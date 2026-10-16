import { useEffect, useRef } from 'react'

// Confeti para celebrar que se terminó la encuesta. flux-ui no trae uno y el proyecto no admite
// librerías de animación, así que se dibuja en un lienzo: una lluvia corta que cae desde arriba
// por todo el ancho del panel, meciéndose, y se apaga sola en unos segundos. Los colores son los del tema (se leen
// de sus variables al disparar), así que cambian con la marca y con el modo oscuro. Quien pidió
// menos movimiento en su equipo no lo ve. No atrapa clics: todo lo de debajo sigue funcionando.

const TOKENS = ['--primary', '--success', '--warning', '--info', '--destructive']
const PAPELES = 140
const DURACION_MS = 4000
const APAGADO_MS = 1200
// Velocidades en píxeles por cuadro de 60 fps; el paso se ajusta al tiempo real entre cuadros.
const CUADRO_MS = 1000 / 60
const GRAVEDAD = 0.06
const CAIDA_MAXIMA = 4.5

type Papel = { x: number; y: number; vx: number; vy: number; giro: number; vGiro: number; fase: number; ancho: number; alto: number; color: string }

function coloresDelTema(): string[] {
  const estilos = getComputedStyle(document.documentElement)
  const colores = TOKENS.map((token) => estilos.getPropertyValue(token).trim()).filter(Boolean)
  return colores.length > 0 ? colores : [estilos.color]
}

function lanzar(ancho: number, alto: number, colores: readonly string[]): Papel[] {
  return Array.from({ length: PAPELES }, (_, indice) => ({
    x: Math.random() * ancho,
    y: -Math.random() * alto * 0.6,
    vx: (Math.random() - 0.5) * 1.5,
    vy: 1.5 + Math.random() * 2.5,
    giro: Math.random() * Math.PI,
    vGiro: (Math.random() - 0.5) * 0.2,
    fase: Math.random() * Math.PI * 2,
    ancho: 6 + Math.random() * 6,
    alto: 4 + Math.random() * 4,
    color: colores[indice % colores.length],
  }))
}

export function Confeti() {
  const lienzo = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = lienzo.current
    const contexto = canvas?.getContext('2d')
    if (!canvas || !contexto) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const escala = window.devicePixelRatio || 1
    const { width, height } = canvas.getBoundingClientRect()
    canvas.width = width * escala
    canvas.height = height * escala
    contexto.scale(escala, escala)

    const papeles = lanzar(width, height, coloresDelTema())
    const inicio = performance.now()
    let anterior = inicio
    let cuadro = 0

    const pintar = (ahora: number) => {
      const pasado = ahora - inicio
      const paso = Math.min((ahora - anterior) / CUADRO_MS, 3)
      anterior = ahora
      contexto.clearRect(0, 0, width, height)
      contexto.globalAlpha = Math.min(1, Math.max(0, (DURACION_MS - pasado) / APAGADO_MS))
      for (const papel of papeles) {
        papel.vy = Math.min(papel.vy + GRAVEDAD * paso, CAIDA_MAXIMA)
        papel.x += (papel.vx + Math.sin(papel.fase + pasado / 400)) * paso
        papel.y += papel.vy * paso
        papel.giro += papel.vGiro * paso
        contexto.save()
        contexto.translate(papel.x, papel.y)
        contexto.rotate(papel.giro)
        contexto.fillStyle = papel.color
        contexto.fillRect(-papel.ancho / 2, -papel.alto / 2, papel.ancho, papel.alto * Math.abs(Math.cos(papel.giro)))
        contexto.restore()
      }
      if (pasado < DURACION_MS) cuadro = requestAnimationFrame(pintar)
      else contexto.clearRect(0, 0, width, height)
    }
    cuadro = requestAnimationFrame(pintar)
    return () => cancelAnimationFrame(cuadro)
  }, [])

  return <canvas ref={lienzo} aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 size-full" />
}
