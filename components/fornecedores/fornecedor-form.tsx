"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { getToken, isAuthenticated } from "@/lib/auth"
import { 
  getFornecedor, 
  createFornecedor, 
  updateFornecedor,
  getTiposPessoa,
  getIndicadorIe
} from "@/lib/api"
import type { 
  Fornecedor, 
  TipoPessoa, 
  IndicadorIe 
} from "@/lib/types"
import { ArrowLeft, Save, Truck } from "lucide-react"

interface FornecedorFormProps {
  params: {
    slug: string
    action: string // "novo" or fornecedor ID for editing
  }
}

export default function FornecedorForm({ params }: FornecedorFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  
  // Form data
  const [fornecedor, setFornecedor] = useState<Fornecedor>({
    razao_social: "",
    nome_fantasia: "",
    cpf_cnpj: "",
    ie_rg: "",
    inscricao_municipal: "",
    data_nascimento: "",
    contribuinte: false,
    produtor_rural: false,
    isento_icms: false,
    isento_ipi: false,
    isento_iss: false,
    isento_pis: false,
    isento_cofins: false,
    isento_ii: false,
  })

  // Options
  const [tiposPessoa, setTiposPessoa] = useState<TipoPessoa[]>([])
  const [indicadoresIe, setIndicadoresIe] = useState<IndicadorIe[]>([])

  const fornecedorId = params.action !== "novo" ? Number(params.action) : null

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
        loadTiposPessoa(token),
        loadIndicadorIe(token),
      ])

      // If editing, load the fornecedor data
      if (fornecedorId) {
        await loadFornecedor(fornecedorId, token)
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

  const loadTiposPessoa = async (token: string) => {
    try {
      const data = await getTiposPessoa(token)
      setTiposPessoa(data)
    } catch (error) {
      console.error("Erro ao carregar tipos de pessoa:", error)
    }
  }

  const loadIndicadorIe = async (token: string) => {
    try {
      const data = await getIndicadorIe(token)
      setIndicadoresIe(data)
    } catch (error) {
      console.error("Erro ao carregar indicadores IE:", error)
    }
  }

  const loadFornecedor = async (id: number, token: string) => {
    try {
      const data = await getFornecedor(id, token)
      setFornecedor(data)
    } catch (error) {
      console.error("Erro ao carregar fornecedor:", error)
      throw error
    }
  }

  const handleInputChange = (field: keyof Fornecedor, value: any) => {
    setFornecedor(prev => ({
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

      if (isEditing && fornecedorId) {
        await updateFornecedor(fornecedorId, fornecedor, token)
        toast({
          title: "Fornecedor atualizado com sucesso!",
          description: "As alterações foram salvas.",
        })
      } else {
        await createFornecedor(fornecedor, token)
        toast({
          title: "Fornecedor criado com sucesso!",
          description: "O novo fornecedor foi adicionado ao sistema.",
        })
      }

      router.push(`/${params.slug}/dashboard/fornecedores`)
    } catch (error) {
      console.error("Erro ao salvar fornecedor:", error)
      toast({
        variant: "destructive",
        title: "Erro ao salvar fornecedor",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading && !fornecedor.razao_social) {
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
          onClick={() => router.push(`/${params.slug}/dashboard/fornecedores`)}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Truck className="mr-2 h-6 w-6" />
        <h1 className="text-2xl font-bold">
          {isEditing ? "Editar Fornecedor" : "Novo Fornecedor"}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
            <TabsTrigger value="fiscal">Informações Fiscais</TabsTrigger>
            <TabsTrigger value="exemptions">Isenções</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="razao_social">Razão Social</Label>
                    <Input
                      id="razao_social"
                      value={fornecedor.razao_social || ""}
                      onChange={(e) => handleInputChange("razao_social", e.target.value)}
                      placeholder="Digite a razão social"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
                    <Input
                      id="nome_fantasia"
                      value={fornecedor.nome_fantasia || ""}
                      onChange={(e) => handleInputChange("nome_fantasia", e.target.value)}
                      placeholder="Digite o nome fantasia"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipo_pessoa_id">Tipo de Pessoa</Label>
                    <Select
                      value={fornecedor.tipo_pessoa_id?.toString() || ""}
                      onValueChange={(value) => handleInputChange("tipo_pessoa_id", value ? Number(value) : undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposPessoa.map((tipo) => (
                          <SelectItem key={tipo.id} value={tipo.id.toString()}>
                            {tipo.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                    <Input
                      id="data_nascimento"
                      type="date"
                      value={fornecedor.data_nascimento || ""}
                      onChange={(e) => handleInputChange("data_nascimento", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
                  <Input
                    id="cpf_cnpj"
                    value={fornecedor.cpf_cnpj || ""}
                    onChange={(e) => handleInputChange("cpf_cnpj", e.target.value)}
                    placeholder="Digite o CPF ou CNPJ"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fiscal" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Fiscais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ie_rg">IE/RG</Label>
                    <Input
                      id="ie_rg"
                      value={fornecedor.ie_rg || ""}
                      onChange={(e) => handleInputChange("ie_rg", e.target.value)}
                      placeholder="Digite a IE ou RG"
                    />
                  </div>
                  <div>
                    <Label htmlFor="indicador_ie_id">Indicador IE</Label>
                    <Select
                      value={fornecedor.indicador_ie_id?.toString() || ""}
                      onValueChange={(value) => handleInputChange("indicador_ie_id", value ? Number(value) : undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o indicador" />
                      </SelectTrigger>
                      <SelectContent>
                        {indicadoresIe.map((indicador) => (
                          <SelectItem key={indicador.id} value={indicador.id.toString()}>
                            {indicador.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="inscricao_municipal">Inscrição Municipal</Label>
                    <Input
                      id="inscricao_municipal"
                      value={fornecedor.inscricao_municipal || ""}
                      onChange={(e) => handleInputChange("inscricao_municipal", e.target.value)}
                      placeholder="Digite a inscrição municipal"
                    />
                  </div>
                  <div>
                    <Label htmlFor="inscricao_suframa">Inscrição SUFRAMA</Label>
                    <Input
                      id="inscricao_suframa"
                      type="number"
                      value={fornecedor.inscricao_suframa || ""}
                      onChange={(e) => handleInputChange("inscricao_suframa", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="Digite a inscrição SUFRAMA"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="contribuinte"
                      checked={fornecedor.contribuinte || false}
                      onCheckedChange={(checked) => handleInputChange("contribuinte", checked)}
                    />
                    <Label htmlFor="contribuinte">Contribuinte</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="produtor_rural"
                      checked={fornecedor.produtor_rural || false}
                      onCheckedChange={(checked) => handleInputChange("produtor_rural", checked)}
                    />
                    <Label htmlFor="produtor_rural">Produtor Rural</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exemptions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Isenções Fiscais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isento_icms"
                      checked={fornecedor.isento_icms || false}
                      onCheckedChange={(checked) => handleInputChange("isento_icms", checked)}
                    />
                    <Label htmlFor="isento_icms">Isento de ICMS</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isento_ipi"
                      checked={fornecedor.isento_ipi || false}
                      onCheckedChange={(checked) => handleInputChange("isento_ipi", checked)}
                    />
                    <Label htmlFor="isento_ipi">Isento de IPI</Label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isento_iss"
                      checked={fornecedor.isento_iss || false}
                      onCheckedChange={(checked) => handleInputChange("isento_iss", checked)}
                    />
                    <Label htmlFor="isento_iss">Isento de ISS</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isento_pis"
                      checked={fornecedor.isento_pis || false}
                      onCheckedChange={(checked) => handleInputChange("isento_pis", checked)}
                    />
                    <Label htmlFor="isento_pis">Isento de PIS</Label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isento_cofins"
                      checked={fornecedor.isento_cofins || false}
                      onCheckedChange={(checked) => handleInputChange("isento_cofins", checked)}
                    />
                    <Label htmlFor="isento_cofins">Isento de COFINS</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isento_ii"
                      checked={fornecedor.isento_ii || false}
                      onCheckedChange={(checked) => handleInputChange("isento_ii", checked)}
                    />
                    <Label htmlFor="isento_ii">Isento de II</Label>
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
            onClick={() => router.push(`/${params.slug}/dashboard/fornecedores`)}
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