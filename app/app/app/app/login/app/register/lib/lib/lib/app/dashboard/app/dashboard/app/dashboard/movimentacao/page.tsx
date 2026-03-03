'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { firestoreService, Produto } from '@/lib/firestore'
import toast from 'react-hot-toast'
import { FiSave, FiX } from 'react-icons/fi'

export default function MovimentacaoPage() {
  const router = useRouter()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    produtoId: '',
    produtoNome: '',
    categoria: '',
    tipo: 'entrada',
    quantidade: 1,
    data: new Date().toISOString().split('T')[0],
    hora: new Date().toTimeString().split(' ')[0].substring(0, 5),
    operador: '',
    observacao: ''
  })

  useEffect(() => {
    loadProdutos()
  }, [])

  const loadProdutos = async () => {
    const data = await firestoreService.getProdutos()
    setProdutos(data)
  }

  const handleProdutoChange = (produtoId: string) => {
    const produto = produtos.find(p => p.id === produtoId)
    if (produto) {
      setFormData({
        ...formData,
        produtoId,
        produtoNome: produto.nome,
        categoria: produto.categoria
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await firestoreService.addMovimentacao(formData)
      toast.success('Movimentação registrada com sucesso!')
      router.push('/dashboard/historico')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao registrar movimentação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Nova Movimentação</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data
            </label>
            <input
              type="date"
              required
              value={formData.data}
              onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hora
            </label>
            <input
              type="time"
              required
              value={formData.hora}
              onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
              className="input-field"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Produto
          </label>
          <select
            required
            value={formData.produtoId}
            onChange={(e) => handleProdutoChange(e.target.value)}
            className="input-field"
          >
            <option value="">Selecione um produto</option>
            {produtos.map((produto) => (
              <option key={produto.id} value={produto.id}>
                {produto.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Movimentação
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="entrada"
                  checked={formData.tipo === 'entrada'}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'entrada' | 'saida' })}
                  className="mr-2"
                />
                <span className="text-success-600 font-medium">Entrada</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="saida"
                  checked={formData.tipo === 'saida'}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'entrada' | 'saida' })}
                  className="mr-2"
                />
                <span className="text-danger-600 font-medium">Saída</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantidade
            </label>
            <input
              type="number"
              min="1"
              required
              value={formData.quantidade}
              onChange={(e) => setFormData({ ...formData, quantidade: parseInt(e.target.value) })}
              className="input-field"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Operador
          </label>
          <input
            type="text"
            required
            value={formData.operador}
            onChange={(e) => setFormData({ ...formData, operador: e.target.value })}
            className="input-field"
            placeholder="Nome do operador"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observação (opcional)
          </label>
          <textarea
            value={formData.observacao}
            onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
            className="input-field"
            rows={3}
            placeholder="Observações sobre a movimentação"
          />
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <FiSave className="mr-2" />
                Salvar Movimentação
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary flex items-center justify-center"
          >
            <FiX className="mr-2" />
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
