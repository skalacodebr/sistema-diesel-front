"use client"

import React, { forwardRef } from "react"
import type { OrdemServico, EmpresaMae } from "@/lib/types"

interface OrdemServicoPDFProps {
  ordemServico: OrdemServico
  empresa: EmpresaMae
}

export const OrdemServicoPDF = forwardRef<HTMLDivElement, OrdemServicoPDFProps>(
  ({ ordemServico, empresa }, ref) => {
    // Calculate totals
    const totalProdutos = ordemServico.produtos?.reduce((sum, produto) => 
      sum + (produto.quantidade * produto.valor_unitario), 0) || 0
    
    const totalServicos = ordemServico.servicos?.reduce((sum, servico) => 
      sum + (servico.quantidade * servico.valor_unitario) - (servico.valor_desconto || 0), 0) || 0
    
    const totalGeral = totalProdutos + totalServicos
    const descontoGeral = ordemServico.servicos?.reduce((sum, servico) => 
      sum + (servico.valor_desconto || 0), 0) || 0

    return (
      <div ref={ref} className="bg-white p-6 font-sans text-sm" style={{ width: "210mm", minHeight: "297mm" }}>
        {/* Header */}
        <div className="border-2 border-black">
          {/* Company Header */}
          <div className="border-b border-black p-4">
            <div className="flex">
              {/* Logo */}
              <div className="w-20 h-20 border border-black mr-4 flex items-center justify-center">
                {empresa.logo_url ? (
                  <img 
                    src={`data:image/png;base64,${empresa.logo_url}`} 
                    alt="Logo" 
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span className="text-2xl font-bold">{empresa.nome.charAt(0)}</span>
                )}
              </div>
              
              {/* Company Info */}
              <div className="flex-1">
                <div className="text-center font-bold text-lg mb-2">
                  {empresa.nome.toUpperCase()}
                </div>
                <div className="grid grid-cols-2 gap-x-8 text-sm">
                  <div>
                    <div>AV JULIO MULLER</div>
                    <div>VÁRZEA GRANDE</div>
                    <div>Telefone: {empresa.nome.includes("DIESEL") ? "(65)3694-7962" : ""} Cel:</div>
                    <div>CNPJ: 10780332000190</div>
                  </div>
                  <div>
                    <div>N° 302 Bairro: ALAMEDA</div>
                    <div>Cep: 78115-200 Estado: MT</div>
                    <div>E-Mail: rle.2010@hotmail.com</div>
                    <div>IE: 133701905</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Header */}
          <div className="bg-gray-100 p-2 text-center font-bold text-lg border-b border-black">
            ORDEM DE SERVIÇO Nº: {ordemServico.id}
          </div>

          {/* Customer Info */}
          <div className="border-b border-black">
            <div className="grid grid-cols-12 text-sm">
              <div className="col-span-1 border-r border-black p-2 font-bold">Nome</div>
              <div className="col-span-1 border-r border-black p-2">{ordemServico.id}</div>
              <div className="col-span-4 border-r border-black p-2">{ordemServico.cliente?.razao_social || ordemServico.cliente?.nome_fantasia}</div>
              <div className="col-span-2 border-r border-black p-2 font-bold">Bairro</div>
              <div className="col-span-4 p-2">VITÓRIA-RÉGIA</div>
            </div>
            
            <div className="grid grid-cols-12 text-sm border-t border-black">
              <div className="col-span-2 border-r border-black p-2 font-bold">Endereço</div>
              <div className="col-span-6 border-r border-black p-2">
                {ordemServico.cliente?.enderecos?.[0] ? 
                  `${ordemServico.cliente.enderecos[0].rua}, ${ordemServico.cliente.enderecos[0].numero}` : 
                  "RUA FERREIRA, 26"
                }
              </div>
              <div className="col-span-4 p-2"></div>
            </div>

            <div className="grid grid-cols-12 text-sm border-t border-black">
              <div className="col-span-2 border-r border-black p-2 font-bold">Complemento</div>
              <div className="col-span-2 border-r border-black p-2">SALA A</div>
              <div className="col-span-2 border-r border-black p-2 font-bold">Cidade</div>
              <div className="col-span-2 border-r border-black p-2">CÁCERES</div>
              <div className="col-span-2 border-r border-black p-2 font-bold">Estado</div>
              <div className="col-span-1 border-r border-black p-2">MT</div>
              <div className="col-span-1 p-2 font-bold">Cep</div>
            </div>

            <div className="grid grid-cols-12 text-sm border-t border-black">
              <div className="col-span-1 border-r border-black p-2 font-bold">Telefone</div>
              <div className="col-span-2 border-r border-black p-2">(65)9686-0639</div>
              <div className="col-span-1 border-r border-black p-2 font-bold">Celular</div>
              <div className="col-span-2 border-r border-black p-2"></div>
              <div className="col-span-2 border-r border-black p-2 font-bold">E-Mail</div>
              <div className="col-span-4 p-2"></div>
            </div>

            <div className="grid grid-cols-12 text-sm border-t border-black">
              <div className="col-span-2 border-r border-black p-2 font-bold">CNPJ/CPF</div>
              <div className="col-span-2 border-r border-black p-2">40.553.092/0001-51</div>
              <div className="col-span-2 border-r border-black p-2 font-bold">IE/RG</div>
              <div className="col-span-2 border-r border-black p-2">ISENTO</div>
              <div className="col-span-4 p-2"></div>
            </div>

            <div className="grid grid-cols-12 text-sm border-t border-black">
              <div className="col-span-1 border-r border-black p-2 font-bold">PLACA</div>
              <div className="col-span-2 border-r border-black p-2">NFQ-3A42</div>
              <div className="col-span-1 border-r border-black p-2 font-bold">ANO</div>
              <div className="col-span-2 border-r border-black p-2"></div>
              <div className="col-span-2 border-r border-black p-2 font-bold">KM</div>
              <div className="col-span-4 p-2">114.300</div>
            </div>

            <div className="grid grid-cols-12 text-sm border-t border-black">
              <div className="col-span-2 border-r border-black p-2 font-bold">FABRICANTE</div>
              <div className="col-span-2 border-r border-black p-2">JULIANA</div>
              <div className="col-span-8 p-2"></div>
            </div>

            <div className="grid grid-cols-12 text-sm border-t border-black">
              <div className="col-span-1 border-r border-black p-2 font-bold">MODELO</div>
              <div className="col-span-11 p-2">S10</div>
            </div>

            <div className="grid grid-cols-12 text-sm border-t border-black">
              <div className="col-span-1 border-r border-black p-2 font-bold">Vendedor</div>
              <div className="col-span-4 border-r border-black p-2">MONICA RIBEIRO ROCHA</div>
              <div className="col-span-2 border-r border-black p-2 font-bold">Profissional</div>
              <div className="col-span-5 p-2">MONICA RIBEIRO ROCHA</div>
            </div>

            <div className="grid grid-cols-12 text-sm border-t border-black">
              <div className="col-span-3 border-r border-black p-2 font-bold">Data da Abertura</div>
              <div className="col-span-2 border-r border-black p-2">14/07/2025</div>
              <div className="col-span-3 border-r border-black p-2 font-bold">Data do Encerramento</div>
              <div className="col-span-2 border-r border-black p-2"></div>
              <div className="col-span-2 p-2 font-bold">Data de Garantia</div>
            </div>

            <div className="border-t border-black p-2">
              <div className="font-bold">OBS Solicitação do Cliente</div>
              <div className="mt-1">{ordemServico.observacoes_cliente || ordemServico.descricao}</div>
            </div>
          </div>

          {/* Products Section */}
          {ordemServico.produtos && ordemServico.produtos.length > 0 && (
            <div className="border-b border-black">
              <div className="bg-gray-100 p-2 text-center font-bold">PRODUTO(S)</div>
              <div className="grid grid-cols-12 text-sm font-bold border-b border-black">
                <div className="col-span-1 border-r border-black p-2">Cód.</div>
                <div className="col-span-1 border-r border-black p-2">Produto</div>
                <div className="col-span-3 border-r border-black p-2">Descrição</div>
                <div className="col-span-1 border-r border-black p-2">Localização</div>
                <div className="col-span-2 border-r border-black p-2">Valor Unitário</div>
                <div className="col-span-1 border-r border-black p-2">Quantidade</div>
                <div className="col-span-1 border-r border-black p-2">Desconto</div>
                <div className="col-span-2 p-2">Total Geral</div>
              </div>
              {ordemServico.produtos.map((produto, index) => (
                <div key={index} className="grid grid-cols-12 text-sm border-b border-black">
                  <div className="col-span-1 border-r border-black p-2">{produto.produtos_id}</div>
                  <div className="col-span-1 border-r border-black p-2">{produto.produto?.referencia}</div>
                  <div className="col-span-3 border-r border-black p-2">{produto.produto?.descricao}</div>
                  <div className="col-span-1 border-r border-black p-2">MANTER/OK</div>
                  <div className="col-span-2 border-r border-black p-2">R$ {produto.valor_unitario.toFixed(2)}</div>
                  <div className="col-span-1 border-r border-black p-2">{produto.quantidade}</div>
                  <div className="col-span-1 border-r border-black p-2">0,00</div>
                  <div className="col-span-2 p-2">R$ {(produto.quantidade * produto.valor_unitario).toFixed(2)}</div>
                </div>
              ))}
              <div className="grid grid-cols-12 text-sm font-bold">
                <div className="col-span-8 p-2 text-right">Sub-Total Produto:</div>
                <div className="col-span-2 p-2">0,00</div>
                <div className="col-span-2 p-2">R$ {totalProdutos.toFixed(2)}</div>
              </div>
            </div>
          )}

          {/* Services Section */}
          {ordemServico.servicos && ordemServico.servicos.length > 0 && (
            <div className="border-b border-black">
              <div className="bg-gray-100 p-2 text-center font-bold">SERVIÇO(S)</div>
              <div className="grid grid-cols-12 text-sm font-bold border-b border-black">
                <div className="col-span-1 border-r border-black p-2">Cód.</div>
                <div className="col-span-1 border-r border-black p-2">Serviço</div>
                <div className="col-span-4 border-r border-black p-2">Descrição</div>
                <div className="col-span-1 border-r border-black p-2">Qtd.</div>
                <div className="col-span-1 border-r border-black p-2">Hora</div>
                <div className="col-span-2 border-r border-black p-2">Valor Hora</div>
                <div className="col-span-1 border-r border-black p-2">Desconto</div>
                <div className="col-span-1 p-2">Valor Total</div>
              </div>
              {ordemServico.servicos.map((servico, index) => (
                <div key={index} className="grid grid-cols-12 text-sm border-b border-black">
                  <div className="col-span-1 border-r border-black p-2">{servico.servicos_id}</div>
                  <div className="col-span-1 border-r border-black p-2">{servico.servico?.codigo_servico}</div>
                  <div className="col-span-4 border-r border-black p-2">{servico.servico?.nome}</div>
                  <div className="col-span-1 border-r border-black p-2">{servico.quantidade}</div>
                  <div className="col-span-1 border-r border-black p-2">01:00</div>
                  <div className="col-span-2 border-r border-black p-2">R$ {servico.valor_unitario.toFixed(2)}</div>
                  <div className="col-span-1 border-r border-black p-2">{(servico.valor_desconto || 0).toFixed(2)}</div>
                  <div className="col-span-1 p-2">R$ {((servico.quantidade * servico.valor_unitario) - (servico.valor_desconto || 0)).toFixed(2)}</div>
                </div>
              ))}
              <div className="grid grid-cols-12 text-sm font-bold">
                <div className="col-span-8 p-2 text-right">Sub-Total Serviço:</div>
                <div className="col-span-2 p-2">{descontoGeral.toFixed(2)}</div>
                <div className="col-span-2 p-2">R$ {totalServicos.toFixed(2)}</div>
              </div>
            </div>
          )}

          {/* Payment and Totals */}
          <div className="border-b border-black">
            <div className="grid grid-cols-2">
              <div className="border-r border-black p-2">
                <div className="font-bold mb-2">Forma de Pagamento:</div>
                {ordemServico.formasPagamento?.map((forma, index) => (
                  <div key={index}>{forma.formaPagamento?.nome}</div>
                )) || <div>DINHEIRO</div>}
              </div>
              <div className="p-2">
                <div className="flex justify-between">
                  <span className="font-bold">Sub-Total Geral</span>
                  <span>R$ {totalGeral.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">Desconto Geral</span>
                  <span>R$ {descontoGeral.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total Geral</span>
                  <span>R$ {(totalGeral - descontoGeral).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Declaration */}
          <div className="border-b border-black p-2 text-sm">
            Declaro que o produto acima identificado e consertado foi testado em minha presença, estando em perfeitas condições de funcionamento.
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2">
            <div className="border-r border-black p-4 text-center">
              <div className="border-b border-black pb-2 mb-2"></div>
              <div className="font-bold">Serviço Autorizado</div>
            </div>
            <div className="p-4 text-center">
              <div className="border-b border-black pb-2 mb-2"></div>
              <div className="font-bold">O.S. Finalizada</div>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

OrdemServicoPDF.displayName = "OrdemServicoPDF"