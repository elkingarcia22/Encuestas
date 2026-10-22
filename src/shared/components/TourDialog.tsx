import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { PauseIcon, PlayIcon } from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Heading,
  IconTile,
  Progress,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  useTheme,
} from '@ubits/flux-ui'
import { CloseButton } from '@/shared/components/CloseButton'
import paleta from '@/shared/components/tarjeta-ia.module.css'
import ambienteAzul from '@/shared/assets/ambiente-azul.png'
import capturaInicio from '@/shared/assets/tour/inicio.webp'
import capturaInicioOscura from '@/shared/assets/tour/inicio-oscuro.webp'
import capturaOrbit from '@/shared/assets/tour/orbit.webp'
import capturaOrbitOscura from '@/shared/assets/tour/orbit-oscuro.webp'
import capturaContenido from '@/shared/assets/tour/contenido.webp'
import capturaContenidoOscura from '@/shared/assets/tour/contenido-oscuro.webp'
import capturaCuenta from '@/shared/assets/tour/licencias.webp'
import capturaCuentaOscura from '@/shared/assets/tour/licencias-oscuro.webp'

type TourDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Paso = {
  valor: string
  numero: string
  titulo: string
  descripcion: string
  captura: string
  // La misma captura en modo oscuro: el tour muestra la del modo que ve la persona (15 oct, Carlos).
  capturaOscura: string
  // Lo que se ve en la captura, para el lector de pantalla.
  alt: string
  // Fondo detrás de la captura: el halo azul de la interfaz o, en los pasos de IA, el halo de la IA (15 oct, Carlos).
  fondo: 'azul' | 'ia'
}

// Los cuatro cambios del nuevo UBITS (15 oct, Carlos; antes: Inicio, buscador, Orbit y Orbit Flow): la navegación
// renovada, Orbit, la creación de contenido con IA y la gestión de la cuenta. Las capturas son de las pantallas reales
// del playground y tienen la proporción del recuadro (1,28), para que no se corten: el Inicio y el menú de la empresa,
// completos a 1280 × 1000; el chat nuevo de Orbit y «Añadir página» del creador, recortados (15 oct). Cada una existe en
// claro y en oscuro. El saludo «¡Hola, soy Orbit! Estoy aquí para ayudarte» es solo de la captura: el chat real saluda
// por el nombre. Cada bajada cabe en dos líneas.
const PASOS: Paso[] = [
  {
    valor: 'arquitectura',
    numero: '1',
    titulo: 'Arquitectura de información renovada',
    descripcion: 'Navegación más intuitiva y consistente. Llega a cualquier lugar o acción en pocos pasos.',
    captura: capturaInicio,
    capturaOscura: capturaInicioOscura,
    alt: 'El Inicio con la barra lateral, las acciones rápidas, las métricas de aprendizaje y lo que hay para atender.',
    fondo: 'azul',
  },
  {
    valor: 'orbit',
    numero: '2',
    titulo: 'Orbit, tu superagente',
    descripcion: 'Pídele lo que necesites en lenguaje natural y lo resuelve en segundos, con tus datos.',
    captura: capturaOrbit,
    capturaOscura: capturaOrbitOscura,
    alt: 'El chat nuevo de Orbit: el orbe, «¡Hola, soy Orbit! Estoy aquí para ayudarte», la caja para escribir y cuatro sugerencias.',
    fondo: 'ia',
  },
  {
    valor: 'contenido',
    numero: '3',
    titulo: 'Creación de contenido con AI',
    descripcion: 'Crea cursos más rápido que nunca y con la mejor calidad.',
    captura: capturaContenido,
    capturaOscura: capturaContenidoOscura,
    alt: 'La ventana «Añadir página» del creador de contenido con los tipos de recurso; video, presentación, roleplay y evaluación con IA.',
    fondo: 'ia',
  },
  {
    valor: 'cuenta',
    numero: '4',
    titulo: 'Licencias, créditos y usuarios',
    descripcion: 'Panel de configuración efectiva para cambios en tu cuenta de manera más rápida y segura.',
    captura: capturaCuenta,
    capturaOscura: capturaCuentaOscura,
    alt: 'El menú de la empresa abierto con las licencias, los créditos de IA, la gestión de usuarios y la configuración.',
    fondo: 'azul',
  },
]

// Cuánto se queda cada paso antes de pasar al siguiente: ~24 s el recorrido completo. La barra avanza cada 100 ms.
const PERMANENCIA_MS = 6000
const TICK_MS = 100

// Tour del nuevo UBITS (1 oct). Se abre la primera vez que se entra desde el login y desde «Hacer el tour» en la tarjeta
// de la barra lateral. Estructura del bloque «How it works 5» de ReUI: insignia, título y bajada centrados; debajo, una
// tarjeta con los pasos como pestañas verticales a la izquierda y la captura del paso a la derecha, sobre el halo azul de
// la interfaz. Avanza solo cada 6 s y se detiene mientras la persona lee (cursor o foco encima) o con el botón de pausa;
// con «reducir movimiento» no avanza solo. El paso activo lleva al pie una línea que se llena con su avance; el pie de la
// ventana dice en qué paso va y deja pausar, saltar o seguir.
export function TourDialog({ open, onOpenChange }: TourDialogProps) {
  const [paso, setPaso] = useState(PASOS[0].valor)
  // El modo que ve la persona (también cuando eligió «sistema»): decide si las capturas van en claro o en oscuro.
  const oscuro = useTheme().resolvedMode === 'dark'
  // Cuánto lleva el paso actual (ms): llena su barra y, al llegar a 6 s, pasa al siguiente.
  const [transcurrido, setTranscurrido] = useState(0)
  // Dos pausas: la de leer (cursor o foco sobre los pasos) y la del botón, que se queda hasta que se reanuda.
  const [leyendo, setLeyendo] = useState(false)
  const [pausado, setPausado] = useState(false)
  // Con «reducir movimiento» no avanza solo: sin botón de pausa y la línea del paso activo queda llena.
  const [sinMovimiento] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  const cambiarPaso = (valor: string) => {
    setPaso(valor)
    setTranscurrido(0)
  }

  // Cada vez que se abre (también cuando lo abre el login, sin pasar por onOpenChange) vuelve al primer paso, sin pausa.
  const [abiertoAntes, setAbiertoAntes] = useState(open)
  if (open !== abiertoAntes) {
    setAbiertoAntes(open)
    if (open) {
      cambiarPaso(PASOS[0].valor)
      setPausado(false)
    }
  }

  const indice = PASOS.findIndex((item) => item.valor === paso)
  const ultimo = indice === PASOS.length - 1

  // Al completar los 6 s pasa al siguiente (después del último, vuelve al primero).
  if (transcurrido >= PERMANENCIA_MS) cambiarPaso(PASOS[(indice + 1) % PASOS.length].valor)

  const corriendo = open && !leyendo && !pausado && !sinMovimiento
  useEffect(() => {
    if (!corriendo) return
    const reloj = window.setInterval(() => setTranscurrido((t) => t + TICK_MS), TICK_MS)
    return () => window.clearInterval(reloj)
  }, [corriendo])

  const siguiente = () => {
    if (ultimo) onOpenChange(false)
    else cambiarPaso(PASOS[indice + 1].valor)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex! max-h-[calc(100vh-4rem)] flex-col gap-0! overflow-y-auto p-0! sm:max-w-260!"
      >
        <CloseButton label="Cerrar el tour" className="absolute top-4 right-4 z-10" onClick={() => onOpenChange(false)} />

        {/* Encabezado centrado, como el bloque: insignia, título y bajada. */}
        <div className="flex flex-col items-center gap-3 px-8 pt-8 pb-6 text-center">
          <Badge variant="outline" radius="full">
            Tour de plataforma
          </Badge>
          <DialogTitle render={<Heading as="h2" level={3} />}>Nos renovamos para ti</DialogTitle>
          <DialogDescription render={<Text variant="muted" className="max-w-xl text-pretty" />}>
            Una experiencia más simple, rápida e intuitiva. Conoce lo más relevante y lo que potenciará tu flujo de trabajo diario.
          </DialogDescription>
        </div>

        <div className="px-6">
          <Card className="gap-0! overflow-hidden p-0! shadow-none! ring-0!">
            {/* Pestañas verticales: flechas para moverse entre pasos, Enter o Espacio para elegir. En pantallas angostas
                los pasos van arriba y la captura debajo. */}
            <Tabs
              orientation="vertical"
              value={paso}
              onValueChange={(valor) => cambiarPaso(String(valor))}
              className="flex w-full flex-col gap-0! lg:h-120 lg:flex-row lg:items-stretch"
              onPointerEnter={() => setLeyendo(true)}
              onPointerLeave={() => setLeyendo(false)}
              onFocusCapture={() => setLeyendo(true)}
              onBlurCapture={() => setLeyendo(false)}
            >
              {/* La columna de pasos lleva todo el borde, con la esquina de la tarjeta; el paso activo, un fondo suave. */}
              <TabsList
                variant="line"
                aria-label="Pasos del tour"
                className="h-auto! w-full min-w-0 flex-col! items-stretch! gap-0! rounded-t-xl! border bg-transparent p-0! lg:w-96 lg:shrink-0 lg:rounded-tr-none! lg:rounded-bl-xl!"
              >
                {PASOS.map((item, i) => (
                  <TabsTrigger
                    key={item.valor}
                    value={item.valor}
                    className="relative h-auto! flex-1 cursor-pointer flex-col! items-start! justify-start! gap-2! [&>span]:w-full [&>span]:static! [&>span]:flex-col! [&>span]:items-start! [&>span]:gap-1.5! rounded-none! [border-width:0_0_1px_0]! last:[border-width:0]! border-border! data-active:border-border! px-5! py-3.5! text-start! whitespace-normal! [&>span]:after:hidden! after:hidden! [&>div]:hidden! data-active:bg-muted/50! not-data-active:hover:bg-muted/25!"
                  >
                    {/* El número al lado del título, para que los cuatro pasos quepan en el alto de la captura. */}
                    <span className="flex items-center gap-2.5">
                      <IconTile variant="outline" size="xs" className="shadow-xs">
                        <span className="text-xs font-medium tabular-nums text-foreground">{item.numero}</span>
                      </IconTile>
                      <span className="text-[15px] leading-5 font-medium text-foreground">{item.titulo}</span>
                    </span>
                    <span className="text-sm leading-5 font-normal text-pretty text-muted-foreground">{item.descripcion}</span>
                    {/* El avance del paso (1 oct): una línea de 2px al pie del paso activo que se llena en azul (15 oct,
                        Carlos; antes en negro) durante sus 6 s, sin pista debajo, encima del divisor del paso. Decorativa
                        para el lector: «Paso n de 4» ya lo dice. */}
                    {i === indice ? (
                      <span aria-hidden="true" className={`absolute inset-x-0 ${i < PASOS.length - 1 ? '-bottom-px' : 'bottom-0'}`}>
                        <Progress
                          value={sinMovimiento ? 100 : Math.min(100, (transcurrido / PERMANENCIA_MS) * 100)}
                          className="h-0.5! rounded-none! bg-transparent! [&_[data-slot=progress-indicator]]:bg-primary! [&_[data-slot=progress-indicator]]:rounded-none! [&_[data-slot=progress-track]]:h-0.5! [&_[data-slot=progress-track]]:rounded-none! [&_[data-slot=progress-track]]:bg-transparent!"
                        />
                      </span>
                    ) : null}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* La captura del paso sobre el halo azul de la interfaz (en lugar de la foto del bloque) o, en los pasos de IA,
                  sobre el halo de la IA; los dos fondos se cruzan con un fundido al cambiar de paso. En 4:3 y con un bisel
                  claro, como una ventana apoyada en el fondo. */}
              {/* En escritorio la fila mide 480px y la captura ocupa ese alto: así la ventana entra completa en pantalla. */}
              <div className="relative aspect-[4/3] min-w-0 overflow-hidden bg-muted lg:aspect-auto lg:h-full lg:flex-1">
                <img
                  src={ambienteAzul}
                  alt=""
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-0 size-full object-cover select-none transition-opacity duration-500 motion-reduce:transition-none ${PASOS[indice].fondo === 'azul' ? 'opacity-70' : 'opacity-0'}`}
                />
                <div
                  aria-hidden="true"
                  className={`${paleta.vars} ${paleta.halo} pointer-events-none absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none ${PASOS[indice].fondo === 'ia' ? 'opacity-100' : 'opacity-0'}`}
                />
                <div className="absolute inset-[5%]">
                  <div className="size-full rounded-xl bg-background/50 p-[1.5%] shadow-lg ring-1 ring-border/60">
                    {PASOS.filter((item) => item.valor === paso).map((item) => (
                      <TabsContent
                        key={item.valor}
                        value={item.valor}
                        tabIndex={-1}
                        className="size-full overflow-hidden rounded-lg animate-in fade-in duration-300 motion-reduce:animate-none"
                      >
                        <img
                          src={oscuro ? item.capturaOscura : item.captura}
                          alt={item.alt}
                          className="size-full object-cover object-left-top"
                          draggable={false}
                        />
                      </TabsContent>
                    ))}
                  </div>
                </div>
              </div>
            </Tabs>
          </Card>
        </div>

        {/* Pie: pausar el avance (botón secundario de solo icono, a la altura de los demás), en qué paso va, saltar y seguir. En el último paso, «Empezar» cierra el tour. */}
        <div className="flex items-center gap-3 px-6 pt-5 pb-6">
          {sinMovimiento ? null : (
            <Button
              variant="outline"
              size="icon"
              aria-label={pausado ? 'Reanudar el tour' : 'Pausar el tour'}
              aria-pressed={pausado}
              onClick={() => setPausado((valor) => !valor)}
            >
              <HugeiconsIcon icon={pausado ? PlayIcon : PauseIcon} size={16} aria-hidden="true" />
            </Button>
          )}
          <Text as="span" variant="muted" size="sm" aria-live="polite" className="flex-1 whitespace-nowrap tabular-nums">
            Paso {indice + 1} de {PASOS.length}
          </Text>
          {ultimo ? null : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Saltar el tour
            </Button>
          )}
          <Button onClick={siguiente}>{ultimo ? 'Empezar' : 'Siguiente'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
