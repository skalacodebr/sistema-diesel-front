"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import type { EmpresaMae, LoginCredentials } from "@/lib/types"
import { saveAuthData } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Eye, EyeOff } from "lucide-react"

interface LoginFormProps {
  empresa: EmpresaMae
}

export function LoginForm({ empresa }: LoginFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logoError, setLogoError] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Modifique a função handleSubmit para lidar melhor com erros
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const credentials: LoginCredentials = {
        email,
        senha,
        empresa_mae_id: empresa.id,
      }

      console.log("Enviando credenciais:", JSON.stringify(credentials))

      const response = await fetch(`/api/login`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        // Verificar se a resposta é JSON
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json()
          throw new Error(errorData.message || `Falha na autenticação: ${response.status}`)
        } else {
          // Se não for JSON, mostrar um erro genérico
          throw new Error(`Falha na autenticação. Status: ${response.status}`)
        }
      }

      const data = await response.json()
      console.log("Login successful, saving auth data...")

      // Save auth data
      saveAuthData(data)

      // Use a small timeout to ensure the auth data is saved before redirecting
      setTimeout(() => {
        router.push(`/${empresa.slug}/dashboard`)
      }, 100)
    } catch (err) {
      console.error("Login error:", err)
      setError(
        err instanceof Error ? err.message : "Falha na autenticação. Verifique suas credenciais e tente novamente.",
      )
    } finally {
      setLoading(false)
    }
  }

  // Function to toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  // Function to render the logo with proper error handling
  const renderLogo = () => {
    // If we've already encountered an error or there's no logo_url, show the fallback
    if (logoError || !empresa.logo_url) {
      return (
        <div className="mb-8 w-60 h-60 flex items-center justify-center bg-gray-100 rounded-full">
          <span className="text-6xl font-bold" style={{ color: empresa.cor_principal }}>
            {empresa.nome.charAt(0)}
          </span>
        </div>
      )
    }

    // Try to render the image with error handling
    try {
      // Check if the logo_url is a valid base64 string
      const isBase64 = /^[A-Za-z0-9+/=]+$/.test(empresa.logo_url.trim())

      if (!isBase64) {
        console.error("Invalid base64 string for logo")
        setLogoError(true)
        return (
          <div className="mb-8 w-60 h-60 flex items-center justify-center bg-gray-100 rounded-full">
            <span className="text-6xl font-bold" style={{ color: empresa.cor_principal }}>
              {empresa.nome.charAt(0)}
            </span>
          </div>
        )
      }

      return (
        <div className="mb-8 w-60 h-60 relative">
          <Image
            src={`data:image/png;base64,${empresa.logo_url}`}
            alt={`${empresa.nome} Logo`}
            fill
            style={{ objectFit: "contain" }}
            onError={() => {
              console.error("Error loading logo image")
              setLogoError(true)
            }}
            priority
          />
        </div>
      )
    } catch (error) {
      console.error("Error rendering logo:", error)
      setLogoError(true)
      return (
        <div className="mb-8 w-60 h-60 flex items-center justify-center bg-gray-100 rounded-full">
          <span className="text-6xl font-bold" style={{ color: empresa.cor_principal }}>
            {empresa.nome.charAt(0)}
          </span>
        </div>
      )
    }
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="flex flex-col items-center justify-center text-center">
        {renderLogo()}
        {/* Removed the company name heading */}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="senha">Senha</Label>
          </div>
          <div className="relative">
            <Input
              id="senha"
              type={showPassword ? "text" : "password"}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Eye className="h-5 w-5" aria-hidden="true" />
              )}
              <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
            </button>
          </div>
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={loading}
          style={{
            backgroundColor: empresa.cor_principal,
            borderColor: empresa.cor_principal,
            color: "#ffffff",
          }}
        >
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </div>
  )
}
