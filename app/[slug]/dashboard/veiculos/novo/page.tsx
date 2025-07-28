import VeiculoForm from "@/components/veiculos/veiculo-form"

export default function NovoVeiculoPage({ params }: { params: { slug: string } }) {
  return <VeiculoForm params={{ slug: params.slug, action: "novo" }} />
}