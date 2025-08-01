from pydantic import BaseModel
from typing import List, Optional, Any
from fastapi_users import schemas
from uuid import UUID


class UserRead(schemas.BaseUser[UUID]):
    pass


class UserCreate(schemas.BaseUserCreate):
    pass


class UserUpdate(schemas.BaseUserUpdate):
    pass


class ItemBase(BaseModel):
    name: str
    description: str | None = None
    quantity: int | None = None


class ItemCreate(ItemBase):
    pass


class ItemRead(ItemBase):
    id: UUID
    user_id: UUID

    model_config = {"from_attributes": True}


class SearchRequest(BaseModel):
    query: str
    k: Optional[int] = 5
    api_key: Optional[str] = None


class SearchResult(BaseModel):
    rank: int
    page_info: str
    image_size: Optional[tuple] = None
    image_url: Optional[str] = None
    thumbnail_url: Optional[str] = None


class SearchResponse(BaseModel):
    status: str
    query: Optional[str] = None
    results: Optional[List[SearchResult]] = None
    total_results: Optional[int] = None
    ai_response: Optional[str] = None
    message: Optional[str] = None


class IndexResponse(BaseModel):
    status: str
    message: str
    indexed_pages: Optional[int] = None


class CollectionInfoResponse(BaseModel):
    status: str
    storage_type: Optional[str] = None
    indexed_documents: Optional[int] = None
    indexed_images: Optional[int] = None
    collection_info: Optional[Any] = None
    message: Optional[str] = None


class ClearResponse(BaseModel):
    status: str
    message: str
