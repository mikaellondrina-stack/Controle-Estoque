'use client'

import { useEffect, useState } from 'react'
import { firestoreService, Movimentacao } from '@/lib/firestore'
import { auth } from '@/lib/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { FiSearch, FiTrash2, FiDownload } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function HistoricoPage() {
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([])
  const [filteredMovements, setFilteredMovements] = useState<Movimentacao[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [tipoFilter, setTipoFilter] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [movimentoToDelete, setMovimentoToDelete] = useState<string | null>(null)

  useEffect(() => {
    loadData()
    checkUserAdmin()
  }, [])

  useEffect(() => {
    filterMovements()
  }, [searchTerm, tipoFilter, movimentacoes])

  const loadData = async () => {
    try {
      const data = await firestoreService.getMovimentacoes()
      setMovimentacoes(data)
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkUserAdmin = () => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Verificar se é admin
        setIsAdmin(true) // Simplificado - implementar lógica real
      }
    })
  }

  const filterMovements = () => {
    let filtered = [...movimentacoes]

    if (searchTerm) {
      filtered = filtered.filter(m => 
        m.produtoNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.operador.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (tipoFilter) {
      filtered = filtered.filter(m => m.tipo === tipoFilter)
    }

    setFilteredMovements(filtered)
  }

  const handleDelete = async () => {
    if (!movimentoToDelete) return

    try {
      await firestoreService.deleteMovimentacao(movimentoToDelete)
      toast.success('Movimentação excluída com sucesso!')
      loadData()
    } catch (error) {
      toast.error('Erro ao excluir movimentação')
    } finally {
      setShowConfirmModal(false)
      setMovimentoToDelete(null)
    }
  }

  const exportToCSV = () => {
    const headers = ['Data', 'Hora', 'Produto', 'Categoria', 'Tipo', 'Quantidade', 'Operador', 'Observação']
    const csvData = filteredMovements.map(m => [
      m.data,
      m.hora,
      m.produtoNome,
      m.categoria,
      m.tipo === 'entrada' ? 'Entrada' : 'Saída',
      m.quantidade,
      m.operador,
      m.observacao || ''
    ])

    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `historico_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Histórico de Movimentações</h1>
        <button
          onClick={exportToCSV}
          className="btn-success flex items-center"
        >
          <FiDownload className="mr-2" />
          Exportar CSV
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por produto ou operador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
            className="input-field md:w-48"
          >
            <option value="">Todos os tipos</option>
            <option value="entrada">Entradas</option>
            <option value="saida">Saídas</option>
          </select>
        </div>

        {filteredMovements.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FiSearch className="mx-auto text-4xl mb-3 text-gray-400" />
            <p>Nenhuma movimentação encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Data</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Hora</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Produto</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Categoria</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Tipo</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Quantidade</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Operador</th>
                  {isAdmin && <th className="text-left py-3 px-4 text-gray-600 font-medium">Ações</th>}
                </tr>
              </thead>
              <tbody>
                {filteredMovements.map((mov) => (
                  <tr key={mov.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{new Date(mov.data).toLocaleDateString('pt-BR')}</td>
                    <td className="py-3 px-4">{mov.hora}</td>
                    <td className="py-3 px-4 font-medium">{mov.produtoNome}</td>
                    <td className="py-3 px-4">{mov.categoria}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        mov.tipo === 'entrada' 
                          ? 'bg-success-100 text-success-600' 
                          : 'bg-danger-100 text-danger-600'
                      }`}>
                        {mov.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold">{mov.quantidade}</td>
                    <td className="py-3 px-4">{mov.operador}</td>
                    {isAdmin && (
                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            setMovimentoToDelete(mov.id!)
                            setShowConfirmModal(true)
                          }}
                          className="text-danger-600 hover:text-danger-800"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Confirmação */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Confirmar Exclusão</h3>
            <p className="text-gray-600 mb-6">Tem certeza que deseja excluir esta movimentação?</p>
            <div className="flex space-x-4">
              <button
                onClick={handleDelete}
                className="btn-danger flex-1"
              >
                Sim, Excluir
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false)
                  setMovimentoToDelete(null)
                }}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
