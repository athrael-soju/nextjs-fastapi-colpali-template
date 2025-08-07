import os
import tempfile
import io
import base64
import asyncio
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import JSONResponse, StreamingResponse
from PIL import Image
from sse_starlette.sse import EventSourceResponse

from app.users import current_active_user
from app.database import User
from app.schemas import (
    SearchRequest,
    SearchResponse,
    CollectionInfoResponse,
    ClearResponse,
)
from app.services.colpali.colpali_service import ColPaliService
from app.services.progress_manager import progress_manager, ProgressStatus

router = APIRouter(tags=["colpali"])

# Global ColPali service instance
colpali_service = None


def get_colpali_service():
    """Get or create ColPali service instance"""
    global colpali_service
    if colpali_service is None:
        colpali_service = ColPaliService()
    return colpali_service


@router.post("/index")
async def index_documents(
    files: List[UploadFile] = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    user: User = Depends(current_active_user),
    service: ColPaliService = Depends(get_colpali_service),
):
    """Start document indexing with progress tracking"""
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    
    # Validate file types
    for file in files:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(
                status_code=400, 
                detail=f"File {file.filename} is not a PDF. Only PDF files are supported."
            )
    
    # Create progress tracking task
    task_id = progress_manager.create_task(len(files))
    
    # Save uploaded files temporarily
    temp_files = []
    try:
        for file in files:
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
                content = await file.read()
                temp_file.write(content)
                temp_files.append(temp_file.name)
        
        # Start background processing
        background_tasks.add_task(
            process_documents_with_progress,
            task_id,
            temp_files,
            service
        )
        
        return JSONResponse({
            "task_id": task_id,
            "status": "started",
            "message": "Document indexing started"
        })
        
    except Exception as e:
        # Clean up temporary files in case of error
        for temp_file in temp_files:
            try:
                os.unlink(temp_file)
            except OSError:
                pass
        progress_manager.cleanup_task(task_id)
        raise HTTPException(status_code=500, detail=f"Error starting indexing: {str(e)}")


def process_documents_with_progress(task_id: str, temp_files: List[str], service: ColPaliService):
    """Background task to process documents with progress updates"""
    def progress_callback(status_name, progress, step_description, processed_files, indexed_pages=None, error_message=None):
        status = ProgressStatus(status_name) if isinstance(status_name, str) else status_name
        progress_manager.update_progress(
            task_id=task_id,
            status=status,
            progress=progress,
            current_step=step_description,
            processed_files=processed_files,
            indexed_pages=indexed_pages,
            error_message=error_message
        )
    
    try:
        progress_manager.update_progress(
            task_id, ProgressStatus.UPLOADING, 5, "Processing uploaded files", 0
        )
        
        # Process documents with progress tracking
        result = service.index_documents(temp_files, progress_callback)
        
        if result["status"] == "error":
            progress_callback("error", 0, "Indexing failed", 0, error_message=result["message"])
    
    except Exception as e:
        progress_callback("error", 0, "Processing failed", 0, error_message=str(e))
    
    finally:
        # Clean up temporary files
        for temp_file in temp_files:
            try:
                os.unlink(temp_file)
            except OSError:
                pass


@router.get("/progress/{task_id}")
async def get_progress_stream(task_id: str, user: User = Depends(current_active_user)):
    """Get real-time progress updates via Server-Sent Events"""
    return EventSourceResponse(progress_manager.generate_sse_stream(task_id))


@router.get("/progress/{task_id}/status")
async def get_progress_status(task_id: str, user: User = Depends(current_active_user)):
    """Get current progress status"""
    progress = progress_manager.get_progress(task_id)
    if not progress:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return JSONResponse(progress.to_dict())


 


@router.post("/search", response_model=SearchResponse)
async def search_documents(
    request: SearchRequest,
    user: User = Depends(current_active_user),
    service: ColPaliService = Depends(get_colpali_service),
):
    """Search indexed documents"""
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    try:
        result = service.search_documents(
            query=request.query,
            k=request.k,
        )
        
        if result["status"] == "error":
            raise HTTPException(status_code=500, detail=result["message"])
        
        return SearchResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching documents: {str(e)}")


@router.get("/info", response_model=CollectionInfoResponse)
async def get_collection_info(
    user: User = Depends(current_active_user),
    service: ColPaliService = Depends(get_colpali_service),
):
    """Get information about the current document collection"""
    try:
        result = service.get_collection_info()
        
        if result["status"] == "error":
            raise HTTPException(status_code=500, detail=result["message"])
        
        return CollectionInfoResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting collection info: {str(e)}")


@router.delete("/clear", response_model=ClearResponse)
async def clear_collection(
    user: User = Depends(current_active_user),
    service: ColPaliService = Depends(get_colpali_service),
):
    """Clear all indexed documents"""
    try:
        result = service.clear_collection()
        
        if result["status"] == "error":
            raise HTTPException(status_code=500, detail=result["message"])
        
        return ClearResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing collection: {str(e)}")


@router.get("/image/{image_id}")
async def get_search_image(
    image_id: str,
    service: ColPaliService = Depends(get_colpali_service),
):
    """Get search result image by ID"""
    try:
        image = service.get_image_by_id(image_id)
        if image is None:
            raise HTTPException(status_code=404, detail="Image not found")
        
        # Convert PIL Image to bytes
        img_io = io.BytesIO()
        image.save(img_io, format='PNG')
        img_io.seek(0)
        
        return StreamingResponse(
            io.BytesIO(img_io.read()),
            media_type="image/png"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving image: {str(e)}")


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return JSONResponse(
        content={
            "status": "healthy",
            "message": "ColPali service is running"
        }
    )
