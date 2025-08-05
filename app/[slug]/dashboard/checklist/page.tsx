"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { getToken, isAuthenticated } from "@/lib/auth"
import { 
  getChecklists,
  getChecklistTemplates,
  startChecklist,
  getVeiculos,
  getFuncionarios
} from "@/lib/api"
import type { 
  Checklist, 
  ChecklistTemplate,
  StartChecklistData,
  Veiculo
} from "@/lib/types"
import { 
  Plus, 
  CheckSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Play,
  Eye,
  FileText,
  Car,
  User,
  Calendar,
  Search
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ChecklistPageProps {
  params: {
    slug: string
  }
}

export default function ChecklistPage({ params }: ChecklistPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Estados para modal de iniciar checklist
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false)
  const [startData, setStartData] = useState<StartChecklistData>({
    template_id: 0,
    veiculo_id: undefined,
    funcionario_id: undefined,
    observacoes: ""
  })

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      if (!isAuthenticated()) {
        router.push(`/${params.slug}/login`)
        return
      }

      await fetchInitialData()
    }

    checkAuthAndFetchData()
  }, [params.slug, router])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      const [
        checklistsData,
        templatesData,
        veiculosData,
        funcionariosData
      ] = await Promise.all([
        getChecklists(token),
        getChecklistTemplates(token),
        getVeiculos(token),
        getFuncionarios(token)
      ])

      setChecklists(checklistsData)
      setTemplates(templatesData)
      setVeiculos(veiculosData)
      setFuncionarios(funcionariosData)
    } catch (error) {
      console.error("Erro ao buscar dados:", error)
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStartChecklist = async () => {
    if (!startData.template_id) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "Selecione um template para iniciar o checklist",
      })
      return
    }

    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      const checklist = await startChecklist(startData, token)
      
      setIsStartDialogOpen(false)
      setStartData({
        template_id: 0,
        veiculo_id: undefined,
        funcionario_id: undefined,
        observacoes: ""
      })
      
      await fetchInitialData()
      
      toast({
        title: "Checklist iniciado com sucesso!",
        description: "Redirecionando para execução do checklist...",
      })
      
      // Redirecionar para página de execução
      router.push(`/${params.slug}/dashboard/checklist/${checklist.id}`)
    } catch (error) {
      console.error("Erro ao iniciar checklist:", error)
      toast({
        variant: "destructive",
        title: "Erro ao iniciar checklist",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'iniciado':
        return <Clock className="h-4 w-4" />
      case 'em_andamento':
        return <AlertCircle className="h-4 w-4" />
      case 'finalizado':
        return <CheckCircle2 className="h-4 w-4" />
      default:
        return <CheckSquare className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'iniciado':
        return 'bg-blue-100 text-blue-800'
      case 'em_andamento':
        return 'bg-yellow-100 text-yellow-800'
      case 'finalizado':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'iniciado':
        return 'Iniciado'
      case 'em_andamento':
        return 'Em Andamento'
      case 'finalizado':
        return 'Finalizado'
      default:
        return status
    }
  }

  const filteredChecklists = checklists.filter(checklist => {
    const searchLower = searchTerm.toLowerCase()
    return (
      checklist.template?.nome?.toLowerCase().includes(searchLower) ||
      checklist.veiculo?.placa?.toLowerCase().includes(searchLower) ||
      checklist.funcionario?.nome?.toLowerCase().includes(searchLower) ||
      checklist.status.toLowerCase().includes(searchLower)
    )
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Carregando checklists...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <CheckSquare className="mr-2 h-6 w-6" />
          <h1 className="text-2xl font-bold">Checklist de Veículos</h1>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => router.push(`/${params.slug}/dashboard/checklist/templates`)}
          >
            <FileText className="mr-2 h-4 w-4" />
            Templates
          </Button>
          <Dialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Checklist
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Iniciar Novo Checklist</DialogTitle>
                <DialogDescription>
                  Selecione um template e preencha as informações para iniciar um novo checklist.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="template">Template *</Label>
                  <Select
                    value={startData.template_id.toString()}
                    onValueChange={(value) => setStartData({ ...startData, template_id: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id!.toString()}>
                          {template.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="veiculo">Veículo</Label>
                  <Select
                    value={startData.veiculo_id?.toString() || ""}
                    onValueChange={(value) => setStartData({ ...startData, veiculo_id: value ? parseInt(value) : undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um veículo (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {veiculos.map((veiculo) => (
                        <SelectItem key={veiculo.id} value={veiculo.id!.toString()}>
                          {veiculo.placa} - {veiculo.modelo_veiculo?.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="funcionario">Funcionário</Label>
                  <Select
                    value={startData.funcionario_id?.toString() || ""}
                    onValueChange={(value) => setStartData({ ...startData, funcionario_id: value ? parseInt(value) : undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um funcionário (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {funcionarios.map((funcionario) => (
                        <SelectItem key={funcionario.id} value={funcionario.id.toString()}>
                          {funcionario.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={startData.observacoes}
                    onChange={(e) => setStartData({ ...startData, observacoes: e.target.value })}
                    placeholder="Observações iniciais (opcional)"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsStartDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleStartChecklist}>
                  <Play className="mr-2 h-4 w-4" />
                  Iniciar Checklist
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Busca */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar checklists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Lista de Checklists */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredChecklists.map((checklist) => (
          <Card key={checklist.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">
                    {checklist.template?.nome || 'Template não encontrado'}
                  </CardTitle>
                  <Badge className={`${getStatusColor(checklist.status)} mb-2`}>
                    <div className="flex items-center">
                      {getStatusIcon(checklist.status)}
                      <span className="ml-1">{getStatusLabel(checklist.status)}</span>
                    </div>
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {checklist.veiculo && (
                <div className="flex items-center text-sm text-gray-600">
                  <Car className="h-4 w-4 mr-2" />
                  <span>{checklist.veiculo.placa} - {checklist.veiculo.modelo_veiculo?.nome}</span>
                </div>
              )}
              
              {checklist.funcionario && (
                <div className="flex items-center text-sm text-gray-600">
                  <User className="h-4 w-4 mr-2" />
                  <span>{checklist.funcionario.nome}</span>
                </div>
              )}
              
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                <span>
                  {checklist.data_inicio 
                    ? format(new Date(checklist.data_inicio), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                    : 'Data não informada'
                  }
                </span>
              </div>
              
              {checklist.observacoes && (
                <div className="text-sm text-gray-600">
                  <p className="line-clamp-2">{checklist.observacoes}</p>
                </div>
              )}
              
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => router.push(`/${params.slug}/dashboard/checklist/${checklist.id}`)}
                >
                  <Eye className="mr-1 h-3 w-3" />
                  {checklist.status === 'finalizado' ? 'Visualizar' : 'Continuar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredChecklists.length === 0 && (
        <div className="text-center py-12">
          <CheckSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum checklist encontrado</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm ? 'Tente ajustar sua busca.' : 'Comece criando seu primeiro checklist.'}
          </p>
          {!searchTerm && (
            <Button onClick={() => setIsStartDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Checklist
            </Button>
          )}
        </div>
      )}
    </div>
  )
}