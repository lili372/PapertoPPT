# PapertoPPT

学术论文 PDF 一键生成 PPT 演示文稿的工具（v0.2）。

## 功能特点

### v0.2 新增：大纲编辑功能

在生成最终 PPT 前，允许对 AI 生成的叙事大纲进行干预和修正：

- **卡片流展示**：Markdown 解析为幻灯片数组，每张卡片显示标题 + 要点列表
- **在线编辑**：点击卡片进入编辑模式，标题和要点支持增删改
- **拖拽排序**：实现拖拽调整幻灯片顺序
- **删除幻灯片**：支持删除并有确认弹窗
- **AI 单页重写**：支持对单张幻灯片进行 AI 优化（更简洁、更详细、强调数据等）

### 往期功能

- **PDF 智能解析**：提取论文标题、作者、正文结构
- **AI 大纲生成**：基于 LLM 生成演讲型 PPT 大纲
- **Markdown 转 PPT**：支持演讲备注，自动排版，16:9 比例



### 核心流程

```
上传 PDF → 处理中(解析+生成大纲) → 大纲预览/编辑 → 确认生成 → 处理中(生成PPT) → 下载
                            ↑ 可编辑                    ↓不可编辑
```

## 技术栈

### 后端
- Python 3.10+
- FastAPI - Web 框架
- PyMuPDF - PDF 解析
- python-pptx - PPT 生成
- Minimax API - LLM 调用

### 前端
- React 19 + Vite + TypeScript
- Tailwind CSS
- Zustand - 状态管理
- @dnd-kit - 拖拽排序

## 项目结构

```
PapertoPPT/
├── backend/                     # 后端服务
│   ├── app/
│   │   ├── api/routes.py         # API 路由
│   │   ├── core/                 # 配置和 LLM 封装
│   │   │   ├── config.py
│   │   │   └── llm.py
│   │   ├── services/            # 核心服务
│   │   │   ├── pdf_extractor.py    # PDF 文本提取
│   │   │   ├── outline_generator.py # 大纲生成
│   │   │   └── ppt_generator.py    # PPT 生成
│   │   └── schemas/             # 数据模型
│   └── requirements.txt
├── frontend/                     # 前端应用
│   └── src/
│       ├── components/
│       │   ├── UploadPanel.tsx      # 上传面板
│       │   ├── ProcessingPanel.tsx  # 处理进度面板
│       │   ├── DownloadPanel.tsx     # 下载面板
│       │   ├── OutlineEditor.tsx     # 大纲编辑器（v0.2 新增）
│       │   ├── OutlineCard.tsx       # 单页卡片组件（v0.2 新增）
│       │   ├── AIRewriteModal.tsx    # AI 重写弹窗（v0.2 新增）
│       │   └── ConfirmDialog.tsx     # 确认删除弹窗（v0.2 新增）
│       ├── stores/
│       │   └── useAppStore.ts        # Zustand 状态管理
│       └── App.tsx
└── README.md
```

## 快速开始

### 1. 配置后端

```bash
cd backend

# 创建虚拟环境（如没有）
python -m venv venv

# 激活虚拟环境 (Windows)
.\venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple/

# 配置 API 密钥
cp .env.example .env
# 编辑 .env 文件，填入你的 Minimax API Key
```

### 2. 启动后端

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

### 4. 使用

1. 打开 http://localhost:5173
2. 上传 PDF 论文
3. 等待大纲生成完成
4. 在大纲编辑页面调整幻灯片（编辑、排序、删除、AI 重写）
5. 确认生成 PPT
6. 下载生成的 PPT

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/upload` | POST | 上传 PDF，返回 task_id |
| `/api/status/{task_id}` | GET | 查询状态和进度 |
| `/api/process/{task_id}` | POST | 触发处理流程（解析+生成大纲） |
| `/api/outline/{task_id}` | GET | 获取 Markdown 大纲 |
| `/api/outline/{task_id}` | PUT | 更新大纲（编辑后保存） |
| `/api/outline/{task_id}/regenerate/{slide_index}` | POST | AI 重写指定幻灯片 |
| `/api/generate-ppt/{task_id}` | POST | 仅生成 PPT（使用已编辑的大纲） |
| `/api/preview/{task_id}` | GET | 获取大纲预览（兼容 v0.1） |
| `/api/download/{task_id}` | GET | 下载 PPTX 文件 |
| `/api/cancel/{task_id}` | POST | 取消任务 |

## 前端状态流

```
'upload' | 'processing' | 'outline_editing' | 'completed' | 'error'
```

## 注意事项

- 后端任务存储使用内存字典，重启后会丢失
- LLM 调用使用 Minimax API，需在 `backend/.env` 配置 `MINIMAX_API_KEY`
- PDF 临时文件存储在 `backend/temp/` 目录
- 前端 Vite 开发服务器通过代理连接后端，避免 CORS 问题

## License

MIT
