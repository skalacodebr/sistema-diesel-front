"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getToken, isAuthenticated, getUser } from "@/lib/auth"
import { getEmpresaBySlug } from "@/lib/api"
import type { EmpresaMae } from "@/lib/types"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Toaster } from "@/components/ui/toaster"

export default function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { slug: string }
}) {
  const router = useRouter()
  const [empresa, setEmpresa] = useState<EmpresaMae | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      // Check if user is authenticated
      const token = getToken()
      console.log("Dashboard layout - Auth token:", token ? "Token exists" : "No token")

      if (!isAuthenticated()) {
        console.log("User not authenticated, redirecting to login")
        router.push(`/${params.slug}/login`)
        return
      }

      setUser(getUser())

      try {
        const empresaData = await getEmpresaBySlug(params.slug)
        if (empresaData) {
          console.log("Company data fetched successfully")
          setEmpresa(empresaData)
        } else {
          console.error("No company data found for slug:", params.slug)
          router.push(`/${params.slug}/login`)
        }
      } catch (error) {
        console.error("Failed to fetch company data:", error)
        router.push(`/${params.slug}/login`)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [params.slug, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">Carregando...</div>
      </div>
    )
  }

  if (!empresa) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Erro ao carregar dados da empresa.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar empresa={empresa} user={user} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      <Toaster />
    </div>
  )
}
