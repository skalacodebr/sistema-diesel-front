import ClienteForm from "@/components/clientes/cliente-form"

export default function EditarClientePage({ params }: { params: { slug: string; id: string } }) {
  return <ClienteForm params={{ slug: params.slug, action: params.id }} />
}