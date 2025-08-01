import torch
from colpali_engine.models import ColQwen2_5, ColQwen2_5_Processor

from app.config import settings
from .openai_service import query_openai
from .qdrant_service import QdrantService
from .memory_store import MemoryStoreService
from .pdf_utils import convert_files_to_images
from .exceptions import (
    ModelLoadError,
    StorageServiceError,
    InvalidConfigurationError,
)


class ColPaliService:
    def __init__(self):
        try:
            # Initialize model and processor
            self.model = ColQwen2_5.from_pretrained(
                settings.MODEL_NAME,
                torch_dtype=torch.bfloat16,
                device_map=settings.MODEL_DEVICE,
                attn_implementation=None
            ).eval()
            self.processor = ColQwen2_5_Processor.from_pretrained(settings.MODEL_NAME)
        except Exception as e:
            raise ModelLoadError(f"Failed to load ColQwen2_5 model: {str(e)}")
        
        # Initialize storage service based on configuration
        try:
            if settings.STORAGE_TYPE == "memory":
                self.storage_service = MemoryStoreService(self.model, self.processor)
                self.ds = []  # In-memory document store
                self.images = []  # In-memory images
            elif settings.STORAGE_TYPE == "qdrant":
                self.storage_service = QdrantService(self.model, self.processor)
            else:
                raise InvalidConfigurationError(f"Invalid storage type: {settings.STORAGE_TYPE}")
        except Exception as e:
            if isinstance(e, InvalidConfigurationError):
                raise
            raise StorageServiceError(f"Failed to initialize storage service: {str(e)}")
    
    def index_documents(self, file_paths):
        """Index PDF documents"""
        try:
            # Convert PDFs to images
            images = convert_files_to_images(file_paths)
            
            if settings.STORAGE_TYPE == "memory":
                # Store images for in-memory retrieval
                self.images.extend(images)
                result = self.storage_service.index_gpu(images, self.ds)
            elif settings.STORAGE_TYPE == "qdrant":
                result = self.storage_service.index_documents(images)
            
            return {
                "status": "success",
                "message": result,
                "indexed_pages": len(images)
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error indexing documents: {str(e)}"
            }
    
    def search_documents(self, query: str, k: int = None, api_key: str = None):
        """Search indexed documents and optionally query OpenAI"""
        if k is None:
            k = settings.DEFAULT_TOP_K
            
        try:
            if settings.STORAGE_TYPE == "memory":
                if not self.ds or not self.images:
                    return {
                        "status": "error",
                        "message": "No documents indexed. Please upload and index documents first."
                    }
                results = self.storage_service.search(query, self.ds, self.images, k)
            elif settings.STORAGE_TYPE == "qdrant":
                results = self.storage_service.search(query, k=k)
            
            # Format results for API response
            search_results = []
            for i, (image, page_info) in enumerate(results):
                search_results.append({
                    "rank": i + 1,
                    "page_info": page_info,
                    "image_size": image.size if hasattr(image, 'size') else None
                })
            
            response = {
                "status": "success",
                "query": query,
                "results": search_results,
                "total_results": len(results)
            }
            
            # Query OpenAI if API key is provided
            if api_key and api_key.strip():
                ai_response = query_openai(query, results, api_key)
                response["ai_response"] = ai_response
            
            return response
            
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error searching documents: {str(e)}"
            }
    
    def get_collection_info(self):
        """Get information about the current collection/storage"""
        try:
            if settings.STORAGE_TYPE == "memory":
                return {
                    "status": "success",
                    "storage_type": "memory",
                    "indexed_documents": len(self.ds),
                    "indexed_images": len(self.images)
                }
            elif settings.STORAGE_TYPE == "qdrant":
                info = self.storage_service.get_collection_info()
                return {
                    "status": "success",
                    "storage_type": "qdrant",
                    "collection_info": info
                }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error getting collection info: {str(e)}"
            }
    
    def clear_collection(self):
        """Clear all indexed documents"""
        try:
            if settings.STORAGE_TYPE == "memory":
                self.ds.clear()
                self.images.clear()
                return {
                    "status": "success",
                    "message": "Memory store cleared successfully"
                }
            elif settings.STORAGE_TYPE == "qdrant":
                result = self.storage_service.clear_collection()
                return {
                    "status": "success",
                    "message": result
                }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error clearing collection: {str(e)}"
            }
