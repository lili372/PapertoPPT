import { create } from 'zustand'

interface PaperInfo {
  title: string
  authors?: string[]
  pages: number
}

interface AppState {
  // UI状态
  viewState: 'upload' | 'processing' | 'outline_editing' | 'completed' | 'error'

  // 上传
  file: File | null
  taskId: string | null

  // 处理进度
  progress: number
  statusText: string

  // 结果
  paperInfo: PaperInfo | null
  slideCount: number | null

  // 大纲编辑
  outline: string | null

  // 错误
  error: string | null

  // 操作
  setFile: (file: File) => void
  upload: () => Promise<void>
  pollStatus: () => Promise<void>
  downloadPPT: () => Promise<void>
  fetchOutline: () => Promise<void>
  saveOutline: (taskId: string, outline: string) => Promise<void>
  confirmGenerate: () => Promise<void>
  reset: () => void
}

const API_BASE = '/api'

export const useAppStore = create<AppState>((set, get) => ({
  viewState: 'upload',
  file: null,
  taskId: null,
  progress: 0,
  statusText: '',
  paperInfo: null,
  slideCount: null,
  outline: null,
  error: null,

  setFile: (file: File) => {
    set({ file, error: null })
  },

  upload: async () => {
    const { file } = get()
    if (!file) return

    set({
      viewState: 'processing',
      progress: 5,
      statusText: '正在上传文件...',
      error: null
    })

    try {
      // 1. 上传PDF
      const formData = new FormData()
      formData.append('file', file)
      const uploadRes = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
      })

      if (!uploadRes.ok) {
        const err = await uploadRes.json()
        throw new Error(err.detail || '上传失败')
      }

      const { task_id } = await uploadRes.json()
      set({ taskId: task_id, progress: 20, statusText: '正在解析论文...' })

      // 2. 开始处理PDF
      const processRes = await fetch(`${API_BASE}/process/${task_id}`, {
        method: 'POST'
      })

      if (!processRes.ok) {
        const err = await processRes.json()
        throw new Error(err.detail || '处理失败')
      }

      set({ progress: 40, statusText: '正在生成大纲...' })

      // 3. 轮询状态直到大纲生成完成
      const maxPolls = 60
      let polls = 0

      while (polls < maxPolls) {
        await new Promise(r => setTimeout(r, 2000))

        const statusRes = await fetch(`${API_BASE}/status/${task_id}`)
        const status = await statusRes.json()

        if (status.status === 'completed') {
          // 4. 获取大纲，进入编辑模式
          const outlineRes = await fetch(`${API_BASE}/outline/${task_id}`)
          if (!outlineRes.ok) {
            const err = await outlineRes.json()
            throw new Error(err.detail || '获取大纲失败')
          }
          const outlineData = await outlineRes.json()

          set({
            viewState: 'outline_editing',
            outline: outlineData.outline,
            progress: 100,
            statusText: '大纲已生成',
            paperInfo: status.paper_info
          })
          return
        }

        if (status.status === 'failed') {
          throw new Error(status.error || '处理失败')
        }

        set({ progress: status.progress, statusText: '正在生成大纲...' })
        polls++
      }

      throw new Error('处理超时')

    } catch (error) {
      set({
        viewState: 'error',
        error: error instanceof Error ? error.message : '处理失败'
      })
    }
  },

  pollStatus: async () => {
    const { taskId } = get()
    if (!taskId) return

    try {
      const res = await fetch(`${API_BASE}/status/${taskId}`)
      const status = await res.json()
      set({ progress: status.progress })
    } catch (e) {
      // ignore
    }
  },

  downloadPPT: async () => {
    const { taskId } = get()
    if (!taskId) return

    window.open(`${API_BASE}/download/${taskId}`, '_blank')
  },

  fetchOutline: async () => {
    const { taskId } = get()
    if (!taskId) return

    try {
      const res = await fetch(`${API_BASE}/outline/${taskId}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || '获取大纲失败')
      }
      const data = await res.json()
      set({ outline: data.outline })
    } catch (error) {
      set({
        viewState: 'error',
        error: error instanceof Error ? error.message : '获取大纲失败'
      })
    }
  },

  saveOutline: async (taskId: string, outline: string) => {
    try {
      const res = await fetch(`${API_BASE}/outline/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outline })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || '保存大纲失败')
      }
    } catch (error) {
      set({
        viewState: 'error',
        error: error instanceof Error ? error.message : '保存大纲失败'
      })
    }
  },

  confirmGenerate: async () => {
    const { taskId } = get()
    if (!taskId) return

    set({
      viewState: 'processing',
      progress: 10,
      statusText: '正在生成PPT...',
      error: null
    })

    try {
      // 1. 从后端获取最新大纲（确保使用编辑后的内容）
      const outlineRes = await fetch(`${API_BASE}/outline/${taskId}`)
      if (!outlineRes.ok) {
        const err = await outlineRes.json()
        throw new Error(err.detail || '获取大纲失败')
      }
      const { outline: latestOutline } = await outlineRes.json()
      set({ outline: latestOutline })

      // 2. 调用仅生成PPT的接口（跳过大纲生成）
      const res = await fetch(`${API_BASE}/generate-ppt/${taskId}`, {
        method: 'POST'
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || '生成PPT失败')
      }

      // 3. 轮询状态直到完成
      const maxPolls = 120
      let polls = 0

      while (polls < maxPolls) {
        await new Promise(r => setTimeout(r, 2000))

        const statusRes = await fetch(`${API_BASE}/status/${taskId}`)
        const status = await statusRes.json()

        set({ progress: status.progress, statusText: '正在生成PPT...' })

        if (status.status === 'completed') {
          set({
            viewState: 'completed',
            progress: 100,
            statusText: '生成完成！',
            paperInfo: status.paper_info,
            slideCount: status.slide_count
          })
          return
        }

        if (status.status === 'failed') {
          throw new Error(status.error || '生成PPT失败')
        }

        polls++
      }

      throw new Error('处理超时')
    } catch (error) {
      set({
        viewState: 'error',
        error: error instanceof Error ? error.message : '生成PPT失败'
      })
    }
  },

  reset: () => {
    set({
      viewState: 'upload',
      file: null,
      taskId: null,
      progress: 0,
      statusText: '',
      paperInfo: null,
      slideCount: null,
      outline: null,
      error: null
    })
  }
}))
