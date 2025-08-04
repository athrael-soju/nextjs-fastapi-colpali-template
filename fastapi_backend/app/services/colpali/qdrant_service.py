import uuid
import numpy as np
import torch
from qdrant_client import QdrantClient, models
from tqdm import tqdm

from app.config import settings
from .minio_service import MinioService


class QdrantService:
    def __init__(self, model, processor):
        # Initialize Qdrant client
        self.client = QdrantClient(url=settings.QDRANT_URL)
        self.collection_name = settings.QDRANT_COLLECTION_NAME
        
        # Use provided model and processor
        self.model = model
        self.processor = processor
        
        # Initialize MinIO service for image storage
        try:
            self.minio_service = MinioService()
            if not self.minio_service.health_check():
                raise Exception("MinIO service health check failed")
        except Exception as e:
            raise Exception(f"Failed to initialize MinIO service: {e}")
        
        # Create collection if it doesn't exist
        self._create_collection_if_not_exists()
    
    def _create_collection_if_not_exists(self):
        """Create Qdrant collection for document storage"""
        try:
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config={
                    "original": models.VectorParams(
                        size=128,
                        distance=models.Distance.COSINE,
                        multivector_config=models.MultiVectorConfig(
                            comparator=models.MultiVectorComparator.MAX_SIM
                        ),
                        hnsw_config=models.HnswConfigDiff(m=0)
                    ),
                    "mean_pooling_columns": models.VectorParams(
                        size=128,
                        distance=models.Distance.COSINE,
                        multivector_config=models.MultiVectorConfig(
                            comparator=models.MultiVectorComparator.MAX_SIM
                        ),
                        hnsw_config=models.HnswConfigDiff(m=0)
                    ),
                    "mean_pooling_rows": models.VectorParams(
                        size=128,
                        distance=models.Distance.COSINE,
                        multivector_config=models.MultiVectorConfig(
                            comparator=models.MultiVectorComparator.MAX_SIM
                        ),
                        hnsw_config=models.HnswConfigDiff(m=0)
                    )
                }
            )
        except Exception as e:
            if "already exists" not in str(e).lower():
                raise Exception(f"Error creating collection {self.collection_name}: {e}")

    def _get_patches(self, image_size):
        """Get number of patches for image"""
        return self.processor.get_n_patches(image_size, spatial_merge_size=self.model.spatial_merge_size)
    
    def _embed_and_mean_pool_batch(self, image_batch):
        """Embed image batch and perform mean pooling"""
        device = next(self.model.parameters()).device
        
        with torch.no_grad():
            processed_images = self.processor.process_images(image_batch).to(device)
            image_embeddings = self.model(**processed_images)

        image_embeddings_batch = image_embeddings.cpu().float().numpy().tolist()

        # Mean pooling
        pooled_by_rows_batch = []
        pooled_by_columns_batch = []

        for image_embedding, tokenized_image, image in zip(image_embeddings,
                                                           processed_images.input_ids,
                                                           image_batch):
            x_patches, y_patches = self._get_patches(image.size)
            
            image_tokens_mask = (tokenized_image == self.processor.image_token_id)
            image_tokens = image_embedding[image_tokens_mask].view(x_patches, y_patches, self.model.dim)
            pooled_by_rows = torch.mean(image_tokens, dim=0)
            pooled_by_columns = torch.mean(image_tokens, dim=1)

            image_token_idxs = torch.nonzero(image_tokens_mask.int(), as_tuple=False)
            first_image_token_idx = image_token_idxs[0].cpu().item()
            last_image_token_idx = image_token_idxs[-1].cpu().item()

            prefix_tokens = image_embedding[:first_image_token_idx]
            postfix_tokens = image_embedding[last_image_token_idx + 1:]

            # Adding back prefix and postfix special tokens
            pooled_by_rows = torch.cat((prefix_tokens, pooled_by_rows, postfix_tokens), dim=0).cpu().float().numpy().tolist()
            pooled_by_columns = torch.cat((prefix_tokens, pooled_by_columns, postfix_tokens), dim=0).cpu().float().numpy().tolist()

            pooled_by_rows_batch.append(pooled_by_rows)
            pooled_by_columns_batch.append(pooled_by_columns)

        return image_embeddings_batch, pooled_by_rows_batch, pooled_by_columns_batch
    
    def index_documents(self, images, progress_callback=None, total_files=None, total_images=None):
        """Index documents in Qdrant with batch processing and progress tracking"""
        batch_size = int(settings.BATCH_SIZE)
        
        total_images_count = len(images)
        processed_images = 0
        total_batches = (total_images_count + batch_size - 1) // batch_size
        
        with tqdm(total=total_images_count, desc="Processing batches") as pbar:
            for batch_idx, i in enumerate(range(0, total_images_count, batch_size)):
                batch = images[i : i + batch_size]
                current_batch_size = len(batch)
                current_batch_num = batch_idx + 1
                
                # Calculate progress based purely on batch completion (0-100%)
                # Each batch gets equal portion of the full 100% range
                progress_per_batch = 100.0 / total_batches
                batch_start_progress = batch_idx * progress_per_batch
                
                # Step 1: Embedding for this batch (0-40% of this batch's progress)
                embedding_progress = batch_start_progress + (progress_per_batch * 0.0)
                if progress_callback:
                    progress_callback("indexing", embedding_progress, 
                                    f"Batch {current_batch_num}/{total_batches}: Generating embeddings", 
                                    total_files or 0, processed_images)
                
                try:
                    original_batch, pooled_by_rows_batch, pooled_by_columns_batch = self._embed_and_mean_pool_batch(batch)
                except Exception as e:
                    raise Exception(f"Error during embed: {e}")
                
                # Step 2: Store in MinIO for this batch (40-70% of this batch's progress)
                storing_progress = batch_start_progress + (progress_per_batch * 0.4)
                if progress_callback:
                    progress_callback("storing", storing_progress, 
                                    f"Batch {current_batch_num}/{total_batches}: Storing images in MinIO", 
                                    total_files or 0, processed_images)
                
                image_urls = []
                if self.minio_service:
                    try:
                        for j, image in enumerate(batch):
                            image_id = str(uuid.uuid4())
                            storage_result = self.minio_service.store_image(image, image_id)
                            image_urls.append(storage_result)
                    except Exception as e:
                        raise Exception(f"Error storing images in MinIO for batch starting at {i}: {e}")
                else:
                    raise Exception("MinIO service not available")
                
                # Step 3: Index in Qdrant for this batch (70-90% of this batch's progress)
                indexing_progress = batch_start_progress + (progress_per_batch * 0.7)
                if progress_callback:
                    progress_callback("indexing", indexing_progress, 
                                    f"Batch {current_batch_num}/{total_batches}: Indexing in Qdrant", 
                                    total_files or 0, processed_images)
                
                for j, (orig, rows, cols, image_url) in enumerate(zip(original_batch, pooled_by_rows_batch, pooled_by_columns_batch, image_urls)):
                    try:
                        # Create document ID
                        doc_id = str(uuid.uuid4())
                        
                        # Prepare payload with MinIO URL
                        payload = {
                            "index": i + j,
                            "page": f"Page {i + j}",
                            "image_url": image_url['url'],
                            "thumbnail_url": image_url.get('thumbnail_url', image_url['url']),
                            "document_id": doc_id
                        }
                        
                        self.client.upload_collection(
                            collection_name=self.collection_name,
                            vectors={
                                "mean_pooling_columns": np.asarray([cols], dtype=np.float32),
                                "original": np.asarray([orig], dtype=np.float32),
                                "mean_pooling_rows": np.asarray([rows], dtype=np.float32)
                            },
                            payload=[payload],
                            ids=[doc_id]
                        )
                    except Exception as e:
                        raise Exception(f"Error during upsert for image {i + j}: {e}")
                
                processed_images += current_batch_size
                pbar.update(current_batch_size)
                
                # Update progress after completing this batch (90-100% of this batch's progress)
                batch_completion_progress = batch_start_progress + (progress_per_batch * 0.9)
                if progress_callback:
                    progress_callback("indexing", batch_completion_progress, 
                                    f"Completed batch {current_batch_num}/{total_batches}", 
                                    total_files or 0, processed_images)
        
        return f"Uploaded and converted {len(images)} pages"
    
    def _batch_embed_query(self, query_batch):
        """Embed query batch"""
        device = next(self.model.parameters()).device
            
        with torch.no_grad():
            processed_queries = self.processor.process_queries(query_batch).to(device)
            query_embeddings_batch = self.model(**processed_queries)
        return query_embeddings_batch.cpu().float().numpy()
    
    def _reranking_search_batch(self, query_batch, search_limit=settings.QDRANT_SEARCH_LIMIT, prefetch_limit=settings.QDRANT_PREFETCH_LIMIT):
        """Perform two-stage retrieval with multivectors"""
        search_queries = [
            models.QueryRequest(
                query=query,
                prefetch=[
                    models.Prefetch(
                        query=query,
                        limit=prefetch_limit,
                        using="mean_pooling_columns"
                    ),
                    models.Prefetch(
                        query=query,
                        limit=prefetch_limit,
                        using="mean_pooling_rows"
                    ),
                ],
                limit=search_limit,
                with_payload=True,
                with_vector=False,
                using="original"
            ) for query in query_batch
        ]
        return self.client.query_batch_points(
            collection_name=self.collection_name,
            requests=search_queries
        )
    
    def search(self, query, images=None, k=5):
        """Search for relevant documents using Qdrant and retrieve images from MinIO"""
        query_embedding = self._batch_embed_query([query])
        search_results = self._reranking_search_batch(query_embedding)
        
        # Extract relevant results
        results = []
        if search_results and search_results[0].points:
            for i, point in enumerate(search_results[0].points[:k]):
                try:
                    # Get image URL from metadata
                    image_url = point.payload.get('image_url')
                    thumbnail_url = point.payload.get('thumbnail_url', image_url)
                    page_info = point.payload.get('page', f"Page {point.payload.get('index', i)}")
                    # Get image URL from metadata
                    if image_url and self.minio_service:
                        image_id = image_url.split('/')[-1].replace('.png', '')
                        # Retrieve image from MinIO
                        image = self.minio_service.get_image(image_id)
                        results.append((image, page_info, thumbnail_url))
                    else:
                        raise Exception(f"Cannot retrieve image for point {i}. Image URL: {image_url}, MinIO available: {self.minio_service is not None}")
                        
                except Exception as e:
                    raise Exception(f"Error retrieving image from MinIO for point {i}: {e}")
        
        return results
    
    def clear_collection(self):
        """Clear all data from the collection"""
        try:
            self.client.delete_collection(self.collection_name)
            self._create_collection_if_not_exists()
            return "Collection cleared successfully"
        except Exception as e:
            raise Exception(f"Error clearing collection: {e}")
    
    def get_collection_info(self):
        """Get information about the collection"""
        try:
            info = self.client.get_collection(self.collection_name)
            return info
        except Exception as e:
            raise Exception(f"Error getting collection info: {e}")
