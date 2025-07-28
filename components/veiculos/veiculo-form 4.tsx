"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getToken, isAuthenticated } from "@/lib/auth"
import { getVeiculo, createVeiculo, updateVeiculo, getMarcasVeiculos, getModelosVeiculos } from "@/lib/api"
import type { Veiculo, MarcaVeiculo, ModeloVeiculo } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Save, Car } from "lucide-react"

interface VeiculoFormProps {
  params: {
    slug: string
    action: string
  }
}

export default function VeiculoForm({ params }: VeiculoFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [veiculo, setVeiculo] = useState<Veiculo>({
    placa: "",
    cor: "",
    modelos_veiculos_id: 0,
    ano_veiculo: new Date().getFullYear(),
  })

  // Estados para marcas e modelos
  const [marcas, setMarcas] = useState<MarcaVeiculo[]>([])
  const [modelos, setModelos] = useState<ModeloVeiculo[]>([])
  const [selectedMarcaId, setSelectedMarcaId] = useState<number | null>(null)
  const [loadingMarcas, setLoadingMarcas] = useState(true)
  const [loadingModelos, setLoadingModelos] = useState(false)

  const isEditing = params.action !== "novo" && !isNaN(Number(params.action))
  const veiculoId = isEditing ? Number(params.action) : null

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      if (!isAuthenticated()) {
        router.push(`/${params.slug}/login`)
        return
      }

      // Carregar marcas primeiro
      await fetchMarcas()

      if (params.action === "novo") {
        setLoading(false)
      } else if (isEditing && veiculoId) {
        try {
          await fetchVeiculo(veiculoId)
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
      } else {
        setLoading(false)
      }
    }

    checkAuthAndFetchData()
  }, [params.action, isEditing, veiculoId, toast, router, params.slug])

  // Efeito para carregar todos os modelos inicialmente
  useEffect(() => {
    if (marcas.length > 0) {
      fetchTodosModelos()
    }
  }, [marcas])

  // Efeito para sincronizar marca quando um modelo é selecionado
  useEffect(() => {
    if (veiculo.modelos_veiculos_id > 0 && modelos.length > 0) {
      const modeloSelecionado = modelos.find(m => m.id === veiculo.modelos_veiculos_id)
      if (modeloSelecionado) {
        // Sempre atualiza a marca quando um modelo é selecionado
        setSelectedMarcaId(modeloSelecionado.marca_veiculo_id)
      }
    } else if (veiculo.modelos_veiculos_id === 0) {
      // Se modelo foi limpo, não limpar a marca (permite selecionar marca primeiro)
    }
  }, [veiculo.modelos_veiculos_id, modelos])

  const fetchMarcas = async () => {
    setLoadingMarcas(true)
    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      const data = await getMarcasVeiculos(token)
      setMarcas(data)
    } catch (error) {
      console.error("Erro ao buscar marcas:", error)
      toast({
        variant: "destructive",
        title: "Erro ao carregar marcas",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    } finally {
      setLoadingMarcas(false)
    }
  }

  const fetchTodosModelos = async () => {
    setLoadingModelos(true)
    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      // Buscar todos os modelos (sem filtro de marca)
      const data = await getModelosVeiculos(token)
      setModelos(data)
    } catch (error) {
      console.error("Erro ao buscar modelos:", error)
      toast({
        variant: "destructive",
        title: "Erro ao carregar modelos",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    } finally {
      setLoadingModelos(false)
    }
  }

  const fetchVeiculo = async (id: number) => {
    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      const data = await getVeiculo(id, token)
      setVeiculo(data)

      // Se o veículo tem um modelo, buscar a marca correspondente
      if (data.modelo?.marca?.id) {
        setSelectedMarcaId(data.modelo.marca.id)
      }

      toast({
        title: "Veículo carregado com sucesso",
        description: `Veículo de placa "${data.placa}" carregado.`,
      })
    } catch (error) {
      console.error("Erro ao buscar veículo:", error)
      throw error
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name === "ano_veiculo") {
      setVeiculo({
        ...veiculo,
        [name]: value === "" ? undefined : Number(value),
      })
    } else {
      setVeiculo({
        ...veiculo,
        [name]: value,
      })
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setVeiculo({
      ...veiculo,
      [name]: Number(value),
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

      let savedVeiculo: Veiculo

      if (isEditing && veiculoId) {
        // Update existing vehicle
        savedVeiculo = await updateVeiculo(veiculoId, veiculo, token)
        toast({
          title: "Veículo atualizado com sucesso",
          description: `O veículo de placa "${savedVeiculo.placa}" foi atualizado.`,
        })
      } else {
        // Create new vehicle
        savedVeiculo = await createVeiculo(veiculo, token)
        toast({
          title: "Veículo criado com sucesso",
          description: `O veículo de placa "${savedVeiculo.placa}" foi criado.`,
        })
      }

      // Redirect to vehicles list
      router.push(`/${params.slug}/dashboard/veiculos`)
    } catch (error) {
      console.error("Erro ao salvar veículo:", error)
      toast({
        variant: "destructive",
        title: "Erro ao salvar veículo",
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

  // Find the selected model and marca
  const selectedModel = modelos.find(m => m.id === veiculo.modelos_veiculos_id)
  const selectedMarca = marcas.find(m => m.id === selectedMarcaId)
  
  // Filter models based on selected marca (for display)
  const modelosFiltrados = selectedMarcaId 
    ? modelos.filter(m => m.marca_veiculo_id === selectedMarcaId)
    : modelos

  // Handler para mudança de marca (manual)
  const handleMarcaChange = (marcaId: string) => {
    const newMarcaId = Number(marcaId)
    setSelectedMarcaId(newMarcaId)
    
    // Se há um modelo selecionado, verificar se pertence à nova marca
    if (veiculo.modelos_veiculos_id > 0) {
      const modeloAtual = modelos.find(m => m.id === veiculo.modelos_veiculos_id)
      if (modeloAtual && modeloAtual.marca_veiculo_id !== newMarcaId) {
        // Limpar modelo se não pertencer à nova marca
        setVeiculo(prev => ({ ...prev, modelos_veiculos_id: 0 }))
      }
    }
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
          <h1 className="text-2xl font-bold">
            {isEditing ? `Editar Veículo: ${veiculo.placa}` : "Novo Veículo"}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="placa">Placa</Label>
                  <Input
                    id="placa"
                    name="placa"
                    value={veiculo.placa || ""}
                    onChange={handleInputChange}
                    placeholder="Ex: ABC-1234"
                  />
                </div>

                <div>
                  <Label htmlFor="cor">Cor</Label>
                  <Input
                    id="cor"
                    name="cor"
                    value={veiculo.cor || ""}
                    onChange={handleInputChange}
                    placeholder="Ex: Branco, Preto, Azul"
                  />
                </div>

                <div>
                  <Label htmlFor="ano_veiculo">Ano do Veículo</Label>
                  <Input
                    id="ano_veiculo"
                    name="ano_veiculo"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    value={veiculo.ano_veiculo || ""}
                    onChange={handleInputChange}
                    placeholder="Ex: 2023"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="marca_veiculo">Marca do Veículo *</Label>
                  <Select
                    value={selectedMarcaId?.toString() || ""}
                    onValueChange={handleMarcaChange}
                    disabled={loadingMarcas}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingMarcas ? "Carregando marcas..." : "Selecione uma marca"} />
                    </SelectTrigger>
                    <SelectContent>
                      {marcas.map((marca) => (
                        <SelectItem key={marca.id} value={marca.id.toString()}>
                          {marca.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="modelos_veiculos_id">Modelo do Veículo *</Label>
                  <Select
                    value={veiculo.modelos_veiculos_id?.toString() || ""}
                    onValueChange={(value) => handleSelectChange("modelos_veiculos_id", value)}
                    disabled={loadingModelos || modelos.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue 
                        placeholder={
                          loadingModelos
                            ? "Carregando modelos..."
                            : modelos.length === 0
                              ? "Nenhum modelo disponível"
                              : "Selecione um modelo"
                        } 
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {modelosFiltrados.map((modelo) => {
                        const marca = marcas.find(m => m.id === modelo.marca_veiculo_id)
                        return (
                          <SelectItem key={modelo.id} value={modelo.id.toString()}>
                            {selectedMarcaId ? modelo.nome : `${marca?.nome} - ${modelo.nome}`}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  {selectedMarcaId && modelosFiltrados.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Mostrando {modelosFiltrados.length} modelo(s) para {selectedMarca?.nome}
                    </p>
                  )}
                  {!selectedMarcaId && modelos.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Mostrando todos os modelos. Selecione uma marca para filtrar.
                    </p>
                  )}
                </div>

                {(selectedMarca || selectedModel) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Seleção Atual</Label>
                      <div className="flex gap-1">
                        {selectedModel && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setVeiculo(prev => ({ ...prev, modelos_veiculos_id: 0 }))
                            }}
                            className="text-xs h-6"
                            title="Limpar apenas o modelo"
                          >
                            Limpar Modelo
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedMarcaId(null)
                            setVeiculo(prev => ({ ...prev, modelos_veiculos_id: 0 }))
                          }}
                          className="text-xs h-6"
                          title="Limpar marca e modelo"
                        >
                          Limpar Tudo
                        </Button>
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-sm">
                        <strong>Marca:</strong> {selectedMarca?.nome || "Não selecionada"}
                      </p>
                      <p className="text-sm">
                        <strong>Modelo:</strong> {selectedModel?.nome || "Não selecionado"}
                      </p>
                      {selectedModel && selectedMarca && (
                        <p className="text-xs text-muted-foreground mt-2">
                          💡 Dica: Selecione outro modelo para trocar a marca automaticamente
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}