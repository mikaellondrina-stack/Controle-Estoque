import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
  onSnapshot,
  DocumentData,
  QuerySnapshot
} from 'firebase/firestore'
import { db } from './firebase'
import { auth } from './firebase'

export interface Produto {
  id?: string
  nome: string
  categoria: string
  estoqueMinimo: number
  estoqueIdeal: number
  ativo: boolean
  criadoEm?: string
  criadoPor?: string
}

export interface Movimentacao {
  id?: string
  produtoId: string
  produtoNome: string
  categoria: string
  tipo: 'entrada' | 'saida'
  quantidade: number
  data: string
  hora: string
  operador: string
  observacao?: string
  criadoPor?: string
  criadoEm?: string
}

export interface Categoria {
  id?: string
  nome: string
  cor: string
  icone: string
}

export const firestoreService = {
  // PRODUTOS
  async getProdutos() {
    const q = query(collection(db, 'produtos'), where('ativo', '==', true), orderBy('nome'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Produto))
  },

  async getProduto(id: string) {
    const docRef = doc(db, 'produtos', id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Produto
    }
    return null
  },

  async addProduto(produto: Omit<Produto, 'id' | 'criadoEm' | 'criadoPor'>) {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não autenticado')

    const docRef = await addDoc(collection(db, 'produtos'), {
      ...produto,
      ativo: true,
      criadoEm: new Date().toISOString(),
      criadoPor: user.uid
    })
    return docRef.id
  },

  async updateProduto(id: string, updates: Partial<Produto>) {
    const docRef = doc(db, 'produtos', id)
    await updateDoc(docRef, updates)
  },

  async deleteProduto(id: string) {
    const docRef = doc(db, 'produtos', id)
    await updateDoc(docRef, { ativo: false })
  },

  // MOVIMENTAÇÕES
  async getMovimentacoes(filtros?: { dataInicio?: string; dataFim?: string; tipo?: string }) {
    let q = query(collection(db, 'movimentacoes'), orderBy('data', 'desc'), orderBy('hora', 'desc'))
    
    if (filtros?.dataInicio && filtros?.dataFim) {
      q = query(q, where('data', '>=', filtros.dataInicio), where('data', '<=', filtros.dataFim))
    }
    if (filtros?.tipo) {
      q = query(q, where('tipo', '==', filtros.tipo))
    }
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Movimentacao))
  },

  async addMovimentacao(movimento: Omit<Movimentacao, 'id' | 'criadoEm' | 'criadoPor'>) {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não autenticado')

    const docRef = await addDoc(collection(db, 'movimentacoes'), {
      ...movimento,
      criadoEm: new Date().toISOString(),
      criadoPor: user.uid
    })
    return docRef.id
  },

  async deleteMovimentacao(id: string) {
    const docRef = doc(db, 'movimentacoes', id)
    await deleteDoc(docRef)
  },

  // CATEGORIAS
  async getCategorias() {
    const snapshot = await getDocs(collection(db, 'categorias'))
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Categoria))
  },

  // LISTENERS EM TEMPO REAL
  listenProdutos(callback: (produtos: Produto[]) => void) {
    const q = query(collection(db, 'produtos'), where('ativo', '==', true), orderBy('nome'))
    return onSnapshot(q, (snapshot) => {
      const produtos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Produto))
      callback(produtos)
    })
  },

  listenMovimentacoes(callback: (movimentacoes: Movimentacao[]) => void, limite = 100) {
    const q = query(collection(db, 'movimentacoes'), orderBy('data', 'desc'), orderBy('hora', 'desc'))
    return onSnapshot(q, (snapshot) => {
      const movimentacoes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Movimentacao))
      callback(movimentacoes.slice(0, limite))
    })
  },

  // CÁLCULOS
  async calcularEstoque() {
    const produtos = await this.getProdutos()
    const movimentacoes = await this.getMovimentacoes()
    
    const estoque = produtos.map(produto => {
      const movs = movimentacoes.filter(m => m.produtoId === produto.id)
      const entradas = movs.filter(m => m.tipo === 'entrada').reduce((acc, m) => acc + m.quantidade, 0)
      const saidas = movs.filter(m => m.tipo === 'saida').reduce((acc, m) => acc + m.quantidade, 0)
      const saldo = entradas - saidas
      
      return {
        ...produto,
        entradas,
        saidas,
        saldo,
        status: saldo <= produto.estoqueMinimo ? 'critico' : 
                saldo <= produto.estoqueIdeal ? 'baixo' : 'normal'
      }
    })
    
    return estoque
  },

  // MIGRAÇÃO
  async migrarDadosLocais(dados: any) {
    const batch = writeBatch(db)
    const resultados = { produtos: 0, movimentacoes: 0, erros: [] }

    try {
      if (dados.produtos) {
        for (const produto of dados.produtos) {
          const docRef = doc(collection(db, 'produtos'))
          batch.set(docRef, {
            ...produto,
            migrado: true,
            migradoEm: new Date().toISOString()
          })
          resultados.produtos++
        }
      }

      if (dados.movements) {
        for (const mov of dados.movements) {
          const docRef = doc(collection(db, 'movimentacoes'))
          batch.set(docRef, {
            ...mov,
            migrado: true,
            migradoEm: new Date().toISOString()
          })
          resultados.movimentacoes++
        }
      }

      await batch.commit()
      return resultados
    } catch (error) {
      console.error('Erro na migração:', error)
      throw error
    }
  }
}
