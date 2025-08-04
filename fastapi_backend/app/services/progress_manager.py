import asyncio
import uuid
from typing import Dict, Optional, AsyncGenerator
from dataclasses import dataclass
from enum import Enum
import json
import time

class ProgressStatus(Enum):
    PENDING = "pending"
    UPLOADING = "uploading"
    CONVERTING = "converting"
    INDEXING = "indexing"
    STORING = "storing"
    COMPLETED = "completed"
    ERROR = "error"

@dataclass
class ProgressUpdate:
    task_id: str
    status: ProgressStatus
    progress: float  # 0-100
    current_step: str
    total_files: int
    processed_files: int
    indexed_pages: Optional[int] = None
    error_message: Optional[str] = None
    timestamp: float = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = time.time()

    def to_dict(self):
        return {
            "task_id": self.task_id,
            "status": self.status.value,
            "progress": self.progress,
            "current_step": self.current_step,
            "total_files": self.total_files,
            "processed_files": self.processed_files,
            "indexed_pages": self.indexed_pages,
            "error_message": self.error_message,
            "timestamp": self.timestamp
        }

class ProgressManager:
    def __init__(self):
        self._tasks: Dict[str, ProgressUpdate] = {}
        self._subscribers: Dict[str, list] = {}
        
    def create_task(self, total_files: int) -> str:
        """Create a new progress tracking task"""
        task_id = str(uuid.uuid4())
        initial_progress = ProgressUpdate(
            task_id=task_id,
            status=ProgressStatus.PENDING,
            progress=0.0,
            current_step="Initializing...",
            total_files=total_files,
            processed_files=0
        )
        self._tasks[task_id] = initial_progress
        self._subscribers[task_id] = []
        return task_id
    
    def update_progress(self, task_id: str, status: ProgressStatus, progress: float, 
                       current_step: str, processed_files: int = None, 
                       indexed_pages: int = None, error_message: str = None):
        """Update progress for a task"""
        if task_id not in self._tasks:
            return
            
        current_progress = self._tasks[task_id]
        
        updated_progress = ProgressUpdate(
            task_id=task_id,
            status=status,
            progress=progress,
            current_step=current_step,
            total_files=current_progress.total_files,
            processed_files=processed_files or current_progress.processed_files,
            indexed_pages=indexed_pages or current_progress.indexed_pages,
            error_message=error_message
        )
        
        self._tasks[task_id] = updated_progress
        
        # Notify all subscribers
        self._notify_subscribers(task_id, updated_progress)
    
    def _notify_subscribers(self, task_id: str, progress: ProgressUpdate):
        """Notify all subscribers about progress update"""
        if task_id in self._subscribers:
            # Remove closed connections
            active_subscribers = []
            for queue in self._subscribers[task_id]:
                try:
                    queue.put_nowait(progress)
                    active_subscribers.append(queue)
                except:
                    # Queue is full or closed, skip
                    pass
            self._subscribers[task_id] = active_subscribers
    
    def subscribe(self, task_id: str) -> asyncio.Queue:
        """Subscribe to progress updates for a task"""
        if task_id not in self._subscribers:
            return None
            
        queue = asyncio.Queue(maxsize=100)
        self._subscribers[task_id].append(queue)
        
        # Send current progress immediately
        if task_id in self._tasks:
            try:
                queue.put_nowait(self._tasks[task_id])
            except:
                pass
                
        return queue
    
    def get_progress(self, task_id: str) -> Optional[ProgressUpdate]:
        """Get current progress for a task"""
        return self._tasks.get(task_id)
    
    def cleanup_task(self, task_id: str):
        """Clean up task data"""
        if task_id in self._tasks:
            del self._tasks[task_id]
        if task_id in self._subscribers:
            del self._subscribers[task_id]
    
    async def generate_sse_stream(self, task_id: str) -> AsyncGenerator[str, None]:
        """Generate Server-Sent Events stream for task progress"""
        queue = self.subscribe(task_id)
        if queue is None:
            return
            
        try:
            while True:
                try:
                    # Wait for progress update with timeout
                    progress = await asyncio.wait_for(queue.get(), timeout=30.0)
                    
                    # Format as SSE
                    data = json.dumps(progress.to_dict())
                    yield f"data: {data}\n\n"
                    
                    # Stop streaming if task is completed or failed
                    if progress.status in [ProgressStatus.COMPLETED, ProgressStatus.ERROR]:
                        break
                        
                except asyncio.TimeoutError:
                    # Send heartbeat
                    yield "data: {\"type\": \"heartbeat\"}\n\n"
                    
        except Exception as e:
            # Send error and close stream
            error_data = json.dumps({"type": "error", "message": str(e)})
            yield f"data: {error_data}\n\n"

# Global progress manager instance
progress_manager = ProgressManager()
