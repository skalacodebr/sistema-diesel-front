"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { getToken, isAuthenticated, getUser } from "@/lib/auth"
import { 
  getUsuariosDisponiveis,
  getConversas,
  getMensagensComUsuario,
  enviarMensagem,
  getMensagensNaoLidas
} from "@/lib/api"
import type { Usuario, Conversa, ChatMensagem, MensagensNaoLidas } from "@/lib/types"
import { 
  MessageCircle, 
  Send, 
  Search, 
  User,
  Clock,
  CheckCircle2,
  Circle
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ChatInterfaceProps {
  params: {
    slug: string
  }
}

export default function ChatInterface({ params }: ChatInterfaceProps) {
  const router = useRouter()
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // States
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [conversas, setConversas] = useState<Conversa[]>([])
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null)
  const [mensagens, setMensagens] = useState<ChatMensagem[]>([])
  const [novaMensagem, setNovaMensagem] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [enviandoMensagem, setEnviandoMensagem] = useState(false)
  const [mensagensNaoLidas, setMensagensNaoLidas] = useState<MensagensNaoLidas | null>(null)
  const [activeTab, setActiveTab] = useState<"conversas" | "usuarios">("conversas")

  // Get current user from auth context
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    // Get current user from auth helper
    const usuario = getUser()
    if (usuario) {
      setCurrentUser(usuario)
    }
  }, [])

  useEffect(() => {
    const checkAuthAndInitialize = async () => {
      if (!isAuthenticated()) {
        router.push(`/${params.slug}/login`)
        return
      }

      await initializeChat()
    }

    checkAuthAndInitialize()
  }, [params.slug, router])

  useEffect(() => {
    // Auto scroll to bottom when new messages arrive
    scrollToBottom()
  }, [mensagens])

  const initializeChat = async () => {
    setLoading(true)
    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      await Promise.all([
        loadUsuarios(token),
        loadConversas(token),
        loadMensagensNaoLidas(token),
      ])
    } catch (error) {
      console.error("Erro ao inicializar chat:", error)
      toast({
        variant: "destructive",
        title: "Erro ao carregar chat",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadUsuarios = async (token: string) => {
    try {
      const data = await getUsuariosDisponiveis(token)
      setUsuarios(data)
    } catch (error) {
      console.error("Erro ao carregar usuários:", error)
    }
  }

  const loadConversas = async (token: string) => {
    try {
      const data = await getConversas(token)
      setConversas(data)
    } catch (error) {
      console.error("Erro ao carregar conversas:", error)
    }
  }

  const loadMensagensNaoLidas = async (token: string) => {
    try {
      const data = await getMensagensNaoLidas(token)
      setMensagensNaoLidas(data)
    } catch (error) {
      console.error("Erro ao carregar mensagens não lidas:", error)
    }
  }

  const loadMensagensComUsuario = async (usuario: Usuario) => {
    try {
      const token = getToken()
      if (!token) return

      const data = await getMensagensComUsuario(usuario.id, token)
      setMensagens(data.data || [])
      setUsuarioSelecionado(usuario)
      
      // Refresh unread messages count
      await loadMensagensNaoLidas(token)
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error)
      toast({
        variant: "destructive",
        title: "Erro ao carregar mensagens",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    }
  }

  const handleEnviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!novaMensagem.trim() || !usuarioSelecionado) return

    setEnviandoMensagem(true)
    try {
      const token = getToken()
      if (!token) throw new Error("Token não encontrado")

      const mensagemEnviada = await enviarMensagem(usuarioSelecionado.id, novaMensagem.trim(), token)
      
      // Add the new message to the current conversation
      setMensagens(prev => [...prev, mensagemEnviada])
      setNovaMensagem("")
      
      // Refresh conversations list
      await loadConversas(token)
      
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error)
      toast({
        variant: "destructive",
        title: "Erro ao enviar mensagem",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    } finally {
      setEnviandoMensagem(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const getUnreadCountForUser = (userId: number): number => {
    if (!mensagensNaoLidas) return 0
    const userUnread = mensagensNaoLidas.por_usuario.find(u => u.remetente_id === userId)
    return userUnread?.total || 0
  }

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return format(date, "HH:mm", { locale: ptBR })
    } else {
      return format(date, "dd/MM HH:mm", { locale: ptBR })
    }
  }

  const filteredUsuarios = usuarios.filter(usuario => 
    usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredConversas = conversas.filter(conversa => {
    const otherUser = conversa.remetente?.id === currentUser?.id ? conversa.destinatario : conversa.remetente
    return otherUser?.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
           otherUser?.email.toLowerCase().includes(searchTerm.toLowerCase())
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Carregando...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <MessageCircle className="mr-2 h-6 w-6" />
        <h1 className="text-2xl font-bold">Chat</h1>
        {mensagensNaoLidas && mensagensNaoLidas.total > 0 && (
          <Badge variant="destructive" className="ml-3">
            {mensagensNaoLidas.total} não lidas
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Sidebar - Conversas e Usuários */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex gap-2 mb-3">
              <Button
                variant={activeTab === "conversas" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("conversas")}
                className="flex-1"
              >
                Conversas
              </Button>
              <Button
                variant={activeTab === "usuarios" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("usuarios")}
                className="flex-1"
              >
                Usuários
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-340px)]">
              {activeTab === "conversas" ? (
                <div className="space-y-1">
                  {filteredConversas.map((conversa) => {
                    const otherUser = conversa.remetente?.id === currentUser?.id ? conversa.destinatario : conversa.remetente
                    const unreadCount = getUnreadCountForUser(otherUser?.id || 0)
                    
                    return (
                      <div
                        key={conversa.id}
                        className={`p-3 cursor-pointer hover:bg-accent transition-colors ${
                          usuarioSelecionado?.id === otherUser?.id ? "bg-accent" : ""
                        }`}
                        onClick={() => otherUser && loadMensagensComUsuario(otherUser)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {otherUser?.nome}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {conversa.mensagem}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <span className="text-xs text-muted-foreground">
                              {conversa.created_at && formatMessageTime(conversa.created_at)}
                            </span>
                            {unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {filteredConversas.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma conversa encontrada
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredUsuarios.map((usuario) => {
                    const unreadCount = getUnreadCountForUser(usuario.id)
                    
                    return (
                      <div
                        key={usuario.id}
                        className={`p-3 cursor-pointer hover:bg-accent transition-colors ${
                          usuarioSelecionado?.id === usuario.id ? "bg-accent" : ""
                        }`}
                        onClick={() => loadMensagensComUsuario(usuario)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{usuario.nome}</p>
                              <p className="text-xs text-muted-foreground">{usuario.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {usuario.tem_conversa && (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                            {unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {filteredUsuarios.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum usuário encontrado
                    </p>
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2 flex flex-col">
          {usuarioSelecionado ? (
            <>
              {/* Chat Header */}
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{usuarioSelecionado.nome}</CardTitle>
                    <p className="text-sm text-muted-foreground">{usuarioSelecionado.email}</p>
                  </div>
                </div>
              </CardHeader>
              <Separator />

              {/* Messages Area */}
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[calc(100vh-400px)] px-4">
                  <div className="space-y-4 py-4">
                    {mensagens.map((mensagem) => {
                      // Compare both as numbers to ensure type matching
                      const isCurrentUser = Number(mensagem.remetente_id) === Number(currentUser?.id)
                      
                      return (
                        <div
                          key={mensagem.id}
                          className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} mb-4`}
                        >
                          <div className="flex flex-col max-w-[70%]">
                            {/* Show sender name for other user's messages */}
                            {!isCurrentUser && (
                              <span className="text-xs text-muted-foreground mb-1 ml-2">
                                {mensagem.remetente?.nome || "Usuário"}
                              </span>
                            )}
                            <div
                              className={`p-3 rounded-lg ${
                                isCurrentUser
                                  ? "bg-primary text-primary-foreground rounded-br-none ml-auto"
                                  : "bg-muted rounded-bl-none mr-auto"
                              }`}
                            >
                              <p className="text-sm">{mensagem.mensagem}</p>
                              <div className={`flex items-center justify-end mt-1 space-x-1 ${
                                isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
                              }`}>
                                <Clock className="h-3 w-3" />
                                <span className="text-xs">
                                  {mensagem.created_at && formatMessageTime(mensagem.created_at)}
                                </span>
                                {isCurrentUser && (
                                  <div className="ml-1">
                                    {mensagem.lida ? (
                                      <CheckCircle2 className="h-3 w-3 text-green-400" />
                                    ) : (
                                      <Circle className="h-3 w-3" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                  {mensagens.length === 0 && (
                    <div className="flex items-center justify-center h-32">
                      <p className="text-muted-foreground">
                        Nenhuma mensagem ainda. Comece a conversa!
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>

              {/* Message Input */}
              <div className="p-4 border-t">
                <form onSubmit={handleEnviarMensagem} className="flex space-x-2">
                  <Input
                    value={novaMensagem}
                    onChange={(e) => setNovaMensagem(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    disabled={enviandoMensagem}
                    className="flex-1"
                  />
                  <Button 
                    type="submit" 
                    disabled={!novaMensagem.trim() || enviandoMensagem}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">Selecione uma conversa</p>
                <p className="text-muted-foreground">
                  Escolha um usuário ou conversa para começar a trocar mensagens
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}