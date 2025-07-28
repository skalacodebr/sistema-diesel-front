import type React from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getEmpresaBySlug } from "@/lib/api"
import { LoginForm } from "@/components/login-form"

interface LoginPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: LoginPageProps): Promise<Metadata> {
  const empresa = await getEmpresaBySlug(params.slug)

  if (!empresa) {
    return {
      title: "Empresa não encontrada",
    }
  }

  return {
    title: `Login | ${empresa.nome}`,
  }
}

// Replace the entire LoginPage component with this implementation
// that doesn't use any fallback data
export default async function LoginPage({ params }: LoginPageProps) {
  try {
    const empresa = await getEmpresaBySlug(params.slug)

    if (!empresa) {
      notFound()
    }

    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center p-4"
        style={
          {
            "--theme-primary": empresa.cor_principal,
            "--theme-primary-foreground": "#ffffff",
          } as React.CSSProperties
        }
      >
        <div className="w-full max-w-md">
          <div className="rounded-lg border bg-card p-8 shadow-sm">
            <LoginForm empresa={empresa} />
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error fetching empresa data:", error)
    throw error
  }
}
