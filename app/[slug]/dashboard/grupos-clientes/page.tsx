"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getToken, isAuthenticated } from "@/lib/auth"
import { getGruposClientes, deleteGrupoCliente } from "@/lib/api"
import type { GrupoCliente } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { Search, Plus, MoreHorizontal, Edit, Trash, Eye, Users } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { useTablePresets } from "@/hooks/use-table-presets"
import { ConfigurableTable } from "@/components/table/configurable-table"
import type { ColunaConfig } from "@/lib/types"

interface GruposClientesPageProps {
  params: {
    slug: string
  }
}

// Definir as colunas disponíveis para a tabela de grupos de clientes
const GRUPOS_CLIENTES_COLUMNS: ColunaConfig[] = [
  { key: "id", label: "ID", type: "number", sortable: true, width: "80px" },
  { key: "nome", label: "Nome", type: "text", sortable: true },
  { key: "created_at", label: "Data Cadastro", type: "date", sortable: true },
  { key: "updated_at", label: "Data Atualização", type: "date", sortable: true },
  { key: "actions", label: "Ações", type: "actions", width: "120px" },
]

const DEFAULT_VISIBLE_COLUMNS = ["id", "nome", "created_at", "actions"]

export default function GruposClientesPage({ params }: GruposClientesPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [gruposClientes, setGruposClientes] = useState<GrupoCliente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [grupoClienteToDelete, setGrupoClienteToDelete] = useState<GrupoCliente | null>(null)
  const itemsPerPage = 10

  // Hook para gerenciar presets de colunas
  const {
    visibleColumns,
    loading: presetsLoading,
    savePreset,
  } = useTablePresets({
    entityName: "GruposClientes",
    defaultColumns: DEFAULT_VISIBLE_COLUMNS,
    availableColumns: GRUPOS_CLIENTES_COLUMNS,
  })

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      if (!isAuthenticated()) {
        router.push(`/${params.slug}/login`)
        return
      }

      await fetchGruposClientes()
    }

    checkAuthAndFetchData()
  }, [params.slug, router])

  const fetchGruposClientes = async () => {
    setLoading(true)
    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      const data = await getGruposClientes(token)
      setGruposClientes(data)

      toast({
        title: "Grupos de clientes carregados com sucesso",
        description: `${data.length} grupos encontrados`,
      })
    } catch (error) {
      console.error("Erro ao buscar grupos de clientes:", error)
      toast({
        variant: "destructive",
        title: "Erro ao carregar grupos de clientes",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (grupoCliente: GrupoCliente) => {
    setGrupoClienteToDelete(grupoCliente)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!grupoClienteToDelete || !grupoClienteToDelete.id) return

    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      await deleteGrupoCliente(grupoClienteToDelete.id, token)

      // Atualiza a lista removendo o grupo excluído
      setGruposClientes(gruposClientes.filter((g) => g.id !== grupoClienteToDelete.id))

      toast({
        title: "Grupo de cliente excluído com sucesso",
        description: `O grupo "${grupoClienteToDelete.nome}" foi excluído.`,
      })
    } catch (error) {
      console.error("Erro ao excluir grupo de cliente:", error)
      toast({
        variant: "destructive",
        title: "Erro ao excluir grupo de cliente",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    } finally {
      setDeleteDialogOpen(false)
      setGrupoClienteToDelete(null)
    }
  }

  // Filter groups based on search term
  const filteredGruposClientes = gruposClientes.filter((grupo) => {
    return grupo.nome.toLowerCase().includes(searchTerm.toLowerCase())
  })

  // Pagination
  const totalPages = Math.ceil(filteredGruposClientes.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedGruposClientes = filteredGruposClientes.slice(startIndex, startIndex + itemsPerPage)

  const renderCell = (grupoCliente: GrupoCliente, columnKey: string) => {
    switch (columnKey) {
      case "id":
        return grupoCliente.id
      case "nome":
        return grupoCliente.nome
      case "created_at":
        return grupoCliente.created_at 
          ? format(new Date(grupoCliente.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) 
          : "-"
      case "updated_at":
        return grupoCliente.updated_at 
          ? format(new Date(grupoCliente.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) 
          : "-"
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
              <DropdownMenuItem 
                onClick={() => router.push(`/${params.slug}/dashboard/grupos-clientes/${grupoCliente.id}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => router.push(`/${params.slug}/dashboard/grupos-clientes/${grupoCliente.id}/editar`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleDeleteClick(grupoCliente)} 
                className="text-red-600"
              >
                <Trash className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      default:
        return "-"
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Users className="mr-2 h-6 w-6" />
          <h1 className="text-2xl font-bold">Grupos de Clientes</h1>
        </div>
        <Button onClick={() => router.push(`/${params.slug}/dashboard/grupos-clientes/novo`)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Grupo
        </Button>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar grupos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Button variant="outline" onClick={fetchGruposClientes}>
          Atualizar
        </Button>
      </div>

      <ConfigurableTable
        data={paginatedGruposClientes}
        columns={GRUPOS_CLIENTES_COLUMNS}
        visibleColumns={visibleColumns}
        onSaveColumns={savePreset}
        renderCell={renderCell}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        loading={loading || presetsLoading}
        emptyMessage="Nenhum grupo de cliente encontrado."
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o grupo "{grupoClienteToDelete?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}