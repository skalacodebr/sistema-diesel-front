"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getToken, isAuthenticated } from "@/lib/auth"
import { getVeiculos, deleteVeiculo } from "@/lib/api"
import type { Veiculo } from "@/lib/types"
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
import { Search, Plus, MoreHorizontal, Edit, Trash, Eye, Car } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { useTablePresets } from "@/hooks/use-table-presets"
import { ConfigurableTable } from "@/components/table/configurable-table"
import type { ColunaConfig } from "@/lib/types"

interface VeiculosPageProps {
  params: {
    slug: string
  }
}

// Definir as colunas disponíveis para a tabela de veículos
const VEICULOS_COLUMNS: ColunaConfig[] = [
  { key: "id", label: "ID", type: "number", sortable: true, width: "80px" },
  { key: "placa", label: "Placa", type: "text", sortable: true },
  { key: "cor", label: "Cor", type: "text", sortable: true },
  { key: "marca", label: "Marca", type: "text", sortable: true },
  { key: "modelo", label: "Modelo", type: "text", sortable: true },
  { key: "ano_veiculo", label: "Ano", type: "number", sortable: true },
  { key: "created_at", label: "Data Cadastro", type: "date", sortable: true },
  { key: "updated_at", label: "Data Atualização", type: "date", sortable: true },
  { key: "actions", label: "Ações", type: "actions", width: "120px" },
]

const DEFAULT_VISIBLE_COLUMNS = [
  "id",
  "placa",
  "cor",
  "marca",
  "modelo",
  "ano_veiculo",
  "actions",
]

export default function VeiculosPage({ params }: VeiculosPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [veiculoToDelete, setVeiculoToDelete] = useState<Veiculo | null>(null)
  const itemsPerPage = 10

  // Hook para gerenciar presets de colunas
  const {
    visibleColumns,
    loading: presetsLoading,
    savePreset,
  } = useTablePresets({
    entityName: "Veiculos",
    defaultColumns: DEFAULT_VISIBLE_COLUMNS,
    availableColumns: VEICULOS_COLUMNS,
  })

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      if (!isAuthenticated()) {
        router.push(`/${params.slug}/login`)
        return
      }

      await fetchVeiculos()
    }

    checkAuthAndFetchData()
  }, [params.slug, router])

  const fetchVeiculos = async () => {
    setLoading(true)
    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      const data = await getVeiculos(token)
      setVeiculos(data)

      toast({
        title: "Veículos carregados com sucesso",
        description: `${data.length} veículos encontrados`,
      })
    } catch (error) {
      console.error("Erro ao buscar veículos:", error)
      toast({
        variant: "destructive",
        title: "Erro ao carregar veículos",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (veiculo: Veiculo) => {
    setVeiculoToDelete(veiculo)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!veiculoToDelete || !veiculoToDelete.id) return

    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      await deleteVeiculo(veiculoToDelete.id, token)

      // Atualiza a lista de veículos removendo o veículo excluído
      setVeiculos(veiculos.filter((v) => v.id !== veiculoToDelete.id))

      toast({
        title: "Veículo excluído com sucesso",
        description: `O veículo de placa "${veiculoToDelete.placa}" foi excluído.`,
      })
    } catch (error) {
      console.error("Erro ao excluir veículo:", error)
      toast({
        variant: "destructive",
        title: "Erro ao excluir veículo",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    } finally {
      setDeleteDialogOpen(false)
      setVeiculoToDelete(null)
    }
  }

  // Filter vehicles based on search term
  const filteredVeiculos = veiculos.filter((veiculo) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      (veiculo.placa && veiculo.placa.toLowerCase().includes(searchLower)) ||
      (veiculo.cor && veiculo.cor.toLowerCase().includes(searchLower)) ||
      (veiculo.modelo?.marca?.nome && veiculo.modelo.marca.nome.toLowerCase().includes(searchLower)) ||
      (veiculo.modelo?.nome && veiculo.modelo.nome.toLowerCase().includes(searchLower))
    )
  })

  // Pagination
  const totalPages = Math.ceil(filteredVeiculos.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedVeiculos = filteredVeiculos.slice(startIndex, startIndex + itemsPerPage)

  const renderCell = (veiculo: Veiculo, columnKey: string) => {
    switch (columnKey) {
      case "id":
        return veiculo.id
      case "placa":
        return veiculo.placa || "-"
      case "cor":
        return veiculo.cor || "-"
      case "marca":
        return veiculo.modelo?.marca?.nome || "-"
      case "modelo":
        return veiculo.modelo?.nome || "-"
      case "ano_veiculo":
        return veiculo.ano_veiculo || "-"
      case "created_at":
        return veiculo.created_at ? format(new Date(veiculo.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "-"
      case "updated_at":
        return veiculo.updated_at ? format(new Date(veiculo.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "-"
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
              <DropdownMenuItem onClick={() => router.push(`/${params.slug}/dashboard/veiculos/${veiculo.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/${params.slug}/dashboard/veiculos/${veiculo.id}/editar`)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDeleteClick(veiculo)} className="text-red-600">
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
          <Car className="mr-2 h-6 w-6" />
          <h1 className="text-2xl font-bold">Veículos</h1>
        </div>
        <Button onClick={() => router.push(`/${params.slug}/dashboard/veiculos/novo`)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Veículo
        </Button>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar veículos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Button variant="outline" onClick={fetchVeiculos}>
          Atualizar
        </Button>
      </div>

      <ConfigurableTable
        data={paginatedVeiculos}
        columns={VEICULOS_COLUMNS}
        visibleColumns={visibleColumns}
        onSaveColumns={savePreset}
        renderCell={renderCell}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        loading={loading || presetsLoading}
        emptyMessage="Nenhum veículo encontrado."
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o veículo de placa "{veiculoToDelete?.placa}"? Esta ação não pode ser desfeita.
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