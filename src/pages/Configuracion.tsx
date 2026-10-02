import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Configuracion() {
  const [password, setPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function cambiarPassword(e: React.FormEvent) {
    e.preventDefault()

    setMensaje('')
    setError('')

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (password !== confirmarPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setCargando(true)

    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      setError(error.message)
      setCargando(false)
      return
    }

    setPassword('')
    setConfirmarPassword('')
    setMensaje('Contraseña actualizada correctamente')
    setCargando(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <header className="border-b bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold">
            Configuración de cuenta
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Administra los datos de tu cuenta
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">

        <section className="bg-white border rounded-xl p-6">

          <h2 className="text-xl font-semibold">
            Cambiar contraseña
          </h2>

          <form
            onSubmit={cambiarPassword}
            className="mt-6 space-y-4 max-w-md"
          >

            <div>
              <label className="block mb-1">
                Nueva contraseña
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                minLength={6}
                required
              />
            </div>

            <div>
              <label className="block mb-1">
                Confirmar nueva contraseña
              </label>

              <input
                type="password"
                value={confirmarPassword}
                onChange={(e) =>
                  setConfirmarPassword(e.target.value)
                }
                className="w-full border rounded-lg px-3 py-2"
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="bg-black text-white rounded-lg px-5 py-2 disabled:opacity-50"
            >
              {cargando
                ? 'Actualizando...'
                : 'Cambiar contraseña'}
            </button>

          </form>

          {mensaje && (
            <p className="mt-4 text-green-600">
              {mensaje}
            </p>
          )}

          {error && (
            <p className="mt-4 text-red-600">
              {error}
            </p>
          )}

        </section>

      </main>
    </div>
  )
}