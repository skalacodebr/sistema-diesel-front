import type { PresetUsuario } from "./types"
import { getApiUrl } from "./api"

// Presets de Usuário API

export async function getPresets(token: string): Promise<PresetUsuario[]> {
  try {
    const response = await fetch(getApiUrl("presets-usuarios"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()

    // Handle different response formats
    if (Array.isArray(data)) {
      return data
    } else if (data && typeof data === "object" && Array.isArray(data.data)) {
      return data.data
    }

    return []
  } catch (error) {
    console.error("Failed to fetch presets:", error)
    throw error
  }
}

export async function getPreset(id: number, token: string): Promise<PresetUsuario> {
  try {
    const response = await fetch(getApiUrl(`presets-usuarios/${id}`), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    return response.json()
  } catch (error) {
    console.error(`Failed to fetch preset ${id}:`, error)
    throw error
  }
}

export async function createPreset(preset: PresetUsuario, token: string): Promise<PresetUsuario> {
  try {
    console.log("=== DADOS ENVIADOS PARA A API (createPreset) ===")
    console.log("URL:", getApiUrl("presets-usuarios"))
    console.log("Payload JSON:", JSON.stringify(preset, null, 2))

    const response = await fetch(getApiUrl("presets-usuarios"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(preset),
    })

    if (!response.ok) {
      let errorMessage = `Falha ao criar preset: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        try {
          const errorText = await response.text()
          errorMessage = `Falha ao criar preset: ${errorText.substring(0, 200)}...`
        } catch (textError) {
          // Use default message
        }
      }
      throw new Error(errorMessage)
    }

    const responseData = await response.json()
    console.log("=== RESPOSTA DA API (createPreset) ===")
    console.log("Status:", response.status)
    console.log("Dados:", JSON.stringify(responseData, null, 2))

    return responseData
  } catch (error) {
    console.error("Failed to create preset:", error)
    throw error
  }
}

export async function updatePreset(id: number, preset: PresetUsuario, token: string): Promise<PresetUsuario> {
  try {
    console.log("=== DADOS ENVIADOS PARA A API (updatePreset) ===")
    console.log("URL:", getApiUrl(`presets-usuarios/${id}`))
    console.log("Payload JSON:", JSON.stringify(preset, null, 2))

    const response = await fetch(getApiUrl(`presets-usuarios/${id}`), {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(preset),
    })

    if (!response.ok) {
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Falha ao atualizar preset: ${response.status}`)
      } else {
        const text = await response.text()
        console.error(`API returned non-JSON response: ${text.substring(0, 200)}...`)
        throw new Error(`Falha ao atualizar preset. Status: ${response.status}`)
      }
    }

    const responseData = await response.json()
    console.log("=== RESPOSTA DA API (updatePreset) ===")
    console.log("Status:", response.status)
    console.log("Dados:", JSON.stringify(responseData, null, 2))

    return responseData
  } catch (error) {
    console.error(`Failed to update preset ${id}:`, error)
    throw error
  }
}

export async function deletePreset(id: number, token: string): Promise<void> {
  try {
    console.log(`Enviando requisição DELETE para preset ${id}`)

    const response = await fetch(getApiUrl(`presets-usuarios/${id}`), {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      let errorMessage = `Falha ao excluir preset: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        // Use default message
      }
      throw new Error(errorMessage)
    }

    console.log(`Preset ${id} excluído com sucesso`)
  } catch (error) {
    console.error(`Failed to delete preset ${id}:`, error)
    throw error
  }
}

// Função para buscar preset por usuário e entidade
export async function getPresetByUserAndEntity(
  usuarioId: number,
  nomeEntidade: string,
  token: string,
): Promise<PresetUsuario | null> {
  try {
    const presets = await getPresets(token)
    return presets.find((p) => p.usuarios_id === usuarioId && p.nome_entidade === nomeEntidade) || null
  } catch (error) {
    console.error("Failed to fetch preset by user and entity:", error)
    return null
  }
}
