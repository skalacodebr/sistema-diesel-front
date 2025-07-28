import { type NextRequest, NextResponse } from "next/server"

// This is a simple API route that proxies requests to the actual API
// to avoid CORS issues during local development
export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join("/")
  const API_BASE_URL = "https://sistema-diesel-2025-main-vv6tyd.laravel.cloud/api"

  const url = new URL(request.url)
  const searchParams = url.searchParams.toString()
  const targetUrl = `${API_BASE_URL}/${path}${searchParams ? `?${searchParams}` : ""}`

  console.log(`Proxying GET request to: ${targetUrl}`)

  // Verificar se estamos tentando acessar um produto com ID "novo"
  if (path.match(/^produtos\/novo$/i)) {
    return NextResponse.json(
      {
        error: "ID inválido",
        message: "Não é possível buscar um produto com ID 'novo'",
      },
      { status: 400 },
    )
  }

  const headers = new Headers()
  headers.set("Accept", "application/json")

  // Forward authorization header if present
  const authHeader = request.headers.get("Authorization")
  if (authHeader) {
    headers.set("Authorization", authHeader)
  }

  try {
    const response = await fetch(targetUrl, {
      headers,
      method: "GET",
      next: { revalidate: 0 }, // Don't cache the response
    })

    if (!response.ok) {
      console.error(`API returned error status: ${response.status}`)
      return NextResponse.json({ error: `API returned status: ${response.status}` }, { status: response.status })
    }

    const data = await response.json()
    console.log(`API response for ${path}:`, JSON.stringify(data).substring(0, 200) + "...")
    return NextResponse.json(data)
  } catch (error) {
    console.error("API proxy error:", error)
    return NextResponse.json(
      { error: "Failed to fetch from API", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

// Substitua a função POST existente por esta implementação melhorada
export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join("/")
  const API_BASE_URL = "https://sistema-diesel-2025-main-vv6tyd.laravel.cloud/api"

  console.log(`Proxying POST request to: ${API_BASE_URL}/${path}`)

  try {
    const body = await request.json()
    console.log(`POST body: ${JSON.stringify(body).substring(0, 200)}...`)

    const headers = new Headers()
    headers.set("Accept", "application/json")
    headers.set("Content-Type", "application/json")

    // Forward authorization header if present
    const authHeader = request.headers.get("Authorization")
    if (authHeader) {
      headers.set("Authorization", authHeader)
    }

    const response = await fetch(`${API_BASE_URL}/${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    })

    // Verificar se a resposta é JSON válido
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    } else {
      // Se não for JSON, retornar um erro mais informativo
      const text = await response.text()
      console.error(`API returned non-JSON response: ${text.substring(0, 200)}...`)
      return NextResponse.json(
        {
          error: "API returned non-JSON response",
          status: response.status,
          details: text.substring(0, 500),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("API proxy error:", error)
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// Adicione esta função para lidar com requisições PUT
export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join("/")
  const API_BASE_URL = "https://sistema-diesel-2025-main-vv6tyd.laravel.cloud/api"

  console.log(`Proxying PUT request to: ${API_BASE_URL}/${path}`)

  try {
    const body = await request.json()
    console.log(`PUT body: ${JSON.stringify(body).substring(0, 200)}...`)

    const headers = new Headers()
    headers.set("Accept", "application/json")
    headers.set("Content-Type", "application/json")

    // Forward authorization header if present
    const authHeader = request.headers.get("Authorization")
    if (authHeader) {
      headers.set("Authorization", authHeader)
    }

    const response = await fetch(`${API_BASE_URL}/${path}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    })

    // Verificar se a resposta é JSON válido
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    } else {
      // Se não for JSON, retornar um erro mais informativo
      const text = await response.text()
      console.error(`API returned non-JSON response for PUT: ${text.substring(0, 200)}...`)
      return NextResponse.json(
        {
          error: "API returned non-JSON response",
          status: response.status,
          details: text.substring(0, 500),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("API proxy error:", error)
    return NextResponse.json(
      {
        error: "Failed to process PUT request",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// Adicione esta função para lidar com requisições DELETE

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join("/")
  const API_BASE_URL = "https://sistema-diesel-2025-main-vv6tyd.laravel.cloud/api"

  console.log(`Proxying DELETE request to: ${API_BASE_URL}/${path}`)

  try {
    const headers = new Headers()
    headers.set("Accept", "application/json")

    // Forward authorization header if present
    const authHeader = request.headers.get("Authorization")
    if (authHeader) {
      headers.set("Authorization", authHeader)
    }

    const response = await fetch(`${API_BASE_URL}/${path}`, {
      method: "DELETE",
      headers,
    })

    // Se a resposta for 204 No Content (comum em operações DELETE bem-sucedidas)
    if (response.status === 204) {
      return new Response(null, { status: 204 })
    }

    // Verificar se a resposta é JSON válido
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    } else {
      // Se não for JSON, retornar a resposta como texto
      const text = await response.text()
      return new Response(text, {
        status: response.status,
        headers: { "Content-Type": "text/plain" },
      })
    }
  } catch (error) {
    console.error("API proxy error:", error)
    return NextResponse.json(
      {
        error: "Failed to process DELETE request",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
