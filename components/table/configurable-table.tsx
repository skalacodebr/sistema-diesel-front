"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { ColumnConfigDialog } from "./column-config-dialog"
import { Settings2 } from "lucide-react"
import type { ColunaConfig } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ConfigurableTableProps<T> {
  data: T[]
  columns: ColunaConfig[]
  visibleColumns: string[]
  onSaveColumns: (columns: string[]) => Promise<void>
  renderCell: (item: T, columnKey: string) => React.ReactNode
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  loading?: boolean
  emptyMessage?: string
}

export function ConfigurableTable<T extends Record<string, any>>({
  data,
  columns,
  visibleColumns,
  onSaveColumns,
  renderCell,
  currentPage,
  totalPages,
  onPageChange,
  loading = false,
  emptyMessage = "Nenhum registro encontrado.",
}: ConfigurableTableProps<T>) {
  const [configDialogOpen, setConfigDialogOpen] = useState(false)

  // Filtrar e ordenar colunas baseado na configuração do usuário
  const orderedColumns = visibleColumns
    .map((key) => columns.find((col) => col.key === key))
    .filter(Boolean) as ColunaConfig[]

  // Sempre adicionar a coluna de ações no final se ela existir
  const actionsColumn = columns.find((col) => col.key === "actions")
  if (actionsColumn && !orderedColumns.find((col) => col.key === "actions")) {
    orderedColumns.push(actionsColumn)
  }

  const formatCellValue = (value: any, type: ColunaConfig["type"]) => {
    if (value === null || value === undefined) return "-"

    switch (type) {
      case "currency":
        return formatCurrency(Number(value) || 0)
      case "date":
        try {
          return format(new Date(value), "dd/MM/yyyy", { locale: ptBR })
        } catch {
          return value
        }
      case "number":
        return Number(value).toLocaleString("pt-BR")
      case "status":
        return value
      default:
        return value
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
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setConfigDialogOpen(true)} className="gap-2">
          <Settings2 className="h-4 w-4" />
          Configurar Colunas
        </Button>
      </div>

      {data.length === 0 ? (
        <div className="text-center p-8 border rounded-lg">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  {orderedColumns.map((column) => (
                    <TableHead
                      key={column.key}
                      className={
                        column.type === "number" || column.type === "currency"
                          ? "text-right"
                          : column.type === "actions"
                            ? "text-center"
                            : ""
                      }
                      style={column.width ? { width: column.width } : undefined}
                    >
                      {column.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, index) => (
                  <TableRow key={item.id || index}>
                    {orderedColumns.map((column) => (
                      <TableCell
                        key={column.key}
                        className={
                          column.type === "number" || column.type === "currency"
                            ? "text-right"
                            : column.type === "actions"
                              ? "text-center"
                              : ""
                        }
                      >
                        {column.key === "actions"
                          ? renderCell(item, column.key)
                          : formatCellValue(renderCell(item, column.key), column.type)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }).map((_, index) => (
                  <PaginationItem key={index}>
                    <PaginationLink onClick={() => onPageChange(index + 1)} isActive={currentPage === index + 1}>
                      {index + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

      <ColumnConfigDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        availableColumns={columns}
        currentColumns={visibleColumns}
        onSave={onSaveColumns}
      />
    </div>
  )
}
