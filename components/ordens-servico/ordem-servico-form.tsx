"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { getToken, isAuthenticated } from "@/lib/auth"
import { 
  getOrdemServico, 
  createOrdemServico, 
  updateOrdemServico,
  getClientes,
  getStatusOrdensServico,
  getServicos,
  getProdutos,
  getFuncionarios,
  getFormasPagamento,
  createOrdemServicoServico,
  createOrdemServicoProduto,
  createOrdemServicoFuncionario,
  createOrdemServicoFormaPagamento,
  deleteOrdemServicoServico,
  deleteOrdemServicoProduto,
  deleteOrdemServicoFuncionario,
  deleteOrdemServicoFormaPagamento
} from "@/lib/api"
import type { 
  OrdemServico, 
  Cliente,
  StatusOrdemServico,
  Servico,
  Produto,
  FormaPagamento,
  OrdemServicoServico,
  OrdemServicoProduto,
  OrdemServicoFuncionario,
  OrdemServicoFormaPagamento
} from "@/lib/types"
import { ArrowLeft, Save, ClipboardList, Plus, Trash2 } from "lucide-react"

interface OrdemServicoFormProps {
  params: {
    slug: string
    action: string // "novo" or ordem ID for editing
  }
}

export default function OrdemServicoForm({ params }: OrdemServicoFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  
  // Form data
  const [ordemServico, setOrdemServico] = useState<OrdemServico>({
    nome: "",
    descricao: "",
    valor_total_servicos: undefined,
    valor_total_produtos: undefined,
    status: "",
    data_emissao: "",
    valor_total: undefined,
    observacoes_cliente: "",
    observacoes_internas: "",
  })

  // Relationship data
  const [servicosOrdem, setServicosOrdem] = useState<OrdemServicoServico[]>([])
  const [produtosOrdem, setProdutosOrdem] = useState<OrdemServicoProduto[]>([])
  const [funcionariosOrdem, setFuncionariosOrdem] = useState<OrdemServicoFuncionario[]>([])
  const [formasPagamentoOrdem, setFormasPagamentoOrdem] = useState<OrdemServicoFormaPagamento[]>([])

  // Options
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [statusOrdensServico, setStatusOrdensServico] = useState<StatusOrdemServico[]>([])
  const [servicos, setServicos] = useState<Servico[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([])

  const ordemServicoId = params.action !== "novo" ? Number(params.action) : null

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
        loadClientes(token),
        loadStatusOrdensServico(token),
        loadServicos(token),
        loadProdutos(token),
        loadFuncionarios(token),
        loadFormasPagamento(token),
      ])

      // If editing, load the ordem servico data
      if (ordemServicoId) {
        await loadOrdemServico(ordemServicoId, token)
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

  const loadClientes = async (token: string) => {
    try {
      const data = await getClientes(token)
      setClientes(data)
    } catch (error) {
      console.error("Erro ao carregar clientes:", error)
    }
  }

  const loadStatusOrdensServico = async (token: string) => {
    try {
      const data = await getStatusOrdensServico(token)
      setStatusOrdensServico(data)
    } catch (error) {
      console.error("Erro ao carregar status de ordens de serviço:", error)
    }
  }

  const loadServicos = async (token: string) => {
    try {
      const data = await getServicos(token)
      setServicos(data)
    } catch (error) {
      console.error("Erro ao carregar serviços:", error)
    }
  }

  const loadProdutos = async (token: string) => {
    try {
      const data = await getProdutos(token)
      setProdutos(data)
    } catch (error) {
      console.error("Erro ao carregar produtos:", error)
    }
  }

  const loadFuncionarios = async (token: string) => {
    try {
      const data = await getFuncionarios(token)
      setFuncionarios(data)
    } catch (error) {
      console.error("Erro ao carregar funcionários:", error)
    }
  }

  const loadFormasPagamento = async (token: string) => {
    try {
      const data = await getFormasPagamento(token)
      setFormasPagamento(data)
    } catch (error) {
      console.error("Erro ao carregar formas de pagamento:", error)
    }
  }

  const loadOrdemServico = async (id: number, token: string) => {
    try {
      const data = await getOrdemServico(id, token)
      setOrdemServico(data)
      
      // Load relationships if they exist
      if (data.servicos) setServicosOrdem(data.servicos)
      if (data.produtos) setProdutosOrdem(data.produtos)
      if (data.funcionarios) setFuncionariosOrdem(data.funcionarios)
      if (data.formasPagamento) setFormasPagamentoOrdem(data.formasPagamento)
    } catch (error) {
      console.error("Erro ao carregar ordem de serviço:", error)
      throw error
    }
  }

  const handleInputChange = (field: keyof OrdemServico, value: any) => {
    setOrdemServico(prev => ({
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

      let savedOrdemServico: OrdemServico
      
      if (isEditing && ordemServicoId) {
        savedOrdemServico = await updateOrdemServico(ordemServicoId, ordemServico, token)
        toast({
          title: "Ordem de serviço atualizada com sucesso!",
          description: "As alterações foram salvas.",
        })
      } else {
        savedOrdemServico = await createOrdemServico(ordemServico, token)
        toast({
          title: "Ordem de serviço criada com sucesso!",
          description: "A nova ordem de serviço foi adicionada ao sistema.",
        })
      }

      router.push(`/${params.slug}/dashboard/ordens-servico`)
    } catch (error) {
      console.error("Erro ao salvar ordem de serviço:", error)
      toast({
        variant: "destructive",
        title: "Erro ao salvar ordem de serviço",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    } finally {
      setLoading(false)
    }
  }

  // Servico functions
  const addServico = () => {
    const newServico: OrdemServicoServico = {
      ordens_servico_id: ordemServicoId || 0,
      servicos_id: 0,
      quantidade: 1,
      valor_unitario: 0,
      valor_desconto: 0,
    }
    setServicosOrdem([...servicosOrdem, newServico])
  }

  const updateServicoOrdem = (index: number, field: keyof OrdemServicoServico, value: any) => {
    const updated = [...servicosOrdem]
    updated[index] = { ...updated[index], [field]: value }
    setServicosOrdem(updated)
  }

  const removeServicoOrdem = (index: number) => {
    const updated = servicosOrdem.filter((_, i) => i !== index)
    setServicosOrdem(updated)
  }

  // Produto functions
  const addProduto = () => {
    const newProduto: OrdemServicoProduto = {
      ordens_servico_id: ordemServicoId || 0,
      produtos_id: 0,
      quantidade: 1,
      valor_unitario: 0,
    }
    setProdutosOrdem([...produtosOrdem, newProduto])
  }

  const updateProdutoOrdem = (index: number, field: keyof OrdemServicoProduto, value: any) => {
    const updated = [...produtosOrdem]
    updated[index] = { ...updated[index], [field]: value }
    setProdutosOrdem(updated)
  }

  const removeProdutoOrdem = (index: number) => {
    const updated = produtosOrdem.filter((_, i) => i !== index)
    setProdutosOrdem(updated)
  }

  // Funcionario functions
  const addFuncionario = () => {
    const newFuncionario: OrdemServicoFuncionario = {
      ordens_servico_id: ordemServicoId || 0,
      funcionarios_id: 0,
    }
    setFuncionariosOrdem([...funcionariosOrdem, newFuncionario])
  }

  const updateFuncionarioOrdem = (index: number, field: keyof OrdemServicoFuncionario, value: any) => {
    const updated = [...funcionariosOrdem]
    updated[index] = { ...updated[index], [field]: value }
    setFuncionariosOrdem(updated)
  }

  const removeFuncionarioOrdem = (index: number) => {
    const updated = funcionariosOrdem.filter((_, i) => i !== index)
    setFuncionariosOrdem(updated)
  }

  // Forma Pagamento functions
  const addFormaPagamento = () => {
    const newFormaPagamento: OrdemServicoFormaPagamento = {
      ordens_servico_id: ordemServicoId || 0,
      formas_pagamento_id: 0,
      valor: 0,
    }
    setFormasPagamentoOrdem([...formasPagamentoOrdem, newFormaPagamento])
  }

  const updateFormaPagamentoOrdem = (index: number, field: keyof OrdemServicoFormaPagamento, value: any) => {
    const updated = [...formasPagamentoOrdem]
    updated[index] = { ...updated[index], [field]: value }
    setFormasPagamentoOrdem(updated)
  }

  const removeFormaPagamentoOrdem = (index: number) => {
    const updated = formasPagamentoOrdem.filter((_, i) => i !== index)
    setFormasPagamentoOrdem(updated)
  }

  if (loading && !ordemServico.nome) {
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
          onClick={() => router.push(`/${params.slug}/dashboard/ordens-servico`)}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <ClipboardList className="mr-2 h-6 w-6" />
        <h1 className="text-2xl font-bold">
          {isEditing ? "Editar Ordem de Serviço" : "Nova Ordem de Serviço"}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
            <TabsTrigger value="servicos">Serviços</TabsTrigger>
            <TabsTrigger value="produtos">Produtos</TabsTrigger>
            <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
            <TabsTrigger value="pagamento">Pagamento</TabsTrigger>
            <TabsTrigger value="observacoes">Observações</TabsTrigger>
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
                    <Label htmlFor="nome">Nome da Ordem *</Label>
                    <Input
                      id="nome"
                      value={ordemServico.nome || ""}
                      onChange={(e) => handleInputChange("nome", e.target.value)}
                      placeholder="Digite o nome da ordem de serviço"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientes_id">Cliente</Label>
                    <Select
                      value={ordemServico.clientes_id?.toString() || ""}
                      onValueChange={(value) => handleInputChange("clientes_id", value ? Number(value) : undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map((cliente) => (
                          <SelectItem key={cliente.id} value={cliente.id!.toString()}>
                            {cliente.razao_social || cliente.nome_fantasia}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Input
                      id="status"
                      value={ordemServico.status || ""}
                      onChange={(e) => handleInputChange("status", e.target.value)}
                      placeholder="Digite o status"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status_ordens_servico_id">Status da Ordem</Label>
                    <Select
                      value={ordemServico.status_ordens_servico_id?.toString() || ""}
                      onValueChange={(value) => handleInputChange("status_ordens_servico_id", value ? Number(value) : undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOrdensServico.map((status) => (
                          <SelectItem key={status.id} value={status.id.toString()}>
                            {status.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="data_emissao">Data de Emissão</Label>
                    <Input
                      id="data_emissao"
                      type="date"
                      value={ordemServico.data_emissao || ""}
                      onChange={(e) => handleInputChange("data_emissao", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="valor_total">Valor Total (R$)</Label>
                    <Input
                      id="valor_total"
                      type="number"
                      step="0.01"
                      value={ordemServico.valor_total || ""}
                      onChange={(e) => handleInputChange("valor_total", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={ordemServico.descricao || ""}
                    onChange={(e) => handleInputChange("descricao", e.target.value)}
                    placeholder="Digite a descrição da ordem de serviço"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Servicos Tab */}
          <TabsContent value="servicos" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  Serviços
                  <Button type="button" onClick={addServico} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Serviço
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {servicosOrdem.map((servicoOrdem, index) => (
                  <div key={index} className="border p-4 rounded-lg space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Serviço {index + 1}</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeServicoOrdem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label>Serviço</Label>
                        <Select
                          value={servicoOrdem.servicos_id?.toString() || ""}
                          onValueChange={(value) => updateServicoOrdem(index, "servicos_id", value ? Number(value) : 0)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o serviço" />
                          </SelectTrigger>
                          <SelectContent>
                            {servicos.map((servico) => (
                              <SelectItem key={servico.id} value={servico.id!.toString()}>
                                {servico.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Quantidade</Label>
                        <Input
                          type="number"
                          min="1"
                          value={servicoOrdem.quantidade || 1}
                          onChange={(e) => updateServicoOrdem(index, "quantidade", Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Valor Unitário (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={servicoOrdem.valor_unitario || 0}
                          onChange={(e) => updateServicoOrdem(index, "valor_unitario", Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Desconto (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={servicoOrdem.valor_desconto || 0}
                          onChange={(e) => updateServicoOrdem(index, "valor_desconto", Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                {servicosOrdem.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum serviço adicionado. Click em "Adicionar Serviço" para começar.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Produtos Tab */}
          <TabsContent value="produtos" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  Produtos
                  <Button type="button" onClick={addProduto} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Produto
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {produtosOrdem.map((produtoOrdem, index) => (
                  <div key={index} className="border p-4 rounded-lg space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Produto {index + 1}</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeProdutoOrdem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Produto</Label>
                        <Select
                          value={produtoOrdem.produtos_id?.toString() || ""}
                          onValueChange={(value) => updateProdutoOrdem(index, "produtos_id", value ? Number(value) : 0)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o produto" />
                          </SelectTrigger>
                          <SelectContent>
                            {produtos.map((produto) => (
                              <SelectItem key={produto.id} value={produto.id!.toString()}>
                                {produto.descricao}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Quantidade</Label>
                        <Input
                          type="number"
                          min="1"
                          value={produtoOrdem.quantidade || 1}
                          onChange={(e) => updateProdutoOrdem(index, "quantidade", Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Valor Unitário (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={produtoOrdem.valor_unitario || 0}
                          onChange={(e) => updateProdutoOrdem(index, "valor_unitario", Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                {produtosOrdem.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum produto adicionado. Click em "Adicionar Produto" para começar.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Funcionarios Tab */}
          <TabsContent value="funcionarios" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  Funcionários
                  <Button type="button" onClick={addFuncionario} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Funcionário
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {funcionariosOrdem.map((funcionarioOrdem, index) => (
                  <div key={index} className="border p-4 rounded-lg space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Funcionário {index + 1}</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeFuncionarioOrdem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div>
                      <Label>Funcionário</Label>
                      <Select
                        value={funcionarioOrdem.funcionarios_id?.toString() || ""}
                        onValueChange={(value) => updateFuncionarioOrdem(index, "funcionarios_id", value ? Number(value) : 0)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o funcionário" />
                        </SelectTrigger>
                        <SelectContent>
                          {funcionarios.map((funcionario) => (
                            <SelectItem key={funcionario.id} value={funcionario.id.toString()}>
                              {funcionario.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
                
                {funcionariosOrdem.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum funcionário adicionado. Click em "Adicionar Funcionário" para começar.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pagamento Tab */}
          <TabsContent value="pagamento" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  Formas de Pagamento
                  <Button type="button" onClick={addFormaPagamento} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Forma de Pagamento
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formasPagamentoOrdem.map((formaPagamentoOrdem, index) => (
                  <div key={index} className="border p-4 rounded-lg space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Forma de Pagamento {index + 1}</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeFormaPagamentoOrdem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Forma de Pagamento</Label>
                        <Select
                          value={formaPagamentoOrdem.formas_pagamento_id?.toString() || ""}
                          onValueChange={(value) => updateFormaPagamentoOrdem(index, "formas_pagamento_id", value ? Number(value) : 0)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a forma de pagamento" />
                          </SelectTrigger>
                          <SelectContent>
                            {formasPagamento.map((forma) => (
                              <SelectItem key={forma.id} value={forma.id.toString()}>
                                {forma.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Valor (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formaPagamentoOrdem.valor || 0}
                          onChange={(e) => updateFormaPagamentoOrdem(index, "valor", Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                {formasPagamentoOrdem.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma forma de pagamento adicionada. Click em "Adicionar Forma de Pagamento" para começar.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Observacoes Tab */}
          <TabsContent value="observacoes" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Observações do Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={ordemServico.observacoes_cliente || ""}
                    onChange={(e) => handleInputChange("observacoes_cliente", e.target.value)}
                    placeholder="Digite as observações do cliente"
                    rows={4}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Observações Internas</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={ordemServico.observacoes_internas || ""}
                    onChange={(e) => handleInputChange("observacoes_internas", e.target.value)}
                    placeholder="Digite as observações internas"
                    rows={4}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/${params.slug}/dashboard/ordens-servico`)}
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