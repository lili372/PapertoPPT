"""API路由"""
import uuid
import os
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse

from ..schemas import (
    UploadResponse,
    StatusResponse,
    PreviewResponse,
    CancelResponse,
    PaperInfo
)
from ..core.config import TEMP_DIR, MAX_FILE_SIZE, ALLOWED_EXTENSIONS
from ..services.pdf_extractor import extract_structured_text, ExtractedPaper
from ..services.outline_generator import generate_outline, build_paper_context
from ..services.ppt_generator import markdown_to_ppt

router = APIRouter()

# 内存任务存储
_tasks: dict = {}


class Task:
    """任务模型"""
    def __init__(self, task_id: str, pdf_path: str):
        self.id = task_id
        self.status = "pending"
        self.progress = 0
        self.pdf_path = pdf_path
        self.outline: Optional[str] = None
        self.ppt_path: Optional[str] = None
        self.error: Optional[str] = None
        self.paper_info: Optional[dict] = None


@router.post("/upload", response_model=UploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    """上传PDF文件"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="未提供文件名")

    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"不支持的文件类型，仅支持: {', '.join(ALLOWED_EXTENSIONS)}")

    task_id = str(uuid.uuid4())
    file_path = TEMP_DIR / f"{task_id}.pdf"

    try:
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"文件大小超过限制（最大{MAX_FILE_SIZE // 1024 // 1024}MB）")

        with open(file_path, "wb") as f:
            f.write(content)

        task = Task(task_id=task_id, pdf_path=str(file_path))
        _tasks[task_id] = task

        return UploadResponse(task_id=task_id)

    except HTTPException:
        raise
    except Exception as e:
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=500, detail=f"文件上传失败: {str(e)}")


@router.get("/status/{task_id}", response_model=StatusResponse)
async def get_status(task_id: str):
    """查询任务状态"""
    if task_id not in _tasks:
        raise HTTPException(status_code=404, detail="任务不存在")

    task = _tasks[task_id]

    return StatusResponse(
        status=task.status,
        progress=task.progress,
        paper_info=PaperInfo(**task.paper_info) if task.paper_info else None,
        error=task.error
    )


@router.get("/preview/{task_id}", response_model=PreviewResponse)
async def get_preview(task_id: str):
    """获取大纲预览"""
    if task_id not in _tasks:
        raise HTTPException(status_code=404, detail="任务不存在")

    task = _tasks[task_id]

    if task.status != "completed":
        raise HTTPException(status_code=400, detail="任务尚未完成")

    if not task.outline:
        raise HTTPException(status_code=404, detail="大纲不存在")

    return PreviewResponse(outline=task.outline)


@router.get("/download/{task_id}")
async def download_ppt(task_id: str):
    """下载生成的PPT"""
    if task_id not in _tasks:
        raise HTTPException(status_code=404, detail="任务不存在")

    task = _tasks[task_id]

    if task.status != "completed" or not task.ppt_path:
        raise HTTPException(status_code=400, detail="PPT尚未生成")

    ppt_path = Path(task.ppt_path)
    if not ppt_path.exists():
        raise HTTPException(status_code=404, detail="PPT文件不存在")

    return FileResponse(
        path=ppt_path,
        filename="paper.pptx",
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation"
    )


@router.post("/cancel/{task_id}", response_model=CancelResponse)
async def cancel_task(task_id: str):
    """取消任务"""
    if task_id not in _tasks:
        raise HTTPException(status_code=404, detail="任务不存在")

    task = _tasks[task_id]

    if task.status in ("completed", "failed"):
        return CancelResponse(success=False)

    if task.pdf_path and Path(task.pdf_path).exists():
        Path(task.pdf_path).unlink()
    if task.ppt_path and Path(task.ppt_path).exists():
        Path(task.ppt_path).unlink()

    task.status = "failed"
    task.error = "用户取消"

    return CancelResponse(success=True)


@router.post("/process/{task_id}")
async def process_pdf(task_id: str):
    """
    处理PDF：解析文本 → 生成大纲 → 生成PPT
    """
    if task_id not in _tasks:
        raise HTTPException(status_code=404, detail="任务不存在")

    task = _tasks[task_id]
    task.status = "processing"

    try:
        # 第一步：提取PDF文本
        task.progress = 10
        extracted = extract_structured_text(task.pdf_path)

        task.paper_info = {
            "title": extracted.title or "未识别到标题",
            "authors": extracted.authors,
            "pages": extracted.total_pages
        }

        # 第二步：调用LLM生成大纲
        task.progress = 40
        task.outline = generate_outline(extracted)

        # 第三步：生成PPT
        task.progress = 80
        ppt_path = str(TEMP_DIR / f"{task_id}.pptx")
        markdown_to_ppt(task.outline, ppt_path)
        task.ppt_path = ppt_path

        # 完成
        task.status = "completed"
        task.progress = 100

        return {"status": "completed", "task_id": task_id}

    except ValueError as e:
        task.status = "failed"
        task.error = str(e)
        raise HTTPException(status_code=500, detail=f"LLM配置错误: {str(e)}")
    except Exception as e:
        task.status = "failed"
        task.error = str(e)
        raise HTTPException(status_code=500, detail=f"处理失败: {str(e)}")
