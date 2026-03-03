import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { firestoreService } from './firestore'

export default class PDFService {
  private logoUrl = 'https://managing-azure-iu7mo6meja.edgeone.dev/Porter_Horizontal_Preto__1__page-0001-removebg-preview.png'

  async gerarRelatorioSaidas(mes: number, ano: number) {
    const doc = new jsPDF()
    
    // Buscar dados
    const movimentacoes = await firestoreService.getMovimentacoes({
      dataInicio: `${ano}-${mes.toString().padStart(2, '0')}-01`,
      dataFim: `${ano}-${mes.toString().padStart(2, '0')}-31`
    })
    
    const saidas = movimentacoes.filter(m => m.tipo === 'saida')
    const estoque = await firestoreService.calcularEstoque()

    // Agrupar saídas por produto
    const saidasAgrupadas = saidas.reduce((acc: any, mov) => {
      const key = mov.produtoId
      if (!acc[key]) {
        acc[key] = {
          produto: mov.produtoNome,
          categoria: mov.categoria,
          quantidade: 0,
          ultimaData: mov.data
        }
      }
      acc[key].quantidade += mov.quantidade
      if (mov.data > acc[key].ultimaData) {
        acc[key].ultimaData = mov.data
      }
      return acc
    }, {})

    const saidasArray = Object.values(saidasAgrupadas).sort((a: any, b: any) => 
      (b as any).quantidade - (a as any).quantidade
    )

    const totalSaidas = saidasArray.reduce((acc: number, item: any) => acc + item.quantidade, 0)
    const totalEstoque = estoque.reduce((acc, item) => acc + item.saldo, 0)
    const produtosCriticos = estoque.filter(item => item.status === 'critico').length

    // Cabeçalho
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Relatório de Saídas de Estoque', 105, 20, { align: 'center' })

    doc.setFontSize(14)
    doc.setFont('helvetica', 'normal')
    const monthName = this.getMonthName(mes)
    doc.text(`${monthName} de ${ano}`, 105, 30, { align: 'center' })

    doc.setFontSize(10)
    doc.text(`Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 190, 40, { align: 'right' })

    // Cards de resumo
    doc.setFillColor(52, 152, 219)
    doc.roundedRect(20, 50, 40, 20, 3, 3, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.text('Saídas', 22, 58)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(totalSaidas.toString(), 22, 68)

    doc.setFillColor(46, 204, 113)
    doc.roundedRect(70, 50, 40, 20, 3, 3, 'F')
    doc.text('Estoque', 72, 58)
    doc.text(totalEstoque.toString(), 72, 68)

    doc.setFillColor(241, 196, 15)
    doc.roundedRect(120, 50, 40, 20, 3, 3, 'F')
    doc.text('Críticos', 122, 58)
    doc.text(produtosCriticos.toString(), 122, 68)

    doc.setTextColor(0, 0, 0)

    // Tabela de saídas
    if (saidasArray.length === 0) {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'italic')
      doc.text('Nenhuma movimentação registrada no período.', 105, 100, { align: 'center' })
    } else {
      autoTable(doc, {
        startY: 80,
        head: [['Produto', 'Categoria', 'Quantidade', 'Última Saída']],
        body: saidasArray.map((item: any) => [
          item.produto,
          item.categoria,
          item.quantidade.toString(),
          new Date(item.ultimaData).toLocaleDateString('pt-BR')
        ]),
        foot: [[
          'TOTAL',
          '',
          totalSaidas.toString(),
          `${saidasArray.length} produtos`
        ]],
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' }
      })
    }

    // Produtos críticos
    const produtosCriticosLista = estoque.filter(item => item.status === 'critico')
    if (produtosCriticosLista.length > 0) {
      const finalY = (doc as any).lastAutoTable.finalY + 20 || 120
      
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(231, 76, 60)
      doc.text('⚠️ Produtos com Estoque Crítico', 20, finalY)

      autoTable(doc, {
        startY: finalY + 5,
        head: [['Produto', 'Categoria', 'Estoque Atual', 'Mínimo']],
        body: produtosCriticosLista.map(item => [
          item.nome,
          item.categoria,
          item.saldo.toString(),
          item.estoqueMinimo.toString()
        ]),
        theme: 'striped',
        headStyles: { fillColor: [231, 76, 60], textColor: 255 }
      })
    }

    // Rodapé
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(150, 150, 150)
      doc.text(
        'Sistema de Controle de Estoque Porter © 2026',
        105,
        290,
        { align: 'center' }
      )
      doc.text(
        `Página ${i} de ${pageCount}`,
        190,
        290,
        { align: 'right' }
      )
    }

    return doc
  }

  downloadPDF(doc: jsPDF, mes: number, ano: number) {
    const monthName = this.getMonthName(mes).toLowerCase()
    doc.save(`relatorio_estoque_${monthName}_${ano}.pdf`)
  }

  previewPDF(doc: jsPDF) {
    const pdfBlob = doc.output('blob')
    const pdfUrl = URL.createObjectURL(pdfBlob)
    window.open(pdfUrl, '_blank')
  }

  private getMonthName(mes: number): string {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    return months[mes - 1]
  }
}
