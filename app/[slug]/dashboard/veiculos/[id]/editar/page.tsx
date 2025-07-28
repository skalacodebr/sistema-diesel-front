import VeiculoForm from "@/components/veiculos/veiculo-form"

export default function EditarVeiculoPage({ params }: { params: { slug: string; id: string } }) {
  return <VeiculoForm params={{ slug: params.slug, action: params.id }} />
}