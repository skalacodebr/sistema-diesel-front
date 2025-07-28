"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getToken, isAuthenticated, getEmpresaId } from "@/lib/auth"
import { getProdutos, deleteProduto } from "@/lib/api"
import { getCategorias, getSubcategorias, getMarcas } from "@/lib/api-auxiliar"
import type { Produto } from "@/lib/types"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Search, Plus, MoreHorizontal, Edit, Trash, Eye, Package, Filter, X, CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { useTablePresets } from "@/hooks/use-table-presets"
import { ConfigurableTable } from "@/components/table/configurable-table"
import type { ColunaConfig } from "@/lib/types"

interface ProdutosPageProps {
  params: {
    slug: string
  }
}

// Interface para os filtros
interface FiltrosProdutos {
  categoria_id: number | null
  subcategoria_id: number | null
  marca_id: number | null
  data_cadastro: Date | null
  quantidade_operador: "maior" | "menor" | "igual" | null
  quantidade_valor: number | null
  margem_operador: "maior" | "menor" | "igual" | null
  margem_valor: number | null
}

// Interface para as opções de filtro
interface OpcoesFiltro {
  categorias: Array<{ id: number; nome: string }>
  subcategorias: Array<{ id: number; nome: string; categoria_produtos_id: number }>
  marcas: Array<{ id: number; nome: string }>
}

// Definir as colunas disponíveis para a tabela de produtos
const PRODUTOS_COLUMNS: ColunaConfig[] = [
  { key: "id", label: "ID", type: "number", sortable: true, width: "80px" },
  { key: "descricao", label: "Descrição", type: "text", sortable: true },
  { key: "referencia", label: "Referência", type: "text", sortable: true },
  { key: "codigo_barras", label: "Código de Barras", type: "text", sortable: true },
  { key: "valor_compra", label: "Valor Compra", type: "currency", sortable: true },
  { key: "valor_custo", label: "Valor Custo", type: "currency", sortable: true },
  { key: "percentual_lucro", label: "Margem Lucro (%)", type: "number", sortable: true },
  { key: "percentual_frete", label: "Frete (%)", type: "number", sortable: true },
  { key: "preco_venda", label: "Preço Venda", type: "currency", sortable: true },
  { key: "percentual_despesas_operacionais", label: "Despesas Op. (%)", type: "number", sortable: true },
  { key: "preco_minimo", label: "Preço Mínimo", type: "currency", sortable: true },
  { key: "preco_maximo", label: "Preço Máximo", type: "currency", sortable: true },
  { key: "minimo_para_preco_atacado", label: "Mín. P/ Atacado", type: "number", sortable: true },
  { key: "preco_atacado", label: "Preço Atacado", type: "currency", sortable: true },
  { key: "percentual_marckup", label: "Markup (%)", type: "number", sortable: true },
  { key: "estoque_inicial", label: "Estoque", type: "number", sortable: true },
  { key: "estoque_minimo", label: "Estoque Mínimo", type: "number", sortable: true },
  { key: "limite_maximo_desconto", label: "Limite Desc. (%)", type: "number", sortable: true },
  { key: "conversao_unitaria", label: "Conversão Unit.", type: "number", sortable: true },
  { key: "percentual_comissao", label: "Comissão (%)", type: "number", sortable: true },
  { key: "largura_cm", label: "Largura (cm)", type: "number", sortable: true },
  { key: "altura_cm", label: "Altura (cm)", type: "number", sortable: true },
  { key: "comprimento_cm", label: "Comprimento (cm)", type: "number", sortable: true },
  { key: "peso_liquido", label: "Peso Líquido", type: "number", sortable: true },
  { key: "peso_bruto", label: "Peso Bruto", type: "number", sortable: true },
  { key: "lote_vencimento", label: "Lote/Vencimento", type: "text", sortable: true },
  { key: "cest", label: "CEST", type: "text", sortable: true },
  { key: "referencia_balanca", label: "Ref. Balança", type: "text", sortable: true },
  { key: "observacoes", label: "Observações", type: "text", sortable: true },
  { key: "reajuste_automatico", label: "Reajuste Auto", type: "status", sortable: true },
  { key: "gerenciar_estoque", label: "Gerenciar Estoque", type: "status", sortable: true },
  { key: "alerta_vencimento", label: "Alerta Vencimento", type: "status", sortable: true },
  { key: "envia_controle_pedidos", label: "Controle Pedidos", type: "status", sortable: true },
  { key: "atribuir_delivery", label: "Delivery", type: "status", sortable: true },
  { key: "atribuir_ecommerce", label: "E-commerce", type: "status", sortable: true },
  { key: "locacao", label: "Locação", type: "status", sortable: true },
  { key: "composto", label: "Composto", type: "status", sortable: true },
  { key: "derivado_petroleo", label: "Derivado Petróleo", type: "status", sortable: true },
  { key: "created_at", label: "Data Cadastro", type: "date", sortable: true },
  { key: "updated_at", label: "Data Atualização", type: "date", sortable: true },
  { key: "inativo", label: "Status", type: "status", sortable: true },
  { key: "actions", label: "Ações", type: "actions", width: "120px" },
]

const DEFAULT_VISIBLE_COLUMNS = [
  "id",
  "descricao",
  "referencia",
  "valor_custo",
  "preco_venda",
  "estoque_inicial",
  "inativo",
  "actions",
]

export default function ProdutosPage({ params }: ProdutosPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [produtoToDelete, setProdutoToDelete] = useState<Produto | null>(null)
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)
  const itemsPerPage = 10

  // Hook para gerenciar presets de colunas
  const {
    visibleColumns,
    loading: presetsLoading,
    savePreset,
  } = useTablePresets({
    entityName: "Produtos",
    defaultColumns: DEFAULT_VISIBLE_COLUMNS,
    availableColumns: PRODUTOS_COLUMNS,
  })

  // Estado para as opções de filtro
  const [opcoesFiltro, setOpcoesFiltro] = useState<OpcoesFiltro>({
    categorias: [],
    subcategorias: [],
    marcas: [],
  })

  // Estado para os filtros aplicados
  const [filtros, setFiltros] = useState<FiltrosProdutos>({
    categoria_id: null,
    subcategoria_id: null,
    marca_id: null,
    data_cadastro: null,
    quantidade_operador: null,
    quantidade_valor: null,
    margem_operador: null,
    margem_valor: null,
  })

  // Estado para subcategorias filtradas pela categoria selecionada
  const [subcategoriasFiltradas, setSubcategoriasFiltradas] = useState<
    Array<{ id: number; nome: string; categoria_produtos_id: number }>
  >([])

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      if (!isAuthenticated()) {
        router.push(`/${params.slug}/login`)
        return
      }

      await fetchProdutos()
      await carregarOpcoesFiltro()
    }

    checkAuthAndFetchData()
  }, [params.slug, router])

  // Efeito para filtrar subcategorias quando a categoria é alterada
  useEffect(() => {
    if (filtros.categoria_id) {
      const subcategoriasDaCategoria = opcoesFiltro.subcategorias.filter(
        (sub) => sub.categoria_produtos_id === filtros.categoria_id,
      )
      setSubcategoriasFiltradas(subcategoriasDaCategoria)
    } else {
      setSubcategoriasFiltradas(opcoesFiltro.subcategorias)
    }
  }, [filtros.categoria_id, opcoesFiltro.subcategorias])

  // Função para carregar as opções de filtro
  const carregarOpcoesFiltro = async () => {
    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      // Carregar categorias, subcategorias e marcas
      const [categorias, subcategorias, marcas] = await Promise.all([
        getCategorias(token),
        getSubcategorias(token),
        getMarcas(token),
      ])

      setOpcoesFiltro({
        categorias,
        subcategorias,
        marcas,
      })

      setSubcategoriasFiltradas(subcategorias)
    } catch (error) {
      console.error("Erro ao carregar opções de filtro:", error)
      toast({
        variant: "destructive",
        title: "Erro ao carregar opções de filtro",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    }
  }

  // Modificar a função fetchProdutos para usar a função getEmpresaId do lib/auth
  const fetchProdutos = async () => {
    setLoading(true)
    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      // Usar a função getEmpresaId do lib/auth
      const empresaId = getEmpresaId()
      if (!empresaId) {
        throw new Error("ID da empresa não encontrado. Tente fazer login novamente.")
      }

      console.log(`Buscando produtos para empresa_mae_id=${empresaId}`)

      const data = await getProdutos(token)

      // Filtro adicional para garantir que apenas produtos da empresa atual sejam exibidos
      const filteredData = data.filter((produto) => {
        // Se o produto não tiver empresa_mae_id, não mostrar
        if (!produto.empresa_mae_id) {
          console.warn(`Produto ${produto.id} (${produto.descricao}) não tem empresa_mae_id definido`)
          return false
        }
        return produto.empresa_mae_id === empresaId
      })

      if (data.length !== filteredData.length) {
        console.warn(`Filtrados ${data.length - filteredData.length} produtos que não pertencem à empresa ${empresaId}`)
      }

      setProdutos(filteredData)

      toast({
        title: "Produtos carregados com sucesso",
        description: `${filteredData.length} produtos encontrados`,
      })
    } catch (error) {
      console.error("Erro ao buscar produtos:", error)
      toast({
        variant: "destructive",
        title: "Erro ao carregar produtos",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (produto: Produto) => {
    setProdutoToDelete(produto)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!produtoToDelete || !produtoToDelete.id) return

    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      console.log(`Iniciando exclusão do produto ${produtoToDelete.id}`)

      await deleteProduto(produtoToDelete.id, token)

      // Atualiza a lista de produtos removendo o produto excluído
      setProdutos(produtos.filter((p) => p.id !== produtoToDelete.id))

      toast({
        title: "Produto excluído com sucesso",
        description: `O produto "${produtoToDelete.descricao}" foi excluído.`,
      })

      // Opcional: recarregar a lista de produtos do servidor para garantir sincronização
      // await fetchProdutos();
    } catch (error) {
      console.error("Erro ao excluir produto:", error)
      toast({
        variant: "destructive",
        title: "Erro ao excluir produto",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    } finally {
      setDeleteDialogOpen(false)
      setProdutoToDelete(null)
    }
  }

  // Função para limpar todos os filtros
  const limparFiltros = () => {
    setFiltros({
      categoria_id: null,
      subcategoria_id: null,
      marca_id: null,
      data_cadastro: null,
      quantidade_operador: null,
      quantidade_valor: null,
      margem_operador: null,
      margem_valor: null,
    })
    setCurrentPage(1)
  }

  // Função para aplicar os filtros
  const aplicarFiltros = () => {
    setCurrentPage(1)
    setFiltrosAbertos(false)
  }

  // Função para verificar se um produto atende aos critérios de filtro
  const produtoAtendeFiltros = (produto: Produto): boolean => {
    // Filtro de categoria
    if (filtros.categoria_id && produto.categoria_produtos_id !== filtros.categoria_id) {
      return false
    }

    // Filtro de subcategoria
    if (filtros.subcategoria_id && produto.subcategoria_produtos_id !== filtros.subcategoria_id) {
      return false
    }

    // Filtro de marca
    if (filtros.marca_id && produto.marcas_produtos_id !== filtros.marca_id) {
      return false
    }

    // Filtro de data de cadastro
    if (filtros.data_cadastro && produto.created_at) {
      const dataCadastro = new Date(produto.created_at)
      const dataFiltro = new Date(filtros.data_cadastro)

      // Comparar apenas a data (sem hora)
      if (
        dataCadastro.getFullYear() !== dataFiltro.getFullYear() ||
        dataCadastro.getMonth() !== dataFiltro.getMonth() ||
        dataCadastro.getDate() !== dataFiltro.getDate()
      ) {
        return false
      }
    }

    // Filtro de quantidade (estoque)
    if (filtros.quantidade_operador && filtros.quantidade_valor !== null) {
      const estoque = produto.estoque_inicial || 0

      if (filtros.quantidade_operador === "maior" && estoque <= filtros.quantidade_valor) {
        return false
      }
      if (filtros.quantidade_operador === "menor" && estoque >= filtros.quantidade_valor) {
        return false
      }
      if (filtros.quantidade_operador === "igual" && estoque !== filtros.quantidade_valor) {
        return false
      }
    }

    // Filtro de margem de lucro
    if (filtros.margem_operador && filtros.margem_valor !== null) {
      const margem = produto.percentual_lucro || 0

      if (filtros.margem_operador === "maior" && margem <= filtros.margem_valor) {
        return false
      }
      if (filtros.margem_operador === "menor" && margem >= filtros.margem_valor) {
        return false
      }
      if (filtros.margem_operador === "igual" && margem !== filtros.margem_valor) {
        return false
      }
    }

    return true
  }

  // Filter products based on search term and filters
  const filteredProdutos = produtos.filter((produto) => {
    // Primeiro verifica o termo de busca
    const matchesSearchTerm =
      produto.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produto.referencia.toLowerCase().includes(searchTerm.toLowerCase())

    // Se não corresponder ao termo de busca, já retorna falso
    if (!matchesSearchTerm) return false

    // Verifica os filtros avançados
    return produtoAtendeFiltros(produto)
  })

  // Pagination
  const totalPages = Math.ceil(filteredProdutos.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProdutos = filteredProdutos.slice(startIndex, startIndex + itemsPerPage)

  const renderCell = (produto: Produto, columnKey: string) => {
    switch (columnKey) {
      case "id":
        return produto.id
      case "descricao":
        return produto.descricao
      case "referencia":
        return produto.referencia
      case "codigo_barras":
        return produto.codigo_barras || "-"
      case "valor_compra":
        return produto.valor_compra || 0
      case "valor_custo":
        return produto.valor_custo
      case "percentual_lucro":
        return produto.percentual_lucro ? `${produto.percentual_lucro}%` : "-"
      case "percentual_frete":
        return produto.percentual_frete ? `${produto.percentual_frete}%` : "-"
      case "preco_venda":
        return produto.preco_venda
      case "percentual_despesas_operacionais":
        return produto.percentual_despesas_operacionais ? `${produto.percentual_despesas_operacionais}%` : "-"
      case "preco_minimo":
        return produto.preco_minimo || "-"
      case "preco_maximo":
        return produto.preco_maximo || "-"
      case "minimo_para_preco_atacado":
        return produto.minimo_para_preco_atacado || "-"
      case "preco_atacado":
        return produto.preco_atacado || "-"
      case "percentual_marckup":
        return produto.percentual_marckup ? `${produto.percentual_marckup}%` : "-"
      case "estoque_inicial":
        return produto.estoque_inicial
      case "estoque_minimo":
        return produto.estoque_minimo || "-"
      case "limite_maximo_desconto":
        return produto.limite_maximo_desconto ? `${produto.limite_maximo_desconto}%` : "-"
      case "conversao_unitaria":
        return produto.conversao_unitaria || "-"
      case "percentual_comissao":
        return produto.percentual_comissao ? `${produto.percentual_comissao}%` : "-"
      case "largura_cm":
        return produto.largura_cm ? `${produto.largura_cm} cm` : "-"
      case "altura_cm":
        return produto.altura_cm ? `${produto.altura_cm} cm` : "-"
      case "comprimento_cm":
        return produto.comprimento_cm ? `${produto.comprimento_cm} cm` : "-"
      case "peso_liquido":
        return produto.peso_liquido ? `${produto.peso_liquido} kg` : "-"
      case "peso_bruto":
        return produto.peso_bruto ? `${produto.peso_bruto} kg` : "-"
      case "lote_vencimento":
        return produto.lote_vencimento || "-"
      case "cest":
        return produto.cest || "-"
      case "referencia_balanca":
        return produto.referencia_balanca || "-"
      case "observacoes":
        return produto.observacoes ? (
          <span className="max-w-xs truncate" title={produto.observacoes}>
            {produto.observacoes}
          </span>
        ) : (
          "-"
        )
      case "reajuste_automatico":
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              produto.reajuste_automatico ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
            }`}
          >
            {produto.reajuste_automatico ? "Sim" : "Não"}
          </span>
        )
      case "gerenciar_estoque":
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              produto.gerenciar_estoque ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
            }`}
          >
            {produto.gerenciar_estoque ? "Sim" : "Não"}
          </span>
        )
      case "alerta_vencimento":
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              produto.alerta_vencimento ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"
            }`}
          >
            {produto.alerta_vencimento ? "Sim" : "Não"}
          </span>
        )
      case "envia_controle_pedidos":
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              produto.envia_controle_pedidos ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
            }`}
          >
            {produto.envia_controle_pedidos ? "Sim" : "Não"}
          </span>
        )
      case "atribuir_delivery":
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              produto.atribuir_delivery ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"
            }`}
          >
            {produto.atribuir_delivery ? "Sim" : "Não"}
          </span>
        )
      case "atribuir_ecommerce":
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              produto.atribuir_ecommerce ? "bg-indigo-100 text-indigo-800" : "bg-gray-100 text-gray-800"
            }`}
          >
            {produto.atribuir_ecommerce ? "Sim" : "Não"}
          </span>
        )
      case "locacao":
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              produto.locacao ? "bg-orange-100 text-orange-800" : "bg-gray-100 text-gray-800"
            }`}
          >
            {produto.locacao ? "Sim" : "Não"}
          </span>
        )
      case "composto":
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              produto.composto ? "bg-teal-100 text-teal-800" : "bg-gray-100 text-gray-800"
            }`}
          >
            {produto.composto ? "Sim" : "Não"}
          </span>
        )
      case "derivado_petroleo":
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              produto.derivado_petroleo ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
            }`}
          >
            {produto.derivado_petroleo ? "Sim" : "Não"}
          </span>
        )
      case "created_at":
        return produto.created_at ? format(new Date(produto.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "-"
      case "updated_at":
        return produto.updated_at ? format(new Date(produto.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "-"
      case "inativo":
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              produto.inativo ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
            }`}
          >
            {produto.inativo ? "Inativo" : "Ativo"}
          </span>
        )
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
              <DropdownMenuItem onClick={() => router.push(`/${params.slug}/dashboard/produtos/${produto.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/${params.slug}/dashboard/produtos/${produto.id}/editar`)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDeleteClick(produto)} className="text-red-600">
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

  // Verificar se há filtros ativos
  const temFiltrosAtivos =
    filtros.categoria_id !== null ||
    filtros.subcategoria_id !== null ||
    filtros.marca_id !== null ||
    filtros.data_cadastro !== null ||
    (filtros.quantidade_operador !== null && filtros.quantidade_valor !== null) ||
    (filtros.margem_operador !== null && filtros.margem_valor !== null)

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Package className="mr-2 h-6 w-6" />
          <h1 className="text-2xl font-bold">Produtos</h1>
        </div>
        <Button onClick={() => router.push(`/${params.slug}/dashboard/produtos/novo`)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Botão de filtros */}
        <Popover open={filtrosAbertos} onOpenChange={setFiltrosAbertos}>
          <PopoverTrigger asChild>
            <Button variant={temFiltrosAtivos ? "default" : "outline"} className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
              {temFiltrosAtivos && (
                <span className="ml-1 rounded-full bg-primary-foreground text-primary w-5 h-5 flex items-center justify-center text-xs">
                  {Object.values(filtros).filter((v) => v !== null).length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-4" align="end">
            <div className="space-y-4">
              <h3 className="font-medium text-sm">Filtros Avançados</h3>

              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Select
                  value={filtros.categoria_id?.toString() || "all"}
                  onValueChange={(value) => {
                    const newValue = value === "all" ? null : Number.parseInt(value)
                    setFiltros({
                      ...filtros,
                      categoria_id: newValue,
                      // Limpar subcategoria se a categoria mudar
                      subcategoria_id: null,
                    })
                  }}
                >
                  <SelectTrigger id="categoria">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {opcoesFiltro.categorias.map((categoria) => (
                      <SelectItem key={categoria.id} value={categoria.id.toString()}>
                        {categoria.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subcategoria">Subcategoria</Label>
                <Select
                  value={filtros.subcategoria_id?.toString() || "all"}
                  onValueChange={(value) => {
                    setFiltros({
                      ...filtros,
                      subcategoria_id: value === "all" ? null : Number.parseInt(value),
                    })
                  }}
                  disabled={subcategoriasFiltradas.length === 0}
                >
                  <SelectTrigger id="subcategoria">
                    <SelectValue placeholder="Selecione uma subcategoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as subcategorias</SelectItem>
                    {subcategoriasFiltradas.map((subcategoria) => (
                      <SelectItem key={subcategoria.id} value={subcategoria.id.toString()}>
                        {subcategoria.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="marca">Marca</Label>
                <Select
                  value={filtros.marca_id?.toString() || "all"}
                  onValueChange={(value) => {
                    setFiltros({
                      ...filtros,
                      marca_id: value === "all" ? null : Number.parseInt(value),
                    })
                  }}
                >
                  <SelectTrigger id="marca">
                    <SelectValue placeholder="Selecione uma marca" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as marcas</SelectItem>
                    {opcoesFiltro.marcas.map((marca) => (
                      <SelectItem key={marca.id} value={marca.id.toString()}>
                        {marca.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data de Cadastro</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filtros.data_cadastro
                        ? format(filtros.data_cadastro, "dd/MM/yyyy", { locale: ptBR })
                        : "Selecione uma data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filtros.data_cadastro || undefined}
                      onSelect={(date) => {
                        setFiltros({
                          ...filtros,
                          data_cadastro: date,
                        })
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {filtros.data_cadastro && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs"
                    onClick={() => {
                      setFiltros({
                        ...filtros,
                        data_cadastro: null,
                      })
                    }}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Limpar data
                  </Button>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Quantidade em Estoque</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={filtros.quantidade_operador || "none"}
                    onValueChange={(value: "maior" | "menor" | "igual" | "none") => {
                      setFiltros({
                        ...filtros,
                        quantidade_operador: value === "none" ? null : value,
                      })
                    }}
                  >
                    <SelectTrigger className="w-[110px]">
                      <SelectValue placeholder="Operador" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      <SelectItem value="maior">Maior que</SelectItem>
                      <SelectItem value="menor">Menor que</SelectItem>
                      <SelectItem value="igual">Igual a</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Valor"
                    value={filtros.quantidade_valor !== null ? filtros.quantidade_valor : ""}
                    onChange={(e) => {
                      const value = e.target.value ? Number.parseInt(e.target.value) : null
                      setFiltros({
                        ...filtros,
                        quantidade_valor: value,
                      })
                    }}
                    className="flex-1"
                    disabled={!filtros.quantidade_operador}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Margem de Lucro (%)</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={filtros.margem_operador || "none"}
                    onValueChange={(value: "maior" | "menor" | "igual" | "none") => {
                      setFiltros({
                        ...filtros,
                        margem_operador: value === "none" ? null : value,
                      })
                    }}
                  >
                    <SelectTrigger className="w-[110px]">
                      <SelectValue placeholder="Operador" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      <SelectItem value="maior">Maior que</SelectItem>
                      <SelectItem value="menor">Menor que</SelectItem>
                      <SelectItem value="igual">Igual a</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Valor"
                    value={filtros.margem_valor !== null ? filtros.margem_valor : ""}
                    onChange={(e) => {
                      const value = e.target.value ? Number.parseInt(e.target.value) : null
                      setFiltros({
                        ...filtros,
                        margem_valor: value,
                      })
                    }}
                    className="flex-1"
                    disabled={!filtros.margem_operador}
                  />
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" size="sm" onClick={limparFiltros}>
                  Limpar Filtros
                </Button>
                <Button size="sm" onClick={aplicarFiltros}>
                  Aplicar Filtros
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button variant="outline" onClick={fetchProdutos}>
          Atualizar
        </Button>
      </div>

      {/* Exibir filtros ativos */}
      {temFiltrosAtivos && (
        <div className="mb-4 flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Filtros ativos:</span>

          {filtros.categoria_id && (
            <div className="bg-muted text-sm px-3 py-1 rounded-full flex items-center gap-1">
              <span>Categoria: {opcoesFiltro.categorias.find((c) => c.id === filtros.categoria_id)?.nome}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0"
                onClick={() => setFiltros({ ...filtros, categoria_id: null, subcategoria_id: null })}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remover filtro de categoria</span>
              </Button>
            </div>
          )}

          {filtros.subcategoria_id && (
            <div className="bg-muted text-sm px-3 py-1 rounded-full flex items-center gap-1">
              <span>
                Subcategoria: {opcoesFiltro.subcategorias.find((s) => s.id === filtros.subcategoria_id)?.nome}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0"
                onClick={() => setFiltros({ ...filtros, subcategoria_id: null })}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remover filtro de subcategoria</span>
              </Button>
            </div>
          )}

          {filtros.marca_id && (
            <div className="bg-muted text-sm px-3 py-1 rounded-full flex items-center gap-1">
              <span>Marca: {opcoesFiltro.marcas.find((m) => m.id === filtros.marca_id)?.nome}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0"
                onClick={() => setFiltros({ ...filtros, marca_id: null })}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remover filtro de marca</span>
              </Button>
            </div>
          )}

          {filtros.data_cadastro && (
            <div className="bg-muted text-sm px-3 py-1 rounded-full flex items-center gap-1">
              <span>Data: {format(filtros.data_cadastro, "dd/MM/yyyy", { locale: ptBR })}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0"
                onClick={() => setFiltros({ ...filtros, data_cadastro: null })}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remover filtro de data</span>
              </Button>
            </div>
          )}

          {filtros.quantidade_operador && filtros.quantidade_valor !== null && (
            <div className="bg-muted text-sm px-3 py-1 rounded-full flex items-center gap-1">
              <span>
                Estoque{" "}
                {filtros.quantidade_operador === "maior" ? ">" : filtros.quantidade_operador === "menor" ? "<" : "="}{" "}
                {filtros.quantidade_valor}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0"
                onClick={() => setFiltros({ ...filtros, quantidade_operador: null, quantidade_valor: null })}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remover filtro de quantidade</span>
              </Button>
            </div>
          )}

          {filtros.margem_operador && filtros.margem_valor !== null && (
            <div className="bg-muted text-sm px-3 py-1 rounded-full flex items-center gap-1">
              <span>
                Margem {filtros.margem_operador === "maior" ? ">" : filtros.margem_operador === "menor" ? "<" : "="}{" "}
                {filtros.margem_valor}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0"
                onClick={() => setFiltros({ ...filtros, margem_operador: null, margem_valor: null })}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remover filtro de margem</span>
              </Button>
            </div>
          )}

          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={limparFiltros}>
            Limpar todos
          </Button>
        </div>
      )}

      <ConfigurableTable
        data={paginatedProdutos}
        columns={PRODUTOS_COLUMNS}
        visibleColumns={visibleColumns}
        onSaveColumns={savePreset}
        renderCell={renderCell}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        loading={loading || presetsLoading}
        emptyMessage="Nenhum produto encontrado."
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o produto "{produtoToDelete?.descricao}"? Esta ação não pode ser desfeita.
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
