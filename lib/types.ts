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

export interface ColunaConfig {
  key: string
  label: string
  type: "text" | "number" | "currency" | "date" | "status" | "actions"
  sortable?: boolean
  width?: string
}
