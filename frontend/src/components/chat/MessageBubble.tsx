import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check, Bot, User } from 'lucide-react'
import { cn } from '@/utils/helpers'
import type { ChatMessage } from '@/types/chat'

interface MessageBubbleProps {
  message: ChatMessage
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="rounded p-1 text-surface-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-white hover:bg-surface-700"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex gap-3 group', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div className={cn(
        'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold',
        isUser ? 'bg-brand-600 text-white' : 'bg-surface-700 text-surface-300'
      )}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Content */}
      <div className={cn('max-w-[80%] space-y-1', isUser && 'items-end flex flex-col')}>
        <div className={cn(
          'relative rounded-2xl px-4 py-3 text-sm',
          isUser
            ? 'bg-brand-600 text-white rounded-tr-sm'
            : 'bg-surface-800 text-surface-100 border border-surface-700 rounded-tl-sm'
        )}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              className="prose prose-invert prose-sm max-w-none"
              components={{
                code({ node, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '')
                  const isBlock = (children as string)?.includes('\n')
                  if (isBlock && match) {
                    return (
                      <div className="relative">
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                          className="!rounded-lg !text-xs !my-2"
                          customStyle={{ background: '#0f172a', border: '1px solid #334155' }}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      </div>
                    )
                  }
                  return (
                    <code className="rounded bg-surface-900 px-1.5 py-0.5 text-xs font-mono text-brand-300 border border-surface-700" {...props}>
                      {children}
                    </code>
                  )
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
          {/* Copy button for assistant */}
          {!isUser && (
            <div className="absolute -right-8 top-2">
              <CopyButton text={message.content} />
            </div>
          )}
        </div>
        {message.tokens_used && (
          <p className="text-[10px] text-surface-500 px-1">{message.tokens_used} tokens</p>
        )}
      </div>
    </div>
  )
}

export function StreamingBubble({ content }: { content: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-surface-700 text-surface-300">
        <Bot className="h-4 w-4" />
      </div>
      <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-surface-800 border border-surface-700 px-4 py-3 text-sm text-surface-100">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          className="prose prose-invert prose-sm max-w-none"
        >
          {content || '▊'}
        </ReactMarkdown>
      </div>
    </div>
  )
}
