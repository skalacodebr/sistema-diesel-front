"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getToken, isAuthenticated } from "@/lib/auth"
import { getGrupoCliente, createGrupoCliente, updateGrupoCliente } from "@/lib/api"
import type { GrupoCliente } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Save, Users } from "lucide-react"

interface GrupoClienteFormProps {
  params: {
    slug: string
    action: string
  }
}

export default function GrupoClienteForm({ params }: GrupoClienteFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [grupoCliente, setGrupoCliente] = useState<GrupoCliente>({
    nome: "",
  })

  const isEditing = params.action !== "novo" && !isNaN(Number(params.action))
  const grupoClienteId = isEditing ? Number(params.action) : null

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      if (!isAuthenticated()) {
        router.push(`/${params.slug}/login`)
        return
      }

      if (params.action === "novo") {
        setLoading(false)
      } else if (isEditing && grupoClienteId) {
        try {
          await fetchGrupoCliente(grupoClienteId)
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
      } else {
        setLoading(false)
      }
    }

    checkAuthAndFetchData()
  }, [params.action, isEditing, grupoClienteId, toast, router, params.slug])

  const fetchGrupoCliente = async (id: number) => {
    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      const data = await getGrupoCliente(id, token)
      setGrupoCliente(data)

      toast({
        title: "Grupo de cliente carregado com sucesso",
        description: `Grupo "${data.nome}" carregado.`,
      })
    } catch (error) {
      console.error("Erro ao buscar grupo de cliente:", error)
      throw error
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setGrupoCliente({
      ...grupoCliente,
      [name]: value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      // Validação simples
      if (!grupoCliente.nome.trim()) {
        throw new Error("O nome do grupo é obrigatório")
      }

      let savedGrupoCliente: GrupoCliente

      if (isEditing && grupoClienteId) {
        // Update existing group
        savedGrupoCliente = await updateGrupoCliente(grupoClienteId, grupoCliente, token)
        toast({
          title: "Grupo de cliente atualizado com sucesso",
          description: `O grupo "${savedGrupoCliente.nome}" foi atualizado.`,
        })
      } else {
        // Create new group
        savedGrupoCliente = await createGrupoCliente(grupoCliente, token)
        toast({
          title: "Grupo de cliente criado com sucesso",
          description: `O grupo "${savedGrupoCliente.nome}" foi criado.`,
        })
      }

      // Redirect to groups list
      router.push(`/${params.slug}/dashboard/grupos-clientes`)
    } catch (error) {
      console.error("Erro ao salvar grupo de cliente:", error)
      toast({
        variant: "destructive",
        title: "Erro ao salvar grupo de cliente",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    } finally {
      setSaving(false)
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${params.slug}/dashboard/grupos-clientes`)}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Users className="mr-2 h-6 w-6" />
          <h1 className="text-2xl font-bold">
            {isEditing ? `Editar Grupo: ${grupoCliente.nome}` : "Novo Grupo de Cliente"}
          </h1>
        </div>
        <Button onClick={handleSubmit} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-6 max-w-xl">
              <div>
                <Label htmlFor="nome">Nome do Grupo *</Label>
                <Input
                  id="nome"
                  name="nome"
                  value={grupoCliente.nome}
                  onChange={handleInputChange}
                  placeholder="Ex: VIP, Regular, Premium"
                  maxLength={100}
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Digite um nome descritivo para o grupo de clientes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}