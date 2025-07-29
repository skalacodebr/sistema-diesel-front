import OrdemServicoForm from "@/components/ordens-servico/ordem-servico-form"

interface EditarOrdemServicoPageProps {
  params: {
    slug: string
    id: string
  }
}

export default function EditarOrdemServicoPage({ params }: EditarOrdemServicoPageProps) {
  return <OrdemServicoForm params={{ slug: params.slug, action: params.id }} />
}