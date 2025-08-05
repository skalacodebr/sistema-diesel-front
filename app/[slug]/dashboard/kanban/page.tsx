"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getToken, isAuthenticated } from "@/lib/auth"
import { 
  getKanbanData,
  createKanbanCard,
  createKanbanColuna,
  moveKanbanCard,
  deleteKanbanCard 
} from "@/lib/api"
import type { KanbanCard, KanbanColuna, KanbanData, MoveCardData } from "@/lib/types"
import { 
  Plus, 
  MoreHorizontal, 
  Trash2, 
  Edit, 
  Calendar,
  Columns,
  GripVertical
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface KanbanPageProps {
  params: {
    slug: string
  }
}

export default function KanbanPage({ params }: KanbanPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [kanbanData, setKanbanData] = useState<KanbanData>({ colunas: [], cards: [] })
  const [loading, setLoading] = useState(true)
  const [draggedCard, setDraggedCard] = useState<KanbanCard | null>(null)
  
  // Estados para modais
  const [isCreateCardOpen, setIsCreateCardOpen] = useState(false)
  const [isCreateColumnOpen, setIsCreateColumnOpen] = useState(false)
  const [selectedColumnId, setSelectedColumnId] = useState<number | null>(null)
  const [cardToDelete, setCardToDelete] = useState<KanbanCard | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  
  // Estados para formulários
  const [newCard, setNewCard] = useState<Partial<KanbanCard>>({ titulo: "", descricao: "" })
  const [newColumn, setNewColumn] = useState<Partial<KanbanColuna>>({ nome: "", cor: "#3b82f6" })

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      if (!isAuthenticated()) {
        router.push(`/${params.slug}/login`)
        return
      }

      await fetchKanbanData()
    }

    checkAuthAndFetchData()
  }, [params.slug, router])

  const fetchKanbanData = async () => {
    setLoading(true)
    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      const data = await getKanbanData(token)
      setKanbanData(data)
    } catch (error) {
      console.error("Erro ao buscar dados do kanban:", error)
      toast({
        variant: "destructive",
        title: "Erro ao carregar kanban",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCard = async () => {
    if (!newCard.titulo || !selectedColumnId) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "Título e coluna são obrigatórios",
      })
      return
    }

    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      await createKanbanCard({
        ...newCard,
        coluna_id: selectedColumnId
      }, token)

      setNewCard({ titulo: "", descricao: "" })
      setSelectedColumnId(null)
      setIsCreateCardOpen(false)
      await fetchKanbanData()
      
      toast({
        title: "Card criado com sucesso!",
        description: "O novo card foi adicionado ao kanban.",
      })
    } catch (error) {
      console.error("Erro ao criar card:", error)
      toast({
        variant: "destructive",
        title: "Erro ao criar card",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    }
  }

  const handleCreateColumn = async () => {
    if (!newColumn.nome) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "Nome da coluna é obrigatório",
      })
      return
    }

    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      await createKanbanColuna(newColumn, token)

      setNewColumn({ nome: "", cor: "#3b82f6" })
      setIsCreateColumnOpen(false)
      await fetchKanbanData()
      
      toast({
        title: "Coluna criada com sucesso!",
        description: "A nova coluna foi adicionada ao kanban.",
      })
    } catch (error) {
      console.error("Erro ao criar coluna:", error)
      toast({
        variant: "destructive",
        title: "Erro ao criar coluna",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    }
  }

  const handleDeleteCard = async () => {
    if (!cardToDelete?.id) return

    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      await deleteKanbanCard(cardToDelete.id, token)
      await fetchKanbanData()
      
      toast({
        title: "Card excluído com sucesso!",
        description: "O card foi removido do kanban.",
      })
    } catch (error) {
      console.error("Erro ao excluir card:", error)
      toast({
        variant: "destructive",
        title: "Erro ao excluir card",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    } finally {
      setDeleteDialogOpen(false)
      setCardToDelete(null)
    }
  }

  const handleDragStart = (card: KanbanCard) => {
    setDraggedCard(card)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, colunaId: number) => {
    e.preventDefault()
    
    if (!draggedCard || draggedCard.coluna_id === colunaId) {
      setDraggedCard(null)
      return
    }

    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      const moveData: MoveCardData = {
        card_id: draggedCard.id!,
        coluna_destino_id: colunaId
      }

      await moveKanbanCard(moveData, token)
      await fetchKanbanData()
      
      toast({
        title: "Card movido com sucesso!",
        description: "O card foi movido para a nova coluna.",
      })
    } catch (error) {
      console.error("Erro ao mover card:", error)
      toast({
        variant: "destructive",
        title: "Erro ao mover card",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    } finally {
      setDraggedCard(null)
    }
  }

  const openCreateCardDialog = (colunaId: number) => {
    setSelectedColumnId(colunaId)
    setIsCreateCardOpen(true)
  }

  const openDeleteDialog = (card: KanbanCard) => {
    setCardToDelete(card)
    setDeleteDialogOpen(true)
  }

  const getColumnCards = (colunaId: number) => {
    return kanbanData.cards.filter(card => card.coluna_id === colunaId)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Carregando kanban...</p>
      </div>
    )
  }

  return (
    <div className="p-6 h-screen overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Columns className="mr-2 h-6 w-6" />
          <h1 className="text-2xl font-bold">Kanban</h1>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateColumnOpen} onOpenChange={setIsCreateColumnOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Nova Coluna
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Coluna</DialogTitle>
                <DialogDescription>
                  Adicione uma nova coluna ao seu kanban.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="column-name">Nome da Coluna</Label>
                  <Input
                    id="column-name"
                    value={newColumn.nome}
                    onChange={(e) => setNewColumn({ ...newColumn, nome: e.target.value })}
                    placeholder="Digite o nome da coluna"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="column-color">Cor</Label>
                  <Input
                    id="column-color"
                    type="color"
                    value={newColumn.cor}
                    onChange={(e) => setNewColumn({ ...newColumn, cor: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateColumnOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateColumn}>
                  Criar Coluna
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-6 h-full overflow-x-auto pb-6">
        {kanbanData.colunas.map((coluna) => {
          const cards = getColumnCards(coluna.id!)
          
          return (
            <div
              key={coluna.id}
              className="min-w-80 bg-gray-50 rounded-lg p-4 flex flex-col"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, coluna.id!)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: coluna.cor || '#3b82f6' }}
                  />
                  <h3 className="font-semibold text-lg">{coluna.nome}</h3>
                  <Badge variant="secondary" className="ml-2">
                    {cards.length}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openCreateCardDialog(coluna.id!)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto">
                {cards.map((card) => (
                  <Card
                    key={card.id}
                    className="cursor-move hover:shadow-md transition-shadow"
                    draggable
                    onDragStart={() => handleDragStart(card)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <GripVertical className="h-4 w-4 text-gray-400 mr-2" />
                          <h4 className="font-medium text-sm">{card.titulo}</h4>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-3 w-3" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => openDeleteDialog(card)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-3 w-3" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    {card.descricao && (
                      <CardContent className="pt-0 pb-2">
                        <p className="text-xs text-gray-600">{card.descricao}</p>
                      </CardContent>
                    )}
                    {card.data_vencimento && (
                      <CardContent className="pt-0 pb-2">
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          {format(new Date(card.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal para criar card */}
      <Dialog open={isCreateCardOpen} onOpenChange={setIsCreateCardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Card</DialogTitle>
            <DialogDescription>
              Adicione um novo card à coluna selecionada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="card-title">Título</Label>
              <Input
                id="card-title"
                value={newCard.titulo}
                onChange={(e) => setNewCard({ ...newCard, titulo: e.target.value })}
                placeholder="Digite o título do card"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-description">Descrição</Label>
              <Textarea
                id="card-description"
                value={newCard.descricao}
                onChange={(e) => setNewCard({ ...newCard, descricao: e.target.value })}
                placeholder="Digite a descrição do card (opcional)"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-due-date">Data de Vencimento</Label>
              <Input
                id="card-due-date"
                type="date"
                value={newCard.data_vencimento}
                onChange={(e) => setNewCard({ ...newCard, data_vencimento: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateCardOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCard}>
              Criar Card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação para exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o card "{cardToDelete?.titulo}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCard} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}