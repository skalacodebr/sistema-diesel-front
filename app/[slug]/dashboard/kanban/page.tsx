"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getToken, isAuthenticated } from "@/lib/auth"
import { getOrdensServico } from "@/lib/api"
import type { OrdemServico } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Kanban, Plus, Calendar, User, DollarSign } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface KanbanPageProps {
  params: {
    slug: string
  }
}

interface KanbanColumn {
  id: string
  title: string
  color: string
  orders: OrdemServico[]
}

export default function KanbanPage({ params }: KanbanPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>([])

  // Kanban columns configuration
  const [columns, setColumns] = useState<KanbanColumn[]>([
    {
      id: "aguardando",
      title: "Aguardando",
      color: "bg-yellow-100 border-yellow-300",
      orders: []
    },
    {
      id: "em_andamento",
      title: "Em Andamento",
      color: "bg-blue-100 border-blue-300",
      orders: []
    },
    {
      id: "aguardando_pecas",
      title: "Aguardando Peças",
      color: "bg-orange-100 border-orange-300",
      orders: []
    },
    {
      id: "concluido",
      title: "Concluído",
      color: "bg-green-100 border-green-300",
      orders: []
    }
  ])

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      if (!isAuthenticated()) {
        router.push(`/${params.slug}/login`)
        return
      }

      await fetchOrdensServico()
    }

    checkAuthAndFetchData()
  }, [params.slug, router])

  const fetchOrdensServico = async () => {
    setLoading(true)
    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      const data = await getOrdensServico(token)
      const ordensArray = data.result?.data || data.data || data
      setOrdensServico(Array.isArray(ordensArray) ? ordensArray : [])

      // Distribute orders across columns (placeholder logic)
      distributeOrders(Array.isArray(ordensArray) ? ordensArray : [])
    } catch (error) {
      console.error("Erro ao buscar ordens de serviço:", error)
      toast({
        variant: "destructive",
        title: "Erro ao carregar ordens de serviço",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    } finally {
      setLoading(false)
    }
  }

  const distributeOrders = (orders: OrdemServico[]) => {
    // Placeholder logic for distributing orders
    // This should be replaced with actual status-based logic
    const updatedColumns = columns.map(column => ({
      ...column,
      orders: []
    }))

    orders.forEach((order, index) => {
      const columnIndex = index % 4
      updatedColumns[columnIndex].orders.push(order)
    })

    setColumns(updatedColumns)
  }

  const handleCardClick = (ordemId: number) => {
    router.push(`/${params.slug}/dashboard/ordens-servico/${ordemId}`)
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'concluido':
        return "bg-green-500"
      case 'em_andamento':
        return "bg-blue-500"
      case 'aguardando':
        return "bg-yellow-500"
      case 'aguardando_pecas':
        return "bg-orange-500"
      default:
        return "bg-gray-500"
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Carregando...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Kanban className="mr-2 h-6 w-6" />
          <h1 className="text-2xl font-bold">Kanban - Ordens de Serviço</h1>
        </div>
        <Button onClick={() => router.push(`/${params.slug}/dashboard/ordens-servico/novo`)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Ordem
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((column) => (
          <div key={column.id} className="space-y-4">
            {/* Column Header */}
            <div className={`p-4 rounded-lg border-2 ${column.color}`}>
              <div className="flex justify-between items-center">
                <h2 className="font-semibold text-lg">{column.title}</h2>
                <Badge variant="secondary" className="ml-2">
                  {column.orders.length}
                </Badge>
              </div>
            </div>

            {/* Column Cards */}
            <div className="space-y-3 min-h-[400px]">
              {column.orders.map((ordem) => (
                <Card 
                  key={ordem.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleCardClick(ordem.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-sm font-medium">
                        OS #{ordem.id}
                      </CardTitle>
                      <Badge 
                        className={`text-xs text-white ${getStatusBadgeColor(ordem.status)}`}
                      >
                        {ordem.status || 'Indefinido'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    <div className="text-sm text-gray-600">
                      <strong>Cliente:</strong>
                      <div className="truncate">
                        {ordem.cliente?.razao_social || ordem.cliente?.nome_fantasia || "N/A"}
                      </div>
                    </div>

                    {ordem.data_emissao && (
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="mr-1 h-3 w-3" />
                        {format(new Date(ordem.data_emissao), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    )}

                    {ordem.funcionarios && ordem.funcionarios.length > 0 && (
                      <div className="flex items-center text-xs text-gray-500">
                        <User className="mr-1 h-3 w-3" />
                        {ordem.funcionarios[0].funcionario?.nome || "N/A"}
                      </div>
                    )}

                    {ordem.valor_total && (
                      <div className="flex items-center text-xs text-green-600 font-medium">
                        <DollarSign className="mr-1 h-3 w-3" />
                        R$ {ordem.valor_total.toFixed(2)}
                      </div>
                    )}

                    {ordem.descricao && (
                      <div className="text-xs text-gray-500 line-clamp-2">
                        {ordem.descricao}
                      </div>
                    )}

                    {/* Services and Products count */}
                    <div className="flex justify-between text-xs text-gray-500 pt-2 border-t">
                      <span>
                        {ordem.servicos?.length || 0} serviço(s)
                      </span>
                      <span>
                        {ordem.produtos?.length || 0} produto(s)
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Empty state for columns */}
              {column.orders.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  <p className="text-sm">Nenhuma ordem nesta coluna</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}