import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata um valor numérico para o formato de moeda brasileira (R$ 1.234,56)
 * @param value Valor a ser formatado
 * @returns String formatada no padrão brasileiro
 */
export function formatCurrency(value: number | string | null | undefined): string {
  // Verificar se o valor é nulo ou indefinido
  if (value === null || value === undefined) return "R$ 0,00"

  // Converter para número se for string
  let numValue: number
  try {
    numValue = typeof value === "string" ? Number.parseFloat(value) : value
  } catch (error) {
    console.error("Erro ao converter valor para número:", error)
    return "R$ 0,00"
  }

  // Verificar se é um número válido
  if (isNaN(numValue)) return "R$ 0,00"

  // Formatar usando o padrão brasileiro
  try {
    return numValue.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  } catch (error) {
    console.error("Erro ao formatar valor monetário:", error)
    return `R$ ${numValue.toFixed(2).replace(".", ",")}`
  }
}
