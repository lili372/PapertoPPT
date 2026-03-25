import { useAppStore } from './stores/useAppStore'
import { UploadPanel } from './components/UploadPanel'
import { ProcessingPanel } from './components/ProcessingPanel'
import { DownloadPanel } from './components/DownloadPanel'
import { OutlineEditor } from './components/OutlineEditor'

function App() {
  const { viewState, error, reset, taskId, outline, confirmGenerate } = useAppStore()

  return (
    <div className="min-h-screen paper-texture grid-pattern">
      {/* Header */}
      <header className="py-6 border-b border-gray-200/60 bg-white/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">PapertoPPT</h1>
              <p className="text-xs text-gray-500">学术论文PPT生成</p>
            </div>
          </div>

          {/* 标签 */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
              v0.2
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-16 px-6">
        {error ? (
          /* 错误状态 */
          <div className="max-w-md mx-auto">
            <div className="card p-8 text-center border-red-200 bg-red-50/50">
              <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">处理失败</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={reset}
                className="btn-primary"
              >
                重新上传
              </button>
            </div>
          </div>
        ) : viewState === 'upload' ? (
          <UploadPanel />
        ) : viewState === 'processing' ? (
          <ProcessingPanel />
        ) : viewState === 'outline_editing' ? (
          <OutlineEditor
            taskId={taskId!}
            outline={outline!}
            onConfirmGenerate={confirmGenerate}
          />
        ) : viewState === 'completed' ? (
          <DownloadPanel />
        ) : null}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center">
        <p className="text-gray-400 text-xs">
          PapertoPPT · 智能化学术演示文稿生成
        </p>
      </footer>
    </div>
  )
}

export default App
