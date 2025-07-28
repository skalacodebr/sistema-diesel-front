"use client"

import { useState, useEffect } from "react"
import { getToken, getUser } from "@/lib/auth"
import { getPresetByUserAndEntity, createPreset, updatePreset } from "@/lib/api-presets"
import type { PresetUsuario, ColunaConfig } from "@/lib/types"

interface UseTablePresetsProps {
  entityName: string
  defaultColumns: string[]
  availableColumns: ColunaConfig[]
}

export function useTablePresets({ entityName, defaultColumns, availableColumns }: UseTablePresetsProps) {
  const [currentPreset, setCurrentPreset] = useState<PresetUsuario | null>(null)
  const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserPreset()
  }, [entityName])

  const loadUserPreset = async () => {
    setLoading(true)
    try {
      const token = getToken()
      const user = getUser()

      if (!token || !user) {
        setVisibleColumns(defaultColumns)
        setLoading(false)
        return
      }

      const preset = await getPresetByUserAndEntity(user.id, entityName, token)

      if (preset) {
        setCurrentPreset(preset)
        // Validar se as colunas do preset ainda existem
        const validColumns = preset.colunas_visiveis.filter((col) =>
          availableColumns.some((availableCol) => availableCol.key === col),
        )
        setVisibleColumns(validColumns.length > 0 ? validColumns : defaultColumns)
      } else {
        setVisibleColumns(defaultColumns)
      }
    } catch (error) {
      console.error("Erro ao carregar preset do usuário:", error)
      setVisibleColumns(defaultColumns)
    } finally {
      setLoading(false)
    }
  }

  const savePreset = async (columns: string[], presetName?: string) => {
    const token = getToken()
    const user = getUser()

    if (!token || !user) {
      throw new Error("Usuário não autenticado")
    }

    const presetData: PresetUsuario = {
      usuarios_id: user.id,
      nome_entidade: entityName,
      colunas_visiveis: columns,
    }

    try {
      let savedPreset: PresetUsuario

      if (currentPreset) {
        // Atualizar preset existente
        savedPreset = await updatePreset(currentPreset.id!, presetData, token)
      } else {
        // Criar novo preset
        savedPreset = await createPreset(presetData, token)
      }

      setCurrentPreset(savedPreset)
      setVisibleColumns(columns)
    } catch (error) {
      console.error("Erro ao salvar preset:", error)
      throw error
    }
  }

  const resetToDefault = async () => {
    setVisibleColumns(defaultColumns)

    if (currentPreset) {
      try {
        await savePreset(defaultColumns)
      } catch (error) {
        console.error("Erro ao resetar preset:", error)
      }
    }
  }

  return {
    visibleColumns,
    currentPreset,
    loading,
    savePreset,
    resetToDefault,
    refreshPreset: loadUserPreset,
  }
}
