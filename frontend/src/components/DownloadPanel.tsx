import { useAppStore } from '../stores/useAppStore'

export function DownloadPanel() {
  const { downloadPPT, reset, paperInfo, file } = useAppStore()

  return (
    <div className="max-w-xl mx-auto">
      <div className="card p-10 text-center">
        {/* 成功图标 */}
        <div className="relative inline-block mb-8">
          <div className="status-icon bg-emerald-100 text-emerald-500">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          {/* 装饰光环 */}
          <div className="absolute -inset-4 bg-emerald-100 rounded-full opacity-50 blur-xl" />
        </div>

        {/* 标题 */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          生成完成！
        </h2>
        <p className="text-gray-500 mb-8">
          已为《{paperInfo?.title || file?.name}》生成演示文稿
        </p>

        {/* PPT预览卡片 */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 mb-8 border border-gray-200">
          <div className="flex items-center gap-4 mb-4">
            {/* PPT图标 */}
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">PP</span>
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold text-gray-800">
                {paperInfo?.title || file?.name?.replace('.pdf', '.pptx')}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                PowerPoint 演示文稿
              </p>
            </div>
          </div>

          {/* 幻灯片数量 */}
          <div className="flex items-center gap-2 text-sm text-gray-500 pt-4 border-t border-gray-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
            <span>约 {paperInfo?.pages ? Math.max(5, Math.ceil(paperInfo.pages / 3)) : 8} 张幻灯片</span>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="space-y-3">
          <button
            onClick={downloadPPT}
            className="btn-primary w-full flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            下载 PPT
          </button>

          <button
            onClick={reset}
            className="btn-secondary w-full flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            处理其他论文
          </button>
        </div>

        {/* 提示信息 */}
        <p className="text-gray-400 text-xs mt-8">
          文件为标准 PPTX 格式，可直接用 PowerPoint、WPS 等软件打开编辑
        </p>
      </div>

      {/* 装饰元素 */}
      <div className="flex justify-center gap-3 mt-8">
        <div className="w-2 h-2 bg-blue-400 rounded-full opacity-60" />
        <div className="w-2 h-2 bg-amber-400 rounded-full opacity-60" />
        <div className="w-2 h-2 bg-emerald-400 rounded-full opacity-60" />
      </div>
    </div>
  )
}
