"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Settings, Truck } from "lucide-react"

interface IntegracaoPageProps {
  params: {
    slug: string
  }
}

export default function IntegracaoPage({ params }: IntegracaoPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  // Zé Delivery states
  const [zeDeliveryEmail, setZeDeliveryEmail] = useState("")
  const [zeDeliveryPassword, setZeDeliveryPassword] = useState("")
  const [zeDeliveryLoading, setZeDeliveryLoading] = useState(false)
  
  // iFood states
  const [ifoodEmail, setIfoodEmail] = useState("")
  const [ifoodPassword, setIfoodPassword] = useState("")
  const [ifoodLoading, setIfoodLoading] = useState(false)

  const handleZeDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!zeDeliveryEmail || !zeDeliveryPassword) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos do Zé Delivery.",
      })
      return
    }

    setZeDeliveryLoading(true)
    try {
      // TODO: Implement API call for Zé Delivery integration
      await new Promise(resolve => setTimeout(resolve, 1000)) // Placeholder
      
      toast({
        title: "Zé Delivery configurado",
        description: "Integração com Zé Delivery configurada com sucesso!",
      })
      
      // Clear form
      setZeDeliveryEmail("")
      setZeDeliveryPassword("")
    } catch (error) {
      console.error("Erro ao configurar Zé Delivery:", error)
      toast({
        variant: "destructive",
        title: "Erro na integração",
        description: "Erro ao configurar integração com Zé Delivery.",
      })
    } finally {
      setZeDeliveryLoading(false)
    }
  }

  const handleIfoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!ifoodEmail || !ifoodPassword) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos do iFood.",
      })
      return
    }

    setIfoodLoading(true)
    try {
      // TODO: Implement API call for iFood integration
      await new Promise(resolve => setTimeout(resolve, 1000)) // Placeholder
      
      toast({
        title: "iFood configurado",
        description: "Integração com iFood configurada com sucesso!",
      })
      
      // Clear form
      setIfoodEmail("")
      setIfoodPassword("")
    } catch (error) {
      console.error("Erro ao configurar iFood:", error)
      toast({
        variant: "destructive",
        title: "Erro na integração",
        description: "Erro ao configurar integração com iFood.",
      })
    } finally {
      setIfoodLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Settings className="mr-2 h-6 w-6" />
        <h1 className="text-2xl font-bold">Integrações</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Zé Delivery Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Truck className="mr-2 h-5 w-5 text-green-600" />
              Zé Delivery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleZeDeliverySubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ze-email">Email</Label>
                <Input
                  id="ze-email"
                  type="email"
                  placeholder="Digite seu email do Zé Delivery"
                  value={zeDeliveryEmail}
                  onChange={(e) => setZeDeliveryEmail(e.target.value)}
                  disabled={zeDeliveryLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ze-password">Senha</Label>
                <Input
                  id="ze-password"
                  type="password"
                  placeholder="Digite sua senha do Zé Delivery"
                  value={zeDeliveryPassword}
                  onChange={(e) => setZeDeliveryPassword(e.target.value)}
                  disabled={zeDeliveryLoading}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={zeDeliveryLoading}
              >
                {zeDeliveryLoading ? "Configurando..." : "Configurar Zé Delivery"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* iFood Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <div className="mr-2 h-5 w-5 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">i</span>
              </div>
              iFood
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleIfoodSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ifood-email">Email</Label>
                <Input
                  id="ifood-email"
                  type="email"
                  placeholder="Digite seu email do iFood"
                  value={ifoodEmail}
                  onChange={(e) => setIfoodEmail(e.target.value)}
                  disabled={ifoodLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ifood-password">Senha</Label>
                <Input
                  id="ifood-password"
                  type="password"
                  placeholder="Digite sua senha do iFood"
                  value={ifoodPassword}
                  onChange={(e) => setIfoodPassword(e.target.value)}
                  disabled={ifoodLoading}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={ifoodLoading}
              >
                {ifoodLoading ? "Configurando..." : "Configurar iFood"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">Informações sobre as Integrações</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• As credenciais são utilizadas para sincronizar pedidos automaticamente</li>
          <li>• Mantenha suas senhas atualizadas para evitar interrupções na sincronização</li>
          <li>• Os dados são criptografados e armazenados com segurança</li>
          <li>• Em caso de problemas, verifique se as credenciais estão corretas</li>
        </ul>
      </div>
    </div>
  )
}