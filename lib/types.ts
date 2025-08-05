export interface EmpresaMae {
  id: number
  nome: string
  logo_url: string // Base64 encoded image
  logo_url_secundaria: string // Base64 encoded image for sidebar
  cor_principal: string
  slug: string
  created_at: string
  updated_at: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  usuario: {
    id: number
    nome: string
    email: string
    ativo: boolean
    funcionarios_id: number | null
    cargos_id: number | null
    created_at: string
    updated_at: string
    cargo: any | null
    funcionario: any | null
  }
  empresa_mae_id: number
}

export interface LoginCredentials {
  email: string
  senha: string
  empresa_mae_id: number
}

export interface Produto {
  id?: number
  descricao: string
  referencia: string
  valor_compra?: number // Novo campo
  valor_custo: number
  percentual_lucro?: number
  percentual_frete?: number
  preco_venda: number
  percentual_despesas_operacionais?: number
  preco_minimo?: number
  preco_maximo?: number
  minimo_para_preco_atacado?: number
  preco_atacado?: number
  percentual_marckup?: number
  estoque_inicial: number
  codigo_barras?: string
  reajuste_automatico?: boolean
  gerenciar_estoque?: boolean
  inativo: boolean
  valor_desconto?: number
  categoria_produtos_id: number
  subcategoria_produtos_id?: number
  marcas_produtos_id: number
  estoque_minimo?: number
  limite_maximo_desconto?: number
  unidade_compra_id?: number
  unidade_venda_id?: number
  conversao_unitaria?: number
  alerta_vencimento?: boolean
  ncm_id?: number
  cest?: string
  referencia_balanca?: string
  percentual_comissao?: number
  envia_controle_pedidos?: boolean
  imagem_url?: string
  atribuir_delivery?: boolean
  atribuir_ecommerce?: boolean
  locacao?: boolean
  composto?: boolean
  derivado_petroleo?: boolean
  largura_cm?: number
  altura_cm?: number
  comprimento_cm?: number
  peso_liquido?: number
  peso_bruto?: number
  lote_vencimento?: string
  observacoes?: string
  created_at?: string
  updated_at?: string
  aliquotas?: AliquotaProduto[]
  empresa_mae_id?: number
}

export interface AliquotaProduto {
  id?: number
  produto_id: number
  csosn_id: number
  cst_pis_id: number
  cst_cofins_id: number
  cst_ipi_id: number
  csosn_exportacao_id?: number
  cfop_saida_interno?: string
  cfop_saida_externo?: string
  percentual_icms: number
  percentual_pis: number
  percentual_cofins: number
  percentual_ipi: number
  percentual_iss?: number
  percentual_reducao_bc?: number
  codigo_beneficio?: string
  origem_produtos_id?: number
  percentual_icms_interestadual?: number
  percentual_icms_interno?: number
  percentual_fcp_interestadual?: number
  cfop_entrada_interno?: string
  cfop_entrada_externo?: string
  cson_entrada_id?: number
  cst_pis_entrada_id?: number
  cst_cofins_entrada_id?: number
  cst_ipi_entrada?: number
  created_at?: string
  updated_at?: string
}

export interface PresetUsuario {
  id?: number
  usuarios_id: number
  nome_entidade: string
  colunas_visiveis: string[]
  usuario?: {
    id: number
    nome: string
  }
  created_at?: string
  updated_at?: string
}

export interface MarcaVeiculo {
  id: number
  nome: string
  created_at?: string
  updated_at?: string
}

export interface ModeloVeiculo {
  id: number
  nome: string
  marcas_veiculos_id: number
  marca?: MarcaVeiculo
  created_at?: string
  updated_at?: string
}

export interface Veiculo {
  id?: number
  placa?: string
  cor?: string
  modelos_veiculos_id: number
  ano_veiculo?: number
  modelo?: {
    id: number
    nome: string
    marca: {
      id: number
      nome: string
    }
  }
  created_at?: string
  updated_at?: string
}

export interface GrupoCliente {
  id?: number
  nome: string
  created_at?: string
  updated_at?: string
}

export interface TipoPessoa {
  id: number
  nome: string
  created_at?: string
  updated_at?: string
}

export interface IndicadorIe {
  id: number
  nome: string
  created_at?: string
  updated_at?: string
}

export interface TipoContato {
  id: number
  nome: string
  created_at?: string
  updated_at?: string
}

export interface TipoEndereco {
  id: number
  nome: string
  created_at?: string
  updated_at?: string
}

export interface TipoRepresentante {
  id: number
  nome: string
  created_at?: string
  updated_at?: string
}

export interface Cliente {
  id?: number
  empresa_mae_id?: number
  grupos_clientes_id?: number
  consumidor_final?: boolean
  imagem_url?: string
  razao_social?: string
  nome_fantasia?: string
  tipo_pessoa_id?: number
  cpf_cnpj?: string
  ie_rg?: string
  indicador_ie_id?: number
  data_nascimento?: string
  contribuinte?: boolean
  produtor_rural?: boolean
  inscricao_municipal?: string
  inscricao_suframa?: number
  isento_icms?: boolean
  isento_ipi?: boolean
  isento_iss?: boolean
  isento_pis?: boolean
  isento_cofins?: boolean
  isento_ii?: boolean
  created_at?: string
  updated_at?: string
  // Relacionamentos (as returned by the API)
  empresa_mae?: EmpresaMae
  grupo_cliente?: GrupoCliente
  tipo_pessoa?: TipoPessoa
  indicador_ie?: IndicadorIe
}

export interface Fornecedor {
  id?: number
  empresa_mae_id?: number
  imagem_url?: string
  razao_social?: string
  nome_fantasia?: string
  tipo_pessoa_id?: number
  cpf_cnpj?: string
  ie_rg?: string
  indicador_ie_id?: number
  data_nascimento?: string
  contribuinte?: boolean
  produtor_rural?: boolean
  inscricao_municipal?: string
  inscricao_suframa?: number
  isento_icms?: boolean
  isento_ipi?: boolean
  isento_iss?: boolean
  isento_pis?: boolean
  isento_cofins?: boolean
  isento_ii?: boolean
  created_at?: string
  updated_at?: string
  // Relacionamentos (as returned by the API in snake_case)
  empresa_mae?: EmpresaMae
  tipo_pessoa?: TipoPessoa
  indicador_ie?: IndicadorIe
  contatos?: FornecedorContato[]
  enderecos?: FornecedorEndereco[]
  tributacao?: FornecedorTributacao[]
  representantes?: FornecedorRepresentante[]
  dadosBancarios?: FornecedorDadoBancario[]
}

export interface FornecedorContato {
  id?: number
  fornecedores_id: number
  tipos_contatos_id?: number
  email?: string
  telefone?: string
  celular?: string
  created_at?: string
  updated_at?: string
  fornecedor?: Fornecedor
  tipoContato?: TipoContato
}

export interface FornecedorTributacao {
  id?: number
  fornecedores_id: number
  iva?: string
  csosn_id?: number
  carga_tributaria_percentual?: number
  fornecedor_desde?: string
  created_at?: string
  updated_at?: string
  fornecedor?: Fornecedor
  csosn?: any
}

export interface FornecedorEndereco {
  id?: number
  fornecedores_id: number
  tipos_endereco_id?: number
  cep?: string
  pais?: string
  estado?: string
  cidade?: string
  bairro?: string
  rua?: string
  numero?: number
  complemento?: string
  created_at?: string
  updated_at?: string
  fornecedor?: Fornecedor
  tipoEndereco?: TipoEndereco
}

export interface FornecedorRepresentante {
  id?: number
  fornecedores_id: number
  tipos_representantes_id?: number
  nome?: string
  documento?: string
  created_at?: string
  updated_at?: string
  fornecedor?: Fornecedor
  tipoRepresentante?: TipoRepresentante
}

export interface FornecedorDadoBancario {
  id?: number
  fornecedores_id: number
  banco?: string
  agencia?: number
  numero_conta?: number
  tipos_contas_bancarias_id?: number
  chave_pix?: string
  created_at?: string
  updated_at?: string
  fornecedor?: Fornecedor
  tipoContaBancaria?: any
}

export interface Usuario {
  id: number
  nome: string
  email: string
  ativo: boolean
  funcionarios_id?: number
  cargos_id?: number
  created_at?: string
  updated_at?: string
  cargo?: any
  funcionario?: any
  tem_conversa?: boolean
}

export interface ChatMensagem {
  id?: number
  remetente_id: number
  destinatario_id: number
  mensagem: string
  lida?: boolean
  created_at?: string
  updated_at?: string
  deleted_at?: string
  // Relacionamentos
  remetente?: Usuario
  destinatario?: Usuario
}

export interface Conversa {
  id?: number
  remetente_id: number
  destinatario_id: number
  mensagem: string
  lida?: boolean
  created_at?: string
  updated_at?: string
  remetente?: Usuario
  destinatario?: Usuario
}

export interface MensagensNaoLidas {
  total: number
  por_usuario: {
    remetente_id: number
    total: number
    remetente?: Usuario
  }[]
}

export interface ColunaConfig {
  key: string
  label: string
  type: "text" | "number" | "currency" | "date" | "status" | "actions"
  sortable?: boolean
  width?: string
}

// Serviços e Ordens de Serviço

export interface CategoriaServico {
  id: number
  nome: string
  created_at?: string
  updated_at?: string
}

export interface UnidadeCobranca {
  id: number
  nome: string
  created_at?: string
  updated_at?: string
}

export interface Servico {
  id?: number
  empresa_mae_id?: number
  categorias_servicos_id?: number
  nome: string
  valor_unitario?: number
  tempo_servico_minutos?: number
  percentual_comissao?: number
  unidades_cobranca_id?: number
  tempo_adicional?: number
  valor_adicional?: number
  tempo_tolerancia?: number
  codigo_servico?: number
  percentual_iss?: number
  percentual_pis?: number
  percentual_cofins?: number
  percentual_inss?: number
  limite_maximo_desconto?: number
  created_at?: string
  updated_at?: string
  // Relacionamentos
  categoriaServico?: CategoriaServico
  unidadeCobranca?: UnidadeCobranca
}

export interface StatusOrdemServico {
  id: number
  nome: string
  created_at?: string
  updated_at?: string
}

export interface OrdemServico {
  id?: number
  clientes_id?: number
  nome: string
  descricao?: string
  valor_total_servicos?: number
  valor_total_produtos?: number
  status?: string
  data_emissao?: string
  valor_total?: number
  observacoes_cliente?: string
  observacoes_internas?: string
  status_ordens_servico_id?: number
  created_at?: string
  updated_at?: string
  // Relacionamentos
  cliente?: Cliente
  statusOrdemServico?: StatusOrdemServico
  servicos?: OrdemServicoServico[]
  produtos?: OrdemServicoProduto[]
  funcionarios?: OrdemServicoFuncionario[]
  formasPagamento?: OrdemServicoFormaPagamento[]
  feedback?: OrdemServicoFeedback[]
}

export interface OrdemServicoServico {
  id?: number
  ordens_servico_id: number
  servicos_id: number
  quantidade: number
  valor_unitario: number
  valor_desconto?: number
  created_at?: string
  updated_at?: string
  // Relacionamentos
  ordemServico?: OrdemServico
  servico?: Servico
  aprovacaoDesconto?: AprovacaoDescontoOrdemServicoServico
}

export interface OrdemServicoProduto {
  id?: number
  ordens_servico_id: number
  produtos_id: number
  quantidade: number
  valor_unitario: number
  created_at?: string
  updated_at?: string
  // Relacionamentos
  ordemServico?: OrdemServico
  produto?: Produto
  aprovacaoDesconto?: AprovacaoDescontoOrdemServicoProduto
}

export interface OrdemServicoFuncionario {
  id?: number
  ordens_servico_id: number
  funcionarios_id: number
  created_at?: string
  updated_at?: string
  // Relacionamentos
  ordemServico?: OrdemServico
  funcionario?: any
}

export interface FormaPagamento {
  id: number
  nome: string
  created_at?: string
  updated_at?: string
}

export interface OrdemServicoFormaPagamento {
  id?: number
  ordens_servico_id: number
  formas_pagamento_id: number
  valor: number
  created_at?: string
  updated_at?: string
  // Relacionamentos
  ordemServico?: OrdemServico
  formaPagamento?: FormaPagamento
}

export interface OrdemServicoFeedback {
  id?: number
  ordens_servico_id: number
  clientes_id: number
  descricao: string
  created_at?: string
  updated_at?: string
  // Relacionamentos
  ordemServico?: OrdemServico
  cliente?: Cliente
}

export interface AprovacaoDescontoOrdemServicoServico {
  id?: number
  ordens_servico_servicos_id: number
  aprovado: boolean
  created_at?: string
  updated_at?: string
  // Relacionamentos
  ordemServicoServico?: OrdemServicoServico
}

export interface AprovacaoDescontoOrdemServicoProduto {
  id?: number
  ordens_servico_produtos_id: number
  aprovado: boolean
  created_at?: string
  updated_at?: string
  // Relacionamentos
  ordemServicoProduto?: OrdemServicoProduto
}

// Kanban Types
export interface KanbanCard {
  id?: number
  titulo: string
  descricao?: string
  coluna_id: number
  ordem?: number
  cor?: string
  data_vencimento?: string
  created_at?: string
  updated_at?: string
  // Relacionamentos
  coluna?: KanbanColuna
}

export interface KanbanColuna {
  id?: number
  nome: string
  ordem?: number
  cor?: string
  limite_cards?: number
  created_at?: string
  updated_at?: string
  // Relacionamentos
  cards?: KanbanCard[]
}

export interface KanbanData {
  colunas: KanbanColuna[]
  cards: KanbanCard[]
}

export interface MoveCardData {
  card_id: number
  coluna_destino_id: number
  nova_ordem?: number
}

// Checklist Types
export interface ChecklistTemplate {
  id?: number
  nome: string
  descricao?: string
  itens: ChecklistTemplateItem[]
  created_at?: string
  updated_at?: string
}

export interface ChecklistTemplateItem {
  id?: number
  template_id?: number
  pergunta: string
  tipo_resposta: 'sim_nao' | 'texto' | 'numerico' | 'multipla_escolha'
  obrigatoria: boolean
  opcoes?: string[] // Para múltipla escolha
  ordem?: number
  created_at?: string
  updated_at?: string
}

export interface Checklist {
  id?: number
  template_id: number
  veiculo_id?: number
  funcionario_id?: number
  status: 'iniciado' | 'em_andamento' | 'finalizado'
  data_inicio?: string
  data_finalizacao?: string
  observacoes?: string
  created_at?: string
  updated_at?: string
  // Relacionamentos
  template?: ChecklistTemplate
  veiculo?: Veiculo
  funcionario?: any
  respostas?: ChecklistResposta[]
}

export interface ChecklistResposta {
  id?: number
  checklist_id: number
  item_id: number
  resposta: string | boolean | number
  observacao?: string
  created_at?: string
  updated_at?: string
  // Relacionamentos
  checklist?: Checklist
  item?: ChecklistTemplateItem
}

export interface ChecklistStats {
  total: number
  iniciados: number
  em_andamento: number
  finalizados: number
}

export interface StartChecklistData {
  template_id: number
  veiculo_id?: number
  funcionario_id?: number
  observacoes?: string
}
