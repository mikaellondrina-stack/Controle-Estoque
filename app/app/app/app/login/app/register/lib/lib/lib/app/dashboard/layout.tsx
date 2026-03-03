'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { signOut } from '@/lib/auth'
import toast from 'react-hot-toast'
import { 
  FiHome, 
  FiPlusCircle, 
  FiHistory, 
  FiPackage, 
  FiFileText, 
  FiLogOut,
  FiMenu,
  FiX
} from 'react-icons/fi'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login')
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Logout realizado com sucesso!')
      router.push('/login')
    } catch (error) {
      toast.error('Erro ao fazer logout')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const menuItems = [
    { href: '/dashboard', icon: FiHome, label: 'Dashboard' },
    { href: '/dashboard/movimentacao', icon: FiPlusCircle, label: 'Movimentação' },
    { href: '/dashboard/historico', icon: FiHistory, label: 'Histórico' },
    { href: '/dashboard/estoque', icon: FiPackage, label: 'Estoque' },
    { href: '/dashboard/relatorios', icon: FiFileText, label: 'Relatórios' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-primary-600 text-white rounded-lg"
      >
        {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      <div className={`fixed inset-y-0 left-0 transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 transition duration-200 ease-in-out z-30 w-64 bg-primary-800 text-white`}>
        <div className="p-6">
          <Image
            src="https://managing-azure-iu7mo6meja.edgeone.dev/Porter_Horizontal_Preto__1__page-0001-removebg-preview.png"
            alt="Porter"
            width={160}
            height={40}
            className="mb-8 brightness-0 invert"
          />
          
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-primary-700 transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            ))}
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-danger-600 transition-colors text-left"
            >
              <FiLogOut size={20} />
              <span>Sair</span>
            </button>
          </nav>
        </div>
      </div>

      <div className="lg:pl-64">
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
