import torch
import uuid
import os
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
from app.services.progress_manager import ProgressManager, ProgressStatus


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
                self.image_store = {}  # Store images by ID for serving
            elif settings.STORAGE_TYPE == "qdrant":
                self.storage_service = QdrantService(self.model, self.processor)
                self.image_store = {}  # Store images by ID for serving
            else:
                raise InvalidConfigurationError(f"Invalid storage type: {settings.STORAGE_TYPE}")
        except Exception as e:
            if isinstance(e, InvalidConfigurationError):
                raise
            raise StorageServiceError(f"Failed to initialize storage service: {str(e)}")
    
    def index_documents(self, file_paths, progress_callback=None):
        """Index PDF documents with optional progress tracking"""
        try:
            total_files = len(file_paths)
            
            # Convert PDFs to images (quick operation, minimal progress feedback)
            if progress_callback:
                progress_callback("converting", 0, "Converting PDFs to images", 0)
            
            images = convert_files_to_images(file_paths)
            total_images = len(images)
            
            if progress_callback:
                progress_callback("converting", 0, f"Converted {total_files} PDFs to {total_images} images", total_files)
            
            # Process images in batches - progress based purely on batch completion (0-100%)
            if settings.STORAGE_TYPE == "memory":
                if progress_callback:
                    progress_callback("indexing", 0, "Processing with ColPali model", total_files)
                
                # Store images for in-memory retrieval
                self.images.extend(images)
                result = self.storage_service.index_gpu(images, self.ds)
                
                if progress_callback:
                    progress_callback("completed", 100, "Successfully indexed documents", total_files, total_images)
                
            elif settings.STORAGE_TYPE == "qdrant":
                # Process images in batches: embed → store → index per batch
                result = self.storage_service.index_documents(images, progress_callback, total_files, total_images)
                
                # Final completion
                if progress_callback:
                    progress_callback("completed", 100, "Successfully indexed documents", total_files, total_images)
            
            return {
                "status": "success",
                "message": result,
                "indexed_pages": len(images)
            }
        except Exception as e:
            if progress_callback:
                progress_callback("error", 0, f"Error indexing documents: {str(e)}", 0, error_message=str(e))
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
            for i, result in enumerate(results):
                if len(result) == 2:
                    # Handle old format (image, page_info)
                    image, page_info = result
                    thumbnail_url = None
                else:
                    # Handle new format (image, page_info, thumbnail_url)
                    image, page_info, thumbnail_url = result
                
                # Generate unique ID for the image
                image_id = str(uuid.uuid4())
                
                # Store image in the image store for serving
                self.image_store[image_id] = image
                
                # Generate image URL
                image_url = f"/colpali/image/{image_id}"
                
                search_results.append({
                    "rank": i + 1,
                    "page_info": page_info,
                    "image_size": image.size if hasattr(image, 'size') else None,
                    "image_url": image_url,
                    "thumbnail_url": thumbnail_url or image_url  # Fallback to image_url if no thumbnail
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
                self.image_store.clear()
                return {
                    "status": "success",
                    "message": "Memory store cleared successfully"
                }
            elif settings.STORAGE_TYPE == "qdrant":
                result = self.storage_service.clear_collection()
                self.image_store.clear()
                return {
                    "status": "success",
                    "message": result
                }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error clearing collection: {str(e)}"
            }
    
    def get_image_by_id(self, image_id: str):
        """Get image by ID for serving"""
        return self.image_store.get(image_id)
    
    def chat_with_images(self, query: str, image_ids: list, api_key: str = None, stream: bool = False):
        """Chat with specific images using OpenAI"""
        try:
            # Get images by IDs
            images = []
            for image_id in image_ids:
                image = self.get_image_by_id(image_id)
                if image:
                    images.append((image, ""))  # Format expected by query_openai
                else:
                    return {
                        "status": "error",
                        "message": f"Image with ID {image_id} not found"
                    }
            
            if not images:
                return {
                    "status": "error",
                    "message": "No valid images found"
                }
            
            # Determine which API key to use - user provided or environment variable
            effective_api_key = None
            if api_key and api_key.strip():
                effective_api_key = api_key.strip()
                print(f"Using user-provided API key: {effective_api_key[:10]}...")
            else:
                # Fall back to environment variable
                env_key = os.getenv('OPENAI_API_KEY')
                if env_key and env_key.strip():
                    effective_api_key = env_key.strip()
                    print(f"Using environment API key: {effective_api_key[:10]}...")
                else:
                    print("No API key found in environment variables")
            
            # Call OpenAI with streaming support
            if effective_api_key:
                response = query_openai(query, images, effective_api_key, stream=stream)
                
                if stream:
                    return {
                        "status": "success",
                        "query": query,
                        "stream": response
                    }
                else:
                    return {
                        "status": "success",
                        "query": query,
                        "response": response
                    }
            else:
                env_status = "OPENAI_API_KEY not found" if not os.getenv('OPENAI_API_KEY') else "OPENAI_API_KEY is empty"
                return {
                    "status": "error",
                    "message": f"API key is required for chat functionality. Please provide an API key or set OPENAI_API_KEY environment variable. Environment status: {env_status}"
                }
                
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error in chat: {str(e)}"
            }
