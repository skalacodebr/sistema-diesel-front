import { getApiUrl } from "./api"
import { getToken } from "./auth"

// Define a common interface for list items
export interface ListItem {
  id: number
  nome?: string
  descricao?: string
  codigo?: string
  categoria_produtos_id?: number
  created_at?: string
  updated_at?: string
}

// Function to handle API responses consistently
const handleApiResponse = (data: any): ListItem[] => {
  if (Array.isArray(data)) {
    return data
  } else if (data && typeof data === "object" && Array.isArray(data.data)) {
    return data.data
  }
  return []
}

// Fetch functions that use the token from auth
export async function fetchCategorias(): Promise<ListItem[]> {
  try {
    const token = getToken()
    if (!token) {
      throw new Error("Token não encontrado")
    }

    const response = await fetch(getApiUrl("categorias-produtos"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return handleApiResponse(data)
  } catch (error) {
    console.error("Failed to fetch categorias:", error)
    return []
  }
}

export async function fetchSubcategorias(): Promise<ListItem[]> {
  try {
    const token = getToken()
    if (!token) {
      throw new Error("Token não encontrado")
    }

    const response = await fetch(getApiUrl("subcategorias-produtos"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return handleApiResponse(data)
  } catch (error) {
    console.error("Failed to fetch subcategorias:", error)
    return []
  }
}

export async function fetchMarcas(): Promise<ListItem[]> {
  try {
    const token = getToken()
    if (!token) {
      throw new Error("Token não encontrado")
    }

    const response = await fetch(getApiUrl("marcas-produtos"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return handleApiResponse(data)
  } catch (error) {
    console.error("Failed to fetch marcas:", error)
    return []
  }
}

export async function fetchCsosn(): Promise<ListItem[]> {
  try {
    const token = getToken()
    if (!token) {
      throw new Error("Token não encontrado")
    }

    const response = await fetch(getApiUrl("csosn"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return handleApiResponse(data)
  } catch (error) {
    console.error("Failed to fetch CSOSN:", error)
    return []
  }
}

export async function fetchCstPis(): Promise<ListItem[]> {
  try {
    const token = getToken()
    if (!token) {
      throw new Error("Token não encontrado")
    }

    const response = await fetch(getApiUrl("cst-pis"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return handleApiResponse(data)
  } catch (error) {
    console.error("Failed to fetch CST PIS:", error)
    return []
  }
}

export async function fetchCstCofins(): Promise<ListItem[]> {
  try {
    const token = getToken()
    if (!token) {
      throw new Error("Token não encontrado")
    }

    const response = await fetch(getApiUrl("cst-cofins"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return handleApiResponse(data)
  } catch (error) {
    console.error("Failed to fetch CST COFINS:", error)
    return []
  }
}

export async function fetchCstIpi(): Promise<ListItem[]> {
  try {
    const token = getToken()
    if (!token) {
      throw new Error("Token não encontrado")
    }

    const response = await fetch(getApiUrl("cst-ipi"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return handleApiResponse(data)
  } catch (error) {
    console.error("Failed to fetch CST IPI:", error)
    return []
  }
}

export async function fetchNcm(): Promise<ListItem[]> {
  try {
    const token = getToken()
    if (!token) {
      throw new Error("Token não encontrado")
    }

    const response = await fetch(getApiUrl("ncm"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return handleApiResponse(data)
  } catch (error) {
    console.error("Failed to fetch NCM:", error)
    return []
  }
}

export async function fetchOrigemProdutos(): Promise<ListItem[]> {
  try {
    const token = getToken()
    if (!token) {
      throw new Error("Token não encontrado")
    }

    const response = await fetch(getApiUrl("origem-produtos"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return handleApiResponse(data)
  } catch (error) {
    console.error("Failed to fetch origem produtos:", error)
    return []
  }
}

export async function fetchUnidadeCompraVenda(): Promise<ListItem[]> {
  try {
    const token = getToken()
    if (!token) {
      throw new Error("Token não encontrado")
    }

    const response = await fetch(getApiUrl("unidade-compra-venda"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return handleApiResponse(data)
  } catch (error) {
    console.error("Failed to fetch unidades compra venda:", error)
    return []
  }
}

export async function fetchSubcategoriasByCategoria(categoriaId: number): Promise<ListItem[]> {
  try {
    const token = getToken()
    if (!token) {
      throw new Error("Token não encontrado")
    }

    const response = await fetch(getApiUrl(`subcategorias-produtos?categoria_id=${categoriaId}`), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    // A API retorna dados paginados, então precisamos acessar data.data
    if (data && data.data && Array.isArray(data.data)) {
      return data.data.map((item: any) => ({
        id: item.id,
        nome: item.nome,
        descricao: item.nome, // usar nome como descrição
        categoria_produtos_id: item.categoria_id, // mapear categoria_id para categoria_produtos_id
        created_at: item.created_at,
        updated_at: item.updated_at,
      }))
    }
    return []
  } catch (error) {
    console.error("Failed to fetch subcategorias by categoria:", error)
    return []
  }
}

// Keep the original functions for backward compatibility
export async function getCategorias(token: string): Promise<ListItem[]> {
  try {
    const response = await fetch(getApiUrl("categorias-produtos"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return handleApiResponse(data)
  } catch (error) {
    console.error("Failed to fetch categorias:", error)
    throw error
  }
}

export async function getSubcategorias(token: string): Promise<ListItem[]> {
  try {
    const response = await fetch(getApiUrl("subcategorias-produtos"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return handleApiResponse(data)
  } catch (error) {
    console.error("Failed to fetch subcategorias:", error)
    throw error
  }
}

export async function getMarcas(token: string): Promise<ListItem[]> {
  try {
    const response = await fetch(getApiUrl("marcas-produtos"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return handleApiResponse(data)
  } catch (error) {
    console.error("Failed to fetch marcas:", error)
    throw error
  }
}

export async function getSubcategoriasByCategoria(categoriaId: number, token: string): Promise<ListItem[]> {
  try {
    const response = await fetch(getApiUrl(`subcategorias-produtos?categoria_id=${categoriaId}`), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    // A API retorna dados paginados, então precisamos acessar data.data
    if (data && data.data && Array.isArray(data.data)) {
      return data.data.map((item: any) => ({
        id: item.id,
        nome: item.nome,
        descricao: item.nome, // usar nome como descrição
        categoria_produtos_id: item.categoria_id, // mapear categoria_id para categoria_produtos_id
        created_at: item.created_at,
        updated_at: item.updated_at,
      }))
    }
    return []
  } catch (error) {
    console.error("Failed to fetch subcategorias by categoria:", error)
    throw error
  }
}
