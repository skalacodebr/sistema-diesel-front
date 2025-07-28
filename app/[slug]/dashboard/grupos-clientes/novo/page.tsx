import GrupoClienteForm from "@/components/grupos-clientes/grupo-cliente-form"

export default function NovoGrupoClientePage({ params }: { params: { slug: string } }) {
  return <GrupoClienteForm params={{ slug: params.slug, action: "novo" }} />
}