"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, ArrowRight } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const [slug, setSlug] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!slug.trim()) {
      setError("Por favor, insira o identificador da empresa.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Check if the company exists
      const response = await fetch(`/api/empresas-mae`, {
        headers: {
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Erro ao verificar empresas: ${response.status}`)
      }

      const data = await response.json()

      // Process the data to find companies
      let empresas: any[] = []
      if (Array.isArray(data)) {
        empresas = data
      } else if (data && typeof data === "object") {
        if (Array.isArray(data.data)) {
          empresas = data.data
        } else if (data.id && data.slug) {
          empresas = [data]
        } else {
          empresas = Object.values(data).filter(
            (item) => item && typeof item === "object" && "id" in item && "slug" in item,
          )
        }
      }

      // Check if the entered slug exists
      const slugExists = empresas.some((empresa) => empresa.slug === slug.trim())

      if (slugExists) {
        router.push(`/${slug.trim()}/login`)
      } else {
        setError(`Empresa "${slug.trim()}" não encontrada. Verifique o identificador e tente novamente.`)
      }
    } catch (error) {
      console.error("Error checking company:", error)
      setError(error instanceof Error ? error.message : "Erro ao verificar empresa.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Sistema Diesel</CardTitle>
          <CardDescription>Digite o identificador da sua empresa para acessar o sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="slug">Identificador da Empresa</Label>
                <Input
                  id="slug"
                  placeholder="empresa-exemplo"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verificando..." : "Acessar"}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-gray-500">
          <p>© 2025 Sistema Diesel. Todos os direitos reservados.</p>
        </CardFooter>
      </Card>
    </div>
  )
}
