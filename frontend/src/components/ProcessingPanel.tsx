import { useEffect, useState } from 'react'
import { useAppStore } from '../stores/useAppStore'

export function ProcessingPanel() {
  const { progress, statusText, paperInfo, file } = useAppStore()
  const [displayProgress, setDisplayProgress] = useState(0)
  const [dots, setDots] = useState('')

  // 平滑进度条动画
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayProgress(progress)
    }, 100)
    return () => clearTimeout(timer)
  }, [progress])

  // 省略号动画
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 400)
    return () => clearInterval(interval)
  }, [])

  const statusTextWithDots = statusText + dots

  return (
    <div className="max-w-xl mx-auto">
      <div className="card p-10 text-center">
        {/* 状态图标 */}
        <div className="relative inline-block mb-8">
          <div className="status-icon bg-blue-50 text-blue-500">
            <svg className="w-12 h-12 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>

        {/* 标题 */}
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          正在处理您的论文
        </h2>
        <p className="text-gray-500 mb-8">
          {statusTextWithDots || '准备中...'}
        </p>

        {/* 进度条 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-500">生成进度</span>
            <span className="text-sm font-medium text-blue-600">{displayProgress}%</span>
          </div>
          <div className="progress-container">
            <div
              className="progress-bar"
              style={{ width: `${displayProgress}%` }}
            />
            {displayProgress < 100 && (
              <div className="shimmer absolute inset-0 rounded-full" />
            )}
          </div>
        </div>

        {/* 文件信息 */}
        <div className="flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-xl mb-6">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8.5 13h7v1.5h-7V13zm0 3h7v1.5h-7V16zm0-6h3v1.5h-3V10z"/>
            </svg>
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-700 text-sm">{file?.name}</p>
            <p className="text-gray-400 text-xs">
              {file ? (file.size / 1024 / 1024).toFixed(2) : '0'} MB
            </p>
          </div>
        </div>

        {/* 论文信息（如果已提取） */}
        {paperInfo && (
          <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 animate-in">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-800">{paperInfo.title}</p>
                <p className="text-blue-600 text-sm mt-1">
                  已识别 {paperInfo.pages} 页
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 处理阶段提示 */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex justify-center gap-2 text-xs text-gray-400">
            <span className={progress >= 10 ? 'text-blue-500' : ''}>上传</span>
            <span className="text-gray-300 mx-1">→</span>
            <span className={progress >= 40 ? 'text-blue-500' : ''}>解析</span>
            <span className="text-gray-300 mx-1">→</span>
            <span className={progress >= 70 ? 'text-blue-500' : ''}>生成</span>
            <span className="text-gray-300 mx-1">→</span>
            <span className={progress >= 100 ? 'text-emerald-500' : ''}>完成</span>
          </div>
        </div>
      </div>
    </div>
  )
}
