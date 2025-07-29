import OrdemServicoForm from "@/components/ordens-servico/ordem-servico-form"

interface NovaOrdemServicoPageProps {
  params: {
    slug: string
  }
}

export default function NovaOrdemServicoPage({ params }: NovaOrdemServicoPageProps) {
  return <OrdemServicoForm params={{ ...params, action: "novo" }} />
}