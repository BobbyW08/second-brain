import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useUIStore } from '@/stores/useUIStore'
import { useAIContext } from '@/hooks/useAIContext'
// assistant-ui uses its own runtime — use the Vercel AI SDK adapter
import { useVercelUseChatRuntime } from '@assistant-ui/react-ai-sdk'
import { AssistantRuntimeProvider, Thread } from '@assistant-ui/react'
import { useChat } from '@ai-sdk/react'

export function AIChatPanel() {
  const chatPanelOpen = useUIStore((s) => s.chatPanelOpen)
  const setChatPanelOpen = useUIStore((s) => s.setChatPanelOpen)
  const context = useAIContext()

  const chat = useChat({
    api: '/api/ai-chat', // TanStack Start server fn URL
    body: { context },
  })

  const runtime = useVercelUseChatRuntime(chat)

  return (
    <Sheet open={chatPanelOpen} onOpenChange={setChatPanelOpen}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] flex flex-col p-0">
        <SheetHeader className="px-4 py-3 border-b">
          <SheetTitle>AI Assistant</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-hidden">
          <AssistantRuntimeProvider runtime={runtime}>
            <Thread />
          </AssistantRuntimeProvider>
        </div>
      </SheetContent>
    </Sheet>
  )
}