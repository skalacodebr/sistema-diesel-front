"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { getToken, isAuthenticated } from "@/lib/auth"
import { 
  getServico, 
  createServico, 
  updateServico,
  getCategoriasServicos,
  getUnidadesCobranca
} from "@/lib/api"
import type { 
  Servico, 
  CategoriaServico,
  UnidadeCobranca
} from "@/lib/types"
import { ArrowLeft, Save, Wrench } from "lucide-react"

interface ServicoFormProps {
  params: {
    slug: string
    action: string // "novo" or servico ID for editing
  }
}

export default function ServicoForm({ params }: ServicoFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  
  // Form data
  const [servico, setServico] = useState<Servico>({
    nome: "",
    valor_unitario: undefined,
    tempo_servico_minutos: undefined,
    percentual_comissao: undefined,
    tempo_adicional: undefined,
    valor_adicional: undefined,
    tempo_tolerancia: undefined,
    codigo_servico: undefined,
    percentual_iss: undefined,
    percentual_pis: undefined,
    percentual_cofins: undefined,
    percentual_inss: undefined,
    limite_maximo_desconto: undefined,
  })

  // Options
  const [categoriasServicos, setCategoriasServicos] = useState<CategoriaServico[]>([])
  const [unidadesCobranca, setUnidadesCobranca] = useState<UnidadeCobranca[]>([])

  const servicoId = params.action !== "novo" ? Number(params.action) : null

  useEffect(() => {
    const checkAuthAndInitialize = async () => {
      if (!isAuthenticated()) {
        router.push(`/${params.slug}/login`)
        return
      }

      await initializeForm()
    }

    checkAuthAndInitialize()
  }, [params.slug, params.action, router])

  const initializeForm = async () => {
    setLoading(true)
    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      // Load options
      await Promise.all([
        loadCategoriasServicos(token),
        loadUnidadesCobranca(token),
      ])

      // If editing, load the servico data
      if (servicoId) {
        await loadServico(servicoId, token)
        setIsEditing(true)
      }
    } catch (error) {
      console.error("Erro ao inicializar formulário:", error)
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadCategoriasServicos = async (token: string) => {
    try {
      const data = await getCategoriasServicos(token)
      setCategoriasServicos(data)
    } catch (error) {
      console.error("Erro ao carregar categorias de serviços:", error)
    }
  }

  const loadUnidadesCobranca = async (token: string) => {
    try {
      const data = await getUnidadesCobranca(token)
      setUnidadesCobranca(data)
    } catch (error) {
      console.error("Erro ao carregar unidades de cobrança:", error)
    }
  }

  const loadServico = async (id: number, token: string) => {
    try {
      const data = await getServico(id, token)
      setServico(data)
    } catch (error) {
      console.error("Erro ao carregar serviço:", error)
      throw error
    }
  }

  const handleInputChange = (field: keyof Servico, value: any) => {
    setServico(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      let savedServico: Servico
      
      if (isEditing && servicoId) {
        savedServico = await updateServico(servicoId, servico, token)
        toast({
          title: "Serviço atualizado com sucesso!",
          description: "As alterações foram salvas.",
        })
      } else {
        savedServico = await createServico(servico, token)
        toast({
          title: "Serviço criado com sucesso!",
          description: "O novo serviço foi adicionado ao sistema.",
        })
      }

      router.push(`/${params.slug}/dashboard/servicos`)
    } catch (error) {
      console.error("Erro ao salvar serviço:", error)
      toast({
        variant: "destructive",
        title: "Erro ao salvar serviço",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading && !servico.nome) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Carregando...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/${params.slug}/dashboard/servicos`)}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Wrench className="mr-2 h-6 w-6" />
        <h1 className="text-2xl font-bold">
          {isEditing ? "Editar Serviço" : "Novo Serviço"}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
            <TabsTrigger value="pricing">Preços e Tempo</TabsTrigger>
            <TabsTrigger value="taxes">Impostos</TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome do Serviço *</Label>
                    <Input
                      id="nome"
                      value={servico.nome || ""}
                      onChange={(e) => handleInputChange("nome", e.target.value)}
                      placeholder="Digite o nome do serviço"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="codigo_servico">Código do Serviço</Label>
                    <Input
                      id="codigo_servico"
                      type="number"
                      value={servico.codigo_servico || ""}
                      onChange={(e) => handleInputChange("codigo_servico", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="Digite o código"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="categorias_servicos_id">Categoria do Serviço</Label>
                    <Select
                      value={servico.categorias_servicos_id?.toString() || ""}
                      onValueChange={(value) => handleInputChange("categorias_servicos_id", value ? Number(value) : undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriasServicos.map((categoria) => (
                          <SelectItem key={categoria.id} value={categoria.id.toString()}>
                            {categoria.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="unidades_cobranca_id">Unidade de Cobrança</Label>
                    <Select
                      value={servico.unidades_cobranca_id?.toString() || ""}
                      onValueChange={(value) => handleInputChange("unidades_cobranca_id", value ? Number(value) : undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a unidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {unidadesCobranca.map((unidade) => (
                          <SelectItem key={unidade.id} value={unidade.id.toString()}>
                            {unidade.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing and Time Tab */}
          <TabsContent value="pricing" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Preços e Tempo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="valor_unitario">Valor Unitário (R$)</Label>
                    <Input
                      id="valor_unitario"
                      type="number"
                      step="0.01"
                      value={servico.valor_unitario || ""}
                      onChange={(e) => handleInputChange("valor_unitario", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="percentual_comissao">Percentual de Comissão (%)</Label>
                    <Input
                      id="percentual_comissao"
                      type="number"
                      step="0.01"
                      min="0"
                      max="99.99"
                      value={servico.percentual_comissao || ""}
                      onChange={(e) => handleInputChange("percentual_comissao", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="tempo_servico_minutos">Tempo do Serviço (min)</Label>
                    <Input
                      id="tempo_servico_minutos"
                      type="number"
                      min="0"
                      value={servico.tempo_servico_minutos || ""}
                      onChange={(e) => handleInputChange("tempo_servico_minutos", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tempo_adicional">Tempo Adicional (min)</Label>
                    <Input
                      id="tempo_adicional"
                      type="number"
                      min="0"
                      value={servico.tempo_adicional || ""}
                      onChange={(e) => handleInputChange("tempo_adicional", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tempo_tolerancia">Tempo de Tolerância (min)</Label>
                    <Input
                      id="tempo_tolerancia"
                      type="number"
                      min="0"
                      value={servico.tempo_tolerancia || ""}
                      onChange={(e) => handleInputChange("tempo_tolerancia", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="valor_adicional">Valor Adicional (R$)</Label>
                    <Input
                      id="valor_adicional"
                      type="number"
                      step="0.01"
                      value={servico.valor_adicional || ""}
                      onChange={(e) => handleInputChange("valor_adicional", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="limite_maximo_desconto">Limite Máximo de Desconto (%)</Label>
                    <Input
                      id="limite_maximo_desconto"
                      type="number"
                      step="0.01"
                      min="0"
                      max="99.99"
                      value={servico.limite_maximo_desconto || ""}
                      onChange={(e) => handleInputChange("limite_maximo_desconto", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Taxes Tab */}
          <TabsContent value="taxes" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Impostos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="percentual_iss">ISS (%)</Label>
                    <Input
                      id="percentual_iss"
                      type="number"
                      step="0.01"
                      min="0"
                      max="99.99"
                      value={servico.percentual_iss || ""}
                      onChange={(e) => handleInputChange("percentual_iss", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="percentual_pis">PIS (%)</Label>
                    <Input
                      id="percentual_pis"
                      type="number"
                      step="0.01"
                      min="0"
                      max="99.99"
                      value={servico.percentual_pis || ""}
                      onChange={(e) => handleInputChange("percentual_pis", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="percentual_cofins">COFINS (%)</Label>
                    <Input
                      id="percentual_cofins"
                      type="number"
                      step="0.01"
                      min="0"
                      max="99.99"
                      value={servico.percentual_cofins || ""}
                      onChange={(e) => handleInputChange("percentual_cofins", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="percentual_inss">INSS (%)</Label>
                    <Input
                      id="percentual_inss"
                      type="number"
                      step="0.01"
                      min="0"
                      max="99.99"
                      value={servico.percentual_inss || ""}
                      onChange={(e) => handleInputChange("percentual_inss", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/${params.slug}/dashboard/servicos`)}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </div>
  )
}