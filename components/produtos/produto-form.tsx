"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { getToken, getEmpresaId } from "@/lib/auth"
import { getProduto, createProduto, updateProduto, createAliquota, updateAliquota } from "@/lib/api"
import type { Produto, AliquotaProduto } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Save, Upload, Package } from "lucide-react"
import {
  fetchCategorias,
  fetchSubcategoriasByCategoria,
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

interface ProdutoFormProps {
  params: {
    slug: string
    action: string
  }
}

export default function ProdutoForm({ params }: ProdutoFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [produto, setProduto] = useState<Produto>({
    descricao: "",
    referencia: "",
    valor_compra: 0, // Novo campo
    valor_custo: 0,
    preco_venda: 0,
    estoque_inicial: 0,
    categoria_produtos_id: 1, // Default value
    marcas_produtos_id: 1, // Default value
    inativo: false,
  })
  const [aliquota, setAliquota] = useState<AliquotaProduto>({
    produto_id: 0,
    csosn_id: 1, // Default value
    cst_pis_id: 1, // Default value
    cst_cofins_id: 1, // Default value
    cst_ipi_id: 1, // Default value
    percentual_icms: 0,
    percentual_pis: 0,
    percentual_cofins: 0,
    percentual_ipi: 0,
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const isEditing = params.action !== "novo" && !isNaN(Number(params.action))
  const produtoId = isEditing ? Number(params.action) : null

  // Estados para as listas de seleção
  const [categorias, setCategorias] = useState<ListItem[]>([])
  const [subcategorias, setSubcategorias] = useState<ListItem[]>([])
  const [loadingSubcategorias, setLoadingSubcategorias] = useState(false)
  const [marcas, setMarcas] = useState<ListItem[]>([])
  const [csosnList, setCsosnList] = useState<ListItem[]>([])
  const [cstPisList, setCstPisList] = useState<ListItem[]>([])
  const [cstCofinsList, setCstCofinsList] = useState<ListItem[]>([])
  const [cstIpiList, setCstIpiList] = useState<ListItem[]>([])
  const [ncmList, setNcmList] = useState<ListItem[]>([])
  const [origemProdutos, setOrigemProdutos] = useState<ListItem[]>([])
  const [unidadesCompraVenda, setUnidadesCompraVenda] = useState<ListItem[]>([])
  const [loadingLists, setLoadingLists] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      // Se for um novo produto, não precisamos buscar dados da API
      if (params.action === "novo") {
        setLoading(false)
      } else if (isEditing && produtoId) {
        // Se for edição, busca o produto da API
        try {
          await fetchProduto(produtoId)
        } catch (error) {
          console.error("Erro ao buscar produto:", error)
          toast({
            variant: "destructive",
            title: "Erro ao carregar produto",
            description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
          })
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }

    fetchData()

    // Carregar as listas de dados auxiliares apenas uma vez
    if (loadingLists) {
      fetchAllLists()
    }
  }, [params.action, isEditing, produtoId, toast]) // Remova fetchAllLists e loadingLists das dependências

  const fetchAllLists = async () => {
    setLoadingLists(true)
    try {
      const [
        categoriasData,
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
        description: "Não foi possível carregar as listas de seleção. Alguns campos podem não funcionar corretamente.",
      })
    } finally {
      setLoadingLists(false)
    }
  }

  const fetchSubcategoriasForCategoria = async (categoriaId: number) => {
    if (!categoriaId) {
      setSubcategorias([])
      return
    }

    setLoadingSubcategorias(true)
    try {
      const subcategoriasData = await fetchSubcategoriasByCategoria(categoriaId)
      setSubcategorias(subcategoriasData)
    } catch (error) {
      console.error("Erro ao carregar subcategorias:", error)
      setSubcategorias([])
    } finally {
      setLoadingSubcategorias(false)
    }
  }

  // Efeito para carregar subcategorias quando a categoria mudar
  useEffect(() => {
    if (produto.categoria_produtos_id) {
      fetchSubcategoriasForCategoria(produto.categoria_produtos_id)

      // Limpar subcategoria selecionada quando trocar de categoria
      if (produto.subcategoria_produtos_id) {
        setProduto((prev) => ({
          ...prev,
          subcategoria_produtos_id: undefined,
        }))
      }
    } else {
      setSubcategorias([])
    }
  }, [produto.categoria_produtos_id])

  // Substitua a função fetchProduto atual por esta versão melhorada
  const fetchProduto = async (id: number) => {
    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      const data = await getProduto(id, token)
      setProduto(data)

      if (data.imagem_url) {
        setImagePreview(`data:image/png;base64,${data.imagem_url}`)
      }

      // Verificar se as alíquotas existem e processar adequadamente
      if (data.aliquotas && data.aliquotas.length > 0) {
        console.log("Alíquotas encontradas para o produto:", data.aliquotas)
        setAliquota(data.aliquotas[0])
      } else {
        console.log("Nenhuma alíquota encontrada para o produto, criando uma nova")
        // Se não houver alíquotas, criar uma nova com valores padrão
        setAliquota({
          produto_id: id,
          csosn_id: 1,
          cst_pis_id: 1,
          cst_cofins_id: 1,
          cst_ipi_id: 1,
          percentual_icms: 0,
          percentual_pis: 0,
          percentual_cofins: 0,
          percentual_ipi: 0,
        })
      }

      toast({
        title: "Produto carregado com sucesso",
        description: `Produto "${data.descricao}" carregado.`,
      })
    } catch (error) {
      console.error("Erro ao buscar produto:", error)
      throw error
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    // Handle numeric values
    if (
      [
        "valor_compra",
        "valor_custo",
        "percentual_lucro",
        "percentual_frete",
        "percentual_despesas_operacionais",
        "preco_venda",
        "percentual_despesas_operacionais",
        "preco_minimo",
        "preco_maximo",
        "minimo_para_preco_atacado",
        "preco_atacado",
        "percentual_marckup",
        "estoque_inicial",
        "valor_desconto",
        "estoque_minimo",
        "limite_maximo_desconto",
        "conversao_unitaria",
        "percentual_comissao",
        "largura_cm",
        "altura_cm",
        "comprimento_cm",
        "peso_liquido",
        "peso_bruto",
      ].includes(name)
    ) {
      setProduto({
        ...produto,
        [name]: value === "" ? 0 : Number(value),
      })
    } else {
      setProduto({
        ...produto,
        [name]: value,
      })
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setProduto({
      ...produto,
      [name]: Number(value),
    })
  }

  const handleAliquotaSelectChange = (name: string, value: string) => {
    setAliquota({
      ...aliquota,
      [name]: Number(value),
    })
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setProduto({
      ...produto,
      [name]: checked,
    })
  }

  const handleAliquotaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    // Handle numeric values
    if (
      [
        "percentual_icms",
        "percentual_pis",
        "percentual_cofins",
        "percentual_ipi",
        "percentual_iss",
        "percentual_reducao_bc",
        "percentual_icms_interestadual",
        "percentual_icms_interno",
        "percentual_fcp_interestadual",
      ].includes(name)
    ) {
      setAliquota({
        ...aliquota,
        [name]: value === "" ? 0 : Number(value),
      })
    } else {
      setAliquota({
        ...aliquota,
        [name]: value,
      })
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 2MB.",
      })
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      const base64Data = base64String.split(",")[1] // Remove the data:image/jpeg;base64, part

      setImagePreview(base64String)
      setProduto({
        ...produto,
        imagem_url: base64Data,
      })
    }
    reader.readAsDataURL(file)
  }

  // Modifique o useEffect para cálculo automático do valor de custo para incluir o frete
  // Substitua o useEffect existente para cálculo do valor de custo por este:

  // Efeito para calcular automaticamente o valor de custo
  useEffect(() => {
    const valorCompra = produto.valor_compra || 0
    const despesasOperacionais = produto.percentual_despesas_operacionais || 0
    const percentualFrete = produto.percentual_frete || 0

    if (valorCompra > 0) {
      // Cálculo do valor de custo incluindo despesas operacionais e frete
      const valorDespesas = (valorCompra * despesasOperacionais) / 100
      const valorFrete = (valorCompra * percentualFrete) / 100
      const novoValorCusto = valorCompra + valorDespesas + valorFrete

      // Só atualiza se o valor calculado for diferente do atual
      if (Math.abs(novoValorCusto - produto.valor_custo) > 0.01) {
        setProduto((prev) => ({
          ...prev,
          valor_custo: Number(novoValorCusto.toFixed(2)),
        }))
      }
    }
  }, [produto.valor_compra, produto.percentual_despesas_operacionais, produto.percentual_frete])

  // Adicione um novo useEffect para calcular o preço de venda baseado no markup
  // Adicione este novo useEffect após o useEffect do valor de custo:

  // Efeito para calcular automaticamente o preço de venda baseado no markup
  useEffect(() => {
    const valorCusto = produto.valor_custo || 0
    const percentualMarkup = produto.percentual_marckup || 0

    if (valorCusto > 0 && percentualMarkup > 0) {
      // Cálculo do preço de venda baseado no markup
      const novoPrecoVenda = valorCusto * (1 + percentualMarkup / 100)

      // Só atualiza se o valor calculado for diferente do atual
      if (Math.abs(novoPrecoVenda - produto.preco_venda) > 0.01) {
        setProduto((prev) => ({
          ...prev,
          preco_venda: Number(novoPrecoVenda.toFixed(2)),
        }))
      }
    }
  }, [produto.valor_custo, produto.percentual_marckup])

  // Adicione um novo useEffect para calcular a margem de lucro
  // Adicione este novo useEffect após o useEffect do preço de venda:

  // Efeito para calcular automaticamente a margem de lucro
  useEffect(() => {
    const valorCusto = produto.valor_custo || 0
    const precoVenda = produto.preco_venda || 0

    if (valorCusto > 0 && precoVenda > 0 && precoVenda > valorCusto) {
      // Cálculo da margem de lucro: (Valor venda - Valor de custo) / Valor venda
      const margemLucro = ((precoVenda - valorCusto) / precoVenda) * 100

      // Só atualiza se o valor calculado for diferente do atual
      if (Math.abs(margemLucro - (produto.percentual_lucro || 0)) > 0.01) {
        setProduto((prev) => ({
          ...prev,
          percentual_lucro: Number(margemLucro.toFixed(2)),
        }))
      }
    }
  }, [produto.valor_custo, produto.preco_venda])

  // Substitua a função handleSubmit atual por esta versão melhorada
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      // Obter o ID da empresa do usuário logado
      const empresaId = getEmpresaId()
      if (!empresaId) {
        throw new Error("ID da empresa não encontrado")
      }

      // Adicionar o empresa_mae_id ao produto
      const produtoData = {
        ...produto,
        empresa_mae_id: empresaId,
      }

      let savedProduto: Produto

      if (isEditing && produtoId) {
        // Update existing product
        console.log("Atualizando produto existente:", produtoId)

        try {
          savedProduto = await updateProduto(produtoId, produtoData, token)
          console.log("Produto atualizado com sucesso:", savedProduto)

          // Garantir que o produto_id esteja definido na alíquota
          const aliquotaData = {
            ...aliquota,
            produto_id: produtoId,
          }

          // Update or create aliquota if needed
          if (aliquota.id) {
            console.log("Atualizando alíquota existente:", aliquota.id)
            await updateAliquota(aliquota.id, aliquotaData, token)
            console.log("Alíquota atualizada com sucesso")
          } else {
            console.log("Criando nova alíquota para produto existente")
            await createAliquota(aliquotaData, token)
            console.log("Nova alíquota criada com sucesso")
          }

          toast({
            title: "Produto atualizado com sucesso",
            description: `O produto "${savedProduto.descricao}" foi atualizado.`,
          })
        } catch (error) {
          console.error("Erro ao atualizar produto:", error)
          toast({
            variant: "destructive",
            title: "Erro ao atualizar produto",
            description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido ao atualizar o produto",
          })
          // Não redireciona em caso de erro na atualização
          setSaving(false)
          return
        }
      } else {
        // Create new product
        try {
          savedProduto = await createProduto(produtoData, token)
          console.log("Produto criado com sucesso:", savedProduto)

          // Create aliquota for the new product
          const aliquotaData = {
            ...aliquota,
            produto_id: savedProduto.id as number,
          }

          console.log("Criando alíquota para novo produto:", aliquotaData)
          await createAliquota(aliquotaData, token)
          console.log("Alíquota criada com sucesso")

          toast({
            title: "Produto criado com sucesso",
            description: `O produto "${savedProduto.descricao}" foi criado.`,
          })
        } catch (error) {
          console.error("Erro ao criar produto:", error)
          toast({
            variant: "destructive",
            title: "Erro ao criar produto",
            description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido ao criar o produto",
          })
          // Não redireciona em caso de erro na criação
          setSaving(false)
          return
        }
      }

      // Redirect to products list
      router.push(`/${params.slug}/dashboard/produtos`)
    } catch (error) {
      console.error("Erro ao salvar produto:", error)
      toast({
        variant: "destructive",
        title: "Erro ao salvar produto",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    } finally {
      setSaving(false)
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${params.slug}/dashboard/produtos`)}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Package className="mr-2 h-6 w-6" />
          <h1 className="text-2xl font-bold">{isEditing ? `Editar Produto: ${produto.descricao}` : "Novo Produto"}</h1>
        </div>
        <Button onClick={handleSubmit} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="informacoes">
          <TabsList className="mb-4">
            <TabsTrigger value="informacoes">Informações Básicas</TabsTrigger>
            <TabsTrigger value="precos">Preços e Estoque</TabsTrigger>
            <TabsTrigger value="fiscal">Informações Fiscais</TabsTrigger>
            <TabsTrigger value="adicionais">Informações Adicionais</TabsTrigger>
          </TabsList>

          <TabsContent value="informacoes">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="descricao">Descrição *</Label>
                      <Input
                        id="descricao"
                        name="descricao"
                        value={produto.descricao}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="referencia">Referência *</Label>
                      <Input
                        id="referencia"
                        name="referencia"
                        value={produto.referencia}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="codigo_barras">Código de Barras</Label>
                      <Input
                        id="codigo_barras"
                        name="codigo_barras"
                        value={produto.codigo_barras || ""}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div>
                      <Label htmlFor="categoria_produtos_id">Categoria *</Label>
                      <Select
                        value={produto.categoria_produtos_id?.toString()}
                        onValueChange={(value) => handleSelectChange("categoria_produtos_id", value)}
                        disabled={loadingLists}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categorias.map((categoria) => (
                            <SelectItem key={categoria.id} value={categoria.id.toString()}>
                              {categoria.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="subcategoria_produtos_id">Subcategoria</Label>
                      <Select
                        value={produto.subcategoria_produtos_id?.toString()}
                        onValueChange={(value) => handleSelectChange("subcategoria_produtos_id", value)}
                        disabled={
                          loadingLists ||
                          loadingSubcategorias ||
                          !produto.categoria_produtos_id ||
                          subcategorias.length === 0
                        }
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              !produto.categoria_produtos_id
                                ? "Selecione uma categoria primeiro"
                                : loadingSubcategorias
                                  ? "Carregando subcategorias..."
                                  : subcategorias.length === 0
                                    ? "Nenhuma subcategoria disponível"
                                    : "Selecione uma subcategoria"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {subcategorias.map((subcategoria) => (
                            <SelectItem key={subcategoria.id} value={subcategoria.id.toString()}>
                              {subcategoria.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="marcas_produtos_id">Marca *</Label>
                      <Select
                        value={produto.marcas_produtos_id?.toString()}
                        onValueChange={(value) => handleSelectChange("marcas_produtos_id", value)}
                        disabled={loadingLists}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma marca" />
                        </SelectTrigger>
                        <SelectContent>
                          {marcas.map((marca) => (
                            <SelectItem key={marca.id} value={marca.id.toString()}>
                              {marca.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="inativo"
                        checked={produto.inativo}
                        onCheckedChange={(checked) => handleCheckboxChange("inativo", checked === true)}
                      />
                      <Label htmlFor="inativo">Inativo</Label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Imagem do Produto</Label>
                    <div className="border rounded-lg p-4 flex flex-col items-center justify-center">
                      {imagePreview ? (
                        <div className="relative w-full h-48 mb-4">
                          <Image
                            src={imagePreview || "/placeholder.svg"}
                            alt="Preview da imagem"
                            fill
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-48 bg-gray-100 flex items-center justify-center mb-4 rounded-md">
                          <Package className="h-16 w-16 text-gray-300" />
                        </div>
                      )}

                      <Label
                        htmlFor="imagem"
                        className="cursor-pointer flex items-center justify-center w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Selecionar Imagem
                      </Label>
                      <Input id="imagem" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                      <p className="text-xs text-gray-500 mt-2">Formatos aceitos: JPG, PNG. Tamanho máximo: 2MB</p>
                    </div>

                    <div>
                      <Label htmlFor="observacoes">Observações</Label>
                      <Textarea
                        id="observacoes"
                        name="observacoes"
                        value={produto.observacoes || ""}
                        onChange={handleInputChange}
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="precos">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="valor_compra">Valor de Compra *</Label>
                      <Input
                        id="valor_compra"
                        name="valor_compra"
                        type="number"
                        step="0.01"
                        value={produto.valor_compra}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="percentual_despesas_operacionais">Despesas Operacionais (%)</Label>
                      <Input
                        id="percentual_despesas_operacionais"
                        name="percentual_despesas_operacionais"
                        type="number"
                        step="0.01"
                        value={produto.percentual_despesas_operacionais || ""}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div>
                      <Label htmlFor="percentual_frete">Frete (%)</Label>
                      <Input
                        id="percentual_frete"
                        name="percentual_frete"
                        type="number"
                        step="0.01"
                        value={produto.percentual_frete || ""}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div>
                      <Label htmlFor="valor_custo">Valor Total de Custo (Calculado Automaticamente)</Label>
                      <Input
                        id="valor_custo"
                        name="valor_custo"
                        type="number"
                        step="0.01"
                        value={produto.valor_custo}
                        onChange={handleInputChange}
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Calculado automaticamente: Valor de Compra + (Valor de Compra × Despesas Operacionais %) +
                        (Valor de Compra × Frete %)
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="percentual_marckup">Markup (%)</Label>
                      <Input
                        id="percentual_marckup"
                        name="percentual_marckup"
                        type="number"
                        step="0.01"
                        value={produto.percentual_marckup || ""}
                        onChange={handleInputChange}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Ao definir o markup, o preço de venda será calculado automaticamente: Valor de Custo × (1 +
                        Markup/100)
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="percentual_lucro">Margem de Lucro (%) (Calculado Automaticamente)</Label>
                      <Input
                        id="percentual_lucro"
                        name="percentual_lucro"
                        type="number"
                        step="0.01"
                        value={produto.percentual_lucro || ""}
                        onChange={handleInputChange}
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Calculado automaticamente: ((Preço de Venda - Valor de Custo) / Preço de Venda) × 100
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="preco_venda">Valor de Venda *</Label>
                      <Input
                        id="preco_venda"
                        name="preco_venda"
                        type="number"
                        step="0.01"
                        value={produto.preco_venda}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="preco_minimo">Valor Mínimo</Label>
                      <Input
                        id="preco_minimo"
                        name="preco_minimo"
                        type="number"
                        step="0.01"
                        value={produto.preco_minimo || ""}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div>
                      <Label htmlFor="preco_maximo">Valor Máximo</Label>
                      <Input
                        id="preco_maximo"
                        name="preco_maximo"
                        type="number"
                        step="0.01"
                        value={produto.preco_maximo || ""}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div>
                      <Label htmlFor="preco_atacado">Valor de Atacado</Label>
                      <Input
                        id="preco_atacado"
                        name="preco_atacado"
                        type="number"
                        step="0.01"
                        value={produto.preco_atacado || ""}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div>
                      <Label htmlFor="minimo_para_preco_atacado">Quantidade Mínima para Atacado</Label>
                      <Input
                        id="minimo_para_preco_atacado"
                        name="minimo_para_preco_atacado"
                        type="number"
                        value={produto.minimo_para_preco_atacado || ""}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div>
                      <Label htmlFor="estoque_inicial">Estoque Inicial *</Label>
                      <Input
                        id="estoque_inicial"
                        name="estoque_inicial"
                        type="number"
                        value={produto.estoque_inicial}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="estoque_minimo">Alerta de Estoque</Label>
                      <Input
                        id="estoque_minimo"
                        name="estoque_minimo"
                        type="number"
                        value={produto.estoque_minimo || ""}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="gerenciar_estoque"
                        checked={produto.gerenciar_estoque || false}
                        onCheckedChange={(checked) => handleCheckboxChange("gerenciar_estoque", checked === true)}
                      />
                      <Label htmlFor="gerenciar_estoque">Gerenciar Estoque</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="reajuste_automatico"
                        checked={produto.reajuste_automatico || false}
                        onCheckedChange={(checked) => handleCheckboxChange("reajuste_automatico", checked === true)}
                      />
                      <Label htmlFor="reajuste_automatico">Reajuste Automático</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fiscal">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="csosn_id">CSOSN *</Label>
                      <Select
                        value={aliquota.csosn_id?.toString()}
                        onValueChange={(value) => handleAliquotaSelectChange("csosn_id", value)}
                        disabled={loadingLists}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um CSOSN" />
                        </SelectTrigger>
                        <SelectContent>
                          {csosnList.map((csosn) => (
                            <SelectItem key={csosn.id} value={csosn.id.toString()}>
                              {csosn.codigo ? `${csosn.codigo} - ${csosn.descricao}` : csosn.descricao}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="cst_pis_id">CST PIS *</Label>
                      <Select
                        value={aliquota.cst_pis_id?.toString()}
                        onValueChange={(value) => handleAliquotaSelectChange("cst_pis_id", value)}
                        disabled={loadingLists}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um CST PIS" />
                        </SelectTrigger>
                        <SelectContent>
                          {cstPisList.map((cstPis) => (
                            <SelectItem key={cstPis.id} value={cstPis.id.toString()}>
                              {cstPis.codigo ? `${cstPis.codigo} - ${cstPis.descricao}` : cstPis.descricao}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="cst_cofins_id">CST COFINS *</Label>
                      <Select
                        value={aliquota.cst_cofins_id?.toString()}
                        onValueChange={(value) => handleAliquotaSelectChange("cst_cofins_id", value)}
                        disabled={loadingLists}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um CST COFINS" />
                        </SelectTrigger>
                        <SelectContent>
                          {cstCofinsList.map((cstCofins) => (
                            <SelectItem key={cstCofins.id} value={cstCofins.id.toString()}>
                              {cstCofins.codigo ? `${cstCofins.codigo} - ${cstCofins.descricao}` : cstCofins.descricao}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="cst_ipi_id">CST IPI *</Label>
                      <Select
                        value={aliquota.cst_ipi_id?.toString()}
                        onValueChange={(value) => handleAliquotaSelectChange("cst_ipi_id", value)}
                        disabled={loadingLists}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um CST IPI" />
                        </SelectTrigger>
                        <SelectContent>
                          {cstIpiList.map((cstIpi) => (
                            <SelectItem key={cstIpi.id} value={cstIpi.id.toString()}>
                              {cstIpi.codigo ? `${cstIpi.codigo} - ${cstIpi.descricao}` : cstIpi.descricao}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="ncm_id">NCM</Label>
                      <Select
                        value={produto.ncm_id?.toString()}
                        onValueChange={(value) => handleSelectChange("ncm_id", value)}
                        disabled={loadingLists}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um NCM" />
                        </SelectTrigger>
                        <SelectContent>
                          {ncmList.map((ncm) => (
                            <SelectItem key={ncm.id} value={ncm.id.toString()}>
                              {ncm.codigo ? `${ncm.codigo} - ${ncm.descricao}` : ncm.descricao}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="cest">CEST</Label>
                      <Input id="cest" name="cest" value={produto.cest || ""} onChange={handleInputChange} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="percentual_icms">Percentual ICMS (%) *</Label>
                      <Input
                        id="percentual_icms"
                        name="percentual_icms"
                        type="number"
                        step="0.01"
                        value={aliquota.percentual_icms}
                        onChange={handleAliquotaChange}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="percentual_pis">Percentual PIS (%) *</Label>
                      <Input
                        id="percentual_pis"
                        name="percentual_pis"
                        type="number"
                        step="0.01"
                        value={aliquota.percentual_pis}
                        onChange={handleAliquotaChange}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="percentual_cofins">Percentual COFINS (%) *</Label>
                      <Input
                        id="percentual_cofins"
                        name="percentual_cofins"
                        type="number"
                        step="0.01"
                        value={aliquota.percentual_cofins}
                        onChange={handleAliquotaChange}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="percentual_ipi">Percentual IPI (%) *</Label>
                      <Input
                        id="percentual_ipi"
                        name="percentual_ipi"
                        type="number"
                        step="0.01"
                        value={aliquota.percentual_ipi}
                        onChange={handleAliquotaChange}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="percentual_iss">Percentual ISS (%)</Label>
                      <Input
                        id="percentual_iss"
                        name="percentual_iss"
                        type="number"
                        step="0.01"
                        value={aliquota.percentual_iss || ""}
                        onChange={handleAliquotaChange}
                      />
                    </div>

                    <div>
                      <Label htmlFor="origem_produtos_id">Origem do Produto</Label>
                      <Select
                        value={aliquota.origem_produtos_id?.toString()}
                        onValueChange={(value) => handleAliquotaSelectChange("origem_produtos_id", value)}
                        disabled={loadingLists}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma origem" />
                        </SelectTrigger>
                        <SelectContent>
                          {origemProdutos.map((origem) => (
                            <SelectItem key={origem.id} value={origem.id.toString()}>
                              {origem.codigo ? `${origem.codigo} - ${origem.descricao}` : origem.descricao}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="adicionais">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="unidade_compra_id">Unidade de Compra</Label>
                      <Select
                        value={produto.unidade_compra_id?.toString()}
                        onValueChange={(value) => handleSelectChange("unidade_compra_id", value)}
                        disabled={loadingLists}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma unidade" />
                        </SelectTrigger>
                        <SelectContent>
                          {unidadesCompraVenda.map((unidade) => (
                            <SelectItem key={unidade.id} value={unidade.id.toString()}>
                              {unidade.codigo ? `${unidade.codigo} - ${unidade.descricao}` : unidade.descricao}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="unidade_venda_id">Unidade de Venda</Label>
                      <Select
                        value={produto.unidade_venda_id?.toString()}
                        onValueChange={(value) => handleSelectChange("unidade_venda_id", value)}
                        disabled={loadingLists}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma unidade" />
                        </SelectTrigger>
                        <SelectContent>
                          {unidadesCompraVenda.map((unidade) => (
                            <SelectItem key={unidade.id} value={unidade.id.toString()}>
                              {unidade.codigo ? `${unidade.codigo} - ${unidade.descricao}` : unidade.descricao}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="conversao_unitaria">Conversão Unitária</Label>
                      <Input
                        id="conversao_unitaria"
                        name="conversao_unitaria"
                        type="number"
                        step="0.01"
                        value={produto.conversao_unitaria || ""}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div>
                      <Label htmlFor="percentual_comissao">Percentual de Comissão (%)</Label>
                      <Input
                        id="percentual_comissao"
                        name="percentual_comissao"
                        type="number"
                        step="0.01"
                        value={produto.percentual_comissao || ""}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div>
                      <Label htmlFor="valor_desconto">Valor de Desconto</Label>
                      <Input
                        id="valor_desconto"
                        name="valor_desconto"
                        type="number"
                        step="0.01"
                        value={produto.valor_desconto || ""}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div>
                      <Label htmlFor="limite_maximo_desconto">Limite Máximo de Desconto (%)</Label>
                      <Input
                        id="limite_maximo_desconto"
                        name="limite_maximo_desconto"
                        type="number"
                        step="0.01"
                        value={produto.limite_maximo_desconto || ""}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="largura_cm">Largura (cm)</Label>
                      <Input
                        id="largura_cm"
                        name="largura_cm"
                        type="number"
                        step="0.01"
                        value={produto.largura_cm || ""}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div>
                      <Label htmlFor="altura_cm">Altura (cm)</Label>
                      <Input
                        id="altura_cm"
                        name="altura_cm"
                        type="number"
                        step="0.01"
                        value={produto.altura_cm || ""}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div>
                      <Label htmlFor="comprimento_cm">Comprimento (cm)</Label>
                      <Input
                        id="comprimento_cm"
                        name="comprimento_cm"
                        type="number"
                        step="0.01"
                        value={produto.comprimento_cm || ""}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div>
                      <Label htmlFor="peso_liquido">Peso Líquido (kg)</Label>
                      <Input
                        id="peso_liquido"
                        name="peso_liquido"
                        type="number"
                        step="0.01"
                        value={produto.peso_liquido || ""}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div>
                      <Label htmlFor="peso_bruto">Peso Bruto (kg)</Label>
                      <Input
                        id="peso_bruto"
                        name="peso_bruto"
                        type="number"
                        step="0.01"
                        value={produto.peso_bruto || ""}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="atribuir_delivery"
                          checked={produto.atribuir_delivery || false}
                          onCheckedChange={(checked) => handleCheckboxChange("atribuir_delivery", checked === true)}
                        />
                        <Label htmlFor="atribuir_delivery">Atribuir ao Delivery</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="atribuir_ecommerce"
                          checked={produto.atribuir_ecommerce || false}
                          onCheckedChange={(checked) => handleCheckboxChange("atribuir_ecommerce", checked === true)}
                        />
                        <Label htmlFor="atribuir_ecommerce">Atribuir ao E-commerce</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="locacao"
                          checked={produto.locacao || false}
                          onCheckedChange={(checked) => handleCheckboxChange("locacao", checked === true)}
                        />
                        <Label htmlFor="locacao">Produto para Locação</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="composto"
                          checked={produto.composto || false}
                          onCheckedChange={(checked) => handleCheckboxChange("composto", checked === true)}
                        />
                        <Label htmlFor="composto">Produto Composto</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="derivado_petroleo"
                          checked={produto.derivado_petroleo || false}
                          onCheckedChange={(checked) => handleCheckboxChange("derivado_petroleo", checked === true)}
                        />
                        <Label htmlFor="derivado_petroleo">Derivado de Petróleo</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  )
}
