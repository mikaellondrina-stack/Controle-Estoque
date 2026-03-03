'use client'

import { useEffect, useState } from 'react'
import { firestoreService } from '@/lib/firestore'
import { Produto } from '@/lib/firestore'
import { FiPackage, FiArrowDown, FiArrowUp, FiAlertTriangle } from 'react-icons/fi'

interface EstoqueItem extends Produto {
  entradas: number
  saidas: number
  saldo: number
  status: 'critico' | 'baixo' | 'normal'
}

export default function DashboardPage() {
  const [estoque, setEstoque] = useState<EstoqueItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const data = await firestoreService.calcularEstoque()
      setEstoque(data)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const stats = {
    totalProdutos: estoque.length,
    totalEntradas: estoque.reduce((acc, item) => acc + item.entradas, 0),
    totalSaidas: estoque.reduce((acc, item) => acc + item.saidas, 0),
    produtosCriticos: estoque.filter(item => item.status === 'critico').length,
    saldoTotal: estoque.reduce((acc, item) => acc + item.saldo, 0)
  }

  const produtosCriticos = estoque.filter(item => item.status === 'critico')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total de Produtos</p>
              <p className="text-3xl font-bold text-gray-800">{stats.totalProdutos}</p>
            </div>
            <div className="bg-primary-100 p-3 rounded-lg">
              <FiPackage className="text-primary-600 text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Saldo Total</p>
              <p className="text-3xl font-bold text-gray-800">{stats.saldoTotal}</p>
            </div>
            <div className="bg-success-100 p-3 rounded-lg">
              <FiPackage className="text-success-600 text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Entradas</p>
              <p className="text-3xl font-bold text-success-600">{stats.totalEntradas}</p>
            </div>
            <div className="bg-success-100 p-3 rounded-lg">
              <FiArrowDown className="text-success-600 text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Saídas</p>
              <p className="text-3xl font-bold text-danger-600">{stats.totalSaidas}</p>
            </div>
            <div className="bg-danger-100 p-3 rounded-lg">
              <FiArrowUp className="text-danger-600 text-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Produtos Críticos */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Produtos com Estoque Crítico</h2>
          {produtosCriticos.length > 0 && (
            <span className="bg-danger-100 text-danger-600 px-3 py-1 rounded-full text-sm font-medium">
              {produtosCriticos.length} produtos
            </span>
          )}
        </div>

        {produtosCriticos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FiAlertTriangle className="mx-auto text-4xl mb-3 text-gray-400" />
            <p>Nenhum produto com estoque crítico</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Produto</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Categoria</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Estoque Atual</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Mínimo</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {produtosCriticos.map((produto) => (
                  <tr key={produto.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{produto.nome}</td>
                    <td className="py-3 px-4">{produto.categoria}</td>
                    <td className="py-3 px-4 font-bold text-danger-600">{produto.saldo}</td>
                    <td className="py-3 px-4">{produto.estoqueMinimo}</td>
                    <td className="py-3 px-4">
                      <span className="bg-danger-100 text-danger-600 px-2 py-1 rounded-full text-xs font-medium">
                        Crítico
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Últimas Movimentações */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Últimas Movimentações</h2>
        <div className="text-center py-8 text-gray-500">
          <p>Carregando...</p>
        </div>
      </div>
    </div>
  )
}
