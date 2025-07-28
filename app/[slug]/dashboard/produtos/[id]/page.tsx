"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { getToken, isAuthenticated } from "@/lib/auth"
import { getProduto } from "@/lib/api"
import type { Produto } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Edit, Package } from "lucide-react"
import {
  fetchCategorias,
  fetchSubcategorias,
  fetchMarcas,
  fetchCsosn,
  fetchCstPis,
  fetchCstCofins,
  fetchCstIpi,
  fetchNcm,
  fetchOrigemProdutos,
  fetchUnidadeCompraVenda,
  type ListItem,
} from "@/lib/api-auxiliar"

// Importar a função formatCurrency
import { formatCurrency } from "@/lib/utils"

interface ProdutoViewPageProps {
  params: {
    slug: string
    id: string
  }
}

export default function ProdutoViewPage({ params }: ProdutoViewPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [produto, setProduto] = useState<Produto | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingLists, setLoadingLists] = useState(true)

  // Estados para armazenar os dados das listas
  const [categorias, setCategorias] = useState<ListItem[]>([])
  const [subcategorias, setSubcategorias] = useState<ListItem[]>([])
  const [marcas, setMarcas] = useState<ListItem[]>([])
  const [csosnList, setCsosnList] = useState<ListItem[]>([])
  const [cstPisList, setCstPisList] = useState<ListItem[]>([])
  const [cstCofinsList, setCstCofinsList] = useState<ListItem[]>([])
  const [cstIpiList, setCstIpiList] = useState<ListItem[]>([])
  const [ncmList, setNcmList] = useState<ListItem[]>([])
  const [origemProdutos, setOrigemProdutos] = useState<ListItem[]>([])
  const [unidadesCompraVenda, setUnidadesCompraVenda] = useState<ListItem[]>([])

  useEffect(() => {
    // Verificar se o ID é "novo" e redirecionar imediatamente
    if (params.id === "novo") {
      router.push(`/${params.slug}/dashboard/produtos/novo`)
      return
    }

    const produtoId = Number(params.id)

    const checkAuthAndFetchData = async () => {
      if (!isAuthenticated()) {
        router.push(`/${params.slug}/login`)
        return
      }

      try {
        // Verificar se o ID é válido
        if (isNaN(produtoId)) {
          throw new Error("ID de produto inválido")
        }

        // Carregar as listas de dados auxiliares
        await fetchAllLists()

        // Depois de carregar as listas, buscar o produto
        await fetchProduto(produtoId)
      } catch (error) {
        console.error("Erro ao processar ID do produto:", error)
        toast({
          variant: "destructive",
          title: "Erro",
          description: "ID de produto inválido",
        })
        router.push(`/${params.slug}/dashboard/produtos`)
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndFetchData()
  }, [params.slug, params.id, router, toast])

  const fetchAllLists = async () => {
    setLoadingLists(true)
    try {
      const [
        categoriasData,
        subcategoriasData,
        marcasData,
        csosnData,
        cstPisData,
        cstCofinsData,
        cstIpiData,
        ncmData,
        origemProdutosData,
        unidadesData,
      ] = await Promise.all([
        fetchCategorias(),
        fetchSubcategorias(),
        fetchMarcas(),
        fetchCsosn(),
        fetchCstPis(),
        fetchCstCofins(),
        fetchCstIpi(),
        fetchNcm(),
        fetchOrigemProdutos(),
        fetchUnidadeCompraVenda(),
      ])

      setCategorias(categoriasData)
      setSubcategorias(subcategoriasData)
      setMarcas(marcasData)
      setCsosnList(csosnData)
      setCstPisList(cstPisData)
      setCstCofinsList(cstCofinsData)
      setCstIpiList(cstIpiData)
      setNcmList(ncmData)
      setOrigemProdutos(origemProdutosData)
      setUnidadesCompraVenda(unidadesData)
    } catch (error) {
      console.error("Erro ao carregar listas:", error)
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados auxiliares",
        description:
          "Não foi possível carregar as listas de seleção. Alguns campos podem não ser exibidos corretamente.",
      })
    } finally {
      setLoadingLists(false)
    }
  }

  const fetchProduto = async (id: number) => {
    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      const data = await getProduto(id, token)

      // Verificar se as alíquotas existem
      if (!data.aliquotas || data.aliquotas.length === 0) {
        console.warn(`Produto ${id} não possui alíquotas associadas`)
      } else {
        console.log(`Produto ${id} possui ${data.aliquotas.length} alíquotas`)
      }

      setProduto(data)

      toast({
        title: "Produto carregado com sucesso",
        description: `Produto "${data.descricao}" carregado.`,
      })
    } catch (error) {
      console.error("Erro ao buscar produto:", error)
      toast({
        variant: "destructive",
        title: "Erro ao carregar produto",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
      router.push(`/${params.slug}/dashboard/produtos`)
    }
  }

  // Função para obter o nome de um item de uma lista pelo ID
  const getItemNameById = (list: ListItem[], id?: number | null): string => {
    if (!id) return "-"
    const item = list.find((item) => item.id === id)
    if (!item) return `ID: ${id}`

    // Se tiver código e descrição, mostrar ambos
    if (item.codigo && item.descricao) {
      return `${item.codigo} - ${item.descricao}`
    }

    // Caso contrário, mostrar o que estiver disponível
    return item.nome || item.descricao || `ID: ${id}`
  }

  if (loading || loadingLists) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    )
  }

  if (!produto) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-red-500">Produto não encontrado.</p>
          <Button className="mt-4" onClick={() => router.push(`/${params.slug}/dashboard/produtos`)}>
            Voltar para a lista
          </Button>
        </div>
      </div>
    )
  }

  const produtoId = produto.id

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${params.slug}/dashboard/produtos`)}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Package className="mr-2 h-6 w-6" />
          <h1 className="text-2xl font-bold">{produto.descricao}</h1>
        </div>
        <Button onClick={() => router.push(`/${params.slug}/dashboard/produtos/${produtoId}/editar`)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </div>

      <Tabs defaultValue="informacoes">
        <TabsList className="mb-4">
          <TabsTrigger value="informacoes">Informações Básicas</TabsTrigger>
          <TabsTrigger value="precos">Preços e Estoque</TabsTrigger>
          <TabsTrigger value="fiscal">Informações Fiscais</TabsTrigger>
          <TabsTrigger value="adicionais">Informações Adicionais</TabsTrigger>
        </TabsList>

        <TabsContent value="informacoes">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Dados Gerais</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">ID</dt>
                    <dd className="mt-1 text-sm">{produto.id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Descrição</dt>
                    <dd className="mt-1 text-sm">{produto.descricao}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Referência</dt>
                    <dd className="mt-1 text-sm">{produto.referencia}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Código de Barras</dt>
                    <dd className="mt-1 text-sm">{produto.codigo_barras || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Categoria</dt>
                    <dd className="mt-1 text-sm">{getItemNameById(categorias, produto.categoria_produtos_id)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Subcategoria</dt>
                    <dd className="mt-1 text-sm">{getItemNameById(subcategorias, produto.subcategoria_produtos_id)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Marca</dt>
                    <dd className="mt-1 text-sm">{getItemNameById(marcas, produto.marcas_produtos_id)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${produto.inativo ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
                      >
                        {produto.inativo ? "Inativo" : "Ativo"}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Observações</dt>
                    <dd className="mt-1 text-sm">{produto.observacoes || "-"}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Imagem</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                {produto.imagem_url ? (
                  <div className="relative w-64 h-64">
                    <Image
                      src={`data:image/png;base64,${produto.imagem_url}`}
                      alt={produto.descricao}
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-64 h-64 bg-gray-100 flex items-center justify-center rounded-md">
                    <Package className="h-16 w-16 text-gray-300" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="precos">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Custos e Preços</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Valor de Compra</dt>
                    <dd className="mt-1 text-sm">
                      {produto.valor_compra ? formatCurrency(produto.valor_compra) : "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Despesas Operacionais (%)</dt>
                    <dd className="mt-1 text-sm">
                      {produto.percentual_despesas_operacionais ? `${produto.percentual_despesas_operacionais}%` : "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Frete (%)</dt>
                    <dd className="mt-1 text-sm">{produto.percentual_frete ? `${produto.percentual_frete}%` : "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Valor Total de Custo</dt>
                    <dd className="mt-1 text-sm">{formatCurrency(produto.valor_custo)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Markup (%)</dt>
                    <dd className="mt-1 text-sm">
                      {produto.percentual_marckup ? `${produto.percentual_marckup}%` : "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Margem de Lucro (%)</dt>
                    <dd className="mt-1 text-sm">{produto.percentual_lucro ? `${produto.percentual_lucro}%` : "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Valor de Venda</dt>
                    <dd className="mt-1 text-sm">{formatCurrency(produto.preco_venda)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Valores de Venda e Estoque</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Valor Mínimo</dt>
                    <dd className="mt-1 text-sm">
                      {produto.preco_minimo ? formatCurrency(produto.preco_minimo) : "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Valor Máximo</dt>
                    <dd className="mt-1 text-sm">
                      {produto.preco_maximo ? formatCurrency(produto.preco_maximo) : "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Valor de Atacado</dt>
                    <dd className="mt-1 text-sm">
                      {produto.preco_atacado ? formatCurrency(produto.preco_atacado) : "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Quantidade Mínima para Atacado</dt>
                    <dd className="mt-1 text-sm">{produto.minimo_para_preco_atacado || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Estoque Inicial</dt>
                    <dd className="mt-1 text-sm">{produto.estoque_inicial}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Alerta de Estoque</dt>
                    <dd className="mt-1 text-sm">{produto.estoque_minimo || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Gerenciar Estoque</dt>
                    <dd className="mt-1 text-sm">{produto.gerenciar_estoque ? "Sim" : "Não"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Reajuste Automático</dt>
                    <dd className="mt-1 text-sm">{produto.reajuste_automatico ? "Sim" : "Não"}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="fiscal">
          <Card>
            <CardHeader>
              <CardTitle>Informações Fiscais</CardTitle>
            </CardHeader>
            <CardContent>
              {produto.aliquotas && produto.aliquotas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">CSOSN</dt>
                      <dd className="mt-1 text-sm">{getItemNameById(csosnList, produto.aliquotas[0].csosn_id)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">CST PIS</dt>
                      <dd className="mt-1 text-sm">{getItemNameById(cstPisList, produto.aliquotas[0].cst_pis_id)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">CST COFINS</dt>
                      <dd className="mt-1 text-sm">
                        {getItemNameById(cstCofinsList, produto.aliquotas[0].cst_cofins_id)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">CST IPI</dt>
                      <dd className="mt-1 text-sm">{getItemNameById(cstIpiList, produto.aliquotas[0].cst_ipi_id)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">NCM</dt>
                      <dd className="mt-1 text-sm">{getItemNameById(ncmList, produto.ncm_id)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">CEST</dt>
                      <dd className="mt-1 text-sm">{produto.cest || "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">CFOP Saída Interno</dt>
                      <dd className="mt-1 text-sm">{produto.aliquotas[0].cfop_saida_interno || "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">CFOP Saída Externo</dt>
                      <dd className="mt-1 text-sm">{produto.aliquotas[0].cfop_saida_externo || "-"}</dd>
                    </div>
                  </dl>

                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Percentual ICMS</dt>
                      <dd className="mt-1 text-sm">{produto.aliquotas[0].percentual_icms}%</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Percentual PIS</dt>
                      <dd className="mt-1 text-sm">{produto.aliquotas[0].percentual_pis}%</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Percentual COFINS</dt>
                      <dd className="mt-1 text-sm">{produto.aliquotas[0].percentual_cofins}%</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Percentual IPI</dt>
                      <dd className="mt-1 text-sm">{produto.aliquotas[0].percentual_ipi}%</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Percentual ISS</dt>
                      <dd className="mt-1 text-sm">
                        {produto.aliquotas[0].percentual_iss ? `${produto.aliquotas[0].percentual_iss}%` : "-"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Percentual Redução BC</dt>
                      <dd className="mt-1 text-sm">
                        {produto.aliquotas[0].percentual_reducao_bc
                          ? `${produto.aliquotas[0].percentual_reducao_bc}%`
                          : "-"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Origem do Produto</dt>
                      <dd className="mt-1 text-sm">
                        {getItemNameById(origemProdutos, produto.aliquotas[0].origem_produtos_id)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Código Benefício</dt>
                      <dd className="mt-1 text-sm">{produto.aliquotas[0].codigo_beneficio || "-"}</dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <p className="text-center text-gray-500">Nenhuma informação fiscal cadastrada.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adicionais">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Adicionais</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Unidade de Compra</dt>
                    <dd className="mt-1 text-sm">{getItemNameById(unidadesCompraVenda, produto.unidade_compra_id)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Unidade de Venda</dt>
                    <dd className="mt-1 text-sm">{getItemNameById(unidadesCompraVenda, produto.unidade_venda_id)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Conversão Unitária</dt>
                    <dd className="mt-1 text-sm">{produto.conversao_unitaria || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Percentual de Comissão</dt>
                    <dd className="mt-1 text-sm">
                      {produto.percentual_comissao ? `${produto.percentual_comissao}%` : "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Valor de Desconto</dt>
                    <dd className="mt-1 text-sm">
                      {produto.valor_desconto ? formatCurrency(produto.valor_desconto) : "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Limite Máximo de Desconto</dt>
                    <dd className="mt-1 text-sm">
                      {produto.limite_maximo_desconto ? `${produto.limite_maximo_desconto}%` : "-"}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dimensões e Atributos</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Largura</dt>
                    <dd className="mt-1 text-sm">{produto.largura_cm ? `${produto.largura_cm} cm` : "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Altura</dt>
                    <dd className="mt-1 text-sm">{produto.altura_cm ? `${produto.altura_cm} cm` : "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Comprimento</dt>
                    <dd className="mt-1 text-sm">{produto.comprimento_cm ? `${produto.comprimento_cm} cm` : "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Peso Líquido</dt>
                    <dd className="mt-1 text-sm">{produto.peso_liquido ? `${produto.peso_liquido} kg` : "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Peso Bruto</dt>
                    <dd className="mt-1 text-sm">{produto.peso_bruto ? `${produto.peso_bruto} kg` : "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Atribuir ao Delivery</dt>
                    <dd className="mt-1 text-sm">{produto.atribuir_delivery ? "Sim" : "Não"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Atribuir ao E-commerce</dt>
                    <dd className="mt-1 text-sm">{produto.atribuir_ecommerce ? "Sim" : "Não"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Produto para Locação</dt>
                    <dd className="mt-1 text-sm">{produto.locacao ? "Sim" : "Não"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Produto Composto</dt>
                    <dd className="mt-1 text-sm">{produto.composto ? "Sim" : "Não"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Derivado de Petróleo</dt>
                    <dd className="mt-1 text-sm">{produto.derivado_petroleo ? "Sim" : "Não"}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
