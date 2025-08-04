"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getToken, isAuthenticated } from "@/lib/auth"
import { getServico } from "@/lib/api"
import type { Servico } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Edit, Wrench } from "lucide-react"

interface ServicoViewPageProps {
  params: {
    slug: string
    id: string
  }
}

export default function ServicoViewPage({ params }: ServicoViewPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [servico, setServico] = useState<Servico | null>(null)
  const [loading, setLoading] = useState(true)
  const servicoId = Number(params.id)

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      if (!isAuthenticated()) {
        router.push(`/${params.slug}/login`)
        return
      }

      await fetchServico()
    }

    checkAuthAndFetchData()
  }, [params.slug, router])

  const fetchServico = async () => {
    setLoading(true)
    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      const data = await getServico(servicoId, token)
      setServico(data)
    } catch (error) {
      console.error("Erro ao buscar serviço:", error)
      toast({
        variant: "destructive",
        title: "Erro ao carregar serviço",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Carregando...</p>
      </div>
    )
  }

  if (!servico) {
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
          <h1 className="text-2xl font-bold">Serviço não encontrado</h1>
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
            onClick={() => router.push(`/${params.slug}/dashboard/servicos`)}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Wrench className="mr-2 h-6 w-6" />
          <h1 className="text-2xl font-bold">Detalhes do Serviço</h1>
        </div>
        <Button onClick={() => router.push(`/${params.slug}/dashboard/servicos/${servico.id}/editar`)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>ID:</strong> {servico.id}
            </div>
            <div>
              <strong>Nome:</strong> {servico.nome || "Não informado"}
            </div>
            <div>
              <strong>Código:</strong> {servico.codigo_servico || "Não informado"}
            </div>
            <div>
              <strong>Categoria:</strong> {servico.categoriaServico?.nome || "Não informado"}
            </div>
            <div>
              <strong>Unidade de Cobrança:</strong> {servico.unidadeCobranca?.nome || "Não informado"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preços e Tempo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>Valor Unitário:</strong> {(() => {
                const valor = typeof servico.valor_unitario === 'string' ? parseFloat(servico.valor_unitario) : servico.valor_unitario
                return valor && !isNaN(valor) ? `R$ ${valor.toFixed(2)}` : "Não informado"
              })()}
            </div>
            <div>
              <strong>Percentual de Comissão:</strong> {(() => {
                const percentual = typeof servico.percentual_comissao === 'string' ? parseFloat(servico.percentual_comissao) : servico.percentual_comissao
                return percentual && !isNaN(percentual) ? `${percentual}%` : "Não informado"
              })()}
            </div>
            <div>
              <strong>Tempo do Serviço:</strong> {servico.tempo_servico_minutos ? `${servico.tempo_servico_minutos} min` : "Não informado"}
            </div>
            <div>
              <strong>Tempo Adicional:</strong> {servico.tempo_adicional ? `${servico.tempo_adicional} min` : "Não informado"}
            </div>
            <div>
              <strong>Tempo de Tolerância:</strong> {servico.tempo_tolerancia ? `${servico.tempo_tolerancia} min` : "Não informado"}
            </div>
            <div>
              <strong>Valor Adicional:</strong> {(() => {
                const valor = typeof servico.valor_adicional === 'string' ? parseFloat(servico.valor_adicional) : servico.valor_adicional
                return valor && !isNaN(valor) ? `R$ ${valor.toFixed(2)}` : "Não informado"
              })()}
            </div>
            <div>
              <strong>Limite Máximo de Desconto:</strong> {(() => {
                const limite = typeof servico.limite_maximo_desconto === 'string' ? parseFloat(servico.limite_maximo_desconto) : servico.limite_maximo_desconto
                return limite && !isNaN(limite) ? `${limite}%` : "Não informado"
              })()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Impostos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>ISS:</strong> {(() => {
                const iss = typeof servico.percentual_iss === 'string' ? parseFloat(servico.percentual_iss) : servico.percentual_iss
                return iss && !isNaN(iss) ? `${iss}%` : "Não informado"
              })()}
            </div>
            <div>
              <strong>PIS:</strong> {(() => {
                const pis = typeof servico.percentual_pis === 'string' ? parseFloat(servico.percentual_pis) : servico.percentual_pis
                return pis && !isNaN(pis) ? `${pis}%` : "Não informado"
              })()}
            </div>
            <div>
              <strong>COFINS:</strong> {(() => {
                const cofins = typeof servico.percentual_cofins === 'string' ? parseFloat(servico.percentual_cofins) : servico.percentual_cofins
                return cofins && !isNaN(cofins) ? `${cofins}%` : "Não informado"
              })()}
            </div>
            <div>
              <strong>INSS:</strong> {(() => {
                const inss = typeof servico.percentual_inss === 'string' ? parseFloat(servico.percentual_inss) : servico.percentual_inss
                return inss && !isNaN(inss) ? `${inss}%` : "Não informado"
              })()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>Data de Cadastro:</strong>{" "}
              {servico.created_at
                ? new Date(servico.created_at).toLocaleDateString("pt-BR")
                : "Não informado"}
            </div>
            <div>
              <strong>Última Atualização:</strong>{" "}
              {servico.updated_at
                ? new Date(servico.updated_at).toLocaleDateString("pt-BR")
                : "Não informado"}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}