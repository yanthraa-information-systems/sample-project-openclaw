import { useEffect } from 'react'
import { ChatSidebar } from '@/components/chat/ChatSidebar'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { useChat } from '@/hooks/useChat'
import { useChatStore } from '@/store/chatStore'

export default function ChatPage() {
  const store = useChatStore()
  const {
    sessions,
    messages,
    isLoadingMessages,
    streamingContent,
    isStreaming,
    activeSessionId,
    setActiveSession,
    createSession,
    isCreatingSession,
    deleteSession,
    sendMessage,
    stopStreaming,
  } = useChat(store.activeSessionId || undefined)

  // Auto-select first session on mount
  useEffect(() => {
    if (!store.activeSessionId && sessions.length > 0) {
      setActiveSession(sessions[0].id)
    }
  }, [sessions, store.activeSessionId, setActiveSession])

  const handleNewChat = () => {
    createSession({ title: 'New Chat' })
  }

  const handleSend = (content: string, useRag: boolean) => {
    if (!store.activeSessionId) {
      createSession(
        { title: content.slice(0, 50) },
      )
      // Message will need to be sent after session creation
      // In production, chain via onSuccess callback
    } else {
      sendMessage({ content, use_rag: useRag })
    }
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <ChatSidebar
        sessions={sessions}
        activeId={store.activeSessionId}
        onSelect={setActiveSession}
        onNew={handleNewChat}
        onDelete={deleteSession}
      />
      <ChatWindow
        messages={messages}
        isLoadingMessages={isLoadingMessages}
        streamingContent={streamingContent}
        isStreaming={isStreaming}
        onSend={handleSend}
        onStop={stopStreaming}
        sessionId={store.activeSessionId}
      />
    </div>
  )
}
