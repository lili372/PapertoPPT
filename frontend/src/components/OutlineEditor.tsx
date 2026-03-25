import { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { OutlineCard } from './OutlineCard'
import type { SlideData } from './OutlineCard'
import { ConfirmDialog } from './ConfirmDialog'
import { AIRewriteModal } from './AIRewriteModal'
import { useAppStore } from '../stores/useAppStore'
import { FileText, Loader2 } from 'lucide-react'

interface OutlineEditorProps {
  taskId: string
  outline: string
  onConfirmGenerate: () => void
}

function parseOutlineToSlides(outline: string): SlideData[] {
  // 按 --- 分割幻灯片
  const slideTexts = outline.split(/\n---\n/)
  return slideTexts
    .map((text, index) => {
      const trimmed = text.trim()
      if (!trimmed) return null

      // 解析标题
      const titleMatch = trimmed.match(/^#\s+(?:Slide\s+\d+:\s*)?(.+)$/m)
      const title = titleMatch ? titleMatch[1].trim() : `幻灯片 ${index + 1}`

      // 解析Notes
      const notesMatch = trimmed.match(/^##\s*Notes\s*\n([\s\S]+)$/m)
      const notes = notesMatch ? notesMatch[1].trim() : ''

      // 解析要点（排除Notes部分）
      const contentWithoutNotes = trimmed.replace(/^##\s*Notes.*$/m, '')
      const bullets: string[] = []
      contentWithoutNotes.split('\n').forEach((line) => {
        const bulletMatch = line.trim().match(/^-\s+(.+)$/)
        if (bulletMatch) {
          bullets.push(bulletMatch[1].trim())
        }
      })

      return {
        id: `slide-${index}`,
        index,
        title,
        bullets,
        notes
      }
    })
    .filter((s): s is SlideData => s !== null)
}

function slidesToOutline(slides: SlideData[]): string {
  return slides
    .map((slide, i) => {
      const bulletLines = slide.bullets.map((b) => `- ${b}`).join('\n')
      const notesSection = slide.notes ? `\n\n## Notes\n${slide.notes}` : ''
      return `# Slide ${i + 1}: ${slide.title}\n\n${bulletLines}${notesSection}`
    })
    .join('\n\n---\n\n')
}

function parseSingleSlide(slideText: string, index: number): Partial<SlideData> | null {
  const trimmed = slideText.trim()
  if (!trimmed) return null

  // 解析标题
  const titleMatch = trimmed.match(/^#\s+(?:Slide\s+\d+:\s*)?(.+)$/m)
  const title = titleMatch ? titleMatch[1].trim() : `幻灯片 ${index + 1}`

  // 解析Notes
  const notesMatch = trimmed.match(/^##\s*Notes\s*\n([\s\S]+)$/m)
  const notes = notesMatch ? notesMatch[1].trim() : ''

  // 解析要点（排除Notes部分）
  const contentWithoutNotes = trimmed.replace(/^##\s*Notes.*$/m, '')
  const bullets: string[] = []
  contentWithoutNotes.split('\n').forEach((line) => {
    const bulletMatch = line.trim().match(/^-\s+(.+)$/)
    if (bulletMatch) {
      bullets.push(bulletMatch[1].trim())
    }
  })

  return { title, bullets, notes }
}

export function OutlineEditor({ taskId, outline, onConfirmGenerate }: OutlineEditorProps) {
  const [slides, setSlides] = useState<SlideData[]>(() => parseOutlineToSlides(outline))
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; slideId: string | null }>({
    open: false,
    slideId: null
  })
  const [aiRewriteModal, setAiRewriteModal] = useState<{ open: boolean; slideIndex: number; slideTitle: string }>({
    open: false,
    slideIndex: 0,
    slideTitle: ''
  })
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const { saveOutline } = useAppStore()

  // 同步外部outline变化
  useEffect(() => {
    setSlides(parseOutlineToSlides(outline))
    setHasChanges(false)
  }, [outline])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  // 防抖保存
  const debouncedSave = useCallback(
    async (newSlides: SlideData[]) => {
      setIsSaving(true)
      try {
        const newOutline = slidesToOutline(newSlides)
        await saveOutline(taskId, newOutline)
        setHasChanges(false)
      } catch (err) {
        console.error('保存失败:', err)
      } finally {
        setIsSaving(false)
      }
    },
    [taskId, saveOutline]
  )

  // 标题变更
  const handleTitleChange = (id: string, title: string) => {
    setSlides((prev) => {
      const newSlides = prev.map((s) => (s.id === id ? { ...s, title } : s))
      setHasChanges(true)
      // 防抖保存
      debouncedSave(newSlides)
      return newSlides
    })
    setEditingSlideId(null)
  }

  // 要点变更
  const handleBulletsChange = (id: string, bullets: string[]) => {
    setSlides((prev) => {
      const newSlides = prev.map((s) => (s.id === id ? { ...s, bullets } : s))
      setHasChanges(true)
      debouncedSave(newSlides)
      return newSlides
    })
  }

  // 删除
  const handleDelete = (id: string) => {
    setDeleteConfirm({ open: true, slideId: id })
  }

  const confirmDelete = () => {
    if (deleteConfirm.slideId) {
      setSlides((prev) => {
        const newSlides = prev.filter((s) => s.id !== deleteConfirm.slideId)
        setHasChanges(true)
        debouncedSave(newSlides)
        return newSlides
      })
    }
    setDeleteConfirm({ open: false, slideId: null })
  }

  // AI重写
  const handleAIRewrite = (slideIndex: number) => {
    const slide = slides.find((s) => s.index === slideIndex)
    if (slide) {
      setAiRewriteModal({ open: true, slideIndex, slideTitle: slide.title })
    }
  }

  const submitAIRewrite = async (instruction: string) => {
    const { slideIndex } = aiRewriteModal
    setIsRegenerating(true)

    try {
      const res = await fetch(`/api/outline/${taskId}/regenerate/${slideIndex}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || '重写失败')
      }

      const { slide_content } = await res.json()

      // 解析新的slide内容
      const newSlide = parseSingleSlide(slide_content, slideIndex)
      if (newSlide) {
        setSlides((prev) => {
          const newSlides = prev.map((s) =>
            s.index === slideIndex ? { ...s, ...newSlide, id: s.id } : s
          )
          setHasChanges(true)
          debouncedSave(newSlides)
          return newSlides
        })
      }
    } catch (err) {
      console.error('AI重写失败:', err)
      alert('重写失败，请重试')
    } finally {
      setIsRegenerating(false)
      setAiRewriteModal({ open: false, slideIndex: 0, slideTitle: '' })
    }
  }

  // 拖拽排序
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setSlides((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id)
      const newIndex = prev.findIndex((s) => s.id === over.id)
      const newSlides = arrayMove(prev, oldIndex, newIndex).map((s, i) => ({
        ...s,
        index: i
      }))
      setHasChanges(true)
      debouncedSave(newSlides)
      return newSlides
    })
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">编辑大纲</h2>
              <p className="text-sm text-gray-500">
                共 {slides.length} 张幻灯片，可拖拽排序
              </p>
            </div>
          </div>

          {/* Save indicator */}
          <div className="flex items-center gap-2 text-sm">
            {isSaving && (
              <>
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                <span className="text-gray-500">保存中...</span>
              </>
            )}
            {!isSaving && hasChanges && (
              <span className="text-gray-400">有未保存的更改</span>
            )}
            {!isSaving && !hasChanges && (
              <span className="text-green-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                已保存
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card list */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={slides.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {slides.map((slide) => (
              <OutlineCard
                key={`${slide.id}-${slide.bullets.join(',')}`}
                slide={slide}
                onTitleChange={handleTitleChange}
                onBulletsChange={handleBulletsChange}
                onDelete={handleDelete}
                onAIRewrite={handleAIRewrite}
                isEditing={editingSlideId === slide.id}
                onStartEdit={() => setEditingSlideId(slide.id)}
                onCancelEdit={() => setEditingSlideId(null)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Empty state */}
      {slides.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-2xl">
          <p className="text-gray-500">暂无幻灯片内容</p>
        </div>
      )}

      {/* Confirm generate button */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={onConfirmGenerate}
          disabled={slides.length === 0}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          确认生成PPT
        </button>
        <p className="text-center text-xs text-gray-400 mt-3">
          确认后将根据编辑后的大纲生成最终PPT
        </p>
      </div>

      {/* Delete confirm dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        title="删除幻灯片"
        message="确定要删除这张幻灯片吗？此操作无法撤销。"
        confirmText="删除"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ open: false, slideId: null })}
        danger
      />

      {/* AI rewrite modal */}
      <AIRewriteModal
        isOpen={aiRewriteModal.open}
        slideIndex={aiRewriteModal.slideIndex}
        slideTitle={aiRewriteModal.slideTitle}
        onClose={() => setAiRewriteModal({ open: false, slideIndex: 0, slideTitle: '' })}
        onSubmit={submitAIRewrite}
        isLoading={isRegenerating}
      />
    </div>
  )
}
