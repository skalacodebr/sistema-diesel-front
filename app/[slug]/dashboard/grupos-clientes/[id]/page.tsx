"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getToken, isAuthenticated } from "@/lib/auth"
import { getGrupoCliente } from "@/lib/api"
import type { GrupoCliente } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Edit, Users } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface GrupoClienteViewPageProps {
  params: {
    slug: string
    id: string
  }
}

export default function GrupoClienteViewPage({ params }: GrupoClienteViewPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [grupoCliente, setGrupoCliente] = useState<GrupoCliente | null>(null)
  const [loading, setLoading] = useState(true)
  const grupoClienteId = Number(params.id)

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      if (!isAuthenticated()) {
        router.push(`/${params.slug}/login`)
        return
      }

      await fetchGrupoCliente()
    }

    checkAuthAndFetchData()
  }, [params.slug, router])

  const fetchGrupoCliente = async () => {
    setLoading(true)
    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      const data = await getGrupoCliente(grupoClienteId, token)
      setGrupoCliente(data)
    } catch (error) {
      console.error("Erro ao buscar grupo de cliente:", error)
      toast({
        variant: "destructive",
        title: "Erro ao carregar grupo de cliente",
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

  if (!grupoCliente) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${params.slug}/dashboard/grupos-clientes`)}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Grupo de cliente não encontrado</h1>
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
            onClick={() => router.push(`/${params.slug}/dashboard/grupos-clientes`)}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Users className="mr-2 h-6 w-6" />
          <h1 className="text-2xl font-bold">Detalhes do Grupo de Cliente</h1>
        </div>
        <Button onClick={() => router.push(`/${params.slug}/dashboard/grupos-clientes/${grupoCliente.id}/editar`)}>
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
              <strong>ID:</strong> {grupoCliente.id}
            </div>
            <div>
              <strong>Nome:</strong> {grupoCliente.nome}
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
              {grupoCliente.created_at
                ? format(new Date(grupoCliente.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                : "Não informado"}
            </div>
            <div>
              <strong>Última Atualização:</strong>{" "}
              {grupoCliente.updated_at
                ? format(new Date(grupoCliente.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                : "Não informado"}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}