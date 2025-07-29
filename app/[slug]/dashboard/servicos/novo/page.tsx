import ServicoForm from "@/components/servicos/servico-form"

interface NovoServicoPageProps {
  params: {
    slug: string
  }
}

export default function NovoServicoPage({ params }: NovoServicoPageProps) {
  return <ServicoForm params={{ ...params, action: "novo" }} />
}