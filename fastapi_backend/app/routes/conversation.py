import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse

from app.users import current_active_user
from app.database import User
from app.schemas import ConversationRequest, ConversationResponse
from app.services.colpali.colpali_service import ColPaliService
from app.services.openai_service import OpenAIService
from app.services.colpali.minio_service import MinioService
from app.config import settings

router = APIRouter(tags=["conversation"])
logger = logging.getLogger(__name__)

# Global service instances
colpali_service = None
openai_service = None
minio_service = None


def get_colpali_service():
    """Get or create ColPali service instance"""
    global colpali_service
    if colpali_service is None:
        colpali_service = ColPaliService()
    return colpali_service


def get_openai_service():
    """Get or create OpenAI service instance"""
    global openai_service
    if openai_service is None:
        openai_service = OpenAIService()
    return openai_service


def get_minio_service():
    """Get or create MinIO service instance"""
    global minio_service
    if minio_service is None:
        minio_service = MinioService()
    return minio_service


@router.post("/chat", response_model=ConversationResponse)
async def conversational_chat(
    request: ConversationRequest,
    user: User = Depends(current_active_user),
    colpali_svc: ColPaliService = Depends(get_colpali_service),
    openai_svc: OpenAIService = Depends(get_openai_service),
    minio_svc: MinioService = Depends(get_minio_service),
):
    """
    Conversational chat endpoint that:
    1. Embeds the user's prompt using ColPali
    2. Retrieves top-k relevant images from MinIO/storage
    3. Sends the prompt and images to OpenAI Vision API
    4. Returns the conversational response
    """
    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    try:
        logger.info(f"Processing conversational request with prompt: {request.prompt[:100]}...")
        
        # Step 1: Embed the prompt and search for relevant images using ColPali
        logger.info("Searching for relevant images using ColPali...")
        search_result = colpali_svc.search_documents(
            query=request.prompt,
            k=request.top_k
        )
        
        if search_result["status"] == "error":
            raise HTTPException(
                status_code=500, 
                detail=f"Error searching documents: {search_result['message']}"
            )
        
        search_results = search_result.get("results", [])
        if not search_results:
            return ConversationResponse(
                status="success",
                prompt=request.prompt,
                response="I couldn't find any relevant images in your document collection to answer your question. Please make sure you have uploaded and indexed some documents first.",
                retrieved_images=[],
                total_retrieved=0,
                message="No relevant images found"
            )
        
        logger.info(f"Found {len(search_results)} relevant images")
        
        # Step 2: Get the actual images for OpenAI analysis
        # For in-memory storage, images are already available in ColPali service
        # For Qdrant + MinIO, we need to retrieve images from MinIO
        images_for_analysis = []
        image_urls = []
        
        if settings.STORAGE_TYPE == "memory":
            # Images are stored in the ColPali service image store
            for result in search_results:
                image_url = result.get("image_url", "")
                if image_url:
                    # Extract image ID from URL (format: /colpali/image/{image_id})
                    image_id = image_url.split("/")[-1]
                    image = colpali_svc.get_image_by_id(image_id)
                    if image:
                        images_for_analysis.append(image)
                        image_urls.append(image_url)
        
        elif settings.STORAGE_TYPE == "qdrant":
            # For Qdrant storage, we need to retrieve images from MinIO using image URLs
            for result in search_results:
                thumbnail_url = result.get("thumbnail_url")
                if thumbnail_url:
                    try:
                        # Extract image ID from MinIO URL
                        # Format: http://minio:9000/bucket/images/{image_id}.png
                        url_parts = thumbnail_url.split("/")
                        if len(url_parts) >= 2:
                            filename = url_parts[-1]  # e.g., "image_id.png"
                            image_id = filename.split(".")[0]  # Remove extension
                            
                            # Retrieve image from MinIO
                            image = minio_svc.get_image(image_id)
                            if image:
                                images_for_analysis.append(image)
                                image_urls.append(thumbnail_url)
                    except Exception as e:
                        logger.warning(f"Failed to retrieve image from MinIO: {e}")
                        continue
        
        if not images_for_analysis:
            return ConversationResponse(
                status="error",
                prompt=request.prompt,
                response=None,
                retrieved_images=[],
                total_retrieved=0,
                message="Found relevant results but couldn't retrieve the actual images for analysis"
            )
        
        logger.info(f"Successfully retrieved {len(images_for_analysis)} images for analysis")
        
        # Step 3: Prepare context about the retrieved images
        context_info = []
        for i, result in enumerate(search_results[:len(images_for_analysis)]):
            page_info = result.get("page_info", f"Image {i+1}")
            context_info.append(f"Image {i+1}: {page_info}")
        
        context = "Retrieved images: " + "; ".join(context_info)
        
        # Step 4: Send to OpenAI Vision API for analysis
        logger.info("Sending prompt and images to OpenAI for analysis...")
        openai_response = await openai_svc.conversational_analysis(
            prompt=request.prompt,
            images=images_for_analysis,
            context=context
        )
        
        logger.info("Successfully received response from OpenAI")
        
        return ConversationResponse(
            status="success",
            prompt=request.prompt,
            response=openai_response,
            retrieved_images=image_urls,
            total_retrieved=len(images_for_analysis),
            message="Analysis completed successfully"
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Error in conversational chat: {e}")
        return ConversationResponse(
            status="error",
            prompt=request.prompt,
            response=None,
            retrieved_images=[],
            total_retrieved=0,
            message=f"Error processing request: {str(e)}"
        )


@router.get("/health")
async def conversation_health_check(
    openai_svc: OpenAIService = Depends(get_openai_service),
    colpali_svc: ColPaliService = Depends(get_colpali_service),
):
    """Health check for conversation services"""
    try:
        # Check OpenAI service
        openai_healthy = await openai_svc.health_check()
        
        # Check ColPali service (basic check)
        colpali_info = colpali_svc.get_collection_info()
        colpali_healthy = colpali_info.get("status") == "success"
        
        overall_healthy = openai_healthy and colpali_healthy
        
        return JSONResponse(
            content={
                "status": "healthy" if overall_healthy else "unhealthy",
                "services": {
                    "openai": "healthy" if openai_healthy else "unhealthy",
                    "colpali": "healthy" if colpali_healthy else "unhealthy"
                },
                "message": "All services operational" if overall_healthy else "Some services are unavailable"
            },
            status_code=200 if overall_healthy else 503
        )
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            content={
                "status": "unhealthy",
                "message": f"Health check failed: {str(e)}"
            },
            status_code=503
        )
