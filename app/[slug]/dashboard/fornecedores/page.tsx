"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ConfigurableTable } from "@/components/table/configurable-table"
import { useTablePresets } from "@/hooks/use-table-presets"
import { useToast } from "@/hooks/use-toast"
import { getToken, isAuthenticated } from "@/lib/auth"
import { getFornecedores, deleteFornecedor } from "@/lib/api"
import type { Fornecedor, ColunaConfig } from "@/lib/types"
import { Plus, Truck, Eye, Edit, Trash2, Search, MoreHorizontal } from "lucide-react"
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

interface FornecedoresPageProps {
  params: {
    slug: string
  }
}

export default function FornecedoresPage({ params }: FornecedoresPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [filteredFornecedores, setFilteredFornecedores] = useState<Fornecedor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [fornecedorToDelete, setFornecedorToDelete] = useState<Fornecedor | null>(null)
  
  const itemsPerPage = 10

  const colunas: ColunaConfig[] = [
    { key: "id", label: "ID", type: "number", sortable: true, width: "80px" },
    { key: "razao_social", label: "Razão Social", type: "text", sortable: true },
    { key: "nome_fantasia", label: "Nome Fantasia", type: "text", sortable: true },
    { key: "cpf_cnpj", label: "CPF/CNPJ", type: "text", sortable: true },
    { key: "tipoPessoa.nome", label: "Tipo Pessoa", type: "text", sortable: false },
    { key: "contribuinte", label: "Contribuinte", type: "status", sortable: true },
    { key: "produtor_rural", label: "Produtor Rural", type: "status", sortable: true },
    { key: "actions", label: "Ações", type: "actions", sortable: false, width: "120px" },
  ]

  const {
    visibleColumns,
    loading: presetsLoading,
    savePreset,
  } = useTablePresets({
    entityName: "fornecedores",
    defaultColumns: colunas.map(col => col.key),
  })

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      if (!isAuthenticated()) {
        router.push(`/${params.slug}/login`)
        return
      }

      await fetchFornecedores()
    }

    checkAuthAndFetchData()
  }, [params.slug, router])

  useEffect(() => {
    const filtered = fornecedores.filter(fornecedor => {
      const searchLower = searchTerm.toLowerCase()
      return (
        fornecedor.razao_social?.toLowerCase().includes(searchLower) ||
        fornecedor.nome_fantasia?.toLowerCase().includes(searchLower) ||
        fornecedor.cpf_cnpj?.toLowerCase().includes(searchLower) ||
        fornecedor.tipo_pessoa?.nome?.toLowerCase().includes(searchLower)
      )
    })
    setFilteredFornecedores(filtered)
  }, [fornecedores, searchTerm])

  // Pagination
  const totalPages = Math.ceil(filteredFornecedores.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedFornecedores = filteredFornecedores.slice(startIndex, startIndex + itemsPerPage)

  const fetchFornecedores = async () => {
    setLoading(true)
    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      const data = await getFornecedores(token)
      setFornecedores(data)
    } catch (error) {
      console.error("Erro ao buscar fornecedores:", error)
      toast({
        variant: "destructive",
        title: "Erro ao carregar fornecedores",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!fornecedorToDelete?.id) return

    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      await deleteFornecedor(fornecedorToDelete.id, token)
      await fetchFornecedores()
      toast({
        title: "Fornecedor excluído com sucesso!",
        description: "O fornecedor foi removido do sistema.",
      })
    } catch (error) {
      console.error("Erro ao excluir fornecedor:", error)
      toast({
        variant: "destructive",
        title: "Erro ao excluir fornecedor",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    } finally {
      setDeleteDialogOpen(false)
      setFornecedorToDelete(null)
    }
  }

  const openDeleteDialog = (fornecedor: Fornecedor) => {
    setFornecedorToDelete(fornecedor)
    setDeleteDialogOpen(true)
  }

  const renderCell = (fornecedor: Fornecedor, columnKey: string) => {
    switch (columnKey) {
      case "id":
        return fornecedor.id
      case "razao_social":
        return fornecedor.razao_social || "-"
      case "nome_fantasia":
        return fornecedor.nome_fantasia || "-"
      case "cpf_cnpj":
        return fornecedor.cpf_cnpj || "-"
      case "tipoPessoa.nome":
        return fornecedor.tipo_pessoa?.nome || "-"
      case "contribuinte":
        return fornecedor.contribuinte ? "Sim" : "Não"
      case "produtor_rural":
        return fornecedor.produtor_rural ? "Sim" : "Não"
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
              <DropdownMenuItem onClick={() => router.push(`/${params.slug}/dashboard/fornecedores/${fornecedor.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/${params.slug}/dashboard/fornecedores/${fornecedor.id}/editar`)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openDeleteDialog(fornecedor)} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      default:
        const value = fornecedor[columnKey as keyof Fornecedor]
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
          <Truck className="mr-2 h-6 w-6" />
          <h1 className="text-2xl font-bold">Fornecedores</h1>
        </div>
        <Button onClick={() => router.push(`/${params.slug}/dashboard/fornecedores/novo`)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Fornecedor
        </Button>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar fornecedores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <ConfigurableTable
        data={paginatedFornecedores}
        columns={colunas}
        visibleColumns={visibleColumns}
        onSaveColumns={savePreset}
        renderCell={renderCell}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        loading={loading || presetsLoading}
        emptyMessage="Nenhum fornecedor encontrado."
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o fornecedor "{fornecedorToDelete?.razao_social || fornecedorToDelete?.nome_fantasia}"?
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