import { useState, useRef, type KeyboardEvent } from 'react'
import { Send, Square, Paperclip } from 'lucide-react'
import { cn } from '@/utils/helpers'
import { Button } from '@/components/ui/Button'

interface ChatInputProps {
  onSend: (content: string, useRag: boolean) => void
  onStop: () => void
  isStreaming: boolean
  disabled?: boolean
}

export function ChatInput({ onSend, onStop, isStreaming, disabled }: ChatInputProps) {
  const [content, setContent] = useState('')
  const [useRag, setUseRag] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    const trimmed = content.trim()
    if (!trimmed || isStreaming) return
    onSend(trimmed, useRag)
    setContent('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTextareaInput = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }

  return (
    <div className="border-t border-surface-700 bg-surface-900 p-4">
      {/* RAG toggle */}
      <div className="mb-2 flex items-center gap-2">
        <button
          onClick={() => setUseRag(!useRag)}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all',
            useRag
              ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
              : 'bg-surface-800 text-surface-400 hover:text-white border border-surface-700'
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', useRag ? 'bg-brand-400' : 'bg-surface-500')} />
          Search Documents
        </button>
      </div>

      {/* Input area */}
      <div className="flex items-end gap-2 rounded-xl border border-surface-700 bg-surface-800 p-3 focus-within:border-brand-500/50">
        <button className="flex-shrink-0 text-surface-400 hover:text-white transition-colors p-1">
          <Paperclip className="h-4 w-4" />
        </button>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleTextareaInput}
          placeholder="Message AI Platform... (Enter to send, Shift+Enter for newline)"
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm text-white placeholder-surface-400 focus:outline-none leading-5"
        />
        <button
          onClick={isStreaming ? onStop : handleSend}
          disabled={!isStreaming && (!content.trim() || disabled)}
          className={cn(
            'flex-shrink-0 rounded-lg p-2 transition-all duration-150',
            isStreaming
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : content.trim() && !disabled
              ? 'bg-brand-600 hover:bg-brand-700 text-white'
              : 'bg-surface-700 text-surface-500 cursor-not-allowed'
          )}
        >
          {isStreaming ? <Square className="h-4 w-4" fill="currentColor" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
      <p className="mt-2 text-center text-[11px] text-surface-500">
        AI can make mistakes. Consider checking important information.
      </p>
    </div>
  )
}
