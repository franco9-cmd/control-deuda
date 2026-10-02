import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import Configuracion from './Configuracion'

type Pago = {
  pago_id: string
  deuda_id: string
  monto: number
  estado: string
  created_at: string
  deudor_id: string
  username: string
  nombre: string
  monto_total: number
  saldo: number
}

type Deudor = {
  id: string
  username: string
  nombre: string
}

type PagoHistorial = {
  pago_id: string
  deuda_id: string
  monto: number
  estado: string
  comentario: string | null
  created_at: string
  confirmado_at: string | null
  rechazado_at: string | null
  deudor_id: string
  username: string
  nombre: string
  monto_total: number
  saldo: number
  estado_deuda: string
}

type HistorialDeuda = {
  deuda_id: string
  deudor_id: string
  username: string
  nombre: string
  monto_total: number
  saldo: number
  estado_deuda: string
  pagos: PagoHistorial[]
}

type Deuda = {
  id: string
  deudor_id: string
  monto_total: number
  saldo: number
  estado: string
  created_at: string
}

export default function Prestamista() {
  const [pagos, setPagos] = useState<Pago[]>([])
  const [historialPagos, setHistorialPagos] = useState<PagoHistorial[]>([])
  const [nombre, setNombre] = useState('')
  const [deudores, setDeudores] = useState<Deudor[]>([])
  const [deudas, setDeudas] = useState<Deuda[]>([])
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState('')
  const [pagoRechazo, setPagoRechazo] = useState<string | null>(null)
  const [comentario, setComentario] = useState('')
  const [procesando, setProcesando] = useState<string | null>(null)

  const [deudorSeleccionado, setDeudorSeleccionado] = useState('')
  const [montoDeuda, setMontoDeuda] = useState('')
  const [creandoDeuda, setCreandoDeuda] = useState(false)
  const [mostrarConfiguracion, setMostrarConfiguracion] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    setCargando(true)
    setMensaje('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setMensaje('No hay una sesión activa')
      setCargando(false)
      return
    }

    const { data: perfil, error: perfilError } = await supabase
      .from('perfiles')
      .select('nombre')
      .eq('id', user.id)
      .single()

    if (perfilError) {
      console.error('Error obteniendo perfil:', perfilError)
    } else {
      setNombre(perfil.nombre)
    }

    await cargarPagos()
    await cargarDeudores()
    await cargarDeudas()
    await cargarHistorialPagos()

    setCargando(false)
  }

  async function cargarPagos() {
    const { data, error } = await supabase.rpc(
      'obtener_pagos_pendientes'
    )

    if (error) {
      console.error('Error cargando pagos:', error)
      setMensaje(error.message)
    } else {
      setPagos(data ?? [])
    }
  }

  async function cargarDeudores() {
    const { data, error } = await supabase.rpc(
      'obtener_deudores'
    )

    if (error) {
      console.error('Error cargando deudores:', error)
      setMensaje(error.message)
    } else {
      setDeudores(data ?? [])
    }
  }

  async function cargarDeudas() {
    const { data, error } = await supabase
      .from('deudas')
      .select(
        'id, deudor_id, monto_total, saldo, estado, created_at'
      )
      .order('created_at', {
        ascending: false,
      })

    if (error) {
      console.error('Error cargando deudas:', error)
      setMensaje(error.message)
    } else {
      setDeudas(data ?? [])
    }
  }

  async function cargarHistorialPagos() {
    const { data, error } = await supabase.rpc(
      'obtener_historial_pagos'
    )

    if (error) {
      console.error(
        'Error cargando historial de pagos:',
        error
      )
      setMensaje(error.message)
    } else {
      setHistorialPagos(data ?? [])
    }
  }

  async function crearDeuda() {
    const monto = Number(montoDeuda)

    if (!deudorSeleccionado) {
      setMensaje('Debes seleccionar un deudor')
      return
    }

    if (!monto || monto <= 0) {
      setMensaje('Ingresa un monto válido')
      return
    }

    setCreandoDeuda(true)
    setMensaje('')

    const { error } = await supabase.rpc(
      'crear_deuda',
      {
        p_deudor_id: deudorSeleccionado,
        p_monto: monto,
      }
    )

    if (error) {
      console.error('Error creando deuda:', error)
      setMensaje(error.message)
      setCreandoDeuda(false)
      return
    }

    setDeudorSeleccionado('')
    setMontoDeuda('')
    setMensaje('Deuda creada correctamente')
    setCreandoDeuda(false)

    await cargarDeudas()
  }

  async function confirmarPago(id: string) {
    setMensaje('')
    setProcesando(id)

    const { error } = await supabase.rpc(
      'confirmar_pago',
      {
        p_pago_id: id,
      }
    )

    if (error) {
      console.error('Error confirmando pago:', error)
      setMensaje(error.message)
      setProcesando(null)
      return
    }

    setMensaje('Pago confirmado correctamente')
    setProcesando(null)

    await cargarPagos()
    await cargarDeudas()
    await cargarHistorialPagos()
  }

  async function rechazarPago(id: string) {
    if (!comentario.trim()) {
      setMensaje(
        'Debes escribir un motivo para rechazar el pago'
      )
      return
    }

    setMensaje('')
    setProcesando(id)

    const { error } = await supabase.rpc(
      'rechazar_pago',
      {
        p_pago_id: id,
        p_comentario: comentario.trim(),
      }
    )

    if (error) {
      console.error('Error rechazando pago:', error)
      setMensaje(error.message)
      setProcesando(null)
      return
    }

    setMensaje('Pago rechazado correctamente')
    setPagoRechazo(null)
    setComentario('')
    setProcesando(null)

    await cargarPagos()
    await cargarHistorialPagos()
  }

  async function cerrarSesion() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  function formatoMoneda(valor: number) {
    return new Intl.NumberFormat('es-BO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor)
  }

  function obtenerEstiloEstado(estado: string) {
    if (estado === 'ACTIVA') {
      return 'bg-green-100 text-green-700'
    }

    if (estado === 'PAGADA') {
      return 'bg-blue-100 text-blue-700'
    }

    if (estado === 'CANCELADA') {
      return 'bg-gray-100 text-gray-700'
    }

    return 'bg-gray-100 text-gray-700'
  }

  function obtenerEstiloEstadoPago(estado: string) {
    if (estado === 'CONFIRMADO') {
      return 'bg-green-100 text-green-700'
    }

    if (estado === 'RECHAZADO') {
      return 'bg-red-100 text-red-700'
    }

    if (estado === 'PENDIENTE') {
      return 'bg-yellow-100 text-yellow-700'
    }

    return 'bg-gray-100 text-gray-700'
  }

  function agruparHistorial() {
  const grupos: Record<string, HistorialDeuda> = {}

  historialPagos.forEach((pago) => {
    if (!grupos[pago.deuda_id]) {
      grupos[pago.deuda_id] = {
        deuda_id: pago.deuda_id,
        deudor_id: pago.deudor_id,
        username: pago.username,
        nombre: pago.nombre,
        monto_total: pago.monto_total,
        saldo: pago.saldo,
        estado_deuda: pago.estado_deuda,
        pagos: [],
      }
    }

    grupos[pago.deuda_id].pagos.push(pago)
  })

  return Object.values(grupos)
}

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">
          Cargando...
        </p>
      </div>
    )
  }

  if (mostrarConfiguracion) {
  return (
    <div>
      <Configuracion />

      <div className="text-center pb-8">
        <button
          type="button"
          onClick={() => setMostrarConfiguracion(false)}
          className="text-blue-600"
        >
          Volver al panel
        </button>
      </div>
    </div>
  )
}

  return (
    <div className="min-h-screen bg-gray-50">

      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">

          <div>
            <h1 className="text-2xl font-bold">
              Control de Deudas
            </h1>

            <p className="text-sm text-gray-500">
              Hola, {nombre}
            </p>

            <p className="text-sm text-gray-500">
              Panel del prestamista
            </p>
          </div>

       <div className="flex gap-2">
  <button
    onClick={() => setMostrarConfiguracion(true)}
    className="border px-4 py-2 rounded-lg hover:bg-gray-100"
  >
    Configuración
  </button>

  <button
    onClick={cerrarSesion}
    className="border px-4 py-2 rounded-lg hover:bg-gray-100"
  >
    Cerrar sesión
  </button>
</div>

        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">

        {mensaje && (
          <div className="mb-6 p-4 rounded-lg bg-gray-100">
            {mensaje}
          </div>
        )}

        <section className="bg-white border rounded-xl p-6">

          <h2 className="text-xl font-semibold">
            Nueva deuda
          </h2>

          <p className="mt-1 text-gray-500">
            Registra una nueva deuda asociada a un deudor.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">

            <div>
              <label
                htmlFor="deudor"
                className="block text-sm font-medium mb-1"
              >
                Deudor
              </label>

              <select
                id="deudor"
                value={deudorSeleccionado}
                onChange={(e) =>
                  setDeudorSeleccionado(e.target.value)
                }
                disabled={creandoDeuda}
                className="w-full border rounded-lg px-3 py-2 bg-white"
              >
                <option value="">
                  Selecciona un deudor
                </option>

                {deudores.map((deudor) => (
                  <option
                    key={deudor.id}
                    value={deudor.id}
                  >
                    {deudor.nombre} - {deudor.username}
                  </option>
                ))}

              </select>

            </div>

            <div>
              <label
                htmlFor="montoDeuda"
                className="block text-sm font-medium mb-1"
              >
                Monto de la deuda
              </label>

              <div className="flex">

                <span className="border border-r-0 rounded-l-lg px-3 py-2 bg-gray-50">
                  Bs
                </span>

                <input
                  id="montoDeuda"
                  type="number"
                  min="1"
                  step="1"
                  value={montoDeuda}
                  onChange={(e) =>
                    setMontoDeuda(e.target.value)
                  }
                  placeholder="100"
                  disabled={creandoDeuda}
                  className="w-full border rounded-r-lg px-3 py-2 outline-none focus:ring-2"
                />

              </div>

            </div>

          </div>

          <button
            type="button"
            onClick={crearDeuda}
            disabled={creandoDeuda}
            className="mt-5 bg-black text-white px-5 py-2 rounded-lg disabled:opacity-50"
          >
            {creandoDeuda
              ? 'Creando deuda...'
              : 'Crear deuda'}
          </button>

        </section>

        <section className="mt-8">

          <h2 className="text-xl font-semibold">
            Mis deudas
          </h2>

          <p className="mt-1 text-gray-500">
            Consulta las deudas que has registrado.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">

            {deudas.length === 0 ? (

              <div className="bg-white border rounded-xl p-6 md:col-span-2">
                <p className="text-gray-500">
                  Todavía no has registrado ninguna deuda.
                </p>
              </div>

            ) : (

              deudas.map((deuda) => (

                <div
                  key={deuda.id}
                  className="bg-white border rounded-xl p-6"
                >

                  <div className="flex items-start justify-between gap-4">

                    <div>

                      <p className="text-lg font-semibold">
                        {deudores.find(
                          (deudor) =>
                            deudor.id === deuda.deudor_id
                        )?.nombre ?? 'Deudor'}
                      </p>

                      <p className="text-sm text-gray-500">
                        Usuario:{' '}
                        {deudores.find(
                          (deudor) =>
                            deudor.id === deuda.deudor_id
                        )?.username ?? 'No disponible'}
                      </p>

                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${obtenerEstiloEstado(
                        deuda.estado
                      )}`}
                    >
                      {deuda.estado}
                    </span>

                  </div>

                  <div className="mt-5 space-y-2">

                    <p className="text-sm text-gray-600">
                      Monto original:{' '}
                      <span className="font-semibold text-gray-900">
                        Bs {formatoMoneda(
                          Number(deuda.monto_total)
                        )}
                      </span>
                    </p>

                    <p className="text-sm text-gray-600">
                      Saldo actual:{' '}
                      <span className="font-semibold text-gray-900">
                        Bs {formatoMoneda(
                          Number(deuda.saldo)
                        )}
                      </span>
                    </p>

                    <p className="text-sm text-gray-500">
                      Creada:{' '}
                      {new Date(
                        deuda.created_at
                      ).toLocaleString('es-BO')}
                    </p>

                  </div>

                </div>

              ))

            )}

          </div>

        </section>

        <section className="mt-8">

          <h2 className="text-xl font-semibold">
            Pagos pendientes
          </h2>

          <p className="mt-1 text-gray-500">
            Revisa y procesa los pagos registrados por los deudores.
          </p>

          <div className="mt-6 space-y-4">

            {pagos.length === 0 ? (

              <div className="bg-white border rounded-xl p-6">
                <p className="text-gray-500">
                  No hay pagos pendientes.
                </p>
              </div>

            ) : (

              pagos.map((pago) => (

                <div
                  key={pago.pago_id}
                  className="bg-white border rounded-xl p-6"
                >

                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

                    <div>

                      <p className="text-2xl font-bold">
                        Bs {formatoMoneda(
                          Number(pago.monto)
                        )}
                      </p>

                      <p className="mt-2 text-lg font-semibold">
                        {pago.nombre}
                      </p>

                      <p className="text-sm text-gray-500">
                        Usuario: {pago.username}
                      </p>

                      <p className="mt-3 text-sm text-gray-600">
                        Deuda total: Bs{' '}
                        {formatoMoneda(
                          Number(pago.monto_total)
                        )}
                      </p>

                      <p className="text-sm text-gray-600">
                        Saldo actual: Bs{' '}
                        {formatoMoneda(
                          Number(pago.saldo)
                        )}
                      </p>

                      <p className="mt-2 text-sm text-gray-500">
                        Registrado:{' '}
                        {new Date(
                          pago.created_at
                        ).toLocaleString('es-BO')}
                      </p>

                    </div>

                    <span className="self-start px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
                      Pendiente
                    </span>

                  </div>

                  {pagoRechazo === pago.pago_id ? (

                    <div className="mt-5">

                      <label
                        htmlFor={`comentario-${pago.pago_id}`}
                        className="block text-sm font-medium mb-2"
                      >
                        Motivo del rechazo
                      </label>

                      <textarea
                        id={`comentario-${pago.pago_id}`}
                        value={comentario}
                        onChange={(e) =>
                          setComentario(e.target.value)
                        }
                        placeholder="Escribe el motivo del rechazo"
                        className="w-full border rounded-lg p-3 outline-none focus:ring-2"
                        rows={3}
                        disabled={
                          procesando === pago.pago_id
                        }
                      />

                      <div className="mt-3 flex flex-col sm:flex-row gap-2">

                        <button
                          onClick={() =>
                            rechazarPago(pago.pago_id)
                          }
                          disabled={
                            procesando === pago.pago_id
                          }
                          className="bg-red-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                        >
                          {procesando === pago.pago_id
                            ? 'Procesando...'
                            : 'Confirmar rechazo'}
                        </button>

                        <button
                          onClick={() => {
                            setPagoRechazo(null)
                            setComentario('')
                            setMensaje('')
                          }}
                          disabled={
                            procesando === pago.pago_id
                          }
                          className="border px-4 py-2 rounded-lg disabled:opacity-50"
                        >
                          Cancelar
                        </button>

                      </div>

                    </div>

                  ) : (

                    <div className="mt-5 flex flex-col sm:flex-row gap-2">

                      <button
                        onClick={() =>
                          confirmarPago(pago.pago_id)
                        }
                        disabled={
                          procesando === pago.pago_id
                        }
                        className="bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                      >
                        {procesando === pago.pago_id
                          ? 'Procesando...'
                          : 'Confirmar pago'}
                      </button>

                      <button
                        onClick={() => {
                          setPagoRechazo(pago.pago_id)
                          setComentario('')
                          setMensaje('')
                        }}
                        disabled={
                          procesando === pago.pago_id
                        }
                        className="bg-red-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                      >
                        Rechazar pago
                      </button>

                    </div>

                  )}

                </div>

              ))

            )}

          </div>

        </section>

       <section className="mt-8">
  <h2 className="text-xl font-semibold">
    Historial de pagos
  </h2>

  <p className="mt-1 text-gray-500">
    Consulta las deudas y todos sus pagos registrados.
  </p>

  <div className="mt-6 space-y-6">

    {historialPagos.length === 0 ? (
      <div className="bg-white border rounded-xl p-6">
        <p className="text-gray-500">
          Todavía no hay pagos registrados.
        </p>
      </div>
    ) : (
      agruparHistorial().map((deuda) => (
        <div
          key={deuda.deuda_id}
          className="bg-white border rounded-xl p-6"
        >

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

            <div>
              <h3 className="text-xl font-semibold">
                {deuda.nombre}
              </h3>

              <p className="text-sm text-gray-500">
                Usuario: {deuda.username}
              </p>
            </div>

            <span
              className={`self-start px-3 py-1 rounded-full text-sm font-medium ${obtenerEstiloEstado(
                deuda.estado_deuda
              )}`}
            >
              {deuda.estado_deuda}
            </span>

          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">

            <div>
              <p className="text-sm text-gray-500">
                Deuda total
              </p>

              <p className="text-lg font-semibold">
                Bs {formatoMoneda(Number(deuda.monto_total))}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Saldo actual
              </p>

              <p className="text-lg font-semibold">
                Bs {formatoMoneda(Number(deuda.saldo))}
              </p>
            </div>

          </div>

          <div className="mt-6">

            <h4 className="font-semibold">
              Pagos registrados
            </h4>

            <div className="mt-4 space-y-3">

              {deuda.pagos.map((pago) => (
                <div
                  key={pago.pago_id}
                  className="border rounded-lg p-4"
                >

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                    <div>
                      <p className="text-lg font-semibold">
                        Bs {formatoMoneda(Number(pago.monto))}
                      </p>

                      <p className="text-sm text-gray-500">
                        Registrado:{' '}
                        {new Date(
                          pago.created_at
                        ).toLocaleString('es-BO')}
                      </p>
                    </div>

                    <span
                      className={`self-start px-3 py-1 rounded-full text-sm font-medium ${obtenerEstiloEstadoPago(
                        pago.estado
                      )}`}
                    >
                      {pago.estado}
                    </span>

                  </div>

                  {pago.estado === 'CONFIRMADO' &&
                    pago.confirmado_at && (
                      <p className="mt-2 text-sm text-green-700">
                        Confirmado:{' '}
                        {new Date(
                          pago.confirmado_at
                        ).toLocaleString('es-BO')}
                      </p>
                    )}

                  {pago.estado === 'RECHAZADO' &&
                    pago.rechazado_at && (
                      <p className="mt-2 text-sm text-red-700">
                        Rechazado:{' '}
                        {new Date(
                          pago.rechazado_at
                        ).toLocaleString('es-BO')}
                      </p>
                    )}

                  {pago.estado === 'RECHAZADO' &&
                    pago.comentario && (
                      <div className="mt-3 rounded-lg bg-red-50 border border-red-100 p-3">
                        <p className="text-sm font-semibold text-red-700">
                          Motivo del rechazo
                        </p>

                        <p className="mt-1 text-sm text-red-600">
                          {pago.comentario}
                        </p>
                      </div>
                    )}

                </div>
              ))}

            </div>

          </div>

        </div>
      ))
    )}

  </div>
</section>

      </main>

    </div>
  )
}