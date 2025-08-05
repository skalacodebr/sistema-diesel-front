"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { getToken, isAuthenticated } from "@/lib/auth"
import { getOrdemServico, getEmpresaMae, verificarPodeFacharOrdem, fecharOrdemServico } from "@/lib/api"
import type { OrdemServico, EmpresaMae } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Edit, ClipboardList, FileDown, CheckCircle2, XCircle, AlertTriangle, Lock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { OrdemServicoPDF } from "@/components/ordens-servico/ordem-servico-pdf"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

interface OrdemServicoViewPageProps {
  params: {
    slug: string
    id: string
  }
}

export default function OrdemServicoViewPage({ params }: OrdemServicoViewPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [ordemServico, setOrdemServico] = useState<OrdemServico | null>(null)
  const [empresa, setEmpresa] = useState<EmpresaMae | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const pdfRef = useRef<HTMLDivElement>(null)
  const ordemServicoId = Number(params.id)
  
  // Estados para fechamento
  const [podeFechar, setPodeFechar] = useState<any>(null)
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [closeData, setCloseData] = useState({
    status_final: '',
    observacoes_fechamento: ''
  })

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      if (!isAuthenticated()) {
        router.push(`/${params.slug}/login`)
        return
      }

      await fetchData()
    }

    checkAuthAndFetchData()
  }, [params.slug, router])

  const fetchData = async () => {
    setLoading(true)
    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      // Fetch both ordem servico and empresa data
      const [ordemServicoData, empresaData, podeFecharData] = await Promise.all([
        getOrdemServico(ordemServicoId, token),
        getEmpresaMae(token),
        verificarPodeFacharOrdem(ordemServicoId, token).catch(() => null)
      ])
      
      setOrdemServico(ordemServicoData)
      setPodeFechar(podeFecharData)
      
      // Extract the empresa from the response
      const empresaArray = empresaData.result?.data || empresaData.data || empresaData
      if (Array.isArray(empresaArray) && empresaArray.length > 0) {
        setEmpresa(empresaArray[0])
      }
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

  const generatePDF = async () => {
    if (!pdfRef.current || !ordemServico || !empresa) return

    setGeneratingPDF(true)
    try {
      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff"
      })

      const imgData = canvas.getImageData(0, 0, canvas.width, canvas.height)
      const pdf = new jsPDF("p", "mm", "a4")
      
      // Calculate dimensions to fit A4
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const canvasAspectRatio = canvas.height / canvas.width
      const pdfAspectRatio = pdfHeight / pdfWidth

      let renderWidth, renderHeight

      if (canvasAspectRatio > pdfAspectRatio) {
        renderHeight = pdfHeight
        renderWidth = renderHeight / canvasAspectRatio
      } else {
        renderWidth = pdfWidth
        renderHeight = renderWidth * canvasAspectRatio
      }

      const x = (pdfWidth - renderWidth) / 2
      const y = (pdfHeight - renderHeight) / 2

      pdf.addImage(canvas.toDataURL("image/png"), "PNG", x, y, renderWidth, renderHeight)
      pdf.save(`ordem-servico-${ordemServico.id}.pdf`)

      toast({
        title: "PDF gerado com sucesso",
        description: "O arquivo foi baixado para seu computador.",
      })
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
      toast({
        variant: "destructive",
        title: "Erro ao gerar PDF",
        description: "Ocorreu um erro ao gerar o arquivo PDF.",
      })
    } finally {
      setGeneratingPDF(false)
    }
  }

  const handleOpenCloseDialog = () => {
    setCloseData({ status_final: '', observacoes_fechamento: '' })
    setCloseDialogOpen(true)
  }

  const handleCloseOrder = async () => {
    if (!closeData.status_final || !ordemServico?.id) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "Selecione um status final para fechar a ordem.",
      })
      return
    }

    setConfirmDialogOpen(true)
  }

  const confirmCloseOrder = async () => {
    if (!ordemServico?.id) return

    setClosing(true)
    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      await fecharOrdemServico(ordemServico.id, closeData, token)
      
      toast({
        title: "Ordem de serviço fechada com sucesso!",
        description: `A ordem foi marcada como ${closeData.status_final.toLowerCase()}.`,
      })

      // Recarregar dados
      await fetchData()
      setCloseDialogOpen(false)
      setConfirmDialogOpen(false)
    } catch (error) {
      console.error("Erro ao fechar ordem:", error)
      toast({
        variant: "destructive",
        title: "Erro ao fechar ordem de serviço",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    } finally {
      setClosing(false)
    }
  }

  const isOrderClosed = () => {
    const status = ordemServico?.statusOrdemServico?.nome
    return status && ['Concluída', 'Cancelada', 'Finalizada'].includes(status)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Carregando...</p>
      </div>
    )
  }

  if (!ordemServico) {
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
          <h1 className="text-2xl font-bold">Ordem de serviço não encontrada</h1>
        </div>
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
            onClick={() => router.push(`/${params.slug}/dashboard/ordens-servico`)}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <ClipboardList className="mr-2 h-6 w-6" />
          <h1 className="text-2xl font-bold">Detalhes da Ordem de Serviço</h1>
        </div>
        <div className="flex gap-2">
          {!isOrderClosed() && (
            <Button 
              onClick={handleOpenCloseDialog}
              disabled={!podeFechar?.pode_fechar}
              variant={podeFechar?.pode_fechar ? "default" : "outline"}
              className={podeFechar?.pode_fechar ? "bg-green-600 hover:bg-green-700" : ""}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Fechar Ordem
            </Button>
          )}
          {isOrderClosed() && (
            <Badge variant="secondary" className="text-sm px-3 py-2">
              <Lock className="mr-2 h-4 w-4" />
              Ordem {ordemServico?.statusOrdemServico?.nome}
            </Badge>
          )}
          <Button onClick={() => router.push(`/${params.slug}/dashboard/ordens-servico/${ordemServico.id}/editar`)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button 
            onClick={generatePDF} 
            disabled={generatingPDF || !empresa}
            variant="outline"
          >
            <FileDown className="mr-2 h-4 w-4" />
            {generatingPDF ? "Gerando PDF..." : "Baixar PDF"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>ID:</strong> {ordemServico.id}
            </div>
            <div>
              <strong>Nome:</strong> {ordemServico.nome || "Não informado"}
            </div>
            <div>
              <strong>Cliente:</strong> {ordemServico.cliente?.razao_social || ordemServico.cliente?.nome_fantasia || "Não informado"}
            </div>
            <div>
              <strong>Status:</strong> {ordemServico.status || "Não informado"}
            </div>
            <div>
              <strong>Status da Ordem:</strong> {ordemServico.statusOrdemServico?.nome || "Não informado"}
            </div>
            <div>
              <strong>Data de Emissão:</strong>{" "}
              {ordemServico.data_emissao
                ? format(new Date(ordemServico.data_emissao), "dd/MM/yyyy", { locale: ptBR })
                : "Não informado"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Valores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>Valor Total dos Serviços:</strong> {(() => {
                const valor = typeof ordemServico.valor_total_servicos === 'string' ? parseFloat(ordemServico.valor_total_servicos) : ordemServico.valor_total_servicos
                return valor && !isNaN(valor) ? `R$ ${valor.toFixed(2)}` : "Não informado"
              })()}
            </div>
            <div>
              <strong>Valor Total dos Produtos:</strong> {(() => {
                const valor = typeof ordemServico.valor_total_produtos === 'string' ? parseFloat(ordemServico.valor_total_produtos) : ordemServico.valor_total_produtos
                return valor && !isNaN(valor) ? `R$ ${valor.toFixed(2)}` : "Não informado"
              })()}
            </div>
            <div>
              <strong>Valor Total:</strong> {(() => {
                const valor = typeof ordemServico.valor_total === 'string' ? parseFloat(ordemServico.valor_total) : ordemServico.valor_total
                return valor && !isNaN(valor) ? `R$ ${valor.toFixed(2)}` : "Não informado"
              })()}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Descrição</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{ordemServico.descricao || "Não informado"}</p>
          </CardContent>
        </Card>

        {/* Status de Fechamento */}
        {podeFechar && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                {isOrderClosed() ? (
                  <>
                    <Lock className="mr-2 h-5 w-5" />
                    Ordem Fechada
                  </>
                ) : podeFechar.pode_fechar ? (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5 text-green-600" />
                    Pronta para Fechamento
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mr-2 h-5 w-5 text-orange-600" />
                    Impedimentos para Fechamento
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isOrderClosed() ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  <span>Ordem {ordemServico?.statusOrdemServico?.nome?.toLowerCase()} com sucesso</span>
                </div>
              ) : podeFechar.pode_fechar ? (
                <div className="space-y-2">
                  <div className="flex items-center text-green-600">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    <span>Todos os requisitos foram atendidos. A ordem pode ser fechada.</span>
                  </div>
                  {podeFechar.tem_checklist && (
                    <div className="text-sm text-gray-600">
                      ✓ Checklist obrigatório finalizado
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-orange-600 mb-3">
                    <AlertTriangle className="inline mr-2 h-4 w-4" />
                    Existem impedimentos para fechar a ordem:
                  </div>
                  <ul className="space-y-1">
                    {podeFechar.motivos_impedimento?.map((motivo: string, index: number) => (
                      <li key={index} className="flex items-center text-sm text-red-600">
                        <XCircle className="mr-2 h-3 w-3" />
                        {motivo}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 p-3 bg-blue-50 rounded-md">
                    <div className="text-sm text-blue-800">
                      <strong>Status atual:</strong> {podeFechar.status_atual || 'Não informado'}
                    </div>
                    {podeFechar.tem_checklist && (
                      <div className="text-sm text-blue-800">
                        <strong>Checklist finalizado:</strong> {podeFechar.checklist_finalizado ? 'Sim' : 'Não'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Serviços */}
        {ordemServico.servicos && ordemServico.servicos.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Serviços</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ordemServico.servicos.map((servicoOrdem, index) => {
                const valorUnitario = typeof servicoOrdem.valor_unitario === 'string' ? parseFloat(servicoOrdem.valor_unitario) : servicoOrdem.valor_unitario
                const valorDesconto = typeof servicoOrdem.valor_desconto === 'string' ? parseFloat(servicoOrdem.valor_desconto || '0') : (servicoOrdem.valor_desconto || 0)
                const subtotal = (valorUnitario || 0) * servicoOrdem.quantidade
                const total = subtotal - (valorDesconto || 0)
                
                return (
                  <div key={servicoOrdem.id || index} className="border-b pb-4 last:border-b-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div><strong>Serviço:</strong> {servicoOrdem.servico?.nome || "Não informado"}</div>
                        <div><strong>Quantidade:</strong> {servicoOrdem.quantidade}</div>
                        <div><strong>Valor Unitário:</strong> R$ {(valorUnitario || 0).toFixed(2)}</div>
                        {valorDesconto > 0 && (
                          <div className="text-orange-600">
                            <strong>Desconto:</strong> R$ {valorDesconto.toFixed(2)}
                            {servicoOrdem.aprovacaoDesconto && (
                              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                servicoOrdem.aprovacaoDesconto.aprovado 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {servicoOrdem.aprovacaoDesconto.aprovado ? 'Aprovado' : 'Não Aprovado'}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div><strong>Subtotal:</strong> R$ {subtotal.toFixed(2)}</div>
                        <div className="text-lg font-semibold">
                          <strong>Total:</strong> R$ {total.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        {/* Produtos */}
        {ordemServico.produtos && ordemServico.produtos.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Produtos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ordemServico.produtos.map((produtoOrdem, index) => {
                const valorUnitario = typeof produtoOrdem.valor_unitario === 'string' ? parseFloat(produtoOrdem.valor_unitario) : produtoOrdem.valor_unitario
                const total = (valorUnitario || 0) * produtoOrdem.quantidade
                
                return (
                  <div key={produtoOrdem.id || index} className="border-b pb-4 last:border-b-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div><strong>Produto:</strong> {produtoOrdem.produto?.descricao || "Não informado"}</div>
                        <div><strong>Quantidade:</strong> {produtoOrdem.quantidade}</div>
                        <div><strong>Valor Unitário:</strong> R$ {(valorUnitario || 0).toFixed(2)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">
                          <strong>Total:</strong> R$ {total.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        {/* Funcionários */}
        {ordemServico.funcionarios && ordemServico.funcionarios.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Funcionários</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ordemServico.funcionarios.map((funcionarioOrdem, index) => (
                <div key={funcionarioOrdem.id || index} className="border-b pb-2 last:border-b-0">
                  <div><strong>Funcionário:</strong> {funcionarioOrdem.funcionario?.nome || "Não informado"}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Formas de Pagamento */}
        {ordemServico.formasPagamento && ordemServico.formasPagamento.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Formas de Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ordemServico.formasPagamento.map((formaPagamentoOrdem, index) => (
                <div key={formaPagamentoOrdem.id || index} className="border-b pb-2 last:border-b-0">
                  <div><strong>Forma:</strong> {formaPagamentoOrdem.formaPagamento?.nome || "Não informado"}</div>
                  <div><strong>Valor:</strong> {(() => {
                    const valor = typeof formaPagamentoOrdem.valor === 'string' ? parseFloat(formaPagamentoOrdem.valor) : formaPagamentoOrdem.valor
                    return valor && !isNaN(valor) ? `R$ ${valor.toFixed(2)}` : "R$ 0,00"
                  })()}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Observações */}
        {(ordemServico.observacoes_cliente || ordemServico.observacoes_internas) && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ordemServico.observacoes_cliente && (
                <div>
                  <strong>Observações do Cliente:</strong>
                  <p className="mt-1">{ordemServico.observacoes_cliente}</p>
                </div>
              )}
              {ordemServico.observacoes_internas && (
                <div>
                  <strong>Observações Internas:</strong>
                  <p className="mt-1">{ordemServico.observacoes_internas}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Feedback */}
        {ordemServico.feedback && ordemServico.feedback.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ordemServico.feedback.map((feedbackItem, index) => (
                <div key={feedbackItem.id || index} className="border-b pb-4 last:border-b-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <strong>Cliente:</strong> {feedbackItem.cliente?.razao_social || feedbackItem.cliente?.nome_fantasia || "Não informado"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {feedbackItem.created_at ? format(new Date(feedbackItem.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : ""}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p>{feedbackItem.descricao}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Informações do Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>Data de Cadastro:</strong>{" "}
              {ordemServico.created_at
                ? format(new Date(ordemServico.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                : "Não informado"}
            </div>
            <div>
              <strong>Última Atualização:</strong>{" "}
              {ordemServico.updated_at
                ? format(new Date(ordemServico.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                : "Não informado"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hidden PDF component for generation */}
      {empresa && (
        <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
          <OrdemServicoPDF 
            ref={pdfRef}
            ordemServico={ordemServico}
            empresa={empresa}
          />
        </div>
      )}

      {/* Dialog para fechamento da ordem */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Fechar Ordem de Serviço</DialogTitle>
            <DialogDescription>
              Selecione o status final e adicione observações sobre o fechamento da ordem.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Status Final *</Label>
              <RadioGroup
                value={closeData.status_final}
                onValueChange={(value) => setCloseData({ ...closeData, status_final: value })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Concluída" id="concluida" />
                  <Label htmlFor="concluida" className="flex items-center">
                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                    Concluída
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Cancelada" id="cancelada" />
                  <Label htmlFor="cancelada" className="flex items-center">
                    <XCircle className="mr-2 h-4 w-4 text-red-600" />
                    Cancelada
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações do Fechamento</Label>
              <Textarea
                id="observacoes"
                value={closeData.observacoes_fechamento}
                onChange={(e) => setCloseData({ ...closeData, observacoes_fechamento: e.target.value })}
                placeholder="Descreva motivos, detalhes ou observações sobre o fechamento..."
                rows={4}
              />
            </div>

            {podeFechar && !podeFechar.pode_fechar && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center text-red-800">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  <span className="font-medium">Atenção</span>
                </div>
                <p className="text-sm text-red-700 mt-1">
                  Esta ordem possui impedimentos para fechamento. Certifique-se de que todos os requisitos foram atendidos.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCloseOrder} disabled={!closeData.status_final}>
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Fechamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja fechar esta ordem de serviço como{" "}
              <strong>"{closeData.status_final}"</strong>?
              
              {closeData.observacoes_fechamento && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-700">
                    <strong>Observações:</strong> {closeData.observacoes_fechamento}
                  </p>
                </div>
              )}
              
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-sm text-amber-800">
                  <strong>Importante:</strong> Esta ação não pode ser desfeita. A ordem será movida automaticamente no Kanban e seu status será alterado permanentemente.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmCloseOrder}
              disabled={closing}
              className={closeData.status_final === 'Concluída' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {closing ? 'Fechando...' : `Fechar como ${closeData.status_final}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}