import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

import Login from './pages/Login'
import Deudor from './pages/Deudor'
import Prestamista from './pages/Prestamista'

export default function App() {
  const [cargando, setCargando] = useState(true)
  const [rol, setRol] = useState<string | null>(null)

  useEffect(() => {
    verificarSesion()

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session?.user) {
          setRol(null)
          setCargando(false)
          return
        }

        await obtenerPerfil(session.user.id)
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  async function verificarSesion() {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      setRol(null)
      setCargando(false)
      return
    }

    await obtenerPerfil(session.user.id)
  }

  async function obtenerPerfil(userId: string) {
    const { data: perfil, error } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error obteniendo perfil:', error)
      setRol(null)
      setCargando(false)
      return
    }

    setRol(perfil.rol)
    setCargando(false)
  }

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    )
  }

  if (!rol) {
    return <Login />
  }

  if (rol === 'deudor') {
    return <Deudor />
  }

  if (rol === 'prestamista') {
    return <Prestamista />
  }

  return <Login />
}