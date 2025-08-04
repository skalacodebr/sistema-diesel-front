"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ConfigurableTable } from "@/components/table/configurable-table"
import { useTablePresets } from "@/hooks/use-table-presets"
import { useToast } from "@/hooks/use-toast"
import { getToken, isAuthenticated } from "@/lib/auth"
import { getServicos, deleteServico } from "@/lib/api"
import type { Servico, ColunaConfig } from "@/lib/types"
import { Plus, Wrench, Eye, Edit, Trash2, Search, MoreHorizontal } from "lucide-react"
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

interface ServicosPageProps {
  params: {
    slug: string
  }
}

export default function ServicosPage({ params }: ServicosPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [servicos, setServicos] = useState<Servico[]>([])
  const [filteredServicos, setFilteredServicos] = useState<Servico[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [servicoToDelete, setServicoToDelete] = useState<Servico | null>(null)
  
  const itemsPerPage = 10

  const colunas: ColunaConfig[] = [
    { key: "id", label: "ID", type: "number", sortable: true, width: "80px" },
    { key: "nome", label: "Nome", type: "text", sortable: true },
    { key: "codigo_servico", label: "Código", type: "number", sortable: true },
    { key: "valor_unitario", label: "Valor Unitário", type: "currency", sortable: true },
    { key: "tempo_servico_minutos", label: "Tempo (min)", type: "number", sortable: true },
    { key: "percentual_comissao", label: "Comissão (%)", type: "number", sortable: true },
    { key: "categoriaServico.nome", label: "Categoria", type: "text", sortable: false },
    { key: "actions", label: "Ações", type: "actions", sortable: false, width: "120px" },
  ]

  const {
    visibleColumns,
    loading: presetsLoading,
    savePreset,
  } = useTablePresets({
    entityName: "servicos",
    defaultColumns: colunas.map(col => col.key),
  })

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      if (!isAuthenticated()) {
        router.push(`/${params.slug}/login`)
        return
      }

      await fetchServicos()
    }

    checkAuthAndFetchData()
  }, [params.slug, router])

  useEffect(() => {
    const filtered = servicos.filter(servico => {
      const searchLower = searchTerm.toLowerCase()
      return (
        servico.nome?.toLowerCase().includes(searchLower) ||
        servico.codigo_servico?.toString().includes(searchLower) ||
        servico.categoriaServico?.nome?.toLowerCase().includes(searchLower)
      )
    })
    setFilteredServicos(filtered)
  }, [servicos, searchTerm])

  // Pagination
  const totalPages = Math.ceil(filteredServicos.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedServicos = filteredServicos.slice(startIndex, startIndex + itemsPerPage)

  const fetchServicos = async () => {
    setLoading(true)
    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      const data = await getServicos(token)
      // Handle paginated API response
      const servicosArray = data.data || data
      setServicos(Array.isArray(servicosArray) ? servicosArray : [])
    } catch (error) {
      console.error("Erro ao buscar serviços:", error)
      toast({
        variant: "destructive",
        title: "Erro ao carregar serviços",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!servicoToDelete?.id) return

    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      await deleteServico(servicoToDelete.id, token)
      await fetchServicos()
      toast({
        title: "Serviço excluído com sucesso!",
        description: "O serviço foi removido do sistema.",
      })
    } catch (error) {
      console.error("Erro ao excluir serviço:", error)
      toast({
        variant: "destructive",
        title: "Erro ao excluir serviço",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    } finally {
      setDeleteDialogOpen(false)
      setServicoToDelete(null)
    }
  }

  const openDeleteDialog = (servico: Servico) => {
    setServicoToDelete(servico)
    setDeleteDialogOpen(true)
  }

  const renderCell = (servico: Servico, columnKey: string) => {
    switch (columnKey) {
      case "id":
        return servico.id
      case "nome":
        return servico.nome || "-"
      case "codigo_servico":
        return servico.codigo_servico || "-"
      case "valor_unitario":
        const valorUnitario = typeof servico.valor_unitario === 'string' ? parseFloat(servico.valor_unitario) : servico.valor_unitario
        return valorUnitario && !isNaN(valorUnitario) ? `R$ ${valorUnitario.toFixed(2)}` : "-"
      case "tempo_servico_minutos":
        return servico.tempo_servico_minutos || "-"
      case "percentual_comissao":
        const percentualComissao = typeof servico.percentual_comissao === 'string' ? parseFloat(servico.percentual_comissao) : servico.percentual_comissao
        return percentualComissao && !isNaN(percentualComissao) ? `${percentualComissao}%` : "-"
      case "categoriaServico.nome":
        return servico.categoriaServico?.nome || "-"
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
              <DropdownMenuItem onClick={() => router.push(`/${params.slug}/dashboard/servicos/${servico.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/${params.slug}/dashboard/servicos/${servico.id}/editar`)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openDeleteDialog(servico)} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      default:
        const value = servico[columnKey as keyof Servico]
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
          <Wrench className="mr-2 h-6 w-6" />
          <h1 className="text-2xl font-bold">Serviços</h1>
        </div>
        <Button onClick={() => router.push(`/${params.slug}/dashboard/servicos/novo`)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Serviço
        </Button>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar serviços..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <ConfigurableTable
        data={paginatedServicos}
        columns={colunas}
        visibleColumns={visibleColumns}
        onSaveColumns={savePreset}
        renderCell={renderCell}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        loading={loading || presetsLoading}
        emptyMessage="Nenhum serviço encontrado."
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o serviço "{servicoToDelete?.nome}"?
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