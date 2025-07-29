"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { getToken, isAuthenticated } from "@/lib/auth"
import { 
  getFornecedor, 
  createFornecedor, 
  updateFornecedor,
  getTiposPessoa,
  getIndicadorIe,
  getTiposContatos,
  getTiposEnderecos,
  getTiposRepresentantes,
  getTiposContasBancarias,
  getCsosn,
  createFornecedorContato,
  createFornecedorEndereco,
  updateFornecedorContato,
  updateFornecedorEndereco,
  deleteFornecedorContato,
  deleteFornecedorEndereco
} from "@/lib/api"
import type { 
  Fornecedor, 
  FornecedorContato,
  FornecedorEndereco,
  FornecedorRepresentante,
  FornecedorDadoBancario,
  FornecedorTributacao,
  TipoPessoa, 
  IndicadorIe,
  TipoContato,
  TipoEndereco,
  TipoRepresentante
} from "@/lib/types"
import { ArrowLeft, Save, Truck, Plus, Trash2 } from "lucide-react"

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
  const [activeTab, setActiveTab] = useState("geral")
  
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

  // Relationship data
  const [contatos, setContatos] = useState<FornecedorContato[]>([])
  const [enderecos, setEnderecos] = useState<FornecedorEndereco[]>([])
  const [representantes, setRepresentantes] = useState<FornecedorRepresentante[]>([])
  const [dadosBancarios, setDadosBancarios] = useState<FornecedorDadoBancario[]>([])
  const [tributacao, setTributacao] = useState<FornecedorTributacao[]>([])

  // Options
  const [tiposPessoa, setTiposPessoa] = useState<TipoPessoa[]>([])
  const [indicadoresIe, setIndicadoresIe] = useState<IndicadorIe[]>([])
  const [tiposContatos, setTiposContatos] = useState<TipoContato[]>([])
  const [tiposEnderecos, setTiposEnderecos] = useState<TipoEndereco[]>([])
  const [tiposRepresentantes, setTiposRepresentantes] = useState<TipoRepresentante[]>([])
  const [tiposContasBancarias, setTiposContasBancarias] = useState<any[]>([])
  const [csosn, setCsosn] = useState<any[]>([])

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
        loadTiposContatos(token),
        loadTiposEnderecos(token),
        loadTiposRepresentantes(token),
        loadTiposContasBancarias(token),
        loadCsosn(token),
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

  const loadTiposContatos = async (token: string) => {
    try {
      const data = await getTiposContatos(token)
      setTiposContatos(data)
    } catch (error) {
      console.error("Erro ao carregar tipos de contato:", error)
    }
  }

  const loadTiposEnderecos = async (token: string) => {
    try {
      const data = await getTiposEnderecos(token)
      setTiposEnderecos(data)
    } catch (error) {
      console.error("Erro ao carregar tipos de endereço:", error)
    }
  }

  const loadTiposRepresentantes = async (token: string) => {
    try {
      const data = await getTiposRepresentantes(token)
      setTiposRepresentantes(data)
    } catch (error) {
      console.error("Erro ao carregar tipos de representante:", error)
    }
  }

  const loadTiposContasBancarias = async (token: string) => {
    try {
      const data = await getTiposContasBancarias(token)
      setTiposContasBancarias(data)
    } catch (error) {
      console.error("Erro ao carregar tipos de conta bancária:", error)
    }
  }

  const loadCsosn = async (token: string) => {
    try {
      const data = await getCsosn(token)
      setCsosn(data)
    } catch (error) {
      console.error("Erro ao carregar CSOSN:", error)
    }
  }

  const loadFornecedor = async (id: number, token: string) => {
    try {
      const data = await getFornecedor(id, token)
      setFornecedor(data)
      
      // Load relationships if they exist
      if (data.contatos) setContatos(data.contatos)
      if (data.enderecos) setEnderecos(data.enderecos)
      if (data.representantes) setRepresentantes(data.representantes)
      if (data.dadosBancarios) setDadosBancarios(data.dadosBancarios)
      if (data.tributacao) setTributacao(data.tributacao)
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

      let savedFornecedor: Fornecedor
      
      if (isEditing && fornecedorId) {
        savedFornecedor = await updateFornecedor(fornecedorId, fornecedor, token)
        toast({
          title: "Fornecedor atualizado com sucesso!",
          description: "As alterações foram salvas.",
        })
      } else {
        savedFornecedor = await createFornecedor(fornecedor, token)
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

  // Contato functions
  const addContato = () => {
    const newContato: FornecedorContato = {
      fornecedores_id: fornecedorId || 0,
      tipos_contatos_id: undefined,
      email: "",
      telefone: "",
      celular: "",
    }
    setContatos([...contatos, newContato])
  }

  const updateContato = (index: number, field: keyof FornecedorContato, value: any) => {
    const updated = [...contatos]
    updated[index] = { ...updated[index], [field]: value }
    setContatos(updated)
  }

  const removeContato = (index: number) => {
    const updated = contatos.filter((_, i) => i !== index)
    setContatos(updated)
  }

  // Endereco functions
  const addEndereco = () => {
    const newEndereco: FornecedorEndereco = {
      fornecedores_id: fornecedorId || 0,
      tipos_endereco_id: undefined,
      cep: "",
      pais: "Brasil",
      estado: "",
      cidade: "",
      bairro: "",
      rua: "",
      numero: undefined,
      complemento: "",
    }
    setEnderecos([...enderecos, newEndereco])
  }

  const updateEndereco = (index: number, field: keyof FornecedorEndereco, value: any) => {
    const updated = [...enderecos]
    updated[index] = { ...updated[index], [field]: value }
    setEnderecos(updated)
  }

  const removeEndereco = (index: number) => {
    const updated = enderecos.filter((_, i) => i !== index)
    setEnderecos(updated)
  }

  // Representante functions
  const addRepresentante = () => {
    const newRepresentante: FornecedorRepresentante = {
      fornecedores_id: fornecedorId || 0,
      tipos_representantes_id: undefined,
      nome: "",
      documento: "",
    }
    setRepresentantes([...representantes, newRepresentante])
  }

  const updateRepresentante = (index: number, field: keyof FornecedorRepresentante, value: any) => {
    const updated = [...representantes]
    updated[index] = { ...updated[index], [field]: value }
    setRepresentantes(updated)
  }

  const removeRepresentante = (index: number) => {
    const updated = representantes.filter((_, i) => i !== index)
    setRepresentantes(updated)
  }

  // Dados Bancários functions
  const addDadoBancario = () => {
    const newDadoBancario: FornecedorDadoBancario = {
      fornecedores_id: fornecedorId || 0,
      tipos_contas_bancarias_id: undefined,
      banco: "",
      agencia: undefined,
      numero_conta: undefined,
      chave_pix: "",
    }
    setDadosBancarios([...dadosBancarios, newDadoBancario])
  }

  const updateDadoBancario = (index: number, field: keyof FornecedorDadoBancario, value: any) => {
    const updated = [...dadosBancarios]
    updated[index] = { ...updated[index], [field]: value }
    setDadosBancarios(updated)
  }

  const removeDadoBancario = (index: number) => {
    const updated = dadosBancarios.filter((_, i) => i !== index)
    setDadosBancarios(updated)
  }

  // Tributação functions
  const addTributacao = () => {
    const newTributacao: FornecedorTributacao = {
      fornecedores_id: fornecedorId || 0,
      iva: "",
      csosn_id: undefined,
      carga_tributaria_percentual: undefined,
      fornecedor_desde: "",
    }
    setTributacao([...tributacao, newTributacao])
  }

  const updateTributacao = (index: number, field: keyof FornecedorTributacao, value: any) => {
    const updated = [...tributacao]
    updated[index] = { ...updated[index], [field]: value }
    setTributacao(updated)
  }

  const removeTributacao = (index: number) => {
    const updated = tributacao.filter((_, i) => i !== index)
    setTributacao(updated)
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="geral">Informações Gerais</TabsTrigger>
            <TabsTrigger value="contatos">Contatos</TabsTrigger>
            <TabsTrigger value="enderecos">Endereços</TabsTrigger>
            <TabsTrigger value="outros">Outros</TabsTrigger>
          </TabsList>

          {/* General Information Tab */}
          <TabsContent value="geral" className="mt-6">
            <div className="space-y-6">
              {/* Basic Information */}
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

              {/* Fiscal Information */}
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

              {/* Tax Exemptions */}
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
            </div>
          </TabsContent>

          {/* Contatos Tab */}
          <TabsContent value="contatos" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  Contatos
                  <Button type="button" onClick={addContato} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Contato
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contatos.map((contato, index) => (
                  <div key={index} className="border p-4 rounded-lg space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Contato {index + 1}</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeContato(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Tipo de Contato</Label>
                        <Select
                          value={contato.tipos_contatos_id?.toString() || ""}
                          onValueChange={(value) => updateContato(index, "tipos_contatos_id", value ? Number(value) : undefined)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {tiposContatos.map((tipo) => (
                              <SelectItem key={tipo.id} value={tipo.id.toString()}>
                                {tipo.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={contato.email || ""}
                          onChange={(e) => updateContato(index, "email", e.target.value)}
                          placeholder="Digite o email"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Telefone</Label>
                        <Input
                          value={contato.telefone || ""}
                          onChange={(e) => updateContato(index, "telefone", e.target.value)}
                          placeholder="Digite o telefone"
                        />
                      </div>
                      <div>
                        <Label>Celular</Label>
                        <Input
                          value={contato.celular || ""}
                          onChange={(e) => updateContato(index, "celular", e.target.value)}
                          placeholder="Digite o celular"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                {contatos.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum contato adicionado. Click em "Adicionar Contato" para começar.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enderecos Tab */}
          <TabsContent value="enderecos" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  Endereços
                  <Button type="button" onClick={addEndereco} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Endereço
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {enderecos.map((endereco, index) => (
                  <div key={index} className="border p-4 rounded-lg space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Endereço {index + 1}</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeEndereco(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Tipo de Endereço</Label>
                        <Select
                          value={endereco.tipos_endereco_id?.toString() || ""}
                          onValueChange={(value) => updateEndereco(index, "tipos_endereco_id", value ? Number(value) : undefined)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {tiposEnderecos.map((tipo) => (
                              <SelectItem key={tipo.id} value={tipo.id.toString()}>
                                {tipo.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>CEP</Label>
                        <Input
                          value={endereco.cep || ""}
                          onChange={(e) => updateEndereco(index, "cep", e.target.value)}
                          placeholder="00000-000"
                        />
                      </div>
                      <div>
                        <Label>País</Label>
                        <Input
                          value={endereco.pais || "Brasil"}
                          onChange={(e) => updateEndereco(index, "pais", e.target.value)}
                          placeholder="País"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Estado</Label>
                        <Input
                          value={endereco.estado || ""}
                          onChange={(e) => updateEndereco(index, "estado", e.target.value)}
                          placeholder="SP"
                          maxLength={2}
                        />
                      </div>
                      <div>
                        <Label>Cidade</Label>
                        <Input
                          value={endereco.cidade || ""}
                          onChange={(e) => updateEndereco(index, "cidade", e.target.value)}
                          placeholder="Nome da cidade"
                        />
                      </div>
                      <div>
                        <Label>Bairro</Label>
                        <Input
                          value={endereco.bairro || ""}
                          onChange={(e) => updateEndereco(index, "bairro", e.target.value)}
                          placeholder="Nome do bairro"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <Label>Rua</Label>
                        <Input
                          value={endereco.rua || ""}
                          onChange={(e) => updateEndereco(index, "rua", e.target.value)}
                          placeholder="Nome da rua"
                        />
                      </div>
                      <div>
                        <Label>Número</Label>
                        <Input
                          type="number"
                          value={endereco.numero || ""}
                          onChange={(e) => updateEndereco(index, "numero", e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="123"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Complemento</Label>
                      <Input
                        value={endereco.complemento || ""}
                        onChange={(e) => updateEndereco(index, "complemento", e.target.value)}
                        placeholder="Apartamento, sala, etc."
                      />
                    </div>
                  </div>
                ))}
                
                {enderecos.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum endereço adicionado. Click em "Adicionar Endereço" para começar.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Outros Tab */}
          <TabsContent value="outros" className="mt-6">
            <div className="space-y-6">
              {/* Representantes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    Representantes
                    <Button type="button" onClick={addRepresentante} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Representante
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {representantes.map((representante, index) => (
                    <div key={index} className="border p-4 rounded-lg space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Representante {index + 1}</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeRepresentante(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Tipo de Representante</Label>
                          <Select
                            value={representante.tipos_representantes_id?.toString() || ""}
                            onValueChange={(value) => updateRepresentante(index, "tipos_representantes_id", value ? Number(value) : undefined)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              {tiposRepresentantes.map((tipo) => (
                                <SelectItem key={tipo.id} value={tipo.id.toString()}>
                                  {tipo.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Nome</Label>
                          <Input
                            value={representante.nome || ""}
                            onChange={(e) => updateRepresentante(index, "nome", e.target.value)}
                            placeholder="Digite o nome"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Documento</Label>
                        <Input
                          value={representante.documento || ""}
                          onChange={(e) => updateRepresentante(index, "documento", e.target.value)}
                          placeholder="Digite o documento"
                        />
                      </div>
                    </div>
                  ))}
                  
                  {representantes.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum representante adicionado. Click em "Adicionar Representante" para começar.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Dados Bancários */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    Dados Bancários
                    <Button type="button" onClick={addDadoBancario} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Conta
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dadosBancarios.map((dados, index) => (
                    <div key={index} className="border p-4 rounded-lg space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Conta Bancária {index + 1}</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeDadoBancario(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Tipo de Conta</Label>
                          <Select
                            value={dados.tipos_contas_bancarias_id?.toString() || ""}
                            onValueChange={(value) => updateDadoBancario(index, "tipos_contas_bancarias_id", value ? Number(value) : undefined)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              {tiposContasBancarias.map((tipo) => (
                                <SelectItem key={tipo.id} value={tipo.id.toString()}>
                                  {tipo.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Banco</Label>
                          <Input
                            value={dados.banco || ""}
                            onChange={(e) => updateDadoBancario(index, "banco", e.target.value)}
                            placeholder="Nome do banco"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Agência</Label>
                          <Input
                            type="number"
                            value={dados.agencia || ""}
                            onChange={(e) => updateDadoBancario(index, "agencia", e.target.value ? Number(e.target.value) : undefined)}
                            placeholder="Número da agência"
                          />
                        </div>
                        <div>
                          <Label>Número da Conta</Label>
                          <Input
                            type="number"
                            value={dados.numero_conta || ""}
                            onChange={(e) => updateDadoBancario(index, "numero_conta", e.target.value ? Number(e.target.value) : undefined)}
                            placeholder="Número da conta"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Chave PIX</Label>
                        <Input
                          value={dados.chave_pix || ""}
                          onChange={(e) => updateDadoBancario(index, "chave_pix", e.target.value)}
                          placeholder="Chave PIX"
                        />
                      </div>
                    </div>
                  ))}
                  
                  {dadosBancarios.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma conta bancária adicionada. Click em "Adicionar Conta" para começar.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Tributação */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    Informações de Tributação
                    <Button type="button" onClick={addTributacao} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Tributação
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tributacao.map((trib, index) => (
                    <div key={index} className="border p-4 rounded-lg space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Tributação {index + 1}</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeTributacao(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>IVA</Label>
                          <Input
                            value={trib.iva || ""}
                            onChange={(e) => updateTributacao(index, "iva", e.target.value)}
                            placeholder="Digite o IVA"
                          />
                        </div>
                        <div>
                          <Label>CSOSN</Label>
                          <Select
                            value={trib.csosn_id?.toString() || ""}
                            onValueChange={(value) => updateTributacao(index, "csosn_id", value ? Number(value) : undefined)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o CSOSN" />
                            </SelectTrigger>
                            <SelectContent>
                              {csosn.map((item) => (
                                <SelectItem key={item.id} value={item.id.toString()}>
                                  {item.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Carga Tributária (%)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={trib.carga_tributaria_percentual || ""}
                            onChange={(e) => updateTributacao(index, "carga_tributaria_percentual", e.target.value ? Number(e.target.value) : undefined)}
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label>Fornecedor Desde</Label>
                          <Input
                            type="date"
                            value={trib.fornecedor_desde || ""}
                            onChange={(e) => updateTributacao(index, "fornecedor_desde", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {tributacao.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma informação de tributação adicionada. Click em "Adicionar Tributação" para começar.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
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