import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ChartAverageIcon, LeftToRightListBulletIcon, Mic01Icon } from '@hugeicons/core-free-icons'
import { useNavigate } from 'react-router'
import { Button, Progress, Separator, cn } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import metaLogo from '@/shared/assets/meta.png'
import { Orb } from '@/shared/components/Orb'
import { notify } from '@/shared/components/notify'
import styles from './voz.module.css'

const QUESTION = 'Dime cómo va la participación de Ventas Bogotá este mes y qué debería hacer.'
const NOTICE = 'Prepara un aviso para el turno tarde de Ventas Bogotá.'

const TURNS = [
  { label: 'Mañana', pct: 71 },
  { label: 'Tarde', pct: 46 },
  { label: 'Noche', pct: 58 },
]

// Barras de la onda: alto y tono de cada una, igual que en el prototipo.
const WAVE = [
  'h-6 bg-foreground',
  'h-2 bg-foreground/75',
  'h-3.5 bg-foreground/75',
  'h-2 bg-foreground/60',
  'h-3 bg-foreground/60',
  'h-2 bg-foreground/45',
  'h-3 bg-foreground/45',
]

const chatWith = (param: 'q' | 'draft', text: string) => `/suite-ai/chat/libre?${param}=${encodeURIComponent(text)}`

// Modo voz: ocupa toda la pantalla y siempre es oscuro, como en el prototipo.
// Es la única pantalla sin PageShell ni PageHeader: la excepción documentada en Design system › Marco (auditoría, 5-oct).
export function Component() {
  const navigate = useNavigate()
  const [listening, setListening] = useState(true)
  const [seconds, setSeconds] = useState(0)
  const [detail, setDetail] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // Se comporta como una ventana a pantalla completa: el foco entra al abrir, la barra lateral y el header que
  // quedan detrás se vuelven inertes (el Tab no se escapa hacia ellos) y Escape vuelve al chat. Los portales del
  // body (avisos) no se tocan.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const inert: HTMLElement[] = []
    for (let node: HTMLElement | null = root; node?.parentElement && node.parentElement !== document.body; node = node.parentElement) {
      for (const sibling of node.parentElement.children) {
        if (sibling !== node && sibling instanceof HTMLElement && !sibling.inert) {
          sibling.inert = true
          inert.push(sibling)
        }
      }
    }
    root.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') navigate('/suite-ai')
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      inert.forEach((element) => {
        element.inert = false
      })
    }
  }, [navigate])

  useEffect(() => {
    if (!listening) return
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => window.clearInterval(id)
  }, [listening])

  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

  const toggleMic = () => {
    const on = !listening
    setListening(on)
    notify(on ? 'Te escucho' : 'Micrófono en pausa', undefined, 'info')
  }

  const writeInstead = () => {
    notify('Pasé la voz al texto', undefined, 'info')
    navigate(chatWith('draft', QUESTION))
  }

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="Modo voz"
      tabIndex={-1}
      className="dark fixed inset-0 z-50 flex flex-col overflow-hidden bg-background text-foreground outline-none [&_button]:rounded-full!"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-155 w-225 -translate-x-1/2 bg-radial-[closest-side] from-warning/10 via-primary/7 via-55% to-transparent"
      />

      {/* Alto mínimo en vez de fijo y filas que se acomodan: en pantallas de 320px «Volver al chat» baja en vez de cortarse. */}
      <header className="relative flex min-h-15 shrink-0 flex-wrap items-center gap-x-3.5 gap-y-2 border-b px-7 py-2.5">
        <img src={metaLogo} alt="Meta" className="h-5 w-auto" />
        <span className="flex h-4.5">
          <Separator orientation="vertical" />
        </span>
        <span className="text-sm font-medium">Orbit</span>
        <Badge variant="outline" className="h-7 gap-2 px-3">
          <span
            aria-hidden="true"
            className={cn('size-1.5 rounded-full motion-reduce:animate-none', listening ? 'animate-pulse bg-destructive' : 'bg-muted-foreground')}
          />
          {listening ? 'Modo voz activo' : 'Micrófono en pausa'}
        </Badge>
        <Button variant="outline" size="sm" className="ml-auto h-8.5! px-4!" onClick={() => navigate('/suite-ai')}>
          Volver al chat
        </Button>
      </header>

      <section className="relative flex min-h-0 flex-1 flex-col items-center overflow-auto px-10 pt-15 pb-8">
        {/* Button de flux-ui sin superficie: el orbe es el botón. */}
        <Button
          variant="ghost"
          onClick={toggleMic}
          aria-label={listening ? 'Pausar el micrófono' : 'Activar el micrófono'}
          className="h-auto! shrink-0 border-0! bg-transparent! p-0! hover:bg-transparent! dark:hover:bg-transparent!"
        >
          <Orb className={cn('size-45', listening && styles.orb)} />
        </Button>

        <div aria-hidden="true" className="mt-7 flex h-6.5 items-end gap-2.5">
          {WAVE.map((bar, i) => (
            <span
              key={i}
              className={cn('w-0.75 rounded-full', bar, listening ? styles.wave : styles.waveIdle)}
              style={{ animationDelay: `${i * 90}ms` }}
            />
          ))}
        </div>

        <h1 className="mt-8! max-w-190 animate-in motion-reduce:animate-none text-center text-4xl leading-tight font-semibold tracking-tight text-pretty duration-500 fade-in slide-in-from-bottom-3">
          «{QUESTION}»
        </h1>

        <div className="mt-8 flex max-w-190 animate-in motion-reduce:animate-none gap-3.5 duration-500 fade-in slide-in-from-bottom-3">
          <Orb className="mt-0.5 size-6.5" />
          <p className="text-base leading-relaxed text-pretty text-foreground/80">
            Ventas Bogotá está en <span className="font-medium text-foreground">58 % de participación</span>, nueve
            puntos por debajo del promedio de la empresa. La caída está concentrada en el turno de la tarde.
          </p>
        </div>

        <div className="mt-5.5 flex animate-in motion-reduce:animate-none flex-wrap justify-center gap-3 duration-500 fade-in slide-in-from-bottom-3">
          <Button variant="outline" size="lg" className="px-4.5!" aria-expanded={detail} onClick={() => setDetail((d) => !d)}>
            <HugeiconsIcon icon={ChartAverageIcon} size={18} className="size-4.5" />
            {detail ? 'Ocultar el detalle' : 'Ver el detalle por turno'}
          </Button>
          <Button variant="outline" size="lg" className="px-4.5!" onClick={() => navigate(chatWith('q', NOTICE))}>
            <HugeiconsIcon icon={LeftToRightListBulletIcon} size={18} className="size-4.5" />
            Preparar un aviso para el turno tarde
          </Button>
        </div>

        {detail ? (
          // Las barras usan el color de texto del tema en vez del primario, como en el prototipo.
          <div className="mt-5.5 w-full max-w-140 animate-in motion-reduce:animate-none rounded-xl border bg-foreground/5 px-5 py-4.5 duration-300 fade-in [--primary:var(--foreground)]">
            <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Participación por turno</p>
            {TURNS.map((turn, i) => (
              <div key={turn.label} className="mt-3.5 flex items-center gap-3.5">
                <span className="w-17.5 shrink-0 text-sm">{turn.label}</span>
                <Progress
                  value={turn.pct}
                  aria-label={`Participación turno ${turn.label}`}
                  className={cn('flex-1', styles.grow)}
                  style={{ '--delay': `${i * 80}ms` } as CSSProperties}
                />
                <span className="w-11 shrink-0 text-right tabular-nums text-xs">{turn.pct} %</span>
              </div>
            ))}
          </div>
        ) : null}

        {/* Barra de control. Micrófono y terminar van en blanco: el botón secundario toma el color de texto del tema.
            En pantallas angostas los controles pasan a una segunda fila en vez de salirse. */}
        <div className="mt-9 flex max-w-full shrink-0 flex-wrap items-center justify-center gap-5 rounded-full border bg-foreground/5 py-3 pr-3.5 pl-3 [--secondary-foreground:var(--background)] [--secondary:var(--foreground)]">
          <Button variant="secondary" size="icon-lg" className="size-11.5!" aria-label={listening ? 'Pausar el micrófono' : 'Activar el micrófono'} onClick={toggleMic}>
            <HugeiconsIcon icon={Mic01Icon} size={24} className="size-6" />
          </Button>
          <div className="flex flex-col gap-1 pr-5">
            <span className="text-sm font-medium">{listening ? 'Te escucho · español' : 'En pausa · español'}</span>
            <span className="tabular-nums text-xs text-muted-foreground">
              {clock} · {listening ? 'haz una pausa y sigo esperando' : 'toca el micrófono para seguir'}
            </span>
          </div>
          <Button variant="ghost" size="sm" className="px-0!" onClick={writeInstead}>
            Escribir
          </Button>
          <Button variant="outline" size="icon" className="size-9.5! gap-0.75" aria-label={listening ? 'Pausar' : 'Reanudar'} onClick={toggleMic}>
            <span className="h-3 w-0.5 bg-foreground" />
            <span className="h-3 w-0.5 bg-foreground" />
          </Button>
          <Button variant="secondary" size="icon" className="size-9.5!" aria-label="Terminar" onClick={() => navigate(chatWith('q', QUESTION))}>
            <span className="size-2.75 rounded-xs bg-background" />
          </Button>
        </div>
      </section>
    </div>
  )
}

Component.displayName = 'SuiteAiVozPage'
