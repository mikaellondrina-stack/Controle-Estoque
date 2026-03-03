'use client'

import { useEffect, useState } from 'react'
import { firestoreService } from '@/lib/firestore'

interface EstoqueItem {
  id: string
  nome: string
  categoria: string
  entradas: number
  saidas: number
  saldo: number
  status: 'critico' | 'baixo' | 'normal'
  estoqueMinimo: number
  estoqueIdeal: number
}

export default function EstoquePage() {
  const [estoque, setEstoque] = useState<EstoqueItem[]>([])
  const [filteredEstoque, setFilteredEstoque] = useState<EstoqueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterEstoque()
  }, [searchTerm, categoriaFilter, statusFilter, estoque])

  const loadData = async () => {
    try {
      const data = await firestoreService.calcularEstoque()
      setEstoque(data)
      setFilteredEstoque(data)
    } catch (error) {
      console.error('Erro ao carregar estoque:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterEstoque = () => {
    let filtered = [...estoque]

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.nome.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (categoriaFilter) {
      filtered = filtered.filter(item => item.categoria === categoriaFilter)
    }

    if (statusFilter) {
      filtered = filtered.filter(item => item.status === statusFilter)
    }

    setFilteredEstoque(filtered)
  }

  const categorias = [...new Set(estoque.map(item => item.categoria))]

  const stats = {
    totalItems: filteredEstoque.reduce((acc, item) => acc + item.saldo, 0),
    totalProdutos: filteredEstoque.length,
    criticos: filteredEstoque.filter(item => item.status === 'critico').length,
    baixos: filteredEstoque.filter(item => item.status === 'baixo').length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Estoque Atual</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-500 text-sm">Total em Estoque</p>
          <p className="text-3xl font-bold text-gray-800">{stats.totalItems}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-500 text-sm">Produtos</p>
          <p className="text-3xl font-bold text-gray-800">{stats.totalProdutos}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-500 text-sm">Críticos</p>
          <p className="text-3xl font-bold text-danger-600">{stats.criticos}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-500 text-sm">Baixo Estoque</p>
          <p className="text-3xl font-bold text-warning-600">{stats.baixos}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Buscar produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
          />

          <select
            value={categoriaFilter}
            onChange={(e) => setCategoriaFilter(e.target.value)}
            className="input-field"
          >
            <option value="">Todas as categorias</option>
            {categorias.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="">Todos os status</option>
            <option value="critico">Crítico</option>
            <option value="baixo">Baixo</option>
            <option value="normal">Normal</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm('')
              setCategoriaFilter('')
              setStatusFilter('')
            }}
            className="btn-secondary"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Tabela de Estoque */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left py-4 px-6 text-gray-600 font-medium">Produto</th>
                <th className="text-left py-4 px-6 text-gray-600 font-medium">Categoria</th>
                <th className="text-left py-4 px-6 text-gray-600 font-medium">Entradas</th>
                <th className="text-left py-4 px-6 text-gray-600 font-medium">Saídas</th>
                <th className="text-left py-4 px-6 text-gray-600 font-medium">Saldo</th>
                <th className="text-left py-4 px-6 text-gray-600 font-medium">Mínimo</th>
                <th className="text-left py-4 px-6 text-gray-600 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredEstoque.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="py-4 px-6 font-medium">{item.nome}</td>
                  <td className="py-4 px-6">{item.categoria}</td>
                  <td className="py-4 px-6 text-success-600 font-medium">{item.entradas}</td>
                  <td className="py-4 px-6 text-danger-600 font-medium">{item.saidas}</td>
                  <td className={`py-4 px-6 font-bold ${
                    item.status === 'critico' ? 'text-danger-600' :
                    item.status === 'baixo' ? 'text-warning-600' :
                    'text-success-600'
                  }`}>
                    {item.saldo}
                  </td>
                  <td className="py-4 px-6">{item.estoqueMinimo}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      item.status === 'critico' ? 'bg-danger-100 text-danger-600' :
                      item.status === 'baixo' ? 'bg-warning-100 text-warning-600' :
                      'bg-success-100 text-success-600'
                    }`}>
                      {item.status === 'critico' ? 'Crítico' :
                       item.status === 'baixo' ? 'Baixo' : 'Normal'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={7} className="py-4 px-6">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-600">
                      Total de produtos: {filteredEstoque.length}
                    </span>
                    <span className="font-medium text-gray-600">
                      Itens em estoque: {filteredEstoque.reduce((acc, item) => acc + item.saldo, 0)}
                    </span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
