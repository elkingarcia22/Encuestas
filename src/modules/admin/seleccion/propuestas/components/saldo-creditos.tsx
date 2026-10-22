import { useState } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, ArrowDown01Icon, Clock01Icon, Coins01Icon, CreditCardIcon, PieChartIcon } from '@hugeicons/core-free-icons'
import { Button, Popover, PopoverContent, PopoverTrigger, Separator, Text, TrafficLight } from '@ubits/flux-ui'
import { AnilloAvance } from '@/modules/design-system/graficos/piezas'
import { BarraSegmentada } from '@/modules/design-system/templates/dashboard/components/graficos'
import { plural } from '@/modules/design-system/patrones/formato'
import { bolsaDe, consumoPorSemana, creditos, porUrgencia, useHistorial, usosTexto, type EstadoAgente } from '../creditos'
import { ReasignarCreditos } from '../../creditos/uno/components/reasignar'
import { ComprarCreditos } from '../../creditos/uno/components/comprar'
import { IconoAgente, InsigniaSituacion } from './creditos-ui'
import { enLista } from '../../creditos/uno/components/atencion'
import { CifraAnimada } from './cifra-animada'
import { celda } from './animacion'

// Los créditos de Selección, a la vista en todo Selección (16 oct). En la reunión del 13 oct, Nicolás preguntó dónde va
// «la barra de gasto de créditos», si dentro de la solución o general, y la PM: «Primero en selección y en el LMS tiene que
// haber otra, pues son bolsas de crédito independientes… en este producto tiene que haber una traza». Nicolás, 16 oct:
// «quiero algo hermoso, un componente que pueda mostrar mucho sin tener que entrar a créditos».
//
// Hoy el producto pone una caja con «Sin asignar · 17.360 créd.» y dos botones («Histórico», «Asignar»). Aquí va en la
// cabecera de cada pantalla de Selección como una pastilla con lo que queda (y un punto rojo si algún agente se quedó sin
// cupo); al tocarla se abre todo lo que importa sin salir de la pantalla: cuánto queda y en qué se fue la bolsa, qué
// agentes pausaron vacantes, para cuánto le alcanza a cada uno, lo cobrado esta semana y lo que se hace con eso
// (reasignar, comprar, ver el historial). Reasignar y comprar abren sus cajones de siempre, ahí mismo.

const RUTA_CREDITOS = '/admin/seleccion/creditos/uno'

// Lo cobrado esta semana y la anterior, para decir si sube o baja.
function semanas(historial: Parameters<typeof consumoPorSemana>[0]) {
  const filas = consumoPorSemana(historial, 2)
  const total = (fila: Record<string, number | string>) => Object.values(fila).reduce<number>((suma, valor) => suma + (typeof valor === 'number' ? valor : 0), 0)
  return { esta: total(filas[1]), anterior: total(filas[0]) }
}

export function SaldoCreditos() {
  const navigate = useNavigate()
  const historial = useHistorial()
  const bolsa = bolsaDe(historial)
  const [abierto, setAbierto] = useState(false)
  // Los cajones se montan de nuevo en cada apertura, con lo de hoy (como en Créditos).
  const [vez, setVez] = useState(0)
  const [cajon, setCajon] = useState<'reasignar' | 'comprar' | null>(null)
  const abrirCajon = (cual: 'reasignar' | 'comprar') => {
    setAbierto(false)
    setVez((antes) => antes + 1)
    setCajon(cual)
  }

  const conCosto = porUrgencia(bolsa.porAgente.filter((uno) => uno.agente.costo))
  const libres = conCosto.reduce((suma, uno) => suma + uno.libre, 0)
  const enPausa = conCosto.filter((uno) => uno.situacion === 'sin-cupo' && uno.vacantes.length)
  const vacantesEnPausa = new Set(enPausa.flatMap((uno) => uno.vacantes.map((vacante) => vacante.id))).size
  const usadoPct = bolsa.comprado > 0 ? Math.round((bolsa.usado / bolsa.comprado) * 100) : 0
  const { esta, anterior } = semanas(historial)
  const cambio = anterior > 0 ? Math.round(((esta - anterior) / anterior) * 100) : null

  const partes = [
    { id: 'usado', etiqueta: 'Usados', valor: bolsa.usado, color: 'var(--chart-4)' },
    { id: 'reservado', etiqueta: 'Reservados', valor: bolsa.reservado, color: 'var(--chart-2)' },
    { id: 'libre', etiqueta: 'Libres', valor: libres, color: 'var(--chart-1)' },
    { id: 'sin', etiqueta: 'Sin asignar', valor: bolsa.sinAsignar, color: 'var(--muted)' },
  ]

  return (
    <>
      <Popover open={abierto} onOpenChange={setAbierto}>
        {/* La pastilla: lo que queda, con el punto rojo si algún agente pausó vacantes. Es un dato, no un llamado a la acción:
            va primero en la fila, antes de los botones. */}
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              className="gap-2 pl-1.5"
              aria-label={`Créditos de Selección: ${creditos(bolsa.disponible)} disponibles${enPausa.length ? `; ${plural(enPausa.length, '1 agente', `${enPausa.length} agentes`)} sin cupo` : ''}`}
            />
          }
        >
          <span className="relative flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary [perspective:200px]">
            {/* La moneda da una vuelta al abrir y otra al cerrar. */}
            <motion.span className="flex" animate={{ rotateY: abierto ? 360 : 0 }} transition={{ type: 'spring', stiffness: 220, damping: 18 }}>
              <HugeiconsIcon icon={Coins01Icon} size={15} aria-hidden="true" />
            </motion.span>
            {/* Algún agente pausó vacantes: el punto rojo late para que se note sin gritar. */}
            {enPausa.length ? (
              <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive opacity-60 motion-reduce:hidden" />
                <span className="relative inline-flex size-2 rounded-full bg-destructive ring-2 ring-background" />
              </span>
            ) : null}
          </span>
          <span className="tabular-nums">
            <CifraAnimada valor={bolsa.disponible} formato={creditos} duracion={0.8} />
          </span>
          <Text as="span" variant="muted" size="sm">
            créditos
          </Text>
          <HugeiconsIcon icon={ArrowDown01Icon} size={14} aria-hidden="true" className="text-muted-foreground" />
        </PopoverTrigger>

        <PopoverContent align="end" className="w-[26rem] max-w-[calc(100vw-2rem)] gap-0 p-0">
          {/* 1 · Cuánto queda: la cifra grande y el anillo de lo usado. */}
          <motion.div {...celda(0)} className="flex items-center justify-between gap-4 p-4 pb-3">
            <div className="flex min-w-0 flex-col gap-0.5">
              <Text as="span" size="sm" weight="medium">
                Créditos de Selección
              </Text>
              <span className="flex flex-wrap items-baseline gap-1.5">
                <Text as="span" weight="semibold" className="text-3xl leading-10 tracking-tight tabular-nums">
                  <CifraAnimada valor={bolsa.disponible} formato={creditos} />
                </Text>
                <Text as="span" variant="muted" size="sm" className="tabular-nums">
                  disponibles de {creditos(bolsa.comprado)}
                </Text>
              </span>
            </div>
            <AnilloAvance
              valor={usadoPct}
              color="var(--chart-4)"
              etiqueta="Usados"
              globo={false}
              tamano={60}
              grosor={6}
              centro={
                <Text as="span" size="xs" weight="semibold" className="tabular-nums">
                  {usadoPct} %
                </Text>
              }
            />
          </motion.div>

          {/* 2 · En qué se fue la bolsa: la barra y sus cuatro partes. */}
          <motion.div {...celda(1)} className="flex flex-col gap-2.5 px-4 pb-4">
            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.7, delay: 0.15 }} style={{ originX: 0 }} aria-hidden="true">
              <BarraSegmentada segmentos={partes} />
            </motion.div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {partes.map((parte) => (
                <span key={parte.id} className="flex min-w-0 items-center justify-between gap-2">
                  <TrafficLight data={{ label: parte.etiqueta, items: [{ label: parte.etiqueta, value: '', color: parte.color === 'var(--muted)' ? 'var(--muted-foreground)' : parte.color }] }} />
                  <Text as="span" size="sm" weight="medium" className="tabular-nums">
                    {creditos(parte.valor)}
                  </Text>
                </span>
              ))}
            </div>
          </motion.div>

          {/* 3 · Lo urgente: agentes sin cupo que pausaron vacantes, con la salida a un clic. */}
          {enPausa.length ? (
            <motion.div {...celda(2)} className="mx-4 mb-4 flex items-start gap-3 rounded-lg bg-destructive/8 p-3">
              <motion.span
                className="mt-0.5 flex shrink-0 text-destructive"
                animate={{ scale: [1, 1.18, 1] }}
                transition={{ duration: 0.6, delay: 0.5, repeat: 2, repeatDelay: 0.4 }}
              >
                <HugeiconsIcon icon={Alert02Icon} size={16} aria-hidden="true" />
              </motion.span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <Text as="span" size="sm" weight="medium">
                  {enPausa.length === 1 ? `${enPausa[0].agente.nombre} se quedó sin cupo` : `${enPausa.length} agentes se quedaron sin cupo`}
                </Text>
                <Text as="span" variant="muted" size="xs">
                  {enPausa.length === 1 ? '' : `${enLista(enPausa.map((uno) => uno.agente.nombre))}. `}
                  {plural(vacantesEnPausa, 'Hay 1 vacante en pausa', `Hay ${vacantesEnPausa} vacantes en pausa`)} hasta que les des créditos.
                </Text>
              </span>
              <Button size="sm" variant="outline" className="shrink-0" onClick={() => abrirCajon('reasignar')}>
                Darles créditos
              </Button>
            </motion.div>
          ) : null}

          <Separator />

          {/* 4 · Para cuánto le alcanza a cada agente, primero lo urgente. */}
          <motion.div {...celda(3)} className="flex flex-col gap-1 p-4 pb-3">
            <Text as="span" variant="muted" size="xs" weight="medium">
              Para cuánto le alcanza a cada agente
            </Text>
            <ul className="flex flex-col">
              {conCosto.map((estado, indice) => (
                <FilaAgente key={estado.agente.id} estado={estado} orden={indice} />
              ))}
            </ul>
          </motion.div>

          {/* 5 · Esta semana: lo cobrado y si va más rápido o más lento que la anterior. */}
          <motion.div {...celda(4)} className="flex items-center gap-2 px-4 pb-4">
            <HugeiconsIcon icon={Clock01Icon} size={15} aria-hidden="true" className="text-muted-foreground" />
            <Text as="span" size="sm">
              Esta semana se cobraron <span className="font-medium tabular-nums">{creditos(esta)}</span>
              {cambio === null ? '.' : cambio === 0 ? ', igual que la anterior.' : `, ${Math.abs(cambio)} % ${cambio > 0 ? 'más' : 'menos'} que la anterior.`}
            </Text>
          </motion.div>

          {/* 6 · Lo que se hace con eso, sin salir de aquí. */}
          <div className="flex items-center gap-2 border-t bg-muted/40 px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAbierto(false)
                navigate(`${RUTA_CREDITOS}?pestana=historial`)
              }}
            >
              Ver el historial
            </Button>
            <span className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => abrirCajon('comprar')}>
                <HugeiconsIcon icon={CreditCardIcon} size={16} aria-hidden="true" />
                Comprar
              </Button>
              <Button size="sm" onClick={() => abrirCajon('reasignar')}>
                <HugeiconsIcon icon={PieChartIcon} size={16} aria-hidden="true" />
                Reasignar
              </Button>
            </span>
          </div>
        </PopoverContent>
      </Popover>

      <ReasignarCreditos key={`reasignar-${vez}`} open={cajon === 'reasignar'} onOpenChange={(abre) => setCajon(abre ? 'reasignar' : null)} bolsa={bolsa} />
      <ComprarCreditos
        key={`comprar-${vez}`}
        open={cajon === 'comprar'}
        onOpenChange={(abre) => setCajon(abre ? 'comprar' : null)}
        bolsa={bolsa}
        onReasignar={() => abrirCajon('reasignar')}
      />
    </>
  )
}

// Un agente: su icono, su nombre, la barrita de lo libre sobre lo asignado y para cuánto le alcanza (y en cuántos días se
// le acaba a su ritmo). Sin cupo, lo dice su insignia roja.
function FilaAgente({ estado, orden }: { estado: EstadoAgente; orden: number }) {
  const { agente, asignado, libre, usos, diasRestantes } = estado
  const libreSobre = asignado > 0 ? (libre / asignado) * 100 : 0
  return (
    // Entran uno tras otro y, al pasar el cursor, el agente se corre un poco: se siente que la lista responde.
    <motion.li
      className="flex items-center gap-3 rounded-md py-1.5"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: 0.25 + orden * 0.05 }}
      whileHover={{ x: 3 }}
    >
      <IconoAgente agente={agente} size="sm" />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex min-w-0 items-center justify-between gap-2">
          <Text as="span" size="sm" weight="medium" className="truncate">
            {agente.nombre}
          </Text>
          {usos ? (
            <Text as="span" variant="muted" size="xs" className="shrink-0 tabular-nums">
              {usosTexto(agente, usos)}
              {diasRestantes !== null ? ` · ${diasRestantes} ${diasRestantes === 1 ? 'día' : 'días'}` : ''}
            </Text>
          ) : (
            <span className="shrink-0">
              <InsigniaSituacion estado={estado} />
            </span>
          )}
        </span>
        {/* Lo que le queda de lo asignado. */}
        <span className="relative h-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
          <motion.span
            className="absolute inset-y-0 left-0 rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${libreSobre}%` }}
            transition={{ duration: 0.7, delay: 0.35 + orden * 0.05, ease: [0.22, 1, 0.36, 1] }}
          />
        </span>
      </span>
    </motion.li>
  )
}
