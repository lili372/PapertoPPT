"""配置管理"""
import os
from pathlib import Path
from dotenv import load_dotenv

# 项目根目录
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# 加载.env文件
load_dotenv(BASE_DIR / ".env")

# 临时文件存储目录
TEMP_DIR = BASE_DIR / "temp"
TEMP_DIR.mkdir(exist_ok=True)

# 上传文件大小限制（50MB）
MAX_FILE_SIZE = 50 * 1024 * 1024

# 支持的文件类型
ALLOWED_EXTENSIONS = {".pdf"}

# Minimax API配置（从环境变量读取）
MINIMAX_API_KEY = os.getenv("MINIMAX_API_KEY", "")
MINIMAX_MODEL = os.getenv("MINIMAX_MODEL", "MiniMax-Text-01")

# LLM配置
LLM_TEMPERATURE = 0.7
LLM_MAX_TOKENS = 4096
