"""Pydantic数据模型"""
from pydantic import BaseModel
from typing import Optional, List


class UploadResponse(BaseModel):
    """上传响应"""
    task_id: str


class PaperInfo(BaseModel):
    """论文信息"""
    title: Optional[str] = None
    authors: List[str] = []
    pages: int


class StatusResponse(BaseModel):
    """状态查询响应"""
    status: str  # "pending" | "processing" | "completed" | "failed"
    progress: int  # 0-100
    paper_info: Optional[PaperInfo] = None
    error: Optional[str] = None


class PreviewResponse(BaseModel):
    """大纲预览响应"""
    outline: str  # Markdown格式


class CancelResponse(BaseModel):
    """取消任务响应"""
    success: bool


class ErrorResponse(BaseModel):
    """错误响应"""
    detail: str
