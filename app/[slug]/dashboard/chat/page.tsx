import ChatInterface from "@/components/chat/chat-interface"

interface ChatPageProps {
  params: {
    slug: string
  }
}

export default function ChatPage({ params }: ChatPageProps) {
  return <ChatInterface params={params} />
}