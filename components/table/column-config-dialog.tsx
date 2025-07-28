"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { GripVertical, Save, RotateCcw, Search, ChevronDown, ChevronRight } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { ColunaConfig } from "@/lib/types"

interface ColumnConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableColumns: ColunaConfig[]
  currentColumns: string[]
  onSave: (columns: string[], presetName?: string) => Promise<void>
  presetName?: string
  showPresetName?: boolean
}

// Categorizar as colunas para melhor organização
const categorizeColumns = (columns: ColunaConfig[]) => {
  const categories = {
    identificacao: {
      label: "Identificação",
      columns: columns.filter((col) =>
        ["id", "descricao", "referencia", "codigo_barras", "referencia_balanca"].includes(col.key),
      ),
    },
    precos: {
      label: "Preços e Custos",
      columns: columns.filter((col) =>
        [
          "valor_compra",
          "valor_custo",
          "valor_custo_final",
          "preco_venda",
          "preco_minimo",
          "preco_maximo",
          "preco_atacado",
        ].includes(col.key),
      ),
    },
    percentuais: {
      label: "Percentuais",
      columns: columns.filter((col) =>
        [
          "percentual_lucro",
          "percentual_frete",
          "percentual_despesas_operacionais",
          "percentual_marckup",
          "percentual_comissao",
          "limite_maximo_desconto",
        ].includes(col.key),
      ),
    },
    estoque: {
      label: "Estoque",
      columns: columns.filter((col) =>
        ["estoque_inicial", "estoque_minimo", "minimo_para_preco_atacado", "conversao_unitaria"].includes(col.key),
      ),
    },
    dimensoes: {
      label: "Dimensões e Peso",
      columns: columns.filter((col) =>
        ["largura_cm", "altura_cm", "comprimento_cm", "peso_liquido", "peso_bruto"].includes(col.key),
      ),
    },
    configuracoes: {
      label: "Configurações",
      columns: columns.filter((col) =>
        ["reajuste_automatico", "gerenciar_estoque", "alerta_vencimento", "envia_controle_pedidos"].includes(col.key),
      ),
    },
    canais: {
      label: "Canais de Venda",
      columns: columns.filter((col) => ["atribuir_delivery", "atribuir_ecommerce", "locacao"].includes(col.key)),
    },
    classificacao: {
      label: "Classificação",
      columns: columns.filter((col) => ["composto", "derivado_petroleo", "cest"].includes(col.key)),
    },
    outros: {
      label: "Outros",
      columns: columns.filter((col) =>
        ["lote_vencimento", "observacoes", "created_at", "updated_at", "inativo"].includes(col.key),
      ),
    },
    acoes: {
      label: "Ações",
      columns: columns.filter((col) => col.key === "actions"),
    },
  }

  return categories
}

export function ColumnConfigDialog({
  open,
  onOpenChange,
  availableColumns,
  currentColumns,
  onSave,
  presetName = "",
  showPresetName = false,
}: ColumnConfigDialogProps) {
  const { toast } = useToast()
  const [selectedColumns, setSelectedColumns] = useState<string[]>(currentColumns)
  const [orderedColumns, setOrderedColumns] = useState<string[]>(currentColumns)
  const [saving, setSaving] = useState(false)
  const [localPresetName, setLocalPresetName] = useState(presetName)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    identificacao: true,
    precos: true,
    percentuais: false,
    estoque: false,
    dimensoes: false,
    configuracoes: false,
    canais: false,
    classificacao: false,
    outros: false,
    acoes: true,
  })

  const categorizedColumns = categorizeColumns(availableColumns)

  useEffect(() => {
    setSelectedColumns(currentColumns)
    setOrderedColumns(currentColumns)
    setLocalPresetName(presetName)
  }, [currentColumns, presetName, open])

  const handleColumnToggle = (columnKey: string, checked: boolean) => {
    if (checked) {
      setSelectedColumns((prev) => [...prev, columnKey])
      setOrderedColumns((prev) => [...prev, columnKey])
    } else {
      setSelectedColumns((prev) => prev.filter((col) => col !== columnKey))
      setOrderedColumns((prev) => prev.filter((col) => col !== columnKey))
    }
  }

  const handleCategoryToggle = (categoryKey: string, checked: boolean) => {
    const categoryColumns = categorizedColumns[categoryKey as keyof typeof categorizedColumns].columns.map(
      (col) => col.key,
    )

    if (checked) {
      const newSelected = [...selectedColumns, ...categoryColumns.filter((col) => !selectedColumns.includes(col))]
      const newOrdered = [...orderedColumns, ...categoryColumns.filter((col) => !orderedColumns.includes(col))]
      setSelectedColumns(newSelected)
      setOrderedColumns(newOrdered)
    } else {
      setSelectedColumns((prev) => prev.filter((col) => !categoryColumns.includes(col)))
      setOrderedColumns((prev) => prev.filter((col) => !categoryColumns.includes(col)))
    }
  }

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(orderedColumns)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setOrderedColumns(items)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(orderedColumns, showPresetName ? localPresetName : undefined)
      toast({
        title: "Configuração salva",
        description: "As colunas foram configuradas com sucesso.",
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    const defaultColumns = availableColumns.filter((col) => col.key !== "actions").map((col) => col.key)
    setSelectedColumns(defaultColumns)
    setOrderedColumns(defaultColumns)
  }

  const getColumnLabel = (key: string) => {
    return availableColumns.find((col) => col.key === key)?.label || key
  }

  const filteredCategories = Object.entries(categorizedColumns)
    .map(([key, category]) => ({
      key,
      ...category,
      columns: category.columns.filter(
        (col) =>
          col.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          col.key.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    }))
    .filter((category) => category.columns.length > 0)

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryKey]: !prev[categoryKey],
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Colunas</DialogTitle>
          <DialogDescription>Selecione quais colunas exibir e arraste para reordenar.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {showPresetName && (
            <div className="space-y-2">
              <Label htmlFor="preset-name">Nome do Preset</Label>
              <Input
                id="preset-name"
                value={localPresetName}
                onChange={(e) => setLocalPresetName(e.target.value)}
                placeholder="Digite um nome para este preset"
              />
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Colunas Disponíveis</h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar colunas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Resetar
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="text-sm text-muted-foreground">Selecionar Colunas por Categoria</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto border rounded-md p-3">
                  {filteredCategories.map((category) => {
                    const categoryColumns = category.columns.map((col) => col.key)
                    const selectedInCategory = categoryColumns.filter((col) => selectedColumns.includes(col))
                    const isAllSelected =
                      categoryColumns.length > 0 && selectedInCategory.length === categoryColumns.length
                    const isPartialSelected =
                      selectedInCategory.length > 0 && selectedInCategory.length < categoryColumns.length

                    return (
                      <Collapsible
                        key={category.key}
                        open={expandedCategories[category.key]}
                        onOpenChange={() => toggleCategory(category.key)}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`category-${category.key}`}
                                checked={isAllSelected}
                                ref={(el) => {
                                  if (el) el.indeterminate = isPartialSelected
                                }}
                                onCheckedChange={(checked) => handleCategoryToggle(category.key, checked as boolean)}
                              />
                              <Label htmlFor={`category-${category.key}`} className="text-sm font-medium">
                                {category.label} ({selectedInCategory.length}/{categoryColumns.length})
                              </Label>
                            </div>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                {expandedCategories[category.key] ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                          </div>

                          <CollapsibleContent className="space-y-1 ml-6">
                            {category.columns.map((column) => (
                              <div key={column.key} className="flex items-center space-x-2">
                                <Checkbox
                                  id={column.key}
                                  checked={selectedColumns.includes(column.key)}
                                  onCheckedChange={(checked) => handleColumnToggle(column.key, checked as boolean)}
                                />
                                <Label htmlFor={column.key} className="text-sm">
                                  {column.label}
                                </Label>
                              </div>
                            ))}
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm text-muted-foreground">
                  Ordem das Colunas ({orderedColumns.length} selecionadas)
                </h4>
                <div className="border rounded-md p-3 max-h-96 overflow-y-auto">
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="columns">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-1">
                          {orderedColumns.map((columnKey, index) => (
                            <Draggable key={columnKey} draggableId={columnKey} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`flex items-center space-x-2 p-2 rounded border bg-background ${
                                    snapshot.isDragging ? "shadow-md" : ""
                                  }`}
                                >
                                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm flex-1">{getColumnLabel(columnKey)}</span>
                                  <span className="text-xs text-muted-foreground">#{index + 1}</span>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || orderedColumns.length === 0}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Salvando..." : "Salvar Configuração"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
