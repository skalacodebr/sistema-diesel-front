"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getToken, isAuthenticated } from "@/lib/auth"
import { getVeiculo } from "@/lib/api"
import type { Veiculo } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Edit, Car } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface VeiculoViewPageProps {
  params: {
    slug: string
    id: string
  }
}

export default function VeiculoViewPage({ params }: VeiculoViewPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [veiculo, setVeiculo] = useState<Veiculo | null>(null)
  const [loading, setLoading] = useState(true)
  const veiculoId = Number(params.id)

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      if (!isAuthenticated()) {
        router.push(`/${params.slug}/login`)
        return
      }

      await fetchVeiculo()
    }

    checkAuthAndFetchData()
  }, [params.slug, router])

  const fetchVeiculo = async () => {
    setLoading(true)
    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      const data = await getVeiculo(veiculoId, token)
      setVeiculo(data)
    } catch (error) {
      console.error("Erro ao buscar veículo:", error)
      toast({
        variant: "destructive",
        title: "Erro ao carregar veículo",
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

  if (!veiculo) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${params.slug}/dashboard/veiculos`)}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Veículo não encontrado</h1>
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
            onClick={() => router.push(`/${params.slug}/dashboard/veiculos`)}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Car className="mr-2 h-6 w-6" />
          <h1 className="text-2xl font-bold">Detalhes do Veículo</h1>
        </div>
        <Button onClick={() => router.push(`/${params.slug}/dashboard/veiculos/${veiculo.id}/editar`)}>
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
              <strong>ID:</strong> {veiculo.id}
            </div>
            <div>
              <strong>Placa:</strong> {veiculo.placa || "Não informado"}
            </div>
            <div>
              <strong>Cor:</strong> {veiculo.cor || "Não informado"}
            </div>
            <div>
              <strong>Ano:</strong> {veiculo.ano_veiculo || "Não informado"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modelo e Marca</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>Marca:</strong> {veiculo.modelo?.marca?.nome || "Não informado"}
            </div>
            <div>
              <strong>Modelo:</strong> {veiculo.modelo?.nome || "Não informado"}
            </div>
            <div>
              <strong>ID do Modelo:</strong> {veiculo.modelos_veiculos_id}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Informações do Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>Data de Cadastro:</strong>{" "}
              {veiculo.created_at
                ? format(new Date(veiculo.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                : "Não informado"}
            </div>
            <div>
              <strong>Última Atualização:</strong>{" "}
              {veiculo.updated_at
                ? format(new Date(veiculo.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                : "Não informado"}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}