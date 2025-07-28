"use client"

import type { LoginResponse } from "./types"

const TOKEN_KEY = "sistema_diesel_token"
const USER_KEY = "sistema_diesel_user"
const EMPRESA_KEY = "sistema_diesel_empresa"

export function saveAuthData(data: LoginResponse): void {
  if (typeof window === "undefined") return

  // Store token in localStorage
  localStorage.setItem(TOKEN_KEY, data.access_token)
  localStorage.setItem(USER_KEY, JSON.stringify(data.usuario))
  localStorage.setItem(EMPRESA_KEY, data.empresa_mae_id.toString())

  // Also store in a cookie for server-side access (middleware)
  document.cookie = `${TOKEN_KEY}=${data.access_token}; path=/; max-age=86400; SameSite=Lax`
  document.cookie = `${EMPRESA_KEY}=${data.empresa_mae_id}; path=/; max-age=86400; SameSite=Lax`
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null

  // Get token from cookie
  const cookies = document.cookie.split(";")
  const tokenCookie = cookies.find((cookie) => cookie.trim().startsWith(`${TOKEN_KEY}=`))

  if (tokenCookie) {
    return tokenCookie.split("=")[1]
  }

  return null
}

export function getUser() {
  if (typeof window === "undefined") return null
  const user = localStorage.getItem(USER_KEY)
  return user ? JSON.parse(user) : null
}

// Melhorar a função getEmpresaId para garantir que sempre retorne um número válido

// Substitua a função getEmpresaId atual por esta versão melhorada:
export function getEmpresaId(): number | null {
  if (typeof window === "undefined") return null

  // Primeiro, tentar obter do cookie (prioridade mais alta)
  const cookies = document.cookie.split(";")
  const empresaCookie = cookies.find((cookie) => cookie.trim().startsWith(`${EMPRESA_KEY}=`))

  if (empresaCookie) {
    const empresaId = Number.parseInt(empresaCookie.split("=")[1], 10)
    if (!isNaN(empresaId)) {
      console.log("Empresa ID obtido do cookie:", empresaId)
      return empresaId
    }
  }

  // Segundo, tentar obter do localStorage
  const empresaId = localStorage.getItem(EMPRESA_KEY)
  if (empresaId) {
    const parsedId = Number.parseInt(empresaId, 10)
    if (!isNaN(parsedId)) {
      console.log("Empresa ID obtido do localStorage:", parsedId)
      return parsedId
    }
  }

  // Terceiro, tentar obter do objeto de usuário no localStorage
  try {
    const userStr = localStorage.getItem(USER_KEY)
    if (userStr) {
      const user = JSON.parse(userStr)
      if (user && user.empresa_mae_id) {
        const parsedId = Number(user.empresa_mae_id)
        console.log("Empresa ID obtido do objeto de usuário:", parsedId)
        return parsedId
      }
    }
  } catch (e) {
    console.error("Erro ao obter empresa_mae_id do objeto de usuário:", e)
  }

  // Se nada funcionar, retornar null
  console.warn("Não foi possível obter o ID da empresa de nenhuma fonte")
  return null
}

export function isAuthenticated(): boolean {
  const token = getToken()
  return !!token
}

export function logout(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(EMPRESA_KEY)

  // Also clear cookies
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`
  document.cookie = `${EMPRESA_KEY}=; path=/; max-age=0`
}
