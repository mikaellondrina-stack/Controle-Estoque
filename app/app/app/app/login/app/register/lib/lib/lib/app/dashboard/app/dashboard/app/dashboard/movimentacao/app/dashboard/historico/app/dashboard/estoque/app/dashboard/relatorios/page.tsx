'use client'

import { useState } from 'react'
import { firestoreService } from '@/lib/firestore'
import PDFService from '@/lib/pdf-service'
import toast from 'react-hot-toast'
import { FiDownload, FiEye, FiPrinter } from 'react-icons/fi'

export default function RelatoriosPage() {
  const [mes, setMes] = useState((new Date().getMonth() + 1).toString())
  const [ano, setAno] = useState(new Date().getFullYear().toString())
  const [loading, setLoading] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString())

  const handleGerarRelatorio = async (action: 'preview' | 'download' | 'print') => {
    setLoading(true)

    try {
      const pdfService = new PDFService()
      const doc = await pdfService.gerarRelatorioSaidas(parseInt(mes), parseInt(ano))

      if (action === 'download') {
        pdfService.downloadPDF(doc, parseInt(mes), parseInt(ano))
        toast.success('PDF gerado com sucesso!')
      } else if (action === 'print') {
        pdfService.previewPDF(doc)
      } else if (action === 'preview') {
        const data = await firestoreService.getMovimentacoes({
          dataInicio: `${ano}-${mes.padStart(2, '0')}-01`,
          dataFim: `${ano}-${mes.padStart(2, '0')}-31`
        })
        setPreviewData(data.filter(m => m.tipo === 'saida'))
      }
    } catch (error) {
      toast.error('Erro ao gerar relatório')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Relatórios Mensais</h1>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mês
            </label>
            <select
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              className="input-field"
            >
              {months.map((month, index) => (
                <option key={index + 1} value={(index + 1).toString()}>
                  {month}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ano
            </label>
            <select
              value={ano}
              onChange={(e) => setAno(e.target.value)}
              className="input-field"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end space-x-2">
            <button
              onClick={() => handleGerarRelatorio('preview')}
              disabled={loading}
              className="btn-secondary flex-1 flex items-center justify-center"
            >
              <FiEye className="mr-2" />
              Visualizar
            </button>
            <button
              onClick={() => handleGerarRelatorio('download')}
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center"
            >
              <FiDownload className="mr-2" />
              Download
            </button>
            <button
              onClick={() => handleGerarRelatorio('print')}
              disabled={loading}
              className="btn-secondary"
            >
              <FiPrinter size={20} />
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Gerando relatório...</p>
          </div>
        )}

        {previewData && !loading && (
          <div className="mt-8 border-t pt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Pré-visualização: {months[parseInt(mes) - 1]} de {ano}
            </h2>

            {previewData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhuma movimentação registrada no período.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Produto</th>
                      <th className="text-left py-2 px-4">Categoria</th>
                      <th className="text-left py-2 px-4">Quantidade</th>
                      <th className="text-left py-2 px-4">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((mov: any) => (
                      <tr key={mov.id} className="border-b">
                        <td className="py-2 px-4">{mov.produtoNome}</td>
                        <td className="py-2 px-4">{mov.categoria}</td>
                        <td className="py-2 px-4 font-bold">{mov.quantidade}</td>
                        <td className="py-2 px-4">{new Date(mov.data).toLocaleDateString('pt-BR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
