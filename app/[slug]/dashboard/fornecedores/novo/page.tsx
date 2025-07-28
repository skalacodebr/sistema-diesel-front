import FornecedorForm from "@/components/fornecedores/fornecedor-form"

export default function NovoFornecedorPage({ params }: { params: { slug: string } }) {
  return <FornecedorForm params={{ slug: params.slug, action: "novo" }} />
}