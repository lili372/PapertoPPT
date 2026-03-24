"""
PDF文本提取模块
使用PyMuPDF提取结构化文本，保留文档结构信息
"""

import fitz
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class TextSpan:
    """文本片段"""
    text: str
    font_size: float
    font_name: str
    page: int


@dataclass
class TextBlock:
    """文本块"""
    blocks: List[TextSpan]
    block_type: str  # "title", "paragraph", "list", "unknown"


@dataclass
class PageContent:
    """页面内容"""
    page_num: int
    blocks: List[TextBlock]
    full_text: str


@dataclass
class ExtractedPaper:
    """提取的论文数据"""
    title: Optional[str]
    authors: List[str]
    pages: List[PageContent]
    total_pages: int


def extract_structured_text(pdf_path: str) -> ExtractedPaper:
    """
    提取PDF文本，保留结构信息（标题层级、段落、列表等）
    返回结构化数据供LLM使用
    """
    doc = fitz.open(pdf_path)
    pages: List[PageContent] = []

    for page_num, page in enumerate(doc):
        page_content = _extract_page(page, page_num + 1)
        pages.append(page_content)

    # 提取论文标题（通常在第一页）
    title = _extract_title(pages)

    # 提取作者（通常在第一页标题下方）
    authors = _extract_authors(pages)

    return ExtractedPaper(
        title=title,
        authors=authors,
        pages=pages,
        total_pages=len(doc)
    )


def _extract_page(page: fitz.Page, page_num: int) -> PageContent:
    """提取单个页面的结构化内容"""
    # 使用dict模式获取更详细的结构信息
    blocks_data = page.get_text("dict")

    blocks: List[TextBlock] = []
    full_text_parts: List[str] = []

    for block in blocks_data.get("blocks", []):
        if block.get("type") == 0:  # 文本块
            text_block = _process_text_block(block, page_num)
            if text_block:
                blocks.append(text_block)
                # 收集纯文本
                block_text = " ".join(span.text for span in text_block.blocks)
                if block_text.strip():
                    full_text_parts.append(block_text)

    return PageContent(
        page_num=page_num,
        blocks=blocks,
        full_text="\n".join(full_text_parts)
    )


def _process_text_block(block: dict, page_num: int) -> Optional[TextBlock]:
    """处理单个文本块，识别其类型"""
    spans: List[TextSpan] = []

    for line in block.get("lines", []):
        for span in line.get("spans", []):
            text = span.get("text", "").strip()
            if text:
                spans.append(TextSpan(
                    text=text,
                    font_size=span.get("size", 12),
                    font_name=span.get("font", ""),
                    page=page_num
                ))

    if not spans:
        return None

    # 根据字体大小和内容判断块类型
    block_type = _classify_block(spans)

    return TextBlock(
        blocks=spans,
        block_type=block_type
    )


def _classify_block(spans: List[TextSpan]) -> str:
    """根据特征分类文本块"""
    if not spans:
        return "unknown"

    # 检查是否为列表项（以特定符号开头）
    first_text = spans[0].text
    list_markers = ["•", "-", "*", "·", "–", "—", "1.", "2.", "3.", "(1)", "(2)"]
    if any(first_text.strip().startswith(marker) for marker in list_markers):
        return "list"

    # 检查字体大小判断是否为标题
    avg_font_size = sum(s.font_size for s in spans) / len(spans)

    if avg_font_size >= 16:
        return "title"
    elif avg_font_size >= 13:
        return "subtitle"

    return "paragraph"


def _extract_title(pages: List[PageContent]) -> Optional[str]:
    """从第一页提取论文标题"""
    if not pages:
        return None

    first_page = pages[0]

    # 查找最大的标题（通常字号最大的文本是标题）
    max_size = 0
    title = None

    for block in first_page.blocks:
        if block.block_type in ("title", "subtitle"):
            for span in block.blocks:
                if span.font_size > max_size:
                    max_size = span.font_size
                    title = span.text

    return title


def _extract_authors(pages: List[PageContent]) -> List[str]:
    """从第一页提取作者列表"""
    if not pages:
        return []

    first_page = pages[0]

    # 排除的关键词（非作者行的特征）
    exclude_keywords = [
        "abstract", "introduction", "摘要", "引言", "研究", "方法", "结论",
        "关键词", "keyword", "背景", "前言", "致谢", " acknowledg",
        "department", "university", "institute", "school", "医院", "大学", "研究所",
        "email", "mailto", "@", "基金", "项目", "编号", "grant", "supported"
    ]

    # 收集作者候选行
    author_candidates: List[str] = []
    found_title = False
    title_end_index = 0

    # 找到标题块的位置
    for i, block in enumerate(first_page.blocks):
        if block.block_type == "title" and not found_title:
            found_title = True
            title_end_index = i

    # 标题后紧跟的几行文本才是作者候选
    # 通常作者行在标题后面1-3行内
    max_distance_from_title = 3
    candidate_count = 0

    for i, block in enumerate(first_page.blocks):
        if i <= title_end_index:
            continue

        # 如果已经离标题太远，停止收集
        if i - title_end_index > max_distance_from_title:
            break

        # 跳过章节标题（如"摘要"、"引言"等）
        if block.block_type in ("subtitle", "title"):
            break

        if block.block_type in ("paragraph", "unknown"):
            for span in block.blocks:
                text = span.text.strip()
                if not text:
                    continue

                # 排除包含关键词的行
                text_lower = text.lower()
                if any(kw in text_lower for kw in exclude_keywords):
                    break

                # 作者行判断条件：
                # 1. 长度适中（人名不会太长也不会太短）
                # 2. 不以句号结尾（作者行通常不是完整句子）
                # 3. 不包含数字（排除年份、页码等）
                # 4. 包含分隔符（如逗号、and、&等）或者长度很短（单个名字）
                has_separator = any(sep in text for sep in [",", "，", " and ", " & ", "、"])
                is_short_name = 2 < len(text) < 20

                if len(text) < 80 and not any(c.isdigit() for c in text):
                    if has_separator or is_short_name:
                        author_candidates.append(text)
                        candidate_count += 1
                        if candidate_count >= 3:  # 最多3行作者信息
                            break
            if candidate_count >= 3:
                break

    # 合并所有候选行为一个作者字符串，然后用分隔符拆分
    if author_candidates:
        combined = " ".join(author_candidates)
        # 按常见分隔符拆分
        for sep in [", ", "，", " and ", " & ", "、"]:
            if sep in combined:
                authors = [a.strip() for a in combined.split(sep) if a.strip()]
                return authors[:5]

        # 如果没有分隔符，返回原始候选
        return author_candidates[:5]

    return []


def extract_plain_text(pdf_path: str) -> str:
    """降级方案：提取纯文本"""
    doc = fitz.open(pdf_path)
    text_parts = []

    for page in doc:
        text_parts.append(page.get_text())

    return "\n".join(text_parts)


def get_page_text(pdf_path: str, page_num: int) -> str:
    """获取指定页码的文本（1-indexed）"""
    doc = fitz.open(pdf_path)

    if page_num < 1 or page_num > len(doc):
        return ""

    return doc[page_num - 1].get_text()
