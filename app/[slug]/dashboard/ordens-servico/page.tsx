"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ConfigurableTable } from "@/components/table/configurable-table"
import { useTablePresets } from "@/hooks/use-table-presets"
import { useToast } from "@/hooks/use-toast"
import { getToken, isAuthenticated } from "@/lib/auth"
import { getOrdensServico, deleteOrdemServico } from "@/lib/api"
import type { OrdemServico, ColunaConfig } from "@/lib/types"
import { Plus, ClipboardList, Eye, Edit, Trash2, Search, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

interface OrdensServicoPageProps {
  params: {
    slug: string
  }
}

export default function OrdensServicoPage({ params }: OrdensServicoPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>([])
  const [filteredOrdensServico, setFilteredOrdensServico] = useState<OrdemServico[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [ordemToDelete, setOrdemToDelete] = useState<OrdemServico | null>(null)
  
  const itemsPerPage = 10

  const colunas: ColunaConfig[] = [
    { key: "id", label: "ID", type: "number", sortable: true, width: "80px" },
    { key: "nome", label: "Nome", type: "text", sortable: true },
    { key: "cliente.razao_social", label: "Cliente", type: "text", sortable: false },
    { key: "status", label: "Status", type: "text", sortable: true },
    { key: "data_emissao", label: "Data Emissão", type: "date", sortable: true },
    { key: "valor_total", label: "Valor Total", type: "currency", sortable: true },
    { key: "statusOrdemServico.nome", label: "Status Ordem", type: "text", sortable: false },
    { key: "actions", label: "Ações", type: "actions", sortable: false, width: "120px" },
  ]

  const {
    visibleColumns,
    loading: presetsLoading,
    savePreset,
  } = useTablePresets({
    entityName: "ordens-servico",
    defaultColumns: colunas.map(col => col.key),
  })

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      if (!isAuthenticated()) {
        router.push(`/${params.slug}/login`)
        return
      }

      await fetchOrdensServico()
    }

    checkAuthAndFetchData()
  }, [params.slug, router])

  useEffect(() => {
    const filtered = ordensServico.filter(ordem => {
      const searchLower = searchTerm.toLowerCase()
      return (
        ordem.nome?.toLowerCase().includes(searchLower) ||
        ordem.cliente?.razao_social?.toLowerCase().includes(searchLower) ||
        ordem.status?.toLowerCase().includes(searchLower) ||
        ordem.statusOrdemServico?.nome?.toLowerCase().includes(searchLower)
      )
    })
    setFilteredOrdensServico(filtered)
  }, [ordensServico, searchTerm])

  // Pagination
  const totalPages = Math.ceil(filteredOrdensServico.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedOrdensServico = filteredOrdensServico.slice(startIndex, startIndex + itemsPerPage)

  const fetchOrdensServico = async () => {
    setLoading(true)
    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      const data = await getOrdensServico(token)
      setOrdensServico(data)
    } catch (error) {
      console.error("Erro ao buscar ordens de serviço:", error)
      toast({
        variant: "destructive",
        title: "Erro ao carregar ordens de serviço",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!ordemToDelete?.id) return

    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      await deleteOrdemServico(ordemToDelete.id, token)
      await fetchOrdensServico()
      toast({
        title: "Ordem de serviço excluída com sucesso!",
        description: "A ordem de serviço foi removida do sistema.",
      })
    } catch (error) {
      console.error("Erro ao excluir ordem de serviço:", error)
      toast({
        variant: "destructive",
        title: "Erro ao excluir ordem de serviço",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    } finally {
      setDeleteDialogOpen(false)
      setOrdemToDelete(null)
    }
  }

  const openDeleteDialog = (ordem: OrdemServico) => {
    setOrdemToDelete(ordem)
    setDeleteDialogOpen(true)
  }

  const renderCell = (ordem: OrdemServico, columnKey: string) => {
    switch (columnKey) {
      case "id":
        return ordem.id
      case "nome":
        return ordem.nome || "-"
      case "cliente.razao_social":
        return ordem.cliente?.razao_social || "-"
      case "status":
        return ordem.status || "-"
      case "data_emissao":
        return ordem.data_emissao ? new Date(ordem.data_emissao).toLocaleDateString("pt-BR") : "-"
      case "valor_total":
        const valorTotal = typeof ordem.valor_total === 'string' ? parseFloat(ordem.valor_total) : ordem.valor_total
        return valorTotal && !isNaN(valorTotal) ? `R$ ${valorTotal.toFixed(2)}` : "-"
      case "statusOrdemServico.nome":
        return ordem.statusOrdemServico?.nome || "-"
      case "actions":
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/${params.slug}/dashboard/ordens-servico/${ordem.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/${params.slug}/dashboard/ordens-servico/${ordem.id}/editar`)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openDeleteDialog(ordem)} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      default:
        const value = ordem[columnKey as keyof OrdemServico]
        return value ?? "-"
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Carregando...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <ClipboardList className="mr-2 h-6 w-6" />
          <h1 className="text-2xl font-bold">Ordens de Serviço</h1>
        </div>
        <Button onClick={() => router.push(`/${params.slug}/dashboard/ordens-servico/novo`)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Ordem de Serviço
        </Button>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ordens de serviço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <ConfigurableTable
        data={paginatedOrdensServico}
        columns={colunas}
        visibleColumns={visibleColumns}
        onSaveColumns={savePreset}
        renderCell={renderCell}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        loading={loading || presetsLoading}
        emptyMessage="Nenhuma ordem de serviço encontrada."
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a ordem de serviço "{ordemToDelete?.nome}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}