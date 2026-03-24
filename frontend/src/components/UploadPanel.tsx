import { useCallback, useState } from 'react'
import { useAppStore } from '../stores/useAppStore'

export function UploadPanel() {
  const { file, setFile, upload } = useAppStore()
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile?.type === 'application/pdf') {
      setFile(droppedFile)
    }
  }, [setFile])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile?.type === 'application/pdf') {
      setFile(selectedFile)
    }
  }, [setFile])

  return (
    <div className="max-w-2xl mx-auto">
      {/* 标题区域 */}
      <div className="text-center mb-10 animate-in">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">上传学术论文</h2>
        <p className="text-gray-500">我们将智能分析论文内容，生成专业的演示文稿</p>
      </div>

      {/* 上传区域 */}
      <div
        className={`
          upload-zone p-16 text-center cursor-pointer
          ${isDragging ? 'dragging' : ''}
          ${file ? 'has-file' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* 装饰性元素 */}
        <div className="decorative-dots" style={{ top: '24px', left: '32px' }} />
        <div className="decorative-dots" style={{ top: '24px', right: '32px', background: '#2563eb' }} />
        <div className="decorative-dots" style={{ bottom: '24px', left: '48px', background: '#2563eb', opacity: 0.3 }} />
        <div className="decorative-dots" style={{ bottom: '24px', right: '48px' }} />

        <div className="relative z-10">
          {/* 图标 */}
          <div className={`
            w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center
            transition-all duration-300
            ${file
              ? 'bg-emerald-100 text-emerald-600'
              : 'bg-blue-50 text-blue-500'
            }
          `}>
            {file ? (
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            )}
          </div>

          {file ? (
            /* 已选择文件 */
            <div className="animate-in">
              <p className="text-emerald-600 font-medium text-lg mb-1">{file.name}</p>
              <p className="text-gray-400 text-sm">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            /* 默认状态 */
            <div className="animate-in">
              <p className="text-gray-700 text-lg mb-2">
                拖拽PDF文件到此处
              </p>
              <p className="text-gray-400 text-sm mb-6">或</p>
            </div>
          )}

          <label className="inline-block cursor-pointer">
            <span className={`
              px-8 py-3 rounded-xl font-medium transition-all duration-200
              ${file
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
              }
            `}>
              {file ? '重新选择文件' : '浏览文件'}
            </span>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>

          {!file && (
            <p className="text-gray-400 text-xs mt-6">支持 PDF 格式，建议文件小于 50MB</p>
          )}
        </div>
      </div>

      {/* 开始按钮 */}
      {file && (
        <div className="mt-8 text-center animate-in stagger-3">
          <button
            onClick={upload}
            className="btn-primary inline-flex items-center gap-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            开始生成PPT
          </button>
        </div>
      )}

      {/* 特性提示 */}
      <div className="mt-16 grid grid-cols-3 gap-6 text-center animate-in stagger-4">
        <div>
          <div className="w-12 h-12 mx-auto mb-3 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="font-medium text-gray-700 text-sm">智能解析</h3>
          <p className="text-gray-400 text-xs mt-1">自动提取论文结构</p>
        </div>
        <div>
          <div className="w-12 h-12 mx-auto mb-3 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="font-medium text-gray-700 text-sm">AI 生成</h3>
          <p className="text-gray-400 text-xs mt-1">LLM 驱动的PPT</p>
        </div>
        <div>
          <div className="w-12 h-12 mx-auto mb-3 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <h3 className="font-medium text-gray-700 text-sm">直接下载</h3>
          <p className="text-gray-400 text-xs mt-1">PPTX 格式</p>
        </div>
      </div>
    </div>
  )
}
