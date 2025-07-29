import type { EmpresaMae, LoginCredentials, LoginResponse, Produto, AliquotaProduto, Veiculo, MarcaVeiculo, ModeloVeiculo, GrupoCliente, Cliente, Fornecedor, FornecedorContato, FornecedorTributacao, FornecedorEndereco, FornecedorRepresentante, FornecedorDadoBancario, TipoPessoa, IndicadorIe, TipoContato, TipoEndereco, TipoRepresentante, Usuario, ChatMensagem, Conversa, MensagensNaoLidas, Servico, OrdemServico, CategoriaServico, UnidadeCobranca, StatusOrdemServico, FormaPagamento } from "./types"
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

// Veículos API

export async function getVeiculos(token: string): Promise<Veiculo[]> {
  try {
    const response = await fetch(getApiUrl("veiculos"), {
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
    console.error("Failed to fetch veiculos:", error)
    throw error
  }
}

export async function getVeiculo(id: number, token: string): Promise<Veiculo> {
  try {
    const response = await fetch(getApiUrl(`veiculos/${id}`), {
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
    console.error(`Failed to fetch veiculo ${id}:`, error)
    throw error
  }
}

export async function createVeiculo(veiculo: Veiculo, token: string): Promise<Veiculo> {
  try {
    const response = await fetch(getApiUrl("veiculos"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(veiculo),
    })

    if (!response.ok) {
      let errorMessage = `Falha ao criar veículo: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        try {
          const errorText = await response.text()
          errorMessage = `Falha ao criar veículo: ${errorText.substring(0, 200)}...`
        } catch (textError) {
          // Uses default message
        }
      }
      throw new Error(errorMessage)
    }

    return response.json()
  } catch (error) {
    console.error("Failed to create veiculo:", error)
    throw error
  }
}

export async function updateVeiculo(id: number, veiculo: Veiculo, token: string): Promise<Veiculo> {
  try {
    const response = await fetch(getApiUrl(`veiculos/${id}`), {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(veiculo),
    })

    if (!response.ok) {
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Falha ao atualizar veículo: ${response.status}`)
      } else {
        const text = await response.text()
        throw new Error(`Falha ao atualizar veículo. A API retornou uma resposta não-JSON. Status: ${response.status}`)
      }
    }

    return response.json()
  } catch (error) {
    console.error(`Failed to update veiculo ${id}:`, error)
    throw error
  }
}

export async function deleteVeiculo(id: number, token: string): Promise<void> {
  try {
    const response = await fetch(getApiUrl(`veiculos/${id}`), {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      let errorMessage = `Falha ao excluir veículo: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        // Uses default message
      }
      throw new Error(errorMessage)
    }
  } catch (error) {
    console.error(`Failed to delete veiculo ${id}:`, error)
    throw error
  }
}

// Marcas de Veículos API

export async function getMarcasVeiculos(token: string): Promise<MarcaVeiculo[]> {
  try {
    const response = await fetch(getApiUrl("marcas-veiculos"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()

    // Handle different response formats - based on your example, it's paginated
    if (Array.isArray(data)) {
      return data
    } else if (data && typeof data === "object" && Array.isArray(data.data)) {
      return data.data
    }

    return []
  } catch (error) {
    console.error("Failed to fetch marcas veiculos:", error)
    throw error
  }
}

// Modelos de Veículos API

export async function getModelosVeiculos(token: string, marcaId?: number): Promise<ModeloVeiculo[]> {
  try {
    let url = "modelos-veiculos"
    if (marcaId) {
      url += `?marca_veiculo_id=${marcaId}`
    }

    const response = await fetch(getApiUrl(url), {
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
    console.error("Failed to fetch modelos veiculos:", error)
    throw error
  }
}

// Grupos Clientes API

export async function getGruposClientes(token: string): Promise<GrupoCliente[]> {
  try {
    const response = await fetch(getApiUrl("grupos-clientes"), {
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
    console.error("Failed to fetch grupos clientes:", error)
    throw error
  }
}

export async function getGrupoCliente(id: number, token: string): Promise<GrupoCliente> {
  try {
    const response = await fetch(getApiUrl(`grupos-clientes/${id}`), {
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
    console.error(`Failed to fetch grupo cliente ${id}:`, error)
    throw error
  }
}

export async function createGrupoCliente(grupoCliente: GrupoCliente, token: string): Promise<GrupoCliente> {
  try {
    const response = await fetch(getApiUrl("grupos-clientes"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(grupoCliente),
    })

    if (!response.ok) {
      let errorMessage = `Falha ao criar grupo de cliente: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        // Uses default message
      }
      throw new Error(errorMessage)
    }

    return response.json()
  } catch (error) {
    console.error("Failed to create grupo cliente:", error)
    throw error
  }
}

export async function updateGrupoCliente(id: number, grupoCliente: GrupoCliente, token: string): Promise<GrupoCliente> {
  try {
    const response = await fetch(getApiUrl(`grupos-clientes/${id}`), {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(grupoCliente),
    })

    if (!response.ok) {
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Falha ao atualizar grupo de cliente: ${response.status}`)
      } else {
        throw new Error(`Falha ao atualizar grupo de cliente. Status: ${response.status}`)
      }
    }

    return response.json()
  } catch (error) {
    console.error(`Failed to update grupo cliente ${id}:`, error)
    throw error
  }
}

export async function deleteGrupoCliente(id: number, token: string): Promise<void> {
  try {
    const response = await fetch(getApiUrl(`grupos-clientes/${id}`), {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      let errorMessage = `Falha ao excluir grupo de cliente: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        // Uses default message
      }
      throw new Error(errorMessage)
    }
  } catch (error) {
    console.error(`Failed to delete grupo cliente ${id}:`, error)
    throw error
  }
}

// Tipos Pessoa API

export async function getTiposPessoa(token: string): Promise<TipoPessoa[]> {
  try {
    const response = await fetch(getApiUrl("tipos-pessoa"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return Array.isArray(data) ? data : data.data || []
  } catch (error) {
    console.error("Failed to fetch tipos pessoa:", error)
    throw error
  }
}

// Indicador IE API

export async function getIndicadorIe(token: string): Promise<IndicadorIe[]> {
  try {
    const response = await fetch(getApiUrl("indicador-ie"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return Array.isArray(data) ? data : data.data || []
  } catch (error) {
    console.error("Failed to fetch indicador ie:", error)
    throw error
  }
}

// Tipos Contatos API

export async function getTiposContatos(token: string): Promise<TipoContato[]> {
  try {
    const response = await fetch(getApiUrl("tipos-contatos"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return Array.isArray(data) ? data : data.data || []
  } catch (error) {
    console.error("Failed to fetch tipos contatos:", error)
    throw error
  }
}

// Tipos Endereco API

export async function getTiposEnderecos(token: string): Promise<TipoEndereco[]> {
  try {
    const response = await fetch(getApiUrl("tipos-endereco"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return Array.isArray(data) ? data : data.data || []
  } catch (error) {
    console.error("Failed to fetch tipos endereco:", error)
    throw error
  }
}

// Tipos Representantes API

export async function getTiposRepresentantes(token: string): Promise<TipoRepresentante[]> {
  try {
    const response = await fetch(getApiUrl("tipos-representantes"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return Array.isArray(data) ? data : data.data || []
  } catch (error) {
    console.error("Failed to fetch tipos representantes:", error)
    throw error
  }
}

// Tipos Contas Bancarias API

export async function getTiposContasBancarias(token: string): Promise<any[]> {
  try {
    const response = await fetch(getApiUrl("tipos-contas-bancarias"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return Array.isArray(data) ? data : data.data || []
  } catch (error) {
    console.error("Failed to fetch tipos contas bancarias:", error)
    throw error
  }
}

// CSOSN API

export async function getCsosn(token: string): Promise<any[]> {
  try {
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
    return Array.isArray(data) ? data : data.data || []
  } catch (error) {
    console.error("Failed to fetch csosn:", error)
    throw error
  }
}

// Clientes API

export async function getClientes(token: string): Promise<Cliente[]> {
  try {
    const response = await fetch(getApiUrl("clientes"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return Array.isArray(data) ? data : data.data || []
  } catch (error) {
    console.error("Failed to fetch clientes:", error)
    throw error
  }
}

export async function getCliente(id: number, token: string): Promise<Cliente> {
  try {
    const response = await fetch(getApiUrl(`clientes/${id}`), {
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
    console.error(`Failed to fetch cliente ${id}:`, error)
    throw error
  }
}

export async function createCliente(cliente: Cliente, token: string): Promise<Cliente> {
  try {
    const response = await fetch(getApiUrl("clientes"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(cliente),
    })

    if (!response.ok) {
      let errorMessage = `Falha ao criar cliente: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        // Uses default message
      }
      throw new Error(errorMessage)
    }

    return response.json()
  } catch (error) {
    console.error("Failed to create cliente:", error)
    throw error
  }
}

export async function updateCliente(id: number, cliente: Cliente, token: string): Promise<Cliente> {
  try {
    const response = await fetch(getApiUrl(`clientes/${id}`), {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(cliente),
    })

    if (!response.ok) {
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Falha ao atualizar cliente: ${response.status}`)
      } else {
        throw new Error(`Falha ao atualizar cliente. Status: ${response.status}`)
      }
    }

    return response.json()
  } catch (error) {
    console.error(`Failed to update cliente ${id}:`, error)
    throw error
  }
}

export async function deleteCliente(id: number, token: string): Promise<void> {
  try {
    const response = await fetch(getApiUrl(`clientes/${id}`), {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      let errorMessage = `Falha ao excluir cliente: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        // Uses default message
      }
      throw new Error(errorMessage)
    }
  } catch (error) {
    console.error(`Failed to delete cliente ${id}:`, error)
    throw error
  }
}

// Fornecedores API
export async function getFornecedores(token: string): Promise<Fornecedor[]> {
  try {
    const response = await fetch(getApiUrl("fornecedores"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Falha ao buscar fornecedores: ${response.status}`)
    }

    const result = await response.json()
    return result.data || result
  } catch (error) {
    console.error("Failed to fetch fornecedores:", error)
    throw error
  }
}

export async function getFornecedor(id: number, token: string): Promise<Fornecedor> {
  try {
    const response = await fetch(getApiUrl(`fornecedores/${id}`), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Falha ao buscar fornecedor: ${response.status}`)
    }

    return response.json()
  } catch (error) {
    console.error(`Failed to fetch fornecedor ${id}:`, error)
    throw error
  }
}

export async function createFornecedor(fornecedor: Fornecedor, token: string): Promise<Fornecedor> {
  try {
    const response = await fetch(getApiUrl("fornecedores"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(fornecedor),
    })

    if (!response.ok) {
      let errorMessage = `Falha ao criar fornecedor: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        // Uses default message
      }
      throw new Error(errorMessage)
    }

    return response.json()
  } catch (error) {
    console.error("Failed to create fornecedor:", error)
    throw error
  }
}

export async function updateFornecedor(id: number, fornecedor: Fornecedor, token: string): Promise<Fornecedor> {
  try {
    const response = await fetch(getApiUrl(`fornecedores/${id}`), {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(fornecedor),
    })

    if (!response.ok) {
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Falha ao atualizar fornecedor: ${response.status}`)
      } else {
        throw new Error(`Falha ao atualizar fornecedor. Status: ${response.status}`)
      }
    }

    return response.json()
  } catch (error) {
    console.error(`Failed to update fornecedor ${id}:`, error)
    throw error
  }
}

export async function deleteFornecedor(id: number, token: string): Promise<void> {
  try {
    const response = await fetch(getApiUrl(`fornecedores/${id}`), {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      let errorMessage = `Falha ao excluir fornecedor: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        // Uses default message
      }
      throw new Error(errorMessage)
    }
  } catch (error) {
    console.error(`Failed to delete fornecedor ${id}:`, error)
    throw error
  }
}

// Chat Mensagens API
export async function getUsuariosDisponiveis(token: string): Promise<Usuario[]> {
  try {
    const response = await fetch(getApiUrl("chat-mensagens/usuarios-disponiveis"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Falha ao buscar usuários disponíveis: ${response.status}`)
    }

    return response.json()
  } catch (error) {
    console.error("Failed to fetch usuarios disponiveis:", error)
    throw error
  }
}

export async function getConversas(token: string): Promise<Conversa[]> {
  try {
    const response = await fetch(getApiUrl("chat-mensagens/conversas"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Falha ao buscar conversas: ${response.status}`)
    }

    return response.json()
  } catch (error) {
    console.error("Failed to fetch conversas:", error)
    throw error
  }
}

export async function getMensagensComUsuario(usuarioId: number, token: string): Promise<{data: ChatMensagem[], current_page: number, last_page: number, total: number}> {
  try {
    const response = await fetch(getApiUrl(`chat-mensagens/usuario/${usuarioId}`), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Falha ao buscar mensagens: ${response.status}`)
    }

    return response.json()
  } catch (error) {
    console.error(`Failed to fetch mensagens com usuario ${usuarioId}:`, error)
    throw error
  }
}

export async function enviarMensagem(destinatarioId: number, mensagem: string, token: string): Promise<ChatMensagem> {
  try {
    const response = await fetch(getApiUrl("chat-mensagens"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        destinatario_id: destinatarioId,
        mensagem: mensagem,
      }),
    })

    if (!response.ok) {
      let errorMessage = `Falha ao enviar mensagem: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        // Uses default message
      }
      throw new Error(errorMessage)
    }

    return response.json()
  } catch (error) {
    console.error("Failed to enviar mensagem:", error)
    throw error
  }
}

export async function getMensagensNaoLidas(token: string): Promise<MensagensNaoLidas> {
  try {
    const response = await fetch(getApiUrl("chat-mensagens/nao-lidas"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Falha ao buscar mensagens não lidas: ${response.status}`)
    }

    return response.json()
  } catch (error) {
    console.error("Failed to fetch mensagens nao lidas:", error)
    throw error
  }
}

export async function marcarMensagemComoLida(mensagemId: number, token: string): Promise<void> {
  try {
    const response = await fetch(getApiUrl(`chat-mensagens/${mensagemId}/lida`), {
      method: "PUT",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      let errorMessage = `Falha ao marcar mensagem como lida: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        // Uses default message
      }
      throw new Error(errorMessage)
    }
  } catch (error) {
    console.error(`Failed to marcar mensagem ${mensagemId} como lida:`, error)
    throw error
  }
}

export async function deletarMensagem(mensagemId: number, token: string): Promise<void> {
  try {
    const response = await fetch(getApiUrl(`chat-mensagens/${mensagemId}`), {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      let errorMessage = `Falha ao deletar mensagem: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        // Uses default message
      }
      throw new Error(errorMessage)
    }
  } catch (error) {
    console.error(`Failed to delete mensagem ${mensagemId}:`, error)
    throw error
  }
}

// Fornecedores Contatos API
export async function getFornecedoresContatos(token: string): Promise<FornecedorContato[]> {
  try {
    const response = await fetch(getApiUrl("fornecedores-contatos"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Falha ao buscar contatos de fornecedores: ${response.status}`)
    }

    const result = await response.json()
    return result.data || result
  } catch (error) {
    console.error("Failed to fetch fornecedores contatos:", error)
    throw error
  }
}

export async function createFornecedorContato(contato: FornecedorContato, token: string): Promise<FornecedorContato> {
  try {
    const response = await fetch(getApiUrl("fornecedores-contatos"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(contato),
    })

    if (!response.ok) {
      let errorMessage = `Falha ao criar contato: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        // Uses default message
      }
      throw new Error(errorMessage)
    }

    return response.json()
  } catch (error) {
    console.error("Failed to create fornecedor contato:", error)
    throw error
  }
}

export async function updateFornecedorContato(id: number, contato: FornecedorContato, token: string): Promise<FornecedorContato> {
  try {
    const response = await fetch(getApiUrl(`fornecedores-contatos/${id}`), {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(contato),
    })

    if (!response.ok) {
      let errorMessage = `Falha ao atualizar contato: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        // Uses default message
      }
      throw new Error(errorMessage)
    }

    return response.json()
  } catch (error) {
    console.error(`Failed to update fornecedor contato ${id}:`, error)
    throw error
  }
}

export async function deleteFornecedorContato(id: number, token: string): Promise<void> {
  try {
    const response = await fetch(getApiUrl(`fornecedores-contatos/${id}`), {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      let errorMessage = `Falha ao excluir contato: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        // Uses default message
      }
      throw new Error(errorMessage)
    }
  } catch (error) {
    console.error(`Failed to delete fornecedor contato ${id}:`, error)
    throw error
  }
}

// Fornecedores Enderecos API
export async function createFornecedorEndereco(endereco: FornecedorEndereco, token: string): Promise<FornecedorEndereco> {
  try {
    const response = await fetch(getApiUrl("fornecedores-endereco"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(endereco),
    })

    if (!response.ok) {
      let errorMessage = `Falha ao criar endereço: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        // Uses default message
      }
      throw new Error(errorMessage)
    }

    return response.json()
  } catch (error) {
    console.error("Failed to create fornecedor endereco:", error)
    throw error
  }
}

export async function updateFornecedorEndereco(id: number, endereco: FornecedorEndereco, token: string): Promise<FornecedorEndereco> {
  try {
    const response = await fetch(getApiUrl(`fornecedores-endereco/${id}`), {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(endereco),
    })

    if (!response.ok) {
      let errorMessage = `Falha ao atualizar endereço: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        // Uses default message
      }
      throw new Error(errorMessage)
    }

    return response.json()
  } catch (error) {
    console.error(`Failed to update fornecedor endereco ${id}:`, error)
    throw error
  }
}

export async function deleteFornecedorEndereco(id: number, token: string): Promise<void> {
  try {
    const response = await fetch(getApiUrl(`fornecedores-endereco/${id}`), {
      method: "DELETE",  
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      let errorMessage = `Falha ao excluir endereço: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        // Uses default message
      }
      throw new Error(errorMessage)
    }
  } catch (error) {
    console.error(`Failed to delete fornecedor endereco ${id}:`, error)
    throw error
  }
}

// Servicos API
export async function getServicos(token: string): Promise<Servico[]> {
  try {
    const response = await fetch(getApiUrl("servicos"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Falha ao buscar serviços: ${response.status}`)
    }

    const result = await response.json()
    return result.data || result
  } catch (error) {
    console.error("Failed to fetch servicos:", error)
    throw error
  }
}

export async function getServico(id: number, token: string): Promise<Servico> {
  try {
    const response = await fetch(getApiUrl(`servicos/${id}`), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Falha ao buscar serviço: ${response.status}`)
    }

    return response.json()
  } catch (error) {
    console.error(`Failed to fetch servico ${id}:`, error)
    throw error
  }
}

export async function createServico(servico: Servico, token: string): Promise<Servico> {
  try {
    const response = await fetch(getApiUrl("servicos"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(servico),
    })

    if (!response.ok) {
      let errorMessage = `Falha ao criar serviço: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        // Uses default message
      }
      throw new Error(errorMessage)
    }

    return response.json()
  } catch (error) {
    console.error("Failed to create servico:", error)
    throw error
  }
}

export async function updateServico(id: number, servico: Servico, token: string): Promise<Servico> {
  try {
    const response = await fetch(getApiUrl(`servicos/${id}`), {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(servico),
    })

    if (!response.ok) {
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Falha ao atualizar serviço: ${response.status}`)
      } else {
        throw new Error(`Falha ao atualizar serviço. Status: ${response.status}`)
      }
    }

    return response.json()
  } catch (error) {
    console.error(`Failed to update servico ${id}:`, error)
    throw error
  }
}

export async function deleteServico(id: number, token: string): Promise<void> {
  try {
    const response = await fetch(getApiUrl(`servicos/${id}`), {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      let errorMessage = `Falha ao excluir serviço: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        // Uses default message
      }
      throw new Error(errorMessage)
    }
  } catch (error) {
    console.error(`Failed to delete servico ${id}:`, error)
    throw error
  }
}

// Ordens de Servico API
export async function getOrdensServico(token: string): Promise<OrdemServico[]> {
  try {
    const response = await fetch(getApiUrl("ordens-servico"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Falha ao buscar ordens de serviço: ${response.status}`)
    }

    const result = await response.json()
    return result.data || result
  } catch (error) {
    console.error("Failed to fetch ordens servico:", error)
    throw error
  }
}

export async function getOrdemServico(id: number, token: string): Promise<OrdemServico> {
  try {
    const response = await fetch(getApiUrl(`ordens-servico/${id}`), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Falha ao buscar ordem de serviço: ${response.status}`)
    }

    return response.json()
  } catch (error) {
    console.error(`Failed to fetch ordem servico ${id}:`, error)
    throw error
  }
}

export async function createOrdemServico(ordemServico: OrdemServico, token: string): Promise<OrdemServico> {
  try {
    const response = await fetch(getApiUrl("ordens-servico"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(ordemServico),
    })

    if (!response.ok) {
      let errorMessage = `Falha ao criar ordem de serviço: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        // Uses default message
      }
      throw new Error(errorMessage)
    }

    return response.json()
  } catch (error) {
    console.error("Failed to create ordem servico:", error)
    throw error
  }
}

export async function updateOrdemServico(id: number, ordemServico: OrdemServico, token: string): Promise<OrdemServico> {
  try {
    const response = await fetch(getApiUrl(`ordens-servico/${id}`), {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(ordemServico),
    })

    if (!response.ok) {
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Falha ao atualizar ordem de serviço: ${response.status}`)
      } else {
        throw new Error(`Falha ao atualizar ordem de serviço. Status: ${response.status}`)
      }
    }

    return response.json()
  } catch (error) {
    console.error(`Failed to update ordem servico ${id}:`, error)
    throw error
  }
}

export async function deleteOrdemServico(id: number, token: string): Promise<void> {
  try {
    const response = await fetch(getApiUrl(`ordens-servico/${id}`), {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      let errorMessage = `Falha ao excluir ordem de serviço: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        // Uses default message
      }
      throw new Error(errorMessage)
    }
  } catch (error) {
    console.error(`Failed to delete ordem servico ${id}:`, error)
    throw error
  }
}

// Auxiliary APIs for dropdowns
export async function getCategoriasServicos(token: string): Promise<CategoriaServico[]> {
  try {
    const response = await fetch(getApiUrl("categorias-servicos"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return Array.isArray(data) ? data : data.data || []
  } catch (error) {
    console.error("Failed to fetch categorias servicos:", error)
    throw error
  }
}

export async function getUnidadesCobranca(token: string): Promise<UnidadeCobranca[]> {
  try {
    const response = await fetch(getApiUrl("unidades-cobranca"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return Array.isArray(data) ? data : data.data || []
  } catch (error) {
    console.error("Failed to fetch unidades cobranca:", error)
    throw error
  }
}

export async function getStatusOrdensServico(token: string): Promise<StatusOrdemServico[]> {
  try {
    const response = await fetch(getApiUrl("status-ordens-servico"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return Array.isArray(data) ? data : data.data || []
  } catch (error) {
    console.error("Failed to fetch status ordens servico:", error)
    throw error
  }
}

export async function getFormasPagamento(token: string): Promise<FormaPagamento[]> {
  try {
    const response = await fetch(getApiUrl("formas-pagamento"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return Array.isArray(data) ? data : data.data || []
  } catch (error) {
    console.error("Failed to fetch formas pagamento:", error)
    throw error
  }
}

// Ordens Servico Servicos API
export async function createOrdemServicoServico(ordemServicoServico: any, token: string): Promise<any> {
  try {
    const response = await fetch(getApiUrl("ordens-servico-servicos"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(ordemServicoServico),
    })

    if (!response.ok) {
      let errorMessage = `Falha ao criar serviço da ordem: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        // Uses default message
      }
      throw new Error(errorMessage)
    }

    return response.json()
  } catch (error) {
    console.error("Failed to create ordem servico servico:", error)
    throw error
  }
}

export async function deleteOrdemServicoServico(id: number, token: string): Promise<void> {
  try {
    const response = await fetch(getApiUrl(`ordens-servico-servicos/${id}`), {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      let errorMessage = `Falha ao excluir serviço da ordem: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        // Uses default message
      }
      throw new Error(errorMessage)
    }
  } catch (error) {
    console.error(`Failed to delete ordem servico servico ${id}:`, error)
    throw error
  }
}

// Ordens Servico Produtos API
export async function createOrdemServicoProduto(ordemServicoProduto: any, token: string): Promise<any> {
  try {
    const response = await fetch(getApiUrl("ordens-servico-produtos"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(ordemServicoProduto),
    })

    if (!response.ok) {
      let errorMessage = `Falha ao criar produto da ordem: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        // Uses default message
      }
      throw new Error(errorMessage)
    }

    return response.json()
  } catch (error) {
    console.error("Failed to create ordem servico produto:", error)
    throw error
  }
}

export async function deleteOrdemServicoProduto(id: number, token: string): Promise<void> {
  try {
    const response = await fetch(getApiUrl(`ordens-servico-produtos/${id}`), {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      let errorMessage = `Falha ao excluir produto da ordem: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        // Uses default message
      }
      throw new Error(errorMessage)
    }
  } catch (error) {
    console.error(`Failed to delete ordem servico produto ${id}:`, error)
    throw error
  }
}

// Ordens Servico Funcionarios API
export async function createOrdemServicoFuncionario(ordemServicoFuncionario: any, token: string): Promise<any> {
  try {
    const response = await fetch(getApiUrl("ordens-servico-funcionarios"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(ordemServicoFuncionario),
    })

    if (!response.ok) {
      let errorMessage = `Falha ao criar funcionário da ordem: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        // Uses default message
      }
      throw new Error(errorMessage)
    }

    return response.json()
  } catch (error) {
    console.error("Failed to create ordem servico funcionario:", error)
    throw error
  }
}

export async function deleteOrdemServicoFuncionario(id: number, token: string): Promise<void> {
  try {
    const response = await fetch(getApiUrl(`ordens-servico-funcionarios/${id}`), {
      method: "DELETE",  
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      let errorMessage = `Falha ao excluir funcionário da ordem: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        // Uses default message
      }
      throw new Error(errorMessage)
    }
  } catch (error) {
    console.error(`Failed to delete ordem servico funcionario ${id}:`, error)
    throw error
  }
}

// Ordens Servico Formas Pagamento API
export async function createOrdemServicoFormaPagamento(ordemServicoFormaPagamento: any, token: string): Promise<any> {
  try {
    const response = await fetch(getApiUrl("ordens-servico-formas-pagamento"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(ordemServicoFormaPagamento),
    })

    if (!response.ok) {
      let errorMessage = `Falha ao criar forma de pagamento da ordem: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        // Uses default message
      }
      throw new Error(errorMessage)
    }

    return response.json()
  } catch (error) {
    console.error("Failed to create ordem servico forma pagamento:", error)
    throw error
  }
}

export async function deleteOrdemServicoFormaPagamento(id: number, token: string): Promise<void> {
  try {
    const response = await fetch(getApiUrl(`ordens-servico-formas-pagamento/${id}`), {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      let errorMessage = `Falha ao excluir forma de pagamento da ordem: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        // Uses default message
      }
      throw new Error(errorMessage)
    }
  } catch (error) {
    console.error(`Failed to delete ordem servico forma pagamento ${id}:`, error)
    throw error
  }
}

// Get Funcionarios for dropdown
export async function getFuncionarios(token: string): Promise<any[]> {
  try {
    const response = await fetch(getApiUrl("funcionarios"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return Array.isArray(data) ? data : data.data || []
  } catch (error) {
    console.error("Failed to fetch funcionarios:", error)
    throw error
  }
}
