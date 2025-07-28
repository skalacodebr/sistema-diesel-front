"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ConfigurableTable } from "@/components/table/configurable-table"
import { useTablePresets } from "@/hooks/use-table-presets"
import { useToast } from "@/hooks/use-toast"
import { getToken, isAuthenticated } from "@/lib/auth"
import { getClientes, deleteCliente } from "@/lib/api"
import type { Cliente, ColunaConfig } from "@/lib/types"
import { Plus, UserCheck, Eye, Edit, Trash2, Search, MoreHorizontal } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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

interface ClientesPageProps {
  params: {
    slug: string
  }
}

export default function ClientesPage({ params }: ClientesPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null)
  
  const itemsPerPage = 10

  const colunas: ColunaConfig[] = [
    { key: "id", label: "ID", type: "number", sortable: true, width: "80px" },
    { key: "razao_social", label: "Razão Social", type: "text", sortable: true },
    { key: "nome_fantasia", label: "Nome Fantasia", type: "text", sortable: true },
    { key: "cpf_cnpj", label: "CPF/CNPJ", type: "text", sortable: true },
    { key: "tipoPessoa.nome", label: "Tipo Pessoa", type: "text", sortable: false },
    { key: "grupoCliente.nome", label: "Grupo", type: "text", sortable: false },
    { key: "contribuinte", label: "Contribuinte", type: "status", sortable: true },
    { key: "consumidor_final", label: "Consumidor Final", type: "status", sortable: true },
    { key: "actions", label: "Ações", type: "actions", sortable: false, width: "120px" },
  ]

  const {
    visibleColumns,
    loading: presetsLoading,
    savePreset,
  } = useTablePresets({
    entityName: "clientes",
    defaultColumns: colunas.map(col => col.key),
  })

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      if (!isAuthenticated()) {
        router.push(`/${params.slug}/login`)
        return
      }

      await fetchClientes()
    }

    checkAuthAndFetchData()
  }, [params.slug, router])

  useEffect(() => {
    const filtered = clientes.filter(cliente => {
      const searchLower = searchTerm.toLowerCase()
      return (
        cliente.razao_social?.toLowerCase().includes(searchLower) ||
        cliente.nome_fantasia?.toLowerCase().includes(searchLower) ||
        cliente.cpf_cnpj?.toLowerCase().includes(searchLower) ||
        cliente.tipo_pessoa?.nome?.toLowerCase().includes(searchLower) ||
        cliente.grupo_cliente?.nome?.toLowerCase().includes(searchLower)
      )
    })
    setFilteredClientes(filtered)
  }, [clientes, searchTerm])

  // Pagination
  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedClientes = filteredClientes.slice(startIndex, startIndex + itemsPerPage)

  const fetchClientes = async () => {
    setLoading(true)
    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      const data = await getClientes(token)
      setClientes(data)
    } catch (error) {
      console.error("Erro ao buscar clientes:", error)
      toast({
        variant: "destructive",
        title: "Erro ao carregar clientes",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!clienteToDelete?.id) return

    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      await deleteCliente(clienteToDelete.id, token)
      await fetchClientes()
      toast({
        title: "Cliente excluído com sucesso!",
        description: "O cliente foi removido do sistema.",
      })
    } catch (error) {
      console.error("Erro ao excluir cliente:", error)
      toast({
        variant: "destructive",
        title: "Erro ao excluir cliente",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    } finally {
      setDeleteDialogOpen(false)
      setClienteToDelete(null)
    }
  }

  const openDeleteDialog = (cliente: Cliente) => {
    setClienteToDelete(cliente)
    setDeleteDialogOpen(true)
  }

  const renderCell = (cliente: Cliente, columnKey: string) => {
    switch (columnKey) {
      case "id":
        return cliente.id
      case "razao_social":
        return cliente.razao_social || "-"
      case "nome_fantasia":
        return cliente.nome_fantasia || "-"
      case "cpf_cnpj":
        return cliente.cpf_cnpj || "-"
      case "tipoPessoa.nome":
        return cliente.tipo_pessoa?.nome || "-"
      case "grupoCliente.nome":
        return cliente.grupo_cliente?.nome || "-"
      case "contribuinte":
        return cliente.contribuinte ? "Sim" : "Não"
      case "consumidor_final":
        return cliente.consumidor_final ? "Sim" : "Não"
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
              <DropdownMenuItem onClick={() => router.push(`/${params.slug}/dashboard/clientes/${cliente.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/${params.slug}/dashboard/clientes/${cliente.id}/editar`)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openDeleteDialog(cliente)} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      default:
        const value = cliente[columnKey as keyof Cliente]
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
          <UserCheck className="mr-2 h-6 w-6" />
          <h1 className="text-2xl font-bold">Clientes</h1>
        </div>
        <Button onClick={() => router.push(`/${params.slug}/dashboard/clientes/novo`)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <ConfigurableTable
        data={paginatedClientes}
        columns={colunas}
        visibleColumns={visibleColumns}
        onSaveColumns={savePreset}
        renderCell={renderCell}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        loading={loading || presetsLoading}
        emptyMessage="Nenhum cliente encontrado."
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente "{clienteToDelete?.razao_social || clienteToDelete?.nome_fantasia}"?
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