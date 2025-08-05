"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { getToken, isAuthenticated } from "@/lib/auth"
import { 
  getChecklist,
  saveChecklistResponse,
  finalizeChecklist
} from "@/lib/api"
import type { 
  Checklist, 
  ChecklistResposta,
  ChecklistTemplateItem
} from "@/lib/types"
import { 
  CheckSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Save,
  Check,
  ArrowLeft,
  Car,
  User,
  Calendar,
  FileText,
  AlertTriangle
} from "lucide-react"
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
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ChecklistExecutionPageProps {
  params: {
    slug: string
    id: string
  }
}

interface RespostaLocal {
  item_id: number
  resposta: string | boolean | number
  observacao?: string
}

export default function ChecklistExecutionPage({ params }: ChecklistExecutionPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [checklist, setChecklist] = useState<Checklist | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [finalizing, setFinalizing] = useState(false)
  
  // Estados para respostas locais
  const [respostas, setRespostas] = useState<{ [key: number]: RespostaLocal }>({})
  const [finalizeDialogOpen, setFinalizeDialogOpen] = useState(false)

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      if (!isAuthenticated()) {
        router.push(`/${params.slug}/login`)
        return
      }

      await fetchChecklist()
    }

    checkAuthAndFetchData()
  }, [params.slug, params.id, router])

  const fetchChecklist = async () => {
    setLoading(true)
    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      const data = await getChecklist(parseInt(params.id), token)
      setChecklist(data)
      
      // Inicializar respostas com dados existentes
      if (data.respostas) {
        const respostasMap: { [key: number]: RespostaLocal } = {}
        data.respostas.forEach((resposta: ChecklistResposta) => {
          respostasMap[resposta.item_id] = {
            item_id: resposta.item_id,
            resposta: resposta.resposta,
            observacao: resposta.observacao
          }
        })
        setRespostas(respostasMap)
      }
    } catch (error) {
      console.error("Erro ao buscar checklist:", error)
      toast({
        variant: "destructive",
        title: "Erro ao carregar checklist",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
      router.push(`/${params.slug}/dashboard/checklist`)
    } finally {
      setLoading(false)
    }
  }

  const handleRespostaChange = (itemId: number, resposta: string | boolean | number) => {
    setRespostas(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        item_id: itemId,
        resposta
      }
    }))
  }

  const handleObservacaoChange = (itemId: number, observacao: string) => {
    setRespostas(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        item_id: itemId,
        resposta: prev[itemId]?.resposta || "",
        observacao
      }
    }))
  }

  const handleSaveProgress = async () => {
    if (!checklist?.id) return

    setSaving(true)
    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      // Salvar apenas respostas que foram preenchidas
      const respostasArray = Object.values(respostas).filter(r => 
        r.resposta !== undefined && r.resposta !== ""
      )

      if (respostasArray.length === 0) {
        toast({
          variant: "destructive",
          title: "Nenhuma resposta para salvar",
          description: "Preencha pelo menos uma resposta antes de salvar.",
        })
        return
      }

      await saveChecklistResponse({
        checklist_id: checklist.id,
        respostas: respostasArray
      }, token)

      toast({
        title: "Progresso salvo com sucesso!",
        description: "Suas respostas foram salvas e você pode continuar depois.",
      })
    } catch (error) {
      console.error("Erro ao salvar progresso:", error)
      toast({
        variant: "destructive",
        title: "Erro ao salvar progresso",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleFinalize = async () => {
    if (!checklist?.id) return

    // Verificar se todas as perguntas obrigatórias foram respondidas
    const perguntasObrigatorias = checklist.template?.itens?.filter(item => item.obrigatoria) || []
    const perguntasNaoRespondidas = perguntasObrigatorias.filter(item => {
      const resposta = respostas[item.id!]
      return !resposta || resposta.resposta === undefined || resposta.resposta === ""
    })

    if (perguntasNaoRespondidas.length > 0) {
      toast({
        variant: "destructive",
        title: "Perguntas obrigatórias não respondidas",
        description: `Há ${perguntasNaoRespondidas.length} pergunta(s) obrigatória(s) que precisa(m) ser respondida(s).`,
      })
      return
    }

    setFinalizeDialogOpen(true)
  }

  const confirmFinalize = async () => {
    if (!checklist?.id) return

    setFinalizing(true)
    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      // Salvar todas as respostas primeiro
      const respostasArray = Object.values(respostas).filter(r => 
        r.resposta !== undefined && r.resposta !== ""
      )

      if (respostasArray.length > 0) {
        await saveChecklistResponse({
          checklist_id: checklist.id,
          respostas: respostasArray
        }, token)
      }

      // Finalizar checklist
      await finalizeChecklist(checklist.id, token)

      toast({
        title: "Checklist finalizado com sucesso!",
        description: "O checklist foi concluído e não pode mais ser editado.",
      })

      router.push(`/${params.slug}/dashboard/checklist`)
    } catch (error) {
      console.error("Erro ao finalizar checklist:", error)
      toast({
        variant: "destructive",
        title: "Erro ao finalizar checklist",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    } finally {
      setFinalizing(false)
      setFinalizeDialogOpen(false)
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

  const renderQuestionInput = (item: ChecklistTemplateItem) => {
    const currentResponse = respostas[item.id!]?.resposta
    const currentObservacao = respostas[item.id!]?.observacao || ""

    switch (item.tipo_resposta) {
      case 'sim_nao':
        return (
          <div className="space-y-3">
            <RadioGroup 
              value={currentResponse?.toString() || ""} 
              onValueChange={(value) => handleRespostaChange(item.id!, value === 'true')}
              disabled={checklist?.status === 'finalizado'}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id={`${item.id}-sim`} />
                <Label htmlFor={`${item.id}-sim`}>Sim</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id={`${item.id}-nao`} />
                <Label htmlFor={`${item.id}-nao`}>Não</Label>
              </div>
            </RadioGroup>
            <div className="space-y-2">
              <Label htmlFor={`obs-${item.id}`}>Observação</Label>
              <Textarea
                id={`obs-${item.id}`}
                value={currentObservacao}
                onChange={(e) => handleObservacaoChange(item.id!, e.target.value)}
                placeholder="Observação adicional (opcional)"
                rows={2}
                disabled={checklist?.status === 'finalizado'}
              />
            </div>
          </div>
        )

      case 'texto':
        return (
          <div className="space-y-3">
            <Textarea
              value={currentResponse?.toString() || ""}
              onChange={(e) => handleRespostaChange(item.id!, e.target.value)}
              placeholder="Digite sua resposta..."
              rows={3}
              disabled={checklist?.status === 'finalizado'}
            />
            <div className="space-y-2">
              <Label htmlFor={`obs-${item.id}`}>Observação</Label>
              <Textarea
                id={`obs-${item.id}`}
                value={currentObservacao}
                onChange={(e) => handleObservacaoChange(item.id!, e.target.value)}
                placeholder="Observação adicional (opcional)"
                rows={2}
                disabled={checklist?.status === 'finalizado'}
              />
            </div>
          </div>
        )

      case 'numerico':
        return (
          <div className="space-y-3">
            <Input
              type="number"
              value={currentResponse?.toString() || ""}
              onChange={(e) => handleRespostaChange(item.id!, parseFloat(e.target.value) || 0)}
              placeholder="Digite um número..."
              disabled={checklist?.status === 'finalizado'}
            />
            <div className="space-y-2">
              <Label htmlFor={`obs-${item.id}`}>Observação</Label>
              <Textarea
                id={`obs-${item.id}`}
                value={currentObservacao}
                onChange={(e) => handleObservacaoChange(item.id!, e.target.value)}
                placeholder="Observação adicional (opcional)"
                rows={2}
                disabled={checklist?.status === 'finalizado'}
              />
            </div>
          </div>
        )

      case 'multipla_escolha':
        return (
          <div className="space-y-3">
            <RadioGroup 
              value={currentResponse?.toString() || ""} 
              onValueChange={(value) => handleRespostaChange(item.id!, value)}
              disabled={checklist?.status === 'finalizado'}
            >
              {item.opcoes?.map((opcao, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={opcao} id={`${item.id}-${index}`} />
                  <Label htmlFor={`${item.id}-${index}`}>{opcao}</Label>
                </div>
              ))}
            </RadioGroup>
            <div className="space-y-2">
              <Label htmlFor={`obs-${item.id}`}>Observação</Label>
              <Textarea
                id={`obs-${item.id}`}
                value={currentObservacao}
                onChange={(e) => handleObservacaoChange(item.id!, e.target.value)}
                placeholder="Observação adicional (opcional)"
                rows={2}
                disabled={checklist?.status === 'finalizado'}
              />
            </div>
          </div>
        )

      default:
        return <p className="text-gray-500">Tipo de resposta não suportado</p>
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Carregando checklist...</p>
      </div>
    )
  }

  if (!checklist) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Checklist não encontrado</p>
      </div>
    )
  }

  const totalPerguntas = checklist.template?.itens?.length || 0
  const perguntasRespondidas = Object.keys(respostas).length
  const progresso = totalPerguntas > 0 ? Math.round((perguntasRespondidas / totalPerguntas) * 100) : 0

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/${params.slug}/dashboard/checklist`)}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{checklist.template?.nome}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <Badge className={`${getStatusColor(checklist.status)}`}>
                <div className="flex items-center">
                  {getStatusIcon(checklist.status)}
                  <span className="ml-1">{getStatusLabel(checklist.status)}</span>
                </div>
              </Badge>
              <span>{perguntasRespondidas}/{totalPerguntas} perguntas respondidas ({progresso}%)</span>
            </div>
          </div>
        </div>
        {checklist.status !== 'finalizado' && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleSaveProgress}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Progresso'}
            </Button>
            <Button 
              onClick={handleFinalize}
              disabled={finalizing}
            >
              <Check className="h-4 w-4 mr-2" />
              {finalizing ? 'Finalizando...' : 'Finalizar'}
            </Button>
          </div>
        )}
      </div>

      {/* Informações do checklist */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Informações do Checklist
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {checklist.veiculo && (
            <div className="flex items-center text-sm">
              <Car className="h-4 w-4 mr-2 text-gray-500" />
              <div>
                <p className="font-medium">{checklist.veiculo.placa}</p>
                <p className="text-gray-600">{checklist.veiculo.modelo_veiculo?.nome}</p>
              </div>
            </div>
          )}
          
          {checklist.funcionario && (
            <div className="flex items-center text-sm">
              <User className="h-4 w-4 mr-2 text-gray-500" />
              <div>
                <p className="font-medium">{checklist.funcionario.nome}</p>
                <p className="text-gray-600">Responsável</p>
              </div>
            </div>
          )}
          
          <div className="flex items-center text-sm">
            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
            <div>
              <p className="font-medium">
                {checklist.data_inicio 
                  ? format(new Date(checklist.data_inicio), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                  : 'Data não informada'
                }
              </p>
              <p className="text-gray-600">Data de início</p>
            </div>
          </div>
          
          {checklist.observacoes && (
            <div className="md:col-span-3">
              <p className="text-sm font-medium mb-1">Observações iniciais:</p>
              <p className="text-sm text-gray-600">{checklist.observacoes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progresso */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progresso do Checklist</span>
            <span className="text-sm text-gray-600">{progresso}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all" 
              style={{ width: `${progresso}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Perguntas */}
      <div className="space-y-6">
        {checklist.template?.itens?.map((item, index) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle className="flex items-start justify-between">
                <div className="flex items-start">
                  <span className="text-sm bg-gray-100 rounded-full px-3 py-1 mr-3 mt-0.5">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-lg">{item.pergunta}</p>
                    {item.obrigatoria && (
                      <div className="flex items-center mt-1">
                        <AlertTriangle className="h-4 w-4 text-orange-500 mr-1" />
                        <span className="text-sm text-orange-600">Obrigatória</span>
                      </div>
                    )}
                  </div>
                </div>
                {respostas[item.id!] && (
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-1" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderQuestionInput(item)}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog de confirmação para finalizar */}
      <AlertDialog open={finalizeDialogOpen} onOpenChange={setFinalizeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar Checklist</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja finalizar este checklist? 
              Após finalizado, não será possível fazer mais alterações nas respostas.
              
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Progresso atual:</strong> {perguntasRespondidas}/{totalPerguntas} perguntas respondidas ({progresso}%)
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmFinalize} className="bg-green-600 hover:bg-green-700">
              Finalizar Checklist
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}