import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Check, X, Trash2, Sparkles } from 'lucide-react'

export interface SlideData {
  id: string
  index: number
  title: string
  bullets: string[]
  notes: string
}

interface OutlineCardProps {
  slide: SlideData
  onTitleChange: (id: string, title: string) => void
  onBulletsChange: (id: string, bullets: string[]) => void
  onDelete: (id: string) => void
  onAIRewrite: (index: number) => void
  isEditing: boolean
  onStartEdit: () => void
  onCancelEdit: () => void
}

export function OutlineCard({
  slide,
  onTitleChange,
  onBulletsChange,
  onDelete,
  onAIRewrite,
  isEditing,
  onStartEdit,
  onCancelEdit
}: OutlineCardProps) {
  const [localTitle, setLocalTitle] = useState(slide.title)
  const [localBullets, setLocalBullets] = useState(slide.bullets)
  const [newBullet, setNewBullet] = useState('')
  const [editingBulletIndex, setEditingBulletIndex] = useState<number | null>(null)
  const [editingBulletText, setEditingBulletText] = useState('')

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: slide.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  const handleSave = () => {
    onTitleChange(slide.id, localTitle)
    onBulletsChange(slide.id, localBullets)
    onCancelEdit()
  }

  const handleCancel = () => {
    setLocalTitle(slide.title)
    setLocalBullets(slide.bullets)
    onCancelEdit()
  }

  const handleAddBullet = () => {
    if (newBullet.trim()) {
      setLocalBullets([...localBullets, newBullet.trim()])
      setNewBullet('')
    }
  }

  const handleRemoveBullet = (index: number) => {
    setLocalBullets(localBullets.filter((_, i) => i !== index))
  }

  const handleStartEditBullet = (index: number) => {
    setEditingBulletIndex(index)
    setEditingBulletText(localBullets[index])
  }

  const handleSaveBullet = () => {
    if (editingBulletIndex !== null) {
      const newBullets = [...localBullets]
      newBullets[editingBulletIndex] = editingBulletText
      setLocalBullets(newBullets)
      setEditingBulletIndex(null)
      setEditingBulletText('')
    }
  }

  const handleCancelEditBullet = () => {
    setEditingBulletIndex(null)
    setEditingBulletText('')
  }

  const handleBulletKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveBullet()
    } else if (e.key === 'Escape') {
      handleCancelEditBullet()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAddBullet()
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-2xl border-2 transition-all ${
        isDragging ? 'border-blue-400 shadow-xl' : 'border-gray-100'
      } ${isEditing ? 'ring-2 ring-blue-500' : ''}`}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="mt-1 p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-5 h-5" />
          </button>

          {/* Index */}
          <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-semibold text-sm flex-shrink-0">
            {slide.index + 1}
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="输入标题..."
              />
            ) : (
              <h3 className="font-semibold text-gray-900 truncate">{slide.title}</h3>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="保存"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                  title="取消"
                >
                  <X className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onStartEdit}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="编辑"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onAIRewrite(slide.index)}
                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  title="AI重写"
                >
                  <Sparkles className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onDelete(slide.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="删除"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Bullets */}
        <div className="space-y-2">
          {(isEditing ? localBullets : slide.bullets).map((bullet, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              {isEditing ? (
                editingBulletIndex === index ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editingBulletText}
                      onChange={(e) => setEditingBulletText(e.target.value)}
                      onKeyDown={handleBulletKeyDown}
                      onBlur={handleSaveBullet}
                      autoFocus
                      className="flex-1 px-2 py-1 border border-blue-500 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    />
                    <button
                      onClick={handleSaveBullet}
                      className="p-1 text-green-600 hover:text-green-700 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancelEditBullet}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center gap-2">
                    <span
                      className="flex-1 text-gray-700 cursor-text hover:bg-gray-50 px-1 rounded"
                      onClick={() => handleStartEditBullet(index)}
                    >
                      {bullet}
                    </span>
                    <button
                      onClick={() => handleStartEditBullet(index)}
                      className="p-1 text-blue-500 hover:text-blue-700 transition-colors"
                      title="编辑要点"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveBullet(index)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )
              ) : (
                <span className="text-gray-600 text-sm leading-relaxed">{bullet}</span>
              )}
            </div>
          ))}

          {/* Add bullet input (editing only) */}
          {isEditing && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-blue-500">+</span>
              <input
                type="text"
                value={newBullet}
                onChange={(e) => setNewBullet(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                placeholder="添加新要点..."
              />
              <button
                onClick={handleAddBullet}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                添加
              </button>
            </div>
          )}
        </div>

        {/* Bullet count hint (non-editing) */}
        {!isEditing && slide.bullets.length > 0 && (
          <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
            {slide.bullets.length} 个要点
          </p>
        )}
      </div>
    </div>
  )
}
