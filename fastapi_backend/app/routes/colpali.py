import os
import tempfile
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse

from app.users import current_active_user
from app.database import User
from app.schemas import (
    SearchRequest,
    SearchResponse,
    IndexResponse,
    CollectionInfoResponse,
    ClearResponse,
)
from app.services.colpali.colpali_service import ColPaliService

router = APIRouter(tags=["colpali"])

# Global ColPali service instance
colpali_service = None


def get_colpali_service():
    """Get or create ColPali service instance"""
    global colpali_service
    if colpali_service is None:
        colpali_service = ColPaliService()
    return colpali_service


@router.post("/index", response_model=IndexResponse)
async def index_documents(
    files: List[UploadFile] = File(...),
    user: User = Depends(current_active_user),
    service: ColPaliService = Depends(get_colpali_service),
):
    """Index PDF documents for search"""
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    
    # Validate file types
    for file in files:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(
                status_code=400, 
                detail=f"File {file.filename} is not a PDF. Only PDF files are supported."
            )
    
    try:
        # Save uploaded files temporarily
        temp_files = []
        for file in files:
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
                content = await file.read()
                temp_file.write(content)
                temp_files.append(temp_file.name)
        
        # Index the documents
        result = service.index_documents(temp_files)
        
        # Clean up temporary files
        for temp_file in temp_files:
            try:
                os.unlink(temp_file)
            except OSError:
                pass
        
        if result["status"] == "error":
            raise HTTPException(status_code=500, detail=result["message"])
        
        return IndexResponse(**result)
        
    except Exception as e:
        # Clean up temporary files in case of error
        for temp_file in temp_files:
            try:
                os.unlink(temp_file)
            except OSError:
                pass
        raise HTTPException(status_code=500, detail=f"Error indexing documents: {str(e)}")


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
            api_key=request.api_key
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


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return JSONResponse(
        status_code=200,
        content={"status": "healthy", "service": "ColPali API"}
    )
