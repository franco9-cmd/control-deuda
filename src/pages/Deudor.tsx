import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

type Deuda = {
  id: string
  monto_total: number
  saldo: number
  estado: string
}

type Pago = {
  id: string
  deuda_id: string
  monto: number
  estado: string
  comentario: string | null
  created_at: string
  confirmado_at: string | null
  rechazado_at: string | null
}

export default function Deudor() {
  const [nombre, setNombre] = useState('')
  const [deudas, setDeudas] = useState<Deuda[]>([])
  const [pagos, setPagos] = useState<Pago[]>([])
  const [montoPago, setMontoPago] = useState('')
  const [deudaSeleccionada, setDeudaSeleccionada] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [registrando, setRegistrando] = useState(false)
  const [mensaje, setMensaje] = useState('')

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

    const { data: deudasData, error: deudasError } = await supabase
      .from('deudas')
      .select('id, monto_total, saldo, estado')
      .eq('deudor_id', user.id)
      .order('created_at', {
        ascending: false,
      })

    if (deudasError) {
      console.error('Error obteniendo deudas:', deudasError)
      setMensaje('No se pudieron cargar las deudas')
      setCargando(false)
      return
    }

    const deudasActuales = deudasData ?? []

    setDeudas(deudasActuales)

    if (deudasActuales.length > 0) {
      const idsDeudas = deudasActuales.map(
        (deuda) => deuda.id
      )

      const { data: pagosData, error: pagosError } =
        await supabase
          .from('pagos')
         .select(
  'id, deuda_id, monto, estado, comentario, created_at, confirmado_at, rechazado_at'
)
          .in('deuda_id', idsDeudas)
          .order('created_at', {
            ascending: false,
          })

      if (pagosError) {
        console.error(
          'Error obteniendo pagos:',
          pagosError
        )

        setMensaje('No se pudieron cargar los pagos')
      } else {
        setPagos(pagosData ?? [])
      }
    } else {
      setPagos([])
    }

    setCargando(false)
  }

  async function registrarPago(
    e: React.FormEvent
  ) {
    e.preventDefault()

    const monto = Number(montoPago)

    if (!monto || monto <= 0) {
      setMensaje('Ingresa un monto válido')
      return
    }

    if (!deudaSeleccionada) {
      setMensaje('Selecciona una deuda')
      return
    }

    const deuda = deudas.find(
      (item) => item.id === deudaSeleccionada
    )

    if (!deuda) {
      setMensaje('La deuda seleccionada no existe')
      return
    }

    setRegistrando(true)
    setMensaje('')

    const { error } = await supabase.rpc(
      'registrar_pago',
      {
        p_deuda_id: deuda.id,
        p_monto: monto,
      }
    )

    if (error) {
      console.error(
        'Error registrando pago:',
        error
      )

      setMensaje(
        error.message ||
        'No se pudo registrar el pago'
      )

      setRegistrando(false)
      return
    }

    setMontoPago('')
    setDeudaSeleccionada(null)

    setMensaje(
      'Pago registrado correctamente. Está pendiente de confirmación.'
    )

    await cargarDatos()

    setRegistrando(false)
  }

  async function cerrarSesion() {
    const { error } =
      await supabase.auth.signOut()

    if (error) {
      console.error(
        'Error al cerrar sesión:',
        error
      )
    }
  }

  function formatoMoneda(valor: number) {
    return new Intl.NumberFormat('es-BO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor)
  }

  function obtenerEstiloEstado(estado: string) {
    if (estado === 'CONFIRMADO') {
      return 'bg-green-100 text-green-700'
    }

    if (estado === 'PENDIENTE') {
      return 'bg-yellow-100 text-yellow-700'
    }

    if (estado === 'RECHAZADO') {
      return 'bg-red-100 text-red-700'
    }

    return 'bg-gray-100 text-gray-700'
  }

  function obtenerEstiloEstadoDeuda(estado: string) {
    if (estado === 'ACTIVA') {
      return 'bg-blue-100 text-blue-700'
    }

    if (estado === 'PAGADA') {
      return 'bg-green-100 text-green-700'
    }

    if (estado === 'CANCELADA') {
      return 'bg-gray-100 text-gray-700'
    }

    return 'bg-gray-100 text-gray-700'
  }

  function obtenerTextoEstado(estado: string) {
    if (estado === 'CONFIRMADO') {
      return 'Confirmado'
    }

    if (estado === 'PENDIENTE') {
      return 'Pendiente'
    }

    if (estado === 'RECHAZADO') {
      return 'Rechazado'
    }

    return estado
  }

  function obtenerPagosDeuda(deudaId: string) {
    return pagos.filter(
      (pago) => pago.deuda_id === deudaId
    )
  }

  function obtenerDisponible(deudaId: string) {
    const deuda = deudas.find(
      (item) => item.id === deudaId
    )

    if (!deuda) {
      return 0
    }

    const totalPendiente = pagos
      .filter(
        (pago) =>
          pago.deuda_id === deuda.id &&
          pago.estado === 'PENDIENTE'
      )
      .reduce(
        (total, pago) =>
          total + Number(pago.monto),
        0
      )

    return Math.max(
      0,
      Number(deuda.saldo) - totalPendiente
    )
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
              Panel del deudor
            </p>
          </div>

          <button
            onClick={cerrarSesion}
            className="border px-4 py-2 rounded-lg hover:bg-gray-100"
          >
            Cerrar sesión
          </button>

        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">

        {mensaje && (
          <div className="mb-6 p-4 rounded-lg bg-gray-100">
            {mensaje}
          </div>
        )}

        {deudas.length === 0 ? (

          <div className="bg-white border rounded-xl p-8 text-center">

            <h2 className="text-xl font-semibold">
              No tienes deudas
            </h2>

            <p className="mt-2 text-gray-500">
              Actualmente no existe ninguna deuda asociada a tu cuenta.
            </p>

          </div>

        ) : (

          <>

            <section>

              <h2 className="text-xl font-semibold">
                Mis deudas
              </h2>

              <p className="mt-1 text-gray-500">
                Aquí puedes consultar tus deudas y sus pagos.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">

                {deudas.map((deuda) => {

                  const pagosDeuda =
                    obtenerPagosDeuda(deuda.id)

                  const totalPendiente =
                    pagosDeuda
                      .filter(
                        (pago) =>
                          pago.estado === 'PENDIENTE'
                      )
                      .reduce(
                        (total, pago) =>
                          total + Number(pago.monto),
                        0
                      )

                  const disponible =
                    Math.max(
                      0,
                      Number(deuda.saldo) -
                      totalPendiente
                    )

                  return (

                    <div
                      key={deuda.id}
                      className="bg-white border rounded-xl p-6"
                    >

                      <div className="flex items-start justify-between gap-4">

                        <div>

                          <p className="text-sm text-gray-500">
                            Deuda
                          </p>

                          <p className="mt-1 text-2xl font-bold">
                            Bs {formatoMoneda(
                              Number(deuda.monto_total)
                            )}
                          </p>

                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${obtenerEstiloEstadoDeuda(
                            deuda.estado
                          )}`}
                        >
                          {deuda.estado}
                        </span>

                      </div>

                      <div className="mt-5 space-y-2">

                        <p className="text-sm text-gray-600">
                          Saldo pendiente:{' '}
                          <span className="font-semibold text-gray-900">
                            Bs {formatoMoneda(
                              Number(deuda.saldo)
                            )}
                          </span>
                        </p>

                        <p className="text-sm text-gray-600">
                          Pendiente de confirmación:{' '}
                          <span className="font-semibold text-gray-900">
                            Bs {formatoMoneda(
                              totalPendiente
                            )}
                          </span>
                        </p>

                        <p className="text-sm text-gray-600">
                          Disponible para registrar:{' '}
                          <span className="font-semibold text-gray-900">
                            Bs {formatoMoneda(
                              disponible
                            )}
                          </span>
                        </p>

                      </div>

                      {deuda.estado === 'ACTIVA' &&
                        disponible > 0 && (

                        <button
                          type="button"
                          onClick={() => {
                            setDeudaSeleccionada(deuda.id)
                            setMontoPago('')
                            setMensaje('')
                          }}
                          className="mt-5 w-full bg-black text-white px-4 py-2 rounded-lg"
                        >
                          Registrar pago
                        </button>

                      )}

                    </div>

                  )

                })}

              </div>

            </section>

            {deudaSeleccionada && (

              <section className="mt-8 bg-white border rounded-xl p-6">

                <h2 className="text-xl font-semibold">
                  Registrar un pago
                </h2>

                <p className="mt-1 text-gray-500">
                  Registra un pago que ya realizaste al prestamista.
                </p>

                <p className="mt-3 text-sm text-gray-600">
                  Deuda seleccionada:{' '}
                  <span className="font-semibold">
                    Bs {formatoMoneda(
                      Number(
                        deudas.find(
                          (deuda) =>
                            deuda.id === deudaSeleccionada
                        )?.monto_total ?? 0
                      )
                    )}
                  </span>
                </p>

                <p className="mt-2 text-sm text-gray-600">
                  Máximo disponible para registrar:{' '}
                  <span className="font-semibold text-gray-900">
                    Bs {formatoMoneda(
                      obtenerDisponible(
                        deudaSeleccionada
                      )
                    )}
                  </span>
                </p>

                <form
                  onSubmit={registrarPago}
                  className="mt-5 flex flex-col sm:flex-row gap-3"
                >

                  <div className="flex-1">

                    <label
                      htmlFor="monto"
                      className="block text-sm font-medium mb-1"
                    >
                      Monto
                    </label>

                    <div className="flex">

                      <span className="border border-r-0 rounded-l-lg px-3 py-2 bg-gray-50">
                        Bs
                      </span>

                      <input
                        id="monto"
                        type="number"
                        min="1"
                        step="1"
                        max={obtenerDisponible(
                          deudaSeleccionada
                        )}
                        value={montoPago}
                        onChange={(e) =>
                          setMontoPago(
                            e.target.value
                          )
                        }
                        placeholder="0"
                        className="w-full border rounded-r-lg px-3 py-2 outline-none focus:ring-2"
                        required
                        disabled={registrando}
                      />

                    </div>

                  </div>

                  <div className="flex items-end gap-2">

                    <button
                      type="submit"
                      disabled={
                        registrando ||
                        obtenerDisponible(
                          deudaSeleccionada
                        ) <= 0
                      }
                      className="bg-black text-white px-5 py-2 rounded-lg disabled:opacity-50"
                    >
                      {registrando
                        ? 'Registrando...'
                        : 'Registrar pago'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDeudaSeleccionada(null)
                        setMontoPago('')
                        setMensaje('')
                      }}
                      disabled={registrando}
                      className="border px-5 py-2 rounded-lg disabled:opacity-50"
                    >
                      Cancelar
                    </button>

                  </div>

                </form>

              </section>

            )}

            <section className="mt-8">

              <h2 className="text-xl font-semibold">
                Historial de pagos
              </h2>

              <div className="mt-4 space-y-3">

                {pagos.length === 0 ? (

                  <div className="bg-white border rounded-xl p-6">

                    <p className="text-gray-500">
                      Todavía no tienes pagos registrados.
                    </p>

                  </div>

                ) : (

                  pagos.map((pago) => {

                    const deudaPago = deudas.find(
                      (deuda) =>
                        deuda.id === pago.deuda_id
                    )

                    return (

                      <div
                        key={pago.id}
                        className="bg-white border rounded-xl p-5"
                      >

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                          <div>

                            <p className="text-xl font-semibold">
                              Bs {formatoMoneda(
                                Number(pago.monto)
                              )}
                            </p>

                            <p className="text-sm text-gray-500 mt-1">
  Registrado:{' '}
  {new Date(
    pago.created_at
  ).toLocaleString('es-BO')}
</p>

{pago.estado === 'CONFIRMADO' &&
  pago.confirmado_at && (
    <p className="text-sm text-green-600 mt-1">
      Confirmado:{' '}
      {new Date(
        pago.confirmado_at
      ).toLocaleString('es-BO')}
    </p>
  )}

{pago.estado === 'RECHAZADO' &&
  pago.rechazado_at && (
    <p className="text-sm text-red-600 mt-1">
      Rechazado:{' '}
      {new Date(
        pago.rechazado_at
      ).toLocaleString('es-BO')}
    </p>
  )}

                            <p className="text-sm text-gray-500 mt-1">
                              Deuda:{' '}
                              <span className="font-medium text-gray-700">
                                {deudaPago
                                  ? `Bs ${formatoMoneda(
                                      Number(
                                        deudaPago.monto_total
                                      )
                                    )}`
                                  : 'No disponible'}
                              </span>
                            </p>

                          </div>

                          <span
                            className={`self-start px-3 py-1 rounded-full text-sm font-medium ${obtenerEstiloEstado(
                              pago.estado
                            )}`}
                          >
                            {obtenerTextoEstado(
                              pago.estado
                            )}
                          </span>

                        </div>

                        {pago.estado === 'PENDIENTE' && (
                          <p className="mt-3 text-sm text-gray-500">
                            Este pago está esperando la confirmación del prestamista.
                          </p>
                        )}

                        {pago.estado === 'CONFIRMADO' && (
                          <p className="mt-3 text-sm text-green-600">
                            El pago fue confirmado y descontado de tu deuda.
                          </p>
                        )}

                        {pago.estado === 'RECHAZADO' && (
                          <div className="mt-3 p-3 rounded-lg bg-red-50">

                            <p className="text-sm font-medium text-red-700">
                              Pago rechazado
                            </p>

                            {pago.comentario && (
                              <p className="mt-1 text-sm text-red-600">
                                Motivo: {pago.comentario}
                              </p>
                            )}

                          </div>
                        )}

                      </div>

                    )

                  })

                )}

              </div>

            </section>

          </>

        )}

      </main>

    </div>
  )
}