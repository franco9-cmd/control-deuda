import { useState } from 'react'

const URL_FUNCION =
  'https://iztqhqnqronzbidmcull.supabase.co/functions/v1/hyper-task'

export default function Registro() {
  const [nombre, setNombre] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)

  async function registrarse(e: React.FormEvent) {
    e.preventDefault()

    setMensaje('')
    setCargando(true)

    try {
      const respuesta = await fetch(URL_FUNCION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          nombre,
          password,
        }),
      })

      const resultado = await respuesta.json()

      if (!respuesta.ok) {
        setMensaje(resultado.error || 'No se pudo crear la cuenta')
        setCargando(false)
        return
      }

      setMensaje('Cuenta creada correctamente. Ya puedes iniciar sesión.')
      setNombre('')
      setUsername('')
      setPassword('')
    } catch {
      setMensaje('No se pudo conectar con el servidor')
    }

    setCargando(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6">
        <h1 className="text-3xl font-bold text-center">
          Crear cuenta
        </h1>

        <p className="text-center mt-2 text-gray-500">
          Regístrate como deudor
        </p>

        <form onSubmit={registrarse} className="mt-8 space-y-4">
          <div>
            <label className="block mb-1">
              Nombre
            </label>

            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Juan Pérez"
              required
            />
          </div>

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
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-black text-white rounded-lg py-2 disabled:opacity-50"
          >
            {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        {mensaje && (
          <p className="mt-4 text-center">
            {mensaje}
          </p>
        )}
      </div>
    </div>
  )
}