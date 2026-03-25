"""
PPT大纲生成模块
将PDF提取的结构化文本传入LLM，生成Markdown格式的PPT大纲
"""

from typing import List
from ..core.llm import get_llm_client
from .pdf_extractor import ExtractedPaper, PageContent


# 系统提示词
SYSTEM_PROMPT = """你是一个专业的学术PPT制作助手。请根据提供的学术论文内容，生成一份适合演讲的PPT大纲。

要求：
1. 幻灯片数量控制在8-15页
2. 每张幻灯片包含：标题、要点、演讲备注(Notes)
3. 内容是"讲解型"而非"列点型"——要有逻辑串联
4. 识别论文的核心贡献和创新点
5. 忽略参考文献、致谢等非核心内容
6. 幻灯片顺序应符合学术演讲习惯：标题页→背景→方法→结果→结论→致谢

输出格式：严格遵循Markdown格式，每张幻灯片用"---"分隔
格式示例：
# Slide 1: 标题页
- 论文标题：[提取的标题]
- 作者：[作者列表]

## Notes
讲解要点：这是一篇关于...的研究...

---

# Slide 2: 研究背景
- 核心问题：[一句话描述要解决的问题]
- 现有方法：[简述2-3个相关方法及局限性]
- 研究空白：[本文要填补的缺口]

## Notes
讲解要点：从...问题出发，目前...方法存在...缺陷...
"""


def build_paper_context(paper: ExtractedPaper, max_chars: int = 15000) -> str:
    """
    将ExtractedPaper对象构建为适合LLM处理的文本上下文

    Args:
        paper: PDF提取的论文数据结构
        max_chars: 最大字符数限制，避免超出LLM上下文窗口

    Returns:
        格式化的论文文本
    """
    parts: List[str] = []

    # 添加标题和作者
    if paper.title:
        parts.append(f"论文标题: {paper.title}")
    if paper.authors:
        parts.append(f"作者: {', '.join(paper.authors)}")
    parts.append(f"总页数: {paper.total_pages}")
    parts.append("")

    # 添加各页内容
    for page in paper.pages:
        parts.append(f"--- 第{page.page_num}页 ---")
        parts.append(page.full_text)
        parts.append("")

    # 合并并截断
    context = "\n".join(parts)
    if len(context) > max_chars:
        context = context[:max_chars] + "\n\n[... 内容已截断 ...]"

    return context


def generate_outline(paper: ExtractedPaper) -> str:
    """
    根据论文内容生成PPT大纲

    Args:
        paper: PDF提取的论文数据结构（包含ExtractedPaper对象）

    Returns:
        Markdown格式的PPT大纲字符串
    """
    # 构建论文上下文
    context = build_paper_context(paper)

    # 构建用户提示词
    user_prompt = f"""请为以下学术论文生成PPT大纲：

{context}

请严格按照指定的Markdown格式生成PPT大纲，每张幻灯片用"---"分隔。"""

    # 调用LLM生成
    llm = get_llm_client()
    outline = llm.generate(prompt=user_prompt, system=SYSTEM_PROMPT)

    return outline


def generate_outline_simple(title: str, authors: List[str], content: str) -> str:
    """
    简化版本：根据标题、作者和纯文本内容生成大纲

    Args:
        title: 论文标题
        authors: 作者列表
        content: 论文全文内容

    Returns:
        Markdown格式的PPT大纲
    """
    # 截断内容避免超出限制
    max_chars = 12000
    if len(content) > max_chars:
        content = content[:max_chars] + "\n\n[... 内容已截断 ...]"

    authors_str = ", ".join(authors) if authors else "未知"

    user_prompt = f"""请为以下学术论文生成PPT大纲：

论文标题: {title}
作者: {authors_str}

论文内容:
{content}

请严格按照指定的Markdown格式生成PPT大纲，每张幻灯片用"---"分隔。
幻灯片数量控制在8-15页，包含标题、要点和演讲备注。"""

    llm = get_llm_client()
    outline = llm.generate(prompt=user_prompt, system=SYSTEM_PROMPT)

    return outline


def regenerate_slide(outline: str, slide_index: int, instruction: str) -> str:
    """
    重写大纲中的单个幻灯片

    Args:
        outline: 完整的Markdown大纲
        slide_index: 要重写的幻灯片索引（从0开始）
        instruction: 用户指令，如"更简洁"、"更强调实验数据"

    Returns:
        重写后的单个幻灯片内容（Markdown格式）
    """
    import re

    # 按 --- 分割幻灯片
    slide_texts = re.split(r'\n---\n', outline)
    slides = [s.strip() for s in slide_texts if s.strip()]

    if slide_index < 0 or slide_index >= len(slides):
        raise ValueError(f"幻灯片索引无效: {slide_index}")

    # 获取当前幻灯片内容
    current_slide = slides[slide_index]

    # 系统提示词
    system_prompt = """你是一个专业的学术PPT内容优化助手。你的任务是根据用户的指令优化指定幻灯片的内容。

要求：
1. 只输出该幻灯片的内容（标题和要点），不要输出其他内容
2. 保持Markdown格式
3. **要点格式必须完整保留**：如果原要点是 "- **标题**: 描述内容"，重写后也必须是 "- **标题**: 描述内容"，不能只保留标题
4. "更简洁"是指语言更精炼，但不能删除任何实质性内容
5. 符合学术演讲风格

输出格式示例：
# Slide 1: 标题
- **标题**: 描述内容（必须保留）
- **另一个标题**: 另一个描述内容（必须保留）

## Notes
演讲备注内容"""

    # 构建用户提示词
    user_prompt = f"""请根据以下指令重写这张幻灯片：

【用户指令】
{instruction}

【当前幻灯片内容】
{current_slide}

请严格按照指令重写这张幻灯片的内容，保持Markdown格式。"""

    # 调用LLM生成
    llm = get_llm_client()
    new_slide_content = llm.generate(prompt=user_prompt, system=system_prompt)

    return new_slide_content
