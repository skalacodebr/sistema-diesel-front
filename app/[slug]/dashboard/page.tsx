"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getUser, logout } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

interface DashboardPageProps {
  params: {
    slug: string
  }
}

export default function DashboardPage({ params }: DashboardPageProps) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Set user from auth
    setUser(getUser())
  }, [])

  const handleLogout = () => {
    logout()
    router.push(`/${params.slug}/login`)
  }

  return (
    <div className="p-6">
      <header className="bg-white border-b p-4 flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </header>

      <div className="max-w-7xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-medium mb-4">Bem-vindo ao Sistema Diesel</h2>
          <p>Utilize o menu lateral para navegar pelo sistema.</p>
        </div>
      </div>
    </div>
  )
}
