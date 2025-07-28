import GrupoClienteForm from "@/components/grupos-clientes/grupo-cliente-form"

export default function EditarGrupoClientePage({ params }: { params: { slug: string; id: string } }) {
  return <GrupoClienteForm params={{ slug: params.slug, action: params.id }} />
}