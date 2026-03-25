import { useState } from 'react'
import { Sparkles, Loader2, X } from 'lucide-react'

interface AIRewriteModalProps {
  isOpen: boolean
  slideIndex: number
  slideTitle: string
  onClose: () => void
  onSubmit: (instruction: string) => void
  isLoading?: boolean
}

const PRESET_OPTIONS = [
  { label: '更简洁', instruction: '语言更简洁，每个要点控制在10字以内' },
  { label: '更详细', instruction: '内容更详细，增加更多解释性文字' },
  { label: '更强调数据', instruction: '突出数据和实验结果，强调量化信息' },
  { label: '更通俗易懂', instruction: '用更通俗的语言解释专业概念' },
  { label: '更有逻辑', instruction: '增强要点之间的逻辑关联' },
]

export function AIRewriteModal({
  isOpen,
  slideIndex,
  slideTitle,
  onClose,
  onSubmit,
  isLoading = false
}: AIRewriteModalProps) {
  const [customInstruction, setCustomInstruction] = useState('')
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = () => {
    const instruction = customInstruction.trim() || selectedPreset
    if (instruction) {
      onSubmit(instruction)
    }
  }

  const handleClose = () => {
    setCustomInstruction('')
    setSelectedPreset(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AI重写幻灯片</h3>
              <p className="text-sm text-gray-500">第{slideIndex + 1}页: {slideTitle}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset options */}
        <div className="mb-5">
          <p className="text-sm font-medium text-gray-700 mb-3">选择优化方向</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_OPTIONS.map((option) => (
              <button
                key={option.label}
                onClick={() => {
                  setSelectedPreset(option.instruction)
                  setCustomInstruction('')
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedPreset === option.instruction && !customInstruction
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-400">或</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Custom input */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">自定义指令</p>
          <textarea
            value={customInstruction}
            onChange={(e) => {
              setCustomInstruction(e.target.value)
              setSelectedPreset(null)
            }}
            placeholder="输入你的要求，如：让语言更活泼、强调创新点..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none"
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || (!customInstruction.trim() && !selectedPreset)}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium rounded-xl shadow-lg shadow-purple-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                AI重写中...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                开始重写
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
