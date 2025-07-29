"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getToken, isAuthenticated } from "@/lib/auth"
import { getFornecedor } from "@/lib/api"
import type { Fornecedor } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Edit, Truck, Check, X } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface FornecedorViewPageProps {
  params: {
    slug: string
    id: string
  }
}

export default function FornecedorViewPage({ params }: FornecedorViewPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [fornecedor, setFornecedor] = useState<Fornecedor | null>(null)
  const [loading, setLoading] = useState(true)
  const fornecedorId = Number(params.id)

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      if (!isAuthenticated()) {
        router.push(`/${params.slug}/login`)
        return
      }

      await fetchFornecedor()
    }

    checkAuthAndFetchData()
  }, [params.slug, router])

  const fetchFornecedor = async () => {
    setLoading(true)
    try {
      const token = getToken()
      if (!token) {
        throw new Error("Token não encontrado")
      }

      const data = await getFornecedor(fornecedorId, token)
      setFornecedor(data)
    } catch (error) {
      console.error("Erro ao buscar fornecedor:", error)
      toast({
        variant: "destructive",
        title: "Erro ao carregar fornecedor",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
      })
    } finally {
      setLoading(false)
    }
  }

  const StatusIcon = ({ value }: { value: boolean | undefined }) => {
    return value ? (
      <Check className="h-4 w-4 text-green-600" />
    ) : (
      <X className="h-4 w-4 text-red-600" />
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Carregando...</p>
      </div>
    )
  }

  if (!fornecedor) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${params.slug}/dashboard/fornecedores`)}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Fornecedor não encontrado</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${params.slug}/dashboard/fornecedores`)}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Truck className="mr-2 h-6 w-6" />
          <h1 className="text-2xl font-bold">Detalhes do Fornecedor</h1>
        </div>
        <Button onClick={() => router.push(`/${params.slug}/dashboard/fornecedores/${fornecedor.id}/editar`)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>ID:</strong> {fornecedor.id}
            </div>
            <div>
              <strong>Razão Social:</strong> {fornecedor.razao_social || "Não informado"}
            </div>
            <div>
              <strong>Nome Fantasia:</strong> {fornecedor.nome_fantasia || "Não informado"}
            </div>
            <div>
              <strong>CPF/CNPJ:</strong> {fornecedor.cpf_cnpj || "Não informado"}
            </div>
            <div>
              <strong>Tipo de Pessoa:</strong> {fornecedor.tipo_pessoa?.nome || "Não informado"}
            </div>
            <div>
              <strong>Data de Nascimento:</strong>{" "}
              {fornecedor.data_nascimento
                ? format(new Date(fornecedor.data_nascimento), "dd/MM/yyyy", { locale: ptBR })
                : "Não informado"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações Fiscais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>IE/RG:</strong> {fornecedor.ie_rg || "Não informado"}
            </div>
            <div>
              <strong>Indicador IE:</strong> {fornecedor.indicador_ie?.nome || "Não informado"}
            </div>
            <div>
              <strong>Inscrição Municipal:</strong> {fornecedor.inscricao_municipal || "Não informado"}
            </div>
            <div>
              <strong>Inscrição SUFRAMA:</strong> {fornecedor.inscricao_suframa || "Não informado"}
            </div>
            <div className="flex items-center gap-2">
              <strong>Contribuinte:</strong>
              <StatusIcon value={fornecedor.contribuinte} />
              <span>{fornecedor.contribuinte ? "Sim" : "Não"}</span>
            </div>
            <div className="flex items-center gap-2">
              <strong>Produtor Rural:</strong>
              <StatusIcon value={fornecedor.produtor_rural} />
              <span>{fornecedor.produtor_rural ? "Sim" : "Não"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Isenções Fiscais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <strong>Isento de ICMS:</strong>
              <StatusIcon value={fornecedor.isento_icms} />
              <span>{fornecedor.isento_icms ? "Sim" : "Não"}</span>
            </div>
            <div className="flex items-center gap-2">
              <strong>Isento de IPI:</strong>
              <StatusIcon value={fornecedor.isento_ipi} />
              <span>{fornecedor.isento_ipi ? "Sim" : "Não"}</span>
            </div>
            <div className="flex items-center gap-2">
              <strong>Isento de ISS:</strong>
              <StatusIcon value={fornecedor.isento_iss} />
              <span>{fornecedor.isento_iss ? "Sim" : "Não"}</span>
            </div>
            <div className="flex items-center gap-2">
              <strong>Isento de PIS:</strong>
              <StatusIcon value={fornecedor.isento_pis} />
              <span>{fornecedor.isento_pis ? "Sim" : "Não"}</span>
            </div>
            <div className="flex items-center gap-2">
              <strong>Isento de COFINS:</strong>
              <StatusIcon value={fornecedor.isento_cofins} />
              <span>{fornecedor.isento_cofins ? "Sim" : "Não"}</span>
            </div>
            <div className="flex items-center gap-2">
              <strong>Isento de II:</strong>
              <StatusIcon value={fornecedor.isento_ii} />
              <span>{fornecedor.isento_ii ? "Sim" : "Não"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Contatos */}
        {fornecedor.contatos && fornecedor.contatos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Contatos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {fornecedor.contatos.map((contato, index) => (
                <div key={contato.id || index} className="border-b pb-2 last:border-b-0">
                  <div><strong>Tipo:</strong> {contato.tipoContato?.nome || "Não informado"}</div>
                  {contato.email && <div><strong>Email:</strong> {contato.email}</div>}
                  {contato.telefone && <div><strong>Telefone:</strong> {contato.telefone}</div>}
                  {contato.celular && <div><strong>Celular:</strong> {contato.celular}</div>}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Endereços */}
        {fornecedor.enderecos && fornecedor.enderecos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Endereços</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {fornecedor.enderecos.map((endereco, index) => (
                <div key={endereco.id || index} className="border-b pb-2 last:border-b-0">
                  <div><strong>Tipo:</strong> {endereco.tipoEndereco?.nome || "Não informado"}</div>
                  {endereco.cep && <div><strong>CEP:</strong> {endereco.cep}</div>}
                  {endereco.rua && <div><strong>Rua:</strong> {endereco.rua}, {endereco.numero || "S/N"}</div>}
                  {endereco.bairro && <div><strong>Bairro:</strong> {endereco.bairro}</div>}
                  {endereco.cidade && <div><strong>Cidade:</strong> {endereco.cidade} - {endereco.estado}</div>}
                  {endereco.complemento && <div><strong>Complemento:</strong> {endereco.complemento}</div>}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Representantes */}
        {fornecedor.representantes && fornecedor.representantes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Representantes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {fornecedor.representantes.map((representante, index) => (
                <div key={representante.id || index} className="border-b pb-2 last:border-b-0">
                  <div><strong>Tipo:</strong> {representante.tipoRepresentante?.nome || "Não informado"}</div>
                  {representante.nome && <div><strong>Nome:</strong> {representante.nome}</div>}
                  {representante.documento && <div><strong>Documento:</strong> {representante.documento}</div>}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Dados Bancários */}
        {fornecedor.dadosBancarios && fornecedor.dadosBancarios.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Dados Bancários</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {fornecedor.dadosBancarios.map((dados, index) => (
                <div key={dados.id || index} className="border-b pb-2 last:border-b-0">
                  <div><strong>Tipo de Conta:</strong> {dados.tipoContaBancaria?.nome || "Não informado"}</div>
                  {dados.banco && <div><strong>Banco:</strong> {dados.banco}</div>}
                  {dados.agencia && <div><strong>Agência:</strong> {dados.agencia}</div>}
                  {dados.numero_conta && <div><strong>Conta:</strong> {dados.numero_conta}</div>}
                  {dados.chave_pix && <div><strong>Chave PIX:</strong> {dados.chave_pix}</div>}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Tributação */}
        {fornecedor.tributacao && fornecedor.tributacao.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Informações de Tributação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {fornecedor.tributacao.map((trib, index) => (
                <div key={trib.id || index} className="border-b pb-2 last:border-b-0">
                  {trib.iva && <div><strong>IVA:</strong> {trib.iva}</div>}
                  <div><strong>CSOSN:</strong> {trib.csosn?.nome || "Não informado"}</div>
                  {trib.carga_tributaria_percentual && (
                    <div><strong>Carga Tributária:</strong> {trib.carga_tributaria_percentual}%</div>
                  )}
                  {trib.fornecedor_desde && (
                    <div><strong>Fornecedor desde:</strong> {format(new Date(trib.fornecedor_desde), "dd/MM/yyyy", { locale: ptBR })}</div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Informações do Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>Data de Cadastro:</strong>{" "}
              {fornecedor.created_at
                ? format(new Date(fornecedor.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                : "Não informado"}
            </div>
            <div>
              <strong>Última Atualização:</strong>{" "}
              {fornecedor.updated_at
                ? format(new Date(fornecedor.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                : "Não informado"}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}