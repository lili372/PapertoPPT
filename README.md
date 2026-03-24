# PapertoPPT

学术论文PDF一键生成PPT演示文稿的工具。

## 功能特点

- **PDF智能解析**：提取论文标题、作者、正文结构
- **AI大纲生成**：基于LLM生成演讲型PPT大纲
- **Markdown转PPT**：支持演讲备注，自动排版

## 技术栈

### 后端
- Python 3.10+
- FastAPI - Web框架
- PyMuPDF - PDF解析
- python-pptx - PPT生成
- OpenAI SDK - LLM调用（兼容Minimax）

### 前端
- React + Vite
- Tailwind CSS
- Zustand - 状态管理

## 项目结构

```
pptagent_0.1/
├── backend/                 # 后端服务
│   ├── app/
│   │   ├── api/            # API路由
│   │   ├── core/           # 配置和LLM封装
│   │   ├── services/       # 核心服务
│   │   │   ├── pdf_extractor.py    # PDF文本提取
│   │   │   ├── outline_generator.py # 大纲生成
│   │   │   └── ppt_generator.py    # PPT生成
│   │   └── schemas/        # 数据模型
│   └── requirements.txt
├── frontend/                # 前端应用
│   └── src/
│       ├── components/      # React组件
│       ├── stores/         # 状态管理
│       └── App.tsx
└── plan.md                 # 详细设计文档
```

## 快速开始

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd pptagent_0.1
```

### 2. 配置后端

```bash
cd backend

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境 (Windows)
.\venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置API密钥
cp .env.example .env
# 编辑.env文件，填入你的Minimax API Key
```

### 3. 启动后端

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### 4. 启动前端

```bash
cd frontend
npm install
npm run dev
```

### 5. 使用

1. 打开 http://localhost:5173
2. 上传PDF论文
3. 等待处理完成
4. 下载生成的PPT

## API接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/upload` | POST | 上传PDF文件 |
| `/api/status/{task_id}` | GET | 查询处理状态 |
| `/api/process/{task_id}` | POST | 开始处理任务 |
| `/api/preview/{task_id}` | GET | 获取大纲预览 |
| `/api/download/{task_id}` | GET | 下载PPT文件 |
| `/api/cancel/{task_id}` | POST | 取消任务 |

## 配置说明

### 环境变量 (.env)

```env
# Minimax API配置
MINIMAX_API_KEY=your_api_key_here
MINIMAX_MODEL=MiniMax-Text-01
```

## License

MIT
