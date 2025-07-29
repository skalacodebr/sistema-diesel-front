import ServicoForm from "@/components/servicos/servico-form"

interface EditarServicoPageProps {
  params: {
    slug: string
    id: string
  }
}

export default function EditarServicoPage({ params }: EditarServicoPageProps) {
  return <ServicoForm params={{ slug: params.slug, action: params.id }} />
}