"use client"

import type React from "react"

import { useState, useMemo, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Search, ChevronLeft, ChevronRight, LayoutDashboard, Package, LogOut } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { EmpresaMae } from "@/lib/types"
import { logout } from "@/lib/auth"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Define menu item type
interface MenuItem {
  title: string
  icon: React.ElementType
  href: string
  active?: boolean
}

interface SidebarProps {
  empresa: EmpresaMae
  user: any
}

export function Sidebar({ empresa, user }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [logoError, setLogoError] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  // Reset logo error when empresa changes
  useEffect(() => {
    setLogoError(false)
  }, [empresa])

  // Define menu items (Dashboard and Products)
  const menuItems: MenuItem[] = useMemo(
    () => [
      {
        title: "Dashboard",
        icon: LayoutDashboard,
        href: `/${empresa.slug}/dashboard`,
        active: pathname === `/${empresa.slug}/dashboard`,
      },
      {
        title: "Produtos",
        icon: Package,
        href: `/${empresa.slug}/dashboard/produtos`,
        active: pathname.includes("/dashboard/produtos"),
      },
    ],
    [empresa.slug, pathname],
  )

  // Filter menu items based on search query
  const filteredMenuItems = useMemo(() => {
    if (!searchQuery.trim()) return menuItems

    return menuItems.filter((item) => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [menuItems, searchQuery])

  const toggleSidebar = () => {
    setCollapsed(!collapsed)
  }

  // Function to render the logo with proper error handling
  const renderLogo = () => {
    // If we've already encountered an error or there's no logo_url_secundaria, show the fallback
    if (logoError || !empresa.logo_url_secundaria) {
      return (
        <div
          className={`flex items-center justify-center rounded-full bg-white bg-opacity-20 ${
            collapsed ? "w-14 h-14" : "w-40 h-40"
          } mx-auto`}
        >
          <span className={`text-white font-bold ${collapsed ? "text-xl" : "text-5xl"}`}>{empresa.nome.charAt(0)}</span>
        </div>
      )
    }

    // Try to render the image with error handling
    try {
      // Check if the logo_url_secundaria is a valid base64 string
      const isBase64 = /^[A-Za-z0-9+/=]+$/.test(empresa.logo_url_secundaria.trim())

      if (!isBase64) {
        console.error("Invalid base64 string for logo")
        setLogoError(true)
        return (
          <div
            className={`flex items-center justify-center rounded-full bg-white bg-opacity-20 ${
              collapsed ? "w-14 h-14" : "w-40 h-40"
            } mx-auto`}
          >
            <span className={`text-white font-bold ${collapsed ? "text-xl" : "text-5xl"}`}>
              {empresa.nome.charAt(0)}
            </span>
          </div>
        )
      }

      return (
        <div className={`relative ${collapsed ? "w-14 h-14" : "w-40 h-40"} mx-auto`}>
          <Image
            src={`data:image/png;base64,${empresa.logo_url_secundaria}`}
            alt={`${empresa.nome} Logo`}
            fill
            className="object-contain"
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
        <div
          className={`flex items-center justify-center rounded-full bg-white bg-opacity-20 ${
            collapsed ? "w-14 h-14" : "w-40 h-40"
          } mx-auto`}
        >
          <span className={`text-white font-bold ${collapsed ? "text-xl" : "text-5xl"}`}>{empresa.nome.charAt(0)}</span>
        </div>
      )
    }
  }

  const handleLogout = () => {
    logout()
    router.push(`/${empresa.slug}/login`)
  }

  return (
    <div
      className={`flex flex-col h-screen transition-all duration-300 ${collapsed ? "w-20" : "w-64"}`}
      style={{ backgroundColor: empresa.cor_principal }}
    >
      {/* Logo and toggle button */}
      <div className="relative flex flex-col items-center pt-6 pb-4">
        {/* Centered and larger logo with error handling */}
        {renderLogo()}

        {/* Toggle button positioned absolutely */}
        <button
          onClick={toggleSidebar}
          className="absolute right-2 top-2 text-white p-1 rounded-full hover:bg-white hover:bg-opacity-10 transition-colors"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Search bar */}
      <div className={`px-4 mt-2 ${collapsed ? "hidden" : "block"}`}>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-white opacity-70" />
          <Input
            type="text"
            placeholder="Pesquisar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white bg-opacity-10 border-none text-white placeholder:text-white placeholder:opacity-70 focus-visible:ring-white focus-visible:ring-opacity-30"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6 flex-1 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {filteredMenuItems.length > 0 ? (
            filteredMenuItems.map((item) => (
              <li key={item.title}>
                <Link
                  href={item.href}
                  className={`flex items-center px-2 py-2 rounded-md text-white hover:bg-white hover:bg-opacity-10 transition-colors ${
                    item.active ? "bg-white bg-opacity-10" : ""
                  }`}
                >
                  <item.icon className={`${collapsed ? "mx-auto" : "mr-3"}`} size={20} />
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              </li>
            ))
          ) : (
            <li className="px-2 py-2 text-white text-sm opacity-70">{!collapsed && "Nenhum resultado encontrado"}</li>
          )}
        </ul>
      </nav>

      {/* User info at bottom with dropdown menu */}
      <div className={`p-4 border-t border-white border-opacity-10 ${collapsed ? "hidden" : "block"}`}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center cursor-pointer hover:bg-white hover:bg-opacity-10 rounded-md p-2 transition-colors">
              <div className="w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <span className="text-white text-sm font-medium">{user?.nome?.charAt(0) || "U"}</span>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-white text-sm">{user?.nome || "Usuário"}</p>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
