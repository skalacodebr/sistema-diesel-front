"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { isAuthenticated } from "@/lib/auth"
import ProdutoForm from "@/components/produtos/produto-form"

interface EditProdutoPageProps {
  params: {
    slug: string
    id: string
  }
}

export default function EditProdutoPage({ params }: EditProdutoPageProps) {
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      router.push(`/${params.slug}/login`)
    }
  }, [params.slug, router])

  return <ProdutoForm params={{ slug: params.slug, action: params.id }} />
}
