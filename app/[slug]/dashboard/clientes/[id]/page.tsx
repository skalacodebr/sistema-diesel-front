"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getToken, isAuthenticated } from "@/lib/auth"
import { getCliente } from "@/lib/api"
import type { Cliente } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Edit, UserCheck, Check, X } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ClienteViewPageProps {
  params: {
    slug: string
    id: string
  }
}

export default function ClienteViewPage({ params }: ClienteViewPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(true)
  const clienteId = Number(params.id)

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      if (!isAuthenticated()) {
        router.push(`/${params.slug}/login`)
        return
      }

      await fetchCliente()
    }

    checkAuthAndFetchData()
  }, [params.slug, router])

  const fetchCliente = async () => {
    setLoading(true)
    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      const data = await getCliente(clienteId, token)
      setCliente(data)
    } catch (error) {
      console.error("Erro ao buscar cliente:", error)
      toast({
        variant: "destructive",
        title: "Erro ao carregar cliente",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    } finally {
      setLoading(false)
    }
  }

  const StatusIcon = ({ value }: { value: boolean | undefined }) => {
    return value ? (
      <Check className="h-4 w-4 text-green-600" />
    ) : (
      <X className="h-4 w-4 text-red-600" />
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Carregando...</p>
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${params.slug}/dashboard/clientes`)}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Cliente não encontrado</h1>
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
            onClick={() => router.push(`/${params.slug}/dashboard/clientes`)}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <UserCheck className="mr-2 h-6 w-6" />
          <h1 className="text-2xl font-bold">Detalhes do Cliente</h1>
        </div>
        <Button onClick={() => router.push(`/${params.slug}/dashboard/clientes/${cliente.id}/editar`)}>
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
              <strong>ID:</strong> {cliente.id}
            </div>
            <div>
              <strong>Razão Social:</strong> {cliente.razao_social || "Não informado"}
            </div>
            <div>
              <strong>Nome Fantasia:</strong> {cliente.nome_fantasia || "Não informado"}
            </div>
            <div>
              <strong>CPF/CNPJ:</strong> {cliente.cpf_cnpj || "Não informado"}
            </div>
            <div>
              <strong>Tipo de Pessoa:</strong> {cliente.tipo_pessoa?.nome || "Não informado"}
            </div>
            <div>
              <strong>Grupo de Cliente:</strong> {cliente.grupo_cliente?.nome || "Não informado"}
            </div>
            <div>
              <strong>Data de Nascimento:</strong>{" "}
              {cliente.data_nascimento
                ? format(new Date(cliente.data_nascimento), "dd/MM/yyyy", { locale: ptBR })
                : "Não informado"}
            </div>
            <div className="flex items-center gap-2">
              <strong>Consumidor Final:</strong>
              <StatusIcon value={cliente.consumidor_final} />
              <span>{cliente.consumidor_final ? "Sim" : "Não"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações Fiscais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>IE/RG:</strong> {cliente.ie_rg || "Não informado"}
            </div>
            <div>
              <strong>Indicador IE:</strong> {cliente.indicador_ie?.nome || "Não informado"}
            </div>
            <div>
              <strong>Inscrição Municipal:</strong> {cliente.inscricao_municipal || "Não informado"}
            </div>
            <div>
              <strong>Inscrição SUFRAMA:</strong> {cliente.inscricao_suframa || "Não informado"}
            </div>
            <div className="flex items-center gap-2">
              <strong>Contribuinte:</strong>
              <StatusIcon value={cliente.contribuinte} />
              <span>{cliente.contribuinte ? "Sim" : "Não"}</span>
            </div>
            <div className="flex items-center gap-2">
              <strong>Produtor Rural:</strong>
              <StatusIcon value={cliente.produtor_rural} />
              <span>{cliente.produtor_rural ? "Sim" : "Não"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Isenções Fiscais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <strong>Isento de ICMS:</strong>
              <StatusIcon value={cliente.isento_icms} />
              <span>{cliente.isento_icms ? "Sim" : "Não"}</span>
            </div>
            <div className="flex items-center gap-2">
              <strong>Isento de IPI:</strong>
              <StatusIcon value={cliente.isento_ipi} />
              <span>{cliente.isento_ipi ? "Sim" : "Não"}</span>
            </div>
            <div className="flex items-center gap-2">
              <strong>Isento de ISS:</strong>
              <StatusIcon value={cliente.isento_iss} />
              <span>{cliente.isento_iss ? "Sim" : "Não"}</span>
            </div>
            <div className="flex items-center gap-2">
              <strong>Isento de PIS:</strong>
              <StatusIcon value={cliente.isento_pis} />
              <span>{cliente.isento_pis ? "Sim" : "Não"}</span>
            </div>
            <div className="flex items-center gap-2">
              <strong>Isento de COFINS:</strong>
              <StatusIcon value={cliente.isento_cofins} />
              <span>{cliente.isento_cofins ? "Sim" : "Não"}</span>
            </div>
            <div className="flex items-center gap-2">
              <strong>Isento de II:</strong>
              <StatusIcon value={cliente.isento_ii} />
              <span>{cliente.isento_ii ? "Sim" : "Não"}</span>
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
              {cliente.created_at
                ? format(new Date(cliente.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                : "Não informado"}
            </div>
            <div>
              <strong>Última Atualização:</strong>{" "}
              {cliente.updated_at
                ? format(new Date(cliente.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                : "Não informado"}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}