import type { EmpresaMae, LoginCredentials, LoginResponse, Produto, AliquotaProduto } from "./types"
import { getEmpresaId } from "./auth"

const API_BASE_URL = "https://sistema-diesel-2025-main-vv6tyd.laravel.cloud/api"

// CORS bypass proxy for local development
export const getApiUrl = (endpoint: string) => {
  // In a production environment, you would use the direct API URL
  // This is just for local development to bypass CORS
  if (typeof window !== "undefined") {
    return `/api/${endpoint}`
  }
  return `${API_BASE_URL}/${endpoint}`
}

// Replace the entire getEmpresaBySlug function with this implementation
// that doesn't use any mock data
export async function getEmpresaBySlug(slug: string): Promise<EmpresaMae | null> {
  try {
    const response = await fetch(getApiUrl(`empresas-mae`), {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    // Get the raw response data
    const data = await response.json()

    // Log the response to understand its structure
    console.log("API response:", JSON.stringify(data).substring(0, 200) + "...")

    // Check if the response is an array
    let empresas: EmpresaMae[] = []

    if (Array.isArray(data)) {
      // If it's already an array, use it directly
      empresas = data
    } else if (data && typeof data === "object") {
      // If it has a data property that's an array
      if (Array.isArray(data.data)) {
        empresas = data.data
      } else {
        // If it's an object but not in the expected format, convert it to an array if it looks like a company
        if (data.id && data.slug) {
          empresas = [data]
        } else {
          // Try to extract values if it's an object with company objects as values
          empresas = Object.values(data).filter(
            (item) => item && typeof item === "object" && "id" in item && "slug" in item,
          ) as EmpresaMae[]
        }
      }
    }

    // Now find the company with the matching slug
    const empresa = empresas.find((empresa) => empresa && empresa.slug === slug)
    return empresa || null
  } catch (error) {
    console.error("Failed to fetch empresa:", error)
    throw error
  }
}

// Substitua a função loginUser por esta implementação melhorada
export async function loginUser(credentials: LoginCredentials): Promise<LoginResponse> {
  try {
    const response = await fetch(getApiUrl("login"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: credentials.email,
        senha: credentials.senha,
        empresa_mae_id: credentials.empresa_mae_id,
      }),
    })

    if (!response.ok) {
      // Verificar se a resposta é JSON
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Falha na autenticação: ${response.status}`)
      } else {
        // Se não for JSON, mostrar um erro genérico
        const text = await response.text()
        console.error(`API returned non-JSON response: ${text.substring(0, 200)}...`)
        throw new Error(`Falha na autenticação. Status: ${response.status}`)
      }
    }

    return response.json()
  } catch (error) {
    console.error("Login error:", error)
    throw error
  }
}

// Produtos API

// Modificar a função getProdutos para garantir que apenas produtos da empresa atual sejam retornados
// e tratar corretamente produtos com empresa_mae_id NULL

// Modificar a função getProdutos para usar a função getEmpresaId do lib/auth
export async function getProdutos(token: string): Promise<Produto[]> {
  try {
    // Usar a função getEmpresaId do lib/auth
    const empresaId = getEmpresaId()

    if (!empresaId) {
      console.error("ID da empresa não encontrado")
      throw new Error("ID da empresa não encontrado. Verifique se você está logado corretamente.")
    }

    // Construir a URL com o parâmetro empresa_mae_id
    const url = getApiUrl(`produtos?empresa_mae_id=${empresaId}`)

    console.log(`Buscando produtos para empresa_mae_id=${empresaId}`)

    const response = await fetch(url, {
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
    let produtos: Produto[] = []
    if (Array.isArray(data)) {
      produtos = data
    } else if (data && typeof data === "object" && Array.isArray(data.data)) {
      produtos = data.data
    }

    // Filtrar produtos no frontend para garantir que apenas produtos da empresa atual sejam retornados
    // Isso é uma camada extra de segurança caso o backend não filtre corretamente
    return produtos.filter((produto) => {
      // Se o produto não tiver empresa_mae_id, não mostrar
      if (!produto.empresa_mae_id) {
        console.warn(`Produto ${produto.id} (${produto.descricao}) não tem empresa_mae_id definido`)
        return false
      }
      return produto.empresa_mae_id === empresaId
    })
  } catch (error) {
    console.error("Failed to fetch produtos:", error)
    throw error
  }
}

// Modifique a função createProduto para incluir o empresa_mae_id
// Substitua a função createProduto atual por esta versão melhorada:
export async function createProduto(produto: Produto, token: string): Promise<Produto> {
  try {
    // Obter o ID da empresa do usuário logado
    const empresaId = getEmpresaId()

    if (!empresaId) {
      throw new Error("ID da empresa não encontrado. Verifique se você está logado corretamente.")
    }

    // Criar um novo objeto para garantir que o empresa_mae_id seja incluído
    const produtoData = {
      ...produto,
      empresa_mae_id: Number(empresaId), // Garantir que seja um número
    }

    // Log detalhado do objeto que será enviado
    console.log("=== DADOS ENVIADOS PARA A API (createProduto) ===")
    console.log("URL:", getApiUrl("produtos"))
    console.log("Método:", "POST")
    console.log("Headers:", {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token.substring(0, 15)}...`, // Mostrar apenas parte do token por segurança
    })
    console.log("Payload JSON:", JSON.stringify(produtoData, null, 2))
    console.log("empresa_mae_id:", produtoData.empresa_mae_id, "- Tipo:", typeof produtoData.empresa_mae_id)
    console.log("=== FIM DOS DADOS ENVIADOS ===")

    const response = await fetch(getApiUrl("produtos"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(produtoData),
    })

    if (!response.ok) {
      // Tentar obter detalhes do erro
      let errorMessage = `Falha ao criar produto: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        // Se não conseguir obter JSON, tenta obter o texto da resposta
        try {
          const errorText = await response.text()
          errorMessage = `Falha ao criar produto: ${errorText.substring(0, 200)}...`
        } catch (textError) {
          // Se não conseguir obter o texto, usa a mensagem padrão
        }
      }

      throw new Error(errorMessage)
    }

    const responseData = await response.json()
    console.log("=== RESPOSTA DA API ===")
    console.log("Status:", response.status)
    console.log("Dados:", JSON.stringify(responseData, null, 2))
    console.log("=== FIM DA RESPOSTA ===")

    return responseData
  } catch (error) {
    console.error("Failed to create produto:", error)
    throw error
  }
}

// Substitua a função getProduto atual por esta versão melhorada
export async function getProduto(id: number, token: string): Promise<Produto> {
  try {
    console.log(`Buscando produto com ID ${id}`)

    // Adicionar parâmetro para incluir alíquotas
    const response = await fetch(getApiUrl(`produtos/${id}?include=aliquotas`), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    console.log(`Produto recebido:`, JSON.stringify(data).substring(0, 200) + "...")

    // Verificar se as alíquotas estão presentes
    if (data && !data.aliquotas) {
      console.log("Alíquotas não encontradas no produto, buscando separadamente...")

      // Se as alíquotas não estiverem incluídas, buscar separadamente
      try {
        const aliquotasResponse = await fetch(getApiUrl(`aliquotas-produto?produto_id=${id}`), {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        if (aliquotasResponse.ok) {
          const aliquotasData = await aliquotasResponse.json()
          console.log(`Alíquotas recebidas separadamente:`, JSON.stringify(aliquotasData).substring(0, 200) + "...")

          // Processar os dados das alíquotas
          let aliquotas = []
          if (Array.isArray(aliquotasData)) {
            aliquotas = aliquotasData
          } else if (aliquotasData && typeof aliquotasData === "object" && Array.isArray(aliquotasData.data)) {
            aliquotas = aliquotasData.data
          }

          // Filtrar apenas as alíquotas deste produto
          aliquotas = aliquotas.filter((a) => a.produto_id === id)

          if (aliquotas.length > 0) {
            data.aliquotas = aliquotas
            console.log(`${aliquotas.length} alíquotas encontradas para o produto ${id}`)
          }
        }
      } catch (aliquotaError) {
        console.error("Erro ao buscar alíquotas separadamente:", aliquotaError)
      }
    }

    return data
  } catch (error) {
    console.error(`Failed to fetch produto ${id}:`, error)
    throw error
  }
}

export async function updateProduto(id: number, produto: Produto, token: string): Promise<Produto> {
  try {
    // Obter o ID da empresa do usuário logado
    const empresaId = getEmpresaId()

    if (!empresaId) {
      throw new Error("ID da empresa não encontrado. Verifique se você está logado corretamente.")
    }

    // Garantir que o empresa_mae_id esteja definido no produto
    const produtoAtualizado = {
      ...produto,
      empresa_mae_id: empresaId,
    }

    console.log(`Enviando requisição PUT para produto ${id}`)
    console.log(`Dados do produto: ${JSON.stringify(produtoAtualizado)}`)

    const response = await fetch(getApiUrl(`produtos/${id}`), {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(produtoAtualizado),
    })

    if (!response.ok) {
      // Verificar se a resposta é JSON
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Falha ao atualizar produto: ${response.status}`)
      } else {
        // Se não for JSON, capturar o texto da resposta para diagnóstico
        const text = await response.text()
        console.error(`API returned non-JSON response: ${text.substring(0, 200)}...`)
        throw new Error(`Falha ao atualizar produto. A API retornou uma resposta não-JSON. Status: ${response.status}`)
      }
    }

    return response.json()
  } catch (error) {
    console.error(`Failed to update produto ${id}:`, error)
    throw error
  }
}

// Substitua a função deleteProduto atual por esta implementação melhorada

export async function deleteProduto(id: number, token: string): Promise<void> {
  try {
    console.log(`Enviando requisição DELETE para produto ${id}`)

    const response = await fetch(getApiUrl(`produtos/${id}`), {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      // Tentar obter detalhes do erro
      let errorMessage = `Falha ao excluir produto: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        // Se não conseguir obter JSON, usa a mensagem padrão
      }

      throw new Error(errorMessage)
    }

    console.log(`Produto ${id} excluído com sucesso`)
    return
  } catch (error) {
    console.error(`Failed to delete produto ${id}:`, error)
    throw error
  }
}

// Alíquotas API

export async function getAliquotas(token: string): Promise<AliquotaProduto[]> {
  try {
    const response = await fetch(getApiUrl("aliquotas-produto"), {
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
    console.error("Failed to fetch aliquotas:", error)
    throw error
  }
}

// Substitua a função createAliquota atual por esta versão melhorada
export async function createAliquota(aliquota: AliquotaProduto, token: string): Promise<AliquotaProduto> {
  try {
    console.log("=== DADOS ENVIADOS PARA A API (createAliquota) ===")
    console.log("URL:", getApiUrl("aliquotas-produto"))
    console.log("Método:", "POST")
    console.log("Headers:", {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token.substring(0, 15)}...`, // Mostrar apenas parte do token por segurança
    })
    console.log("Payload JSON:", JSON.stringify(aliquota, null, 2))
    console.log("produto_id:", aliquota.produto_id, "- Tipo:", typeof aliquota.produto_id)
    console.log("=== FIM DOS DADOS ENVIADOS ===")

    // Garantir que todos os campos obrigatórios estejam presentes
    const aliquotaData = {
      ...aliquota,
      produto_id: Number(aliquota.produto_id), // Garantir que seja um número
      csosn_id: Number(aliquota.csosn_id),
      cst_pis_id: Number(aliquota.cst_pis_id),
      cst_cofins_id: Number(aliquota.cst_cofins_id),
      cst_ipi_id: Number(aliquota.cst_ipi_id),
      percentual_icms: Number(aliquota.percentual_icms) || 0,
      percentual_pis: Number(aliquota.percentual_pis) || 0,
      percentual_cofins: Number(aliquota.percentual_cofins) || 0,
      percentual_ipi: Number(aliquota.percentual_ipi) || 0,
    }

    const response = await fetch(getApiUrl("aliquotas-produto"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(aliquotaData),
    })

    if (!response.ok) {
      // Tentar obter detalhes do erro
      let errorMessage = `Falha ao criar alíquota: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
        console.error("Erro detalhado:", errorData)
      } catch (e) {
        // Se não conseguir obter JSON, tenta obter o texto da resposta
        try {
          const errorText = await response.text()
          errorMessage = `Falha ao criar alíquota: ${errorText.substring(0, 200)}...`
          console.error("Resposta de erro (texto):", errorText)
        } catch (textError) {
          // Se não conseguir obter o texto, usa a mensagem padrão
          console.error("Não foi possível obter detalhes do erro")
        }
      }

      throw new Error(errorMessage)
    }

    const responseData = await response.json()
    console.log("=== RESPOSTA DA API (createAliquota) ===")
    console.log("Status:", response.status)
    console.log("Dados:", JSON.stringify(responseData, null, 2))
    console.log("=== FIM DA RESPOSTA ===")

    return responseData
  } catch (error) {
    console.error("Failed to create aliquota:", error)
    throw error
  }
}

// Substitua a função updateAliquota atual por esta versão melhorada
export async function updateAliquota(id: number, aliquota: AliquotaProduto, token: string): Promise<AliquotaProduto> {
  try {
    console.log("=== DADOS ENVIADOS PARA A API (updateAliquota) ===")
    console.log("URL:", getApiUrl(`aliquotas-produto/${id}`))
    console.log("Método:", "PUT")
    console.log("Headers:", {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token.substring(0, 15)}...`, // Mostrar apenas parte do token por segurança
    })
    console.log("Payload JSON:", JSON.stringify(aliquota, null, 2))
    console.log("produto_id:", aliquota.produto_id, "- Tipo:", typeof aliquota.produto_id)
    console.log("=== FIM DOS DADOS ENVIADOS ===")

    // Garantir que todos os campos obrigatórios estejam presentes
    const aliquotaData = {
      ...aliquota,
      produto_id: Number(aliquota.produto_id), // Garantir que seja um número
      csosn_id: Number(aliquota.csosn_id),
      cst_pis_id: Number(aliquota.cst_pis_id),
      cst_cofins_id: Number(aliquota.cst_cofins_id),
      cst_ipi_id: Number(aliquota.cst_ipi_id),
      percentual_icms: Number(aliquota.percentual_icms) || 0,
      percentual_pis: Number(aliquota.percentual_pis) || 0,
      percentual_cofins: Number(aliquota.percentual_cofins) || 0,
      percentual_ipi: Number(aliquota.percentual_ipi) || 0,
    }

    const response = await fetch(getApiUrl(`aliquotas-produto/${id}`), {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(aliquotaData),
    })

    if (!response.ok) {
      // Verificar se a resposta é JSON
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json()
        console.error("Erro detalhado:", errorData)
        throw new Error(errorData.message || `Falha ao atualizar alíquota: ${response.status}`)
      } else {
        // Se não for JSON, capturar o texto da resposta para diagnóstico
        const text = await response.text()
        console.error(`API returned non-JSON response: ${text.substring(0, 200)}...`)
        throw new Error(`Falha ao atualizar alíquota. A API retornou uma resposta não-JSON. Status: ${response.status}`)
      }
    }

    const responseData = await response.json()
    console.log("=== RESPOSTA DA API (updateAliquota) ===")
    console.log("Status:", response.status)
    console.log("Dados:", JSON.stringify(responseData, null, 2))
    console.log("=== FIM DA RESPOSTA ===")

    return responseData
  } catch (error) {
    console.error(`Failed to update aliquota ${id}:`, error)
    throw error
  }
}

export async function deleteAliquota(id: number, token: string): Promise<void> {
  try {
    const response = await fetch(getApiUrl(`aliquotas-produto/${id}`), {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `Falha ao excluir alíquota: ${response.status}`)
    }
  } catch (error) {
    console.error(`Failed to delete aliquota ${id}:`, error)
    throw error
  }
}
