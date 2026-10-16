import { useCallback, useEffect, useRef, useState } from 'react'
import { SEGUNDOS_PRUEBA } from './estudio'

// ── El micrófono, de verdad ──────────────────────────────────────────────────────────────────────────────────────
//
// La prueba **mide**: pide permiso al navegador, lee el nivel del micrófono y solo confirma si captó voz. Un botón
// que diga «todo bien» sin medir nada no sirve de nada, porque el problema que tiene que descubrir —micrófono
// silenciado, el del monitor en vez del de los audífonos— solo se ve midiendo.
//
// Durante la llamada el mismo nivel alimenta el indicador que rodea al botón del micrófono: si latiera por
// temporizador estaría diciendo «te escucho» sin saber si es cierto.

/** Lo que falló, dicho como lo entiende quien lo lee. Un «NotAllowedError» no le explica nada a nadie. */
function porQueFallo(error: unknown): string {
  const nombre = error instanceof DOMException ? error.name : ''
  if (nombre === 'NotAllowedError' || nombre === 'SecurityError') return 'No diste permiso para usar el micrófono.'
  if (nombre === 'NotFoundError' || nombre === 'OverconstrainedError') return 'No encontramos ningún micrófono conectado.'
  if (nombre === 'NotReadableError') return 'Otra aplicación está usando el micrófono.'
  return 'No pudimos acceder al micrófono.'
}

type Medicion = {
  /** 0–1. Manda la altura del medidor y el tamaño del indicador de la llamada. */
  nivel: number
  /** Mientras dura la muestra: cuántos segundos faltan. */
  restante: number
  /** Se enciende apenas se capta voz, no al final: confirma **mientras** se habla (RN-05a). */
  vozDetectada: boolean
  midiendo: boolean
  /** `null` sin probar, `true` funciona, `false` no hay micrófono o no hubo permiso. */
  sirve: boolean | null
  error: string | null
}

const PARADA: Medicion = { nivel: 0, restante: SEGUNDOS_PRUEBA, vozDetectada: false, midiendo: false, sirve: null, error: null }

/** Por encima de esto damos la voz por captada: debajo es ruido de sala. */
const UMBRAL_VOZ = 0.08

export function useMicrofono() {
  const [medicion, setMedicion] = useState<Medicion>(PARADA)
  const pista = useRef<MediaStream | null>(null)
  const audio = useRef<AudioContext | null>(null)
  const cuadro = useRef<number | null>(null)
  const parar = useRef<number | null>(null)

  /** Suelta el micrófono y apaga el aviso de grabación del navegador (RN-13). */
  const soltar = useCallback(() => {
    if (cuadro.current != null) cancelAnimationFrame(cuadro.current)
    if (parar.current != null) window.clearTimeout(parar.current)
    cuadro.current = null
    parar.current = null
    pista.current?.getTracks().forEach((t) => t.stop())
    pista.current = null
    void audio.current?.close()
    audio.current = null
  }, [])

  // Al salir de la página se suelta siempre, aunque la prueba quedara a medias.
  useEffect(() => soltar, [soltar])

  /** Declarar que no hay micrófono: la llamada, si el creador la dejó, se hace por escrito. */
  const sinMicrofono = useCallback(() => {
    soltar()
    setMedicion({ ...PARADA, sirve: false })
  }, [soltar])

  /** Deja el micrófono abierto mientras dura la llamada por voz, para que el indicador siga la voz real. */
  const escuchar = useCallback(async () => {
    try {
      const flujo = await navigator.mediaDevices.getUserMedia({ audio: true })
      pista.current = flujo
      const contexto = new AudioContext()
      audio.current = contexto
      const analizador = contexto.createAnalyser()
      analizador.fftSize = 512
      contexto.createMediaStreamSource(flujo).connect(analizador)
      const datos = new Uint8Array(analizador.frequencyBinCount)
      const leer = () => {
        analizador.getByteTimeDomainData(datos)
        let pico = 0
        for (const v of datos) pico = Math.max(pico, Math.abs(v - 128) / 128)
        setMedicion((m) => ({ ...m, nivel: pico, vozDetectada: m.vozDetectada || pico > UMBRAL_VOZ }))
        cuadro.current = requestAnimationFrame(leer)
      }
      leer()
      return true
    } catch (error) {
      soltar()
      setMedicion({ ...PARADA, sirve: false, error: porQueFallo(error) })
      return false
    }
  }, [soltar])

  /** La muestra de la intro: unos segundos midiendo y el veredicto según si se captó voz. */
  const probar = useCallback(async () => {
    soltar()
    setMedicion({ ...PARADA, midiendo: true })
    const abierto = await escuchar()
    if (!abierto) return
    const desde = Date.now()
    const cuentaAtras = window.setInterval(() => {
      setMedicion((m) => ({ ...m, restante: Math.max(0, SEGUNDOS_PRUEBA - Math.round((Date.now() - desde) / 1000)) }))
    }, 250)
    parar.current = window.setTimeout(() => {
      window.clearInterval(cuentaAtras)
      soltar()
      setMedicion((m) => ({
        ...PARADA,
        sirve: m.vozDetectada,
        error: m.vozDetectada ? null : 'No te escuchamos. Revisa que el micrófono no esté silenciado.',
      }))
    }, SEGUNDOS_PRUEBA * 1000)
  }, [escuchar, soltar])

  /** Al silenciar durante la llamada se cierra de verdad: el navegador deja de señalar que graba (RN-20). */
  const silenciar = useCallback(() => {
    soltar()
    setMedicion((m) => ({ ...m, nivel: 0 }))
  }, [soltar])

  return { ...medicion, probar, escuchar, silenciar, sinMicrofono, soltar }
}
