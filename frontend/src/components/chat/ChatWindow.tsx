import { useEffect, useRef } from 'react'
import { Bot } from 'lucide-react'
import { MessageBubble, StreamingBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { PageSpinner } from '@/components/ui/Spinner'
import type { ChatMessage } from '@/types/chat'

interface ChatWindowProps {
  messages: ChatMessage[]
  isLoadingMessages: boolean
  streamingContent: string
  isStreaming: boolean
  onSend: (content: string, useRag: boolean) => void
  onStop: () => void
  sessionId: string | null
}

export function ChatWindow({
  messages,
  isLoadingMessages,
  streamingContent,
  isStreaming,
  onSend,
  onStop,
  sessionId,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  if (!sessionId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-surface-950">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600/20 border border-brand-500/30">
          <Bot className="h-8 w-8 text-brand-400" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white">AI Chat</h2>
          <p className="mt-1 text-sm text-surface-400">Select a conversation or start a new one</p>
        </div>
      </div>
    )
  }

  if (isLoadingMessages) {
    return <div className="flex flex-1 items-center justify-center bg-surface-950"><PageSpinner /></div>
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-surface-950">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bot className="h-10 w-10 text-surface-600 mb-3" />
            <p className="text-surface-400 text-sm">Send a message to start the conversation</p>
          </div>
        )}
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isStreaming && streamingContent && (
          <StreamingBubble content={streamingContent} />
        )}
        {isStreaming && !streamingContent && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-surface-700">
              <Bot className="h-4 w-4 text-surface-400" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-surface-800 border border-surface-700 px-4 py-3">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-2 w-2 rounded-full bg-surface-500 animate-pulse-slow"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSend={onSend}
        onStop={onStop}
        isStreaming={isStreaming}
        disabled={!sessionId}
      />
    </div>
  )
}
