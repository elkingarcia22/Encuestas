import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@ubits/flux-ui'
import { CRUCE, VOLUMENES, gananciaDb, musicaHabilitada, type TransicionId } from '../datos'
import { aviso } from '../piezas'
import { audioDe, enCola, faltaEnEscena, pistaPorId, type Escena, type Proyecto } from '../proyecto'
import estilos from '../transiciones.module.css'

// La vista previa del editor: reproduce desde la escena elegida hasta el final, con la locución de cada escena, el
// cruce de transición entre una y otra y, si el interruptor lo permite, la música de fondo en loop que baja en los
// últimos 2,5 s. Se detiene antes de la primera escena que todavía se está generando, y se salta las que están vacías
// (video sin cargar, imagen sin subir, avatar sin sincronizar, sin tipo): solo pasa por lo que se puede ver (Dave, 14-oct).

/** Clases de la capa que entra y de la que sale para una transición (`bucle` para la miniatura del modal). */
export function clasesTransicion(id: TransicionId | string, bucle = false) {
  const sale = estilos[`sale-${id}`]
  return {
    entra: cn(estilos.entra, estilos[id], bucle && estilos.bucle),
    sale: sale ? cn(estilos.sale, sale, bucle && estilos.bucle) : '',
    escenario: id === 'cube' ? estilos.escenario3d : '',
  }
}

export type Cruce = { desde: string; transicion: TransicionId; clave: number }

/**
 * La primera escena que se puede ver desde `desde` (incluida): se salta las vacías. Si antes encuentra una que todavía se
 * está generando, devuelve «en-cola», porque la vista previa no pasa por encima de lo que falta generar.
 */
function siguienteVisible(p: Proyecto, desde: number): Escena | 'en-cola' | null {
  for (const e of p.escenas.slice(Math.max(0, desde))) {
    if (enCola(e, Date.now())) return 'en-cola'
    if (!faltaEnEscena(e, p)) return e
  }
  return null
}

type Opciones = {
  proyecto: Proyecto
  seleccion: string | null
  onSeleccion: (id: string) => void
}

export function useReproductor({ proyecto, seleccion, onSeleccion }: Opciones) {
  const [reproduciendo, setReproduciendo] = useState(false)
  const [tiempo, setTiempo] = useState(0)
  const [cruce, setCruce] = useState<Cruce | null>(null)
  const voz = useRef<HTMLAudioElement | null>(null)
  const musica = useRef<HTMLAudioElement | null>(null)
  const cuadro = useRef<number | null>(null)
  const inicio = useRef(0)
  const escenaActual = useRef<string | null>(seleccion)
  const proyectoRef = useRef(proyecto)
  proyectoRef.current = proyecto

  const detenerAudios = () => {
    voz.current?.pause()
    voz.current = null
  }

  const pausar = useCallback(() => {
    if (cuadro.current) cancelAnimationFrame(cuadro.current)
    cuadro.current = null
    detenerAudios()
    musica.current?.pause()
    musica.current = null
    setReproduciendo(false)
  }, [])

  useEffect(() => pausar, [pausar])

  // Si la selección cambia desde afuera (clic en otra escena), se para y vuelve al inicio.
  useEffect(() => {
    if (seleccion === escenaActual.current) return
    escenaActual.current = seleccion
    pausar()
    setTiempo(0)
  }, [seleccion, pausar])

  const volumenMusica = () => gananciaDb(VOLUMENES.find((v) => v.id === proyectoRef.current.musica.volumen)?.db ?? -18)

  const arrancar = (id: string, desde: number) => {
    const p = proyectoRef.current
    const e = p.escenas.find((x) => x.id === id)
    if (!e) return
    detenerAudios()
    const src = audioDe(e, p)
    // La locución calla si la escena la silenció (o, en lo guardado antes del 14-oct, si la mezcla era «solo el video»).
    const callada = e.locucionSilenciada ?? (e.tipo === 'video' && e.mezcla === 'clip-only')
    if (src && !callada) {
      const audio = new Audio(src)
      audio.currentTime = desde
      voz.current = audio
      void audio.play().catch(() => undefined)
    }
    inicio.current = performance.now() - desde * 1000
  }

  const avanzar = () => {
    const p = proyectoRef.current
    const i = p.escenas.findIndex((x) => x.id === escenaActual.current)
    const siguiente = siguienteVisible(p, i + 1)
    if (!siguiente) {
      pausar()
      return
    }
    if (siguiente === 'en-cola') {
      pausar()
      aviso('info', 'La vista previa llegó hasta la última escena generada. Las siguientes siguen en proceso.')
      return
    }
    setCruce({ desde: escenaActual.current ?? '', transicion: siguiente.transicion, clave: Date.now() })
    window.setTimeout(() => setCruce(null), CRUCE * 1000)
    escenaActual.current = siguiente.id
    onSeleccion(siguiente.id)
    setTiempo(0)
    arrancar(siguiente.id, 0)
  }

  const bucle = () => {
    const p = proyectoRef.current
    const e = p.escenas.find((x) => x.id === escenaActual.current)
    if (!e) return pausar()
    const t = (performance.now() - inicio.current) / 1000
    // La música baja en los últimos 2,5 s de la última escena.
    if (musica.current && e.id === p.escenas[p.escenas.length - 1]?.id) {
      const resta = e.duracion - t
      musica.current.volume = Math.max(0, Math.min(1, volumenMusica() * Math.min(1, resta / 2.5)))
    }
    if (t >= e.duracion) {
      setTiempo(e.duracion)
      avanzar()
    } else setTiempo(t)
    cuadro.current = requestAnimationFrame(bucle)
  }

  const reproducir = () => {
    const p = proyectoRef.current
    const elegida = p.escenas.find((x) => x.id === seleccion)
    if (!elegida) return
    if (enCola(elegida, Date.now())) {
      aviso('info', 'Esta escena todavía se está generando. Espera a que termine para verla.')
      return
    }
    // Si la elegida está vacía, arranca en la siguiente que se pueda ver.
    const e = faltaEnEscena(elegida, p) ? siguienteVisible(p, p.escenas.indexOf(elegida) + 1) : elegida
    if (e === 'en-cola') {
      aviso('info', 'Las escenas que siguen todavía se están generando. Espera a que terminen para verlas.')
      return
    }
    if (!e) {
      aviso('info', 'No hay escenas para ver desde aquí: a las que siguen les falta su video, imagen o avatar.')
      return
    }
    escenaActual.current = e.id
    if (e !== elegida) onSeleccion(e.id)
    const desde = e !== elegida || tiempo >= e.duracion - 0.05 ? 0 : tiempo
    setTiempo(desde)
    arrancar(e.id, desde)
    const pista = pistaPorId(p.musica.pista)
    if (musicaHabilitada() && pista.src) {
      const m = new Audio(pista.src)
      m.loop = true
      m.volume = volumenMusica()
      musica.current = m
      void m.play().catch(() => undefined)
    }
    setReproduciendo(true)
    cuadro.current = requestAnimationFrame(bucle)
  }

  const buscar = (t: number) => {
    if (reproduciendo) pausar()
    setTiempo(t)
  }

  return { reproduciendo, tiempo, cruce, reproducir, pausar, buscar }
}
