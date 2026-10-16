import { useEffect, useLayoutEffect, useRef, type CSSProperties, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import estilos from './confeti.module.css'

// Verde del tema en dos intensidades y gris claro, con transparencia (1 oct, Charlie).
const COLORES = [
  'color-mix(in oklch, var(--success) 75%, transparent)',
  'color-mix(in oklch, var(--success) 45%, transparent)',
  'color-mix(in oklch, var(--muted-foreground) 35%, transparent)',
]

const CANTIDAD = 40

// Número pseudoaleatorio fijo por pieza: la explosión sale igual en cada render (sin Math.random, que rompe la pureza).
function azar(semilla: number) {
  const x = Math.sin(semilla * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

// Las direcciones se reparten alrededor del círculo con un poco de desorden, y cada pieza llega a una distancia distinta.
const PIEZAS = Array.from({ length: CANTIDAD }, (_, i) => {
  const angulo = ((i / CANTIDAD) * 360 + (azar(i + 23) - 0.5) * 30) * (Math.PI / 180)
  const distancia = 60 + azar(i + 29) * 90
  // La explosión empuja más hacia arriba que hacia abajo: lo que sube después tiene de dónde caer.
  const vertical = Math.sin(angulo) * distancia
  const dy = vertical < 0 ? vertical * 1.25 : vertical * 0.55
  // Piezas pequeñas (1 oct): círculos de 4px y rectángulos de 3 × 5–7px.
  const redonda = azar(i + 7) > 0.65
  const ancho = redonda ? 4 : 3
  return {
    '--dx': `${Math.round(Math.cos(angulo) * distancia * 1.15)}px`,
    '--dy': `${Math.round(dy)}px`,
    '--caida': `${130 + Math.round(azar(i + 31) * 90)}px`,
    '--ancho': `${ancho}px`,
    '--alto': `${redonda ? ancho : 5 + Math.round(azar(i + 5) * 2)}px`,
    '--radio': redonda ? '9999px' : '1px',
    '--color': COLORES[i % COLORES.length],
    '--retraso': `${Math.round(azar(i + 11) * 60)}ms`,
    '--duracion': `${1000 + Math.round(azar(i + 13) * 300)}ms`,
    '--giro': `${Math.round((azar(i + 19) - 0.5) * 720)}deg`,
  } as CSSProperties
})

// ── Lluvia de confeti ────────────────────────────────────────────────────────────────────────────────────────────
//
// Para celebrar algo grande —terminar un contenido—, donde una chispa desde un punto se queda corta: cae sobre **toda
// la pantalla**, con el doble de piezas, los colores del tema y cuatro segundos de caída con giro y balanceo. Es el
// efecto de la experiencia de estudio de producción, pero tomando los colores de nuestros tokens en vez de hex
// sueltos, para que celebre en nuestra paleta (Dave, 7-oct).
//
// Va en un `canvas` y no en nodos: ciento cincuenta piezas animadas por CSS dejan el navegador pegado.

/** Los tokens que dan color a la fiesta. Se leen del tema en vivo, así que el modo oscuro y un cambio de marca entran solos. */
const TOKENS_FIESTA = ['--primary', '--success', '--warning', '--destructive', '--info', '--focus']

function coloresDelTema(): string[] {
  const estilo = getComputedStyle(document.documentElement)
  const leidos = TOKENS_FIESTA.map((t) => estilo.getPropertyValue(t).trim()).filter(Boolean)
  return leidos.length ? leidos : ['#3b82f6', '#22c55e', '#f59e0b']
}

export function LluviaConfeti({ piezas = 150, duracionMs = 3600 }: { piezas?: number; duracionMs?: number }) {
  const lienzo = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const nodo = lienzo.current
    if (!nodo) return
    // Con «reducir movimiento» no cae nada: una pantalla entera moviéndose es justo lo que esa preferencia evita.
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const ctx = nodo.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const ancho = window.innerWidth
    const alto = window.innerHeight
    nodo.width = ancho * dpr
    nodo.height = alto * dpr
    ctx.scale(dpr, dpr)

    const colores = coloresDelTema()
    const trozos = Array.from({ length: piezas }, () => ({
      x: Math.random() * ancho,
      // Arrancan por encima del borde y escalonadas, para que la lluvia entre poco a poco y no de golpe.
      y: -20 - Math.random() * alto * 0.6,
      vx: Math.random() * 5 - 2.5,
      vy: Math.random() * 3 + 2.5,
      // Fase y paso del balanceo: sin esto caen en línea recta y parecen lluvia, no confeti.
      fase: Math.random() * Math.PI * 2,
      paso: Math.random() * 0.09 + 0.04,
      lado: Math.random() * 5 + 3,
      color: colores[Math.floor(Math.random() * colores.length)],
      giro: Math.random() * 360,
      vGiro: Math.random() * 8 - 4,
    }))

    const cuadros = Math.round(duracionMs / 16)
    let cuadro = 0
    let animacion = 0
    const pintar = () => {
      ctx.clearRect(0, 0, ancho, alto)
      for (const p of trozos) {
        p.fase += p.paso
        // La gravedad crece con el tiempo: al final caen más rápido y la pantalla se despeja sola.
        p.y += p.vy + cuadro * 0.01
        p.x += p.vx + Math.sin(p.fase) * 0.9
        p.giro += p.vGiro
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.giro * Math.PI) / 180)
        ctx.fillStyle = p.color
        ctx.globalAlpha = Math.max(0, 1 - cuadro / cuadros)
        ctx.fillRect(-p.lado / 2, -p.lado, p.lado, p.lado * 2.2)
        ctx.restore()
      }
      cuadro += 1
      if (cuadro < cuadros) animacion = requestAnimationFrame(pintar)
    }
    animacion = requestAnimationFrame(pintar)
    return () => cancelAnimationFrame(animacion)
  }, [piezas, duracionMs])

  return createPortal(
    <canvas ref={lienzo} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[70] size-full" />,
    document.body,
  )
}

// Explosión de confeti para celebrar (agradecimiento de «Enviar feedback»). Sale desde el centro del elemento `ancla`
// hacia afuera, una sola vez al montarse. Va en una capa propia sobre toda la pantalla: dentro de la ventana, el cuerpo con
// desplazamiento recortaba las piezas y hacía saltar la barra. No recibe clics. Decorativo: el lector no lo anuncia, y
// con «reducir movimiento» no aparece.
export function Confeti({ ancla }: { ancla: RefObject<HTMLElement | null> }) {
  const origen = useRef<HTMLSpanElement>(null)

  // Se ubica en el centro del ancla antes de pintarse (la animación arranca ya en su sitio), sin pasar por el estado.
  useLayoutEffect(() => {
    const caja = ancla.current?.getBoundingClientRect()
    const punto = origen.current
    if (!caja || !punto) return
    punto.style.left = `${caja.left + caja.width / 2}px`
    punto.style.top = `${caja.top + caja.height / 2}px`
    // Al terminar (la pieza más lenta dura 1,3 s más 60 ms de retraso) la capa se oculta: no queda nada pintando.
    const fin = window.setTimeout(() => {
      punto.style.display = 'none'
    }, 1450)
    return () => window.clearTimeout(fin)
  }, [ancla])

  return createPortal(
    <span ref={origen} aria-hidden="true" className={estilos.origen}>
      {/* Dos capas por pieza: el eje mueve en horizontal y la pieza en vertical, para que la caída dibuje una curva. */}
      {PIEZAS.map((estilo, i) => (
        <span key={i} className={estilos.eje} style={estilo}>
          <span className={estilos.pieza} />
        </span>
      ))}
    </span>,
    document.body,
  )
}
