import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, ArrowUpDownIcon, ChartColumnIcon, GitCompareIcon, Search01Icon } from '@hugeicons/core-free-icons'
import { Badge } from '@/shared/components/Badge'
import {
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  IconTile,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  FramePanel,
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  Progress,
  RadioGroup,
  RadioGroupItem,
  Text,
} from '@ubits/flux-ui'
import { AiThinking } from '@/shared/components/AiThinking'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { KIND_VISUAL } from '../../modelo/kindVisual'
import type { SurveyKind } from '../../modelo/surveyBuilderTypes'
import { TEXTO_POR_TONO } from '../tonos'
import { dateValue } from '../../modelo/surveyListDates'
import type { SurveyListItem } from '../../modelo/types'
import { FILA_CLICABLE, FilasSeparadas, MarcoLista } from '../marco-lista'
import { EncabezadoPaso, PasosDrawer } from '../pasos-drawer'
import { rutaComparativo } from './ruta'

// El asistente del comparativo: tipo, encuestas y base, en ese orden. Solo se cruzan mediciones
// finalizadas del mismo tipo, de 2 a 5: con más columnas la tabla deja de leerse. La base es la
// referencia contra la que se leen las demás; arranca en la más reciente. Portado del prototipo.
//
// Las tres listas tienen el armado de «Crear con plantilla» (9-oct): un marco con su título y, dentro, filas con una línea
// entre cada una y gris al pasar el cursor, no una tarjeta por opción. La fila entera elige, y la casilla o el círculo van
// siempre a la izquierda (regla «elegir-a-la-izquierda», 9-oct).
import { SinResultados } from '@/shared/components/SinResultados'

export const MINIMO = 2
export const MAXIMO = 5
// El respiro entre «Generar comparativo» y la lectura: cruzar las mediciones no es instantáneo.
const TICK_MS = 260

type Paso = 1 | 2 | 3
const PASOS = ['Tipo', 'Comparar', 'Base'] as const

// Cada tipo con el icono y el color que tiene en todo el módulo (kindVisual.ts): el mismo que se ve al crear y en las plantillas.
const TIPOS: readonly { tipo: string; descripcion: string; clase: SurveyKind }[] = [
  { tipo: 'Clima', descripcion: 'Mide la percepción del ambiente laboral y el bienestar.', clase: 'clima' },
  { tipo: 'Cultura', descripcion: 'Analiza los valores y comportamientos compartidos.', clase: 'cultura' },
  { tipo: 'NPS', descripcion: 'Qué tanto recomendarían la empresa como lugar para trabajar.', clase: 'enps' },
]

// El encabezado de cada paso: qué se elige y, debajo, la regla.
/** Los tipos que se pueden cruzar: la NOM 035 produce niveles de riesgo, no favorabilidad. */
export const TIPOS_COMPARABLES: readonly string[] = TIPOS.map((opcion) => opcion.tipo)

const ORDENES = { recientes: 'Más recientes', antiguas: 'Más antiguas', nombre: 'Nombre (A-Z)' } as const
type Orden = keyof typeof ORDENES

const DETALLE_AVANCE = (avance: number) => (avance < 35 ? 'Leyendo las mediciones elegidas…' : avance < 70 ? 'Cruzando participación y favorabilidad…' : 'Preparando la lectura por sección…')

/** Lo que el asistente trae ya elegido: al reabrirlo desde un comparativo o desde la selección de la tabla. */
export type Preseleccion = { tipo: string; ids: readonly string[]; base?: string | null }

type Props = { abierto: boolean; onAbierto: (abierto: boolean) => void; encuestas: readonly SurveyListItem[]; inicial?: Preseleccion | null }

const masReciente = (encuestas: readonly SurveyListItem[]) => [...encuestas].sort((a, b) => dateValue(b.startDate) - dateValue(a.startDate))[0]

export function AsistenteComparativo({ abierto, onAbierto, encuestas, inicial }: Props) {
  const navigate = useNavigate()
  const finalizadas = useMemo(() => encuestas.filter((encuesta) => encuesta.status === 'Finalizado'), [encuestas])
  const [paso, setPaso] = useState<Paso>(1)
  const [tipo, setTipo] = useState<string | null>(null)
  const [elegidas, setElegidas] = useState<readonly string[]>([])
  const [base, setBase] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState<Orden>('recientes')
  const [avance, setAvance] = useState<number | null>(null)
  const reloj = useRef<ReturnType<typeof setInterval> | null>(null)

  // Al abrir, arranca limpio o con lo que se trae elegido (en el paso de las encuestas, para cambiar solo lo que haga falta).
  useEffect(() => {
    if (!abierto) return
    setBusqueda('')
    setAvance(null)
    if (inicial) {
      setTipo(inicial.tipo)
      setElegidas(inicial.ids.slice(0, MAXIMO))
      setBase(inicial.base ?? null)
      setPaso(2)
    } else {
      setTipo(null)
      setElegidas([])
      setBase(null)
      setPaso(1)
    }
  }, [abierto, inicial])

  useEffect(() => () => void (reloj.current && clearInterval(reloj.current)), [])

  const delTipo = useMemo(() => finalizadas.filter((encuesta) => encuesta.type === tipo), [finalizadas, tipo])
  const lista = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const filtradas = delTipo.filter((encuesta) => !q || encuesta.name.toLowerCase().includes(q))
    return [...filtradas].sort((a, b) => (orden === 'nombre' ? a.name.localeCompare(b.name, 'es') : (dateValue(b.startDate) - dateValue(a.startDate)) * (orden === 'recientes' ? 1 : -1)))
  }, [delTipo, busqueda, orden])
  const seleccionadas = delTipo.filter((encuesta) => elegidas.includes(encuesta.id))
  const baseVigente = seleccionadas.some((encuesta) => encuesta.id === base) ? base : (masReciente(seleccionadas)?.id ?? null)

  const alternar = (id: string) => setElegidas((actuales) => (actuales.includes(id) ? actuales.filter((otra) => otra !== id) : actuales.length < MAXIMO ? [...actuales, id] : actuales))

  const generar = () => {
    if (!baseVigente) return
    const ids = seleccionadas.map((encuesta) => encuesta.id)
    let actual = 0
    setAvance(0)
    reloj.current = setInterval(() => {
      actual = Math.min(100, actual + 6 + Math.floor(Math.random() * 10))
      setAvance(actual)
      if (actual < 100) return
      if (reloj.current) clearInterval(reloj.current)
      setTimeout(() => {
        onAbierto(false)
        // `generado`: el comparativo se acaba de pedir. Si el cruce falla (COM-028), la página lo dice con su estado vacío y
        // ofrece reintentar o volver aquí con lo elegido; un enlace guardado abre la lectura que ya se generó.
        navigate(rutaComparativo(baseVigente, ids), { state: { generado: true } })
      }, 400)
    }, TICK_MS)
  }

  const puedeSeguir = paso === 1 ? tipo !== null : paso === 2 ? seleccionadas.length >= MINIMO : baseVigente !== null
  const generando = avance !== null

  return (
    <DrawerShell
      open={abierto}
      onOpenChange={(valor) => !generando && onAbierto(valor)}
      size="lg"
      icon={GitCompareIcon}
      title={generando ? 'Generando comparativo' : 'Comparativo de encuestas'}
      description={generando ? 'Estamos cruzando las mediciones que elegiste.' : `Compara de ${MINIMO} a ${MAXIMO} encuestas finalizadas del mismo tipo.`}
      // «← Volver» arriba (regla «panel-volver-arriba», 13-oct): el paso anterior, desde el 2.
      onVolver={!generando && paso > 1 ? () => setPaso((paso - 1) as Paso) : undefined}
      headerExtra={
        generando ? null : (
          <PasosDrawer pasos={PASOS} actual={paso} onVolver={(valor) => setPaso(valor as Paso)} />
        )
      }
      footer={
        generando ? null : (
          <>

            {paso < 3 ? (
              <Button disabled={!puedeSeguir} onClick={() => setPaso((paso + 1) as Paso)}>
                Continuar
                <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
              </Button>
            ) : (
              <Button disabled={!puedeSeguir} onClick={generar}>
                <HugeiconsIcon icon={ChartColumnIcon} aria-hidden="true" />
                Generar comparativo
              </Button>
            )}
          </>
        )
      }
    >
      {generando ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <AiThinking label="Comparando encuestas" size="md" />
          <div className="flex w-full max-w-sm flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <Text as="span" size="sm" variant="muted">
                {DETALLE_AVANCE(avance)}
              </Text>
              <Text as="span" size="sm" weight="semibold" className="tabular-nums">
                {avance} %
              </Text>
            </div>
            <Progress value={avance} aria-label="Avance del comparativo" />
          </div>
        </div>
      ) : null}

      {!generando && paso === 1 ? (
        <section className="flex flex-col gap-3">
          <EncabezadoPaso titulo="¿Qué tipo de encuestas quieres comparar?" descripcion="Todas las encuestas del comparativo serán de este tipo." />
          <MarcoLista titulo="Tipos de encuesta" descripcion={`Se puede comparar un tipo con al menos ${MINIMO} encuestas finalizadas.`}>
            {/* «!»: el relleno corto del catálogo de plantillas; con el del tema, las filas quedan lejos de su línea. */}
            <FramePanel className="py-1!">
          <RadioGroup
            value={tipo ?? ''}
            onValueChange={(valor) => {
              setTipo(valor as string)
              setElegidas([])
              setBase(null)
            }}
          >
            <FilasSeparadas>
            {TIPOS.map((opcion) => {
              const cuantas = finalizadas.filter((encuesta) => encuesta.type === opcion.tipo).length
              const alcanza = cuantas >= MINIMO
              const visual = KIND_VISUAL[opcion.clase]
              return (
                <Item key={opcion.tipo} size="sm" render={<label htmlFor={`tipo-${opcion.tipo}`} />} className={alcanza ? FILA_CLICABLE : 'opacity-60'} aria-disabled={!alcanza || undefined}>
                  <RadioGroupItem value={opcion.tipo} id={`tipo-${opcion.tipo}`} disabled={!alcanza} />
                  <ItemMedia>
                    <IconTile variant="soft" size="sm" className={TEXTO_POR_TONO[visual.tone]}>
                      <HugeiconsIcon icon={visual.icon} aria-hidden="true" />
                    </IconTile>
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                    <ItemTitle>
                      {opcion.tipo}
                      <Text as="span" size="xs" variant="muted" weight="normal" className="tabular-nums">
                        · {cuantas} {cuantas === 1 ? 'finalizada' : 'finalizadas'}
                      </Text>
                    </ItemTitle>
                    <ItemDescription>{alcanza ? opcion.descripcion : `Hace falta al menos ${MINIMO} encuestas finalizadas de este tipo.`}</ItemDescription>
                  </ItemContent>
                </Item>
              )
            })}
            </FilasSeparadas>
          </RadioGroup>
            </FramePanel>
          </MarcoLista>
        </section>
      ) : null}

      {!generando && paso === 2 ? (
        <section className="flex flex-col gap-3">
          <EncabezadoPaso
            titulo="Elige las encuestas"
            descripcion={`Entre ${MINIMO} y ${MAXIMO} encuestas finalizadas de tipo ${tipo}.`}
            extra={
              <Badge variant={seleccionadas.length >= MINIMO ? 'primary-light' : 'secondary'} radius="full" className="shrink-0 tabular-nums">
                {seleccionadas.length} de {MAXIMO}
              </Badge>
            }
          />
          <div className="flex items-center gap-2">
            <InputGroup className="flex-1">
              <InputGroupAddon>
                <HugeiconsIcon icon={Search01Icon} aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Filtrar encuestas" aria-label="Filtrar encuestas" />
            </InputGroup>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" />}>
                <HugeiconsIcon icon={ArrowUpDownIcon} aria-hidden="true" />
                {ORDENES[orden]}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-max min-w-(--anchor-width)">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
                  <DropdownMenuRadioGroup value={orden} onValueChange={(valor) => setOrden(valor as Orden)}>
                    {(Object.keys(ORDENES) as Orden[]).map((clave) => (
                      <DropdownMenuRadioItem key={clave} value={clave}>
                        {ORDENES[clave]}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {lista.length === 0 ? (
            <SinResultados busqueda={busqueda} onLimpiar={() => setBusqueda('')} />
          ) : (
            <MarcoLista titulo={`Finalizadas de ${tipo}`} descripcion={`${lista.length} ${lista.length === 1 ? 'encuesta' : 'encuestas'}${busqueda.trim() ? ` para «${busqueda.trim()}»` : ''}`}>
              {/* «!»: el relleno corto del catálogo de plantillas; con el del tema, las filas quedan lejos de su línea. */}
              <FramePanel className="py-1!">
                <FilasSeparadas>
              {lista.map((encuesta) => {
                const marcada = elegidas.includes(encuesta.id)
                const lleno = !marcada && seleccionadas.length >= MAXIMO
                return (
                  <Item key={encuesta.id} size="sm" render={<label htmlFor={`comparar-${encuesta.id}`} />} className={lleno ? 'opacity-60' : FILA_CLICABLE} aria-disabled={lleno || undefined}>
                    <ItemMedia>
                      <Checkbox id={`comparar-${encuesta.id}`} checked={marcada} disabled={lleno} onCheckedChange={() => alternar(encuesta.id)} />
                    </ItemMedia>
                    <ItemContent className="min-w-0">
                      <ItemTitle className="truncate">{encuesta.name}</ItemTitle>
                      <ItemDescription>
                        {encuesta.startDate} · {encuesta.participants} participantes
                      </ItemDescription>
                    </ItemContent>
                  </Item>
                )
              })}
                </FilasSeparadas>
              </FramePanel>
            </MarcoLista>
          )}
        </section>
      ) : null}

      {!generando && paso === 3 ? (
        <section className="flex flex-col gap-3">
          <EncabezadoPaso titulo="Elige la encuesta base" descripcion="Es el punto de referencia: las demás se comparan contra ella. Empieza en la más reciente." />
          <MarcoLista titulo="Encuestas del comparativo" descripcion={`${seleccionadas.length} elegidas · la base es la columna de referencia`}>
            {/* «!»: el relleno corto del catálogo de plantillas; con el del tema, las filas quedan lejos de su línea. */}
            <FramePanel className="py-1!">
          <RadioGroup value={baseVigente ?? ''} onValueChange={(valor) => setBase(valor as string)}>
            <FilasSeparadas>
            {[...seleccionadas]
              .sort((a, b) => dateValue(b.startDate) - dateValue(a.startDate))
              .map((encuesta, indice) => (
                <Item key={encuesta.id} size="sm" render={<label htmlFor={`base-${encuesta.id}`} />} className={FILA_CLICABLE}>
                  <RadioGroupItem value={encuesta.id} id={`base-${encuesta.id}`} />
                  <ItemContent className="min-w-0">
                    <ItemTitle>
                      {encuesta.name}
                      {indice === 0 ? (
                        <Badge variant="secondary" size="xs">
                          Más reciente
                        </Badge>
                      ) : null}
                    </ItemTitle>
                    <ItemDescription>
                      {encuesta.startDate} · {encuesta.participants} participantes
                    </ItemDescription>
                  </ItemContent>
                </Item>
              ))}
            </FilasSeparadas>
          </RadioGroup>
            </FramePanel>
          </MarcoLista>
        </section>
      ) : null}
    </DrawerShell>
  )
}
