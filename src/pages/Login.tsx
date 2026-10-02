import { useState } from 'react'
import { supabase } from '../supabaseClient'
import Registro from './Registro'

export default function Login() {
  const [mostrarRegistro, setMostrarRegistro] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)

  async function iniciarSesion(e: React.FormEvent) {
    e.preventDefault()

    setMensaje('')
    setCargando(true)

    const usuario = username.trim().toLowerCase()
  const emailTecnico = `${usuario}@usuarios.com`

    const { error } = await supabase.auth.signInWithPassword({
      email: emailTecnico,
      password,
    })

    if (error) {
      setMensaje('Usuario o contraseña incorrectos')
    }

    setCargando(false)
  }

  if (mostrarRegistro) {
    return (
      <div>
        <Registro />

        <div className="text-center pb-6">
          <button
            type="button"
            onClick={() => setMostrarRegistro(false)}
            className="text-blue-600"
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6">
        <h1 className="text-3xl font-bold text-center">
          Control de Deudas
        </h1>

        <p className="text-center mt-2 text-gray-500">
          Inicia sesión para continuar
        </p>

        <form onSubmit={iniciarSesion} className="mt-8 space-y-4">
          <div>
            <label className="block mb-1">
              Usuario
            </label>

            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="juan123"
              required
            />
          </div>

          <div>
            <label className="block mb-1">
              Contraseña
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-black text-white rounded-lg py-2 disabled:opacity-50"
          >
            {cargando ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setMostrarRegistro(true)}
            className="text-blue-600"
          >
            ¿No tienes una cuenta? Crear cuenta
          </button>
        </div>

        {mensaje && (
          <p className="mt-4 text-center text-red-500">
            {mensaje}
          </p>
        )}
      </div>
    </div>
  )
}