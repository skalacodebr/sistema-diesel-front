import FornecedorForm from "@/components/fornecedores/fornecedor-form"

export default function EditarFornecedorPage({ params }: { params: { slug: string; id: string } }) {
  return <FornecedorForm params={{ slug: params.slug, action: params.id }} />
}