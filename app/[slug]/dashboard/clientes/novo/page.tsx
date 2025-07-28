import ClienteForm from "@/components/clientes/cliente-form"

export default function NovoClientePage({ params }: { params: { slug: string } }) {
  return <ClienteForm params={{ slug: params.slug, action: "novo" }} />
}