"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { getToken, isAuthenticated } from "@/lib/auth"
import { getOrdemServico, getEmpresaMae } from "@/lib/api"
import type { OrdemServico, EmpresaMae } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Edit, ClipboardList, FileDown } from "lucide-react"
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
      const [ordemServicoData, empresaData] = await Promise.all([
        getOrdemServico(ordemServicoId, token),
        getEmpresaMae(token)
      ])
      
      setOrdemServico(ordemServicoData)
      
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
              <strong>Valor Total dos Serviços:</strong> {ordemServico.valor_total_servicos ? `R$ ${ordemServico.valor_total_servicos.toFixed(2)}` : "Não informado"}
            </div>
            <div>
              <strong>Valor Total dos Produtos:</strong> {ordemServico.valor_total_produtos ? `R$ ${ordemServico.valor_total_produtos.toFixed(2)}` : "Não informado"}
            </div>
            <div>
              <strong>Valor Total:</strong> {ordemServico.valor_total ? `R$ ${ordemServico.valor_total.toFixed(2)}` : "Não informado"}
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

        {/* Serviços */}
        {ordemServico.servicos && ordemServico.servicos.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Serviços</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ordemServico.servicos.map((servicoOrdem, index) => (
                <div key={servicoOrdem.id || index} className="border-b pb-2 last:border-b-0">
                  <div><strong>Serviço:</strong> {servicoOrdem.servico?.nome || "Não informado"}</div>
                  <div><strong>Quantidade:</strong> {servicoOrdem.quantidade}</div>
                  <div><strong>Valor Unitário:</strong> R$ {servicoOrdem.valor_unitario.toFixed(2)}</div>
                  {servicoOrdem.valor_desconto && <div><strong>Desconto:</strong> R$ {servicoOrdem.valor_desconto.toFixed(2)}</div>}
                </div>
              ))}
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
              {ordemServico.produtos.map((produtoOrdem, index) => (
                <div key={produtoOrdem.id || index} className="border-b pb-2 last:border-b-0">
                  <div><strong>Produto:</strong> {produtoOrdem.produto?.descricao || "Não informado"}</div>
                  <div><strong>Quantidade:</strong> {produtoOrdem.quantidade}</div>
                  <div><strong>Valor Unitário:</strong> R$ {produtoOrdem.valor_unitario.toFixed(2)}</div>
                </div>
              ))}
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
                  <div><strong>Valor:</strong> R$ {formaPagamentoOrdem.valor.toFixed(2)}</div>
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
    </div>
  )
}