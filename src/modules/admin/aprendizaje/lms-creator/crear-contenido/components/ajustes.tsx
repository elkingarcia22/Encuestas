import { useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  AlertCircleIcon,
  EyeOffIcon,
  PercentIcon,
  ShuffleIcon,
  SortByDown02Icon,
  Tick02Icon,
  UserGroupIcon,
  ViewIcon,
} from '@hugeicons/core-free-icons'
import {
  Button,
  Frame,
  FramePanel,
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
  Heading,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Progress,
  RadioGroup,
  RadioGroupItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from '@ubits/flux-ui'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { Badge } from '@/shared/components/Badge'
import { DialogoConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { fechaCorta } from '@/modules/design-system/patrones/formato'
import { sumaPesos, type ClaseCreacion, type ItemPeso, type TipoNavegacion, type Visibilidad } from './borrador'
import { DrawerColaboradores } from './drawer-colaboradores'

// Las piezas del paso 4 · Ajustes: la visibilidad (4 opciones y el panel de colaboradores), los pesos de
// evaluación y el tipo de navegación, más las confirmaciones reales que salen al publicar desde la pantalla final. Cada
// sección tiene su ancla (#ajustes-visibilidad, #ajustes-pesos, #ajustes-navegacion).

export const VISIBILIDAD: Record<Visibilidad, { etiqueta: string; badge: 'info-light' | 'success-light' | 'warning-light' | 'secondary' }> = {
  borrador: { etiqueta: 'Borrador', badge: 'info-light' },
  publico: { etiqueta: 'Público', badge: 'success-light' },
  privado: { etiqueta: 'Privado', badge: 'warning-light' },
  oculto: { etiqueta: 'Oculto', badge: 'secondary' },
}

// Una frase por opción: lo que hay que saber para elegir es quién lo ve. Lo que se puede editar después era la misma
// advertencia repetida en tres tarjetas, y la decisión que se está tomando aquí es otra.
/**
 * Las cuatro visibilidades, dichas en la clase que toca: una ruta «está» en construcción y «la» completaron, no «lo».
 * Es la misma decisión en los tres casos; lo único que cambia es la palabra (HU-LMS-001, HU-LMS-013).
 */
const opcionesVisibilidad = (clase: ClaseCreacion): { valor: Visibilidad; descripcion: ReactNode }[] => {
  const ruta = clase === 'ruta'
  const laEl = ruta ? 'La ruta' : clase === 'evento' ? 'El evento' : 'El contenido'
  const elLa = ruta ? 'la ruta' : clase === 'evento' ? 'el evento' : 'el contenido'
  const lo = ruta ? 'la' : 'lo'
  return [
    {
      valor: 'borrador',
      descripcion: (
        <>
          {laEl} está en construcción y será visible <strong>solo para ti y otros creadores</strong>.
        </>
      ),
    },
    {
      valor: 'publico',
      descripcion: (
        <>
          <strong>Todos los colaboradores</strong> de tu empresa podrán ver {elLa}.
        </>
      ),
    },
    {
      valor: 'privado',
      descripcion: (
        <>
          Disponible solo para los <strong>colaboradores seleccionados</strong>.
        </>
      ),
    },
    {
      valor: 'oculto',
      descripcion: (
        <>
          <strong>No estará en el catálogo</strong>, pero será visible para{' '}
          <strong>
            quienes {lo} completaron o {lo} tienen en progreso
          </strong>
          .
        </>
      ),
    },
  ]
}

/** Ids de las anclas de cada sección del paso 3: `#ajustes-pesos` lleva a `cc-ajustes-pesos`. */
export const ANCLA_AJUSTES = { visibilidad: 'cc-ajustes-visibilidad', pesos: 'cc-ajustes-pesos', navegacion: 'cc-ajustes-navegacion' } as const

// ── Visibilidad ──────────────────────────────────────────────────────────────────────────────────────────────────
//
// En el asistente la visibilidad solo se elige: se confirma al publicar, en la pantalla final (`DialogoPublicar`).

type PropsVisibilidad = {
  visibilidad: Visibilidad
  onVisibilidad: (v: Visibilidad) => void
  colaboradores: string[]
  onColaboradores: (ids: string[]) => void
  /** Sin «Borrador»: al publicar un contenido que quedó en borrador se elige entre las otras tres. */
  sinBorrador?: boolean
  /** «Borrador» deshabilitado: ya se confirmó publicar u ocultar y no se vuelve a borrador. */
  bloquearBorrador?: boolean
  /** Prefijo de los ids, para que dos grupos en pantalla no choquen. */
  id?: string
  /** Abre el drawer de selección al entrar: lo pide la dirección `#ajustes-colaboradores`. */
  abrirSeleccion?: boolean
  /** Qué se está creando: decide si los textos hablan de contenido, de evento o de ruta. */
  clase?: ClaseCreacion
}

export function PanelVisibilidad({
  visibilidad,
  onVisibilidad,
  colaboradores,
  onColaboradores,
  sinBorrador = false,
  bloquearBorrador = false,
  id = 'cc-vis',
  abrirSeleccion = false,
  clase = 'contenido',
}: PropsVisibilidad) {
  const [drawer, setDrawer] = useState(abrirSeleccion)
  const elLa = clase === 'ruta' ? 'la ruta' : clase === 'evento' ? 'el evento' : 'el contenido'
  const opciones = opcionesVisibilidad(clase).filter((o) => !sinBorrador || o.valor !== 'borrador')

  return (
    <div className="flex flex-col gap-4">
      <RadioGroup value={visibilidad} onValueChange={(v) => onVisibilidad(v as Visibilidad)} aria-label={`Visibilidad de ${elLa}`} className="grid gap-3 md:grid-cols-2">
        {opciones.map((opcion) => (
          <FieldLabel key={opcion.valor} htmlFor={`${id}-${opcion.valor}`} className="bg-card">
            <Field orientation="horizontal" className="items-start!">
              <RadioGroupItem
                value={opcion.valor}
                id={`${id}-${opcion.valor}`}
                disabled={bloquearBorrador && opcion.valor === 'borrador'}
                className="mt-0.5"
              />
              <FieldContent className="gap-2">
                <div className="flex min-h-7 flex-wrap items-center justify-between gap-2">
                  <FieldTitle>
                    <Badge variant={VISIBILIDAD[opcion.valor].badge}>{VISIBILIDAD[opcion.valor].etiqueta}</Badge>
                  </FieldTitle>
                </div>
                <FieldDescription>{opcion.descripcion}</FieldDescription>
              </FieldContent>
            </Field>
          </FieldLabel>
        ))}
      </RadioGroup>

      {visibilidad === 'privado' ? (
        <Frame spacing="sm">
          <FramePanel className="flex flex-wrap items-center justify-between gap-3">
            <Text as="span" size="sm" variant={colaboradores.length ? undefined : 'muted'}>
              {colaboradores.length
                ? `${cuenta(colaboradores.length, 'colaborador seleccionado', 'colaboradores seleccionados')} · solo ellos verán ${elLa}`
                : `Todavía no seleccionas colaboradores: solo ellos verán ${elLa}.`}
            </Text>
            <Button variant="outline" size="sm" onClick={() => setDrawer(true)}>
              <HugeiconsIcon icon={UserGroupIcon} size={16} aria-hidden="true" />
              {colaboradores.length ? 'Editar selección' : 'Seleccionar colaboradores'}
            </Button>
          </FramePanel>
        </Frame>
      ) : null}

      <DrawerColaboradores abierto={drawer} onCerrar={() => setDrawer(false)} seleccionados={colaboradores} onGuardar={onColaboradores} />
    </div>
  )
}

const cuenta = (n: number, uno: string, varios: string) => `${n.toLocaleString('es-CO')} ${n === 1 ? uno : varios}`

/**
 * Las confirmaciones reales al publicar: «Publicar contenido» para público y privado, «Ocultar contenido» para oculto.
 * En un evento dicen «evento».
 */
export function DialogoPublicar({
  visibilidad,
  abierto,
  clase = 'contenido',
  onAbiertoChange,
  onConfirmar,
}: {
  visibilidad: Visibilidad
  abierto: boolean
  clase?: ClaseCreacion
  onAbiertoChange: (abierto: boolean) => void
  onConfirmar: () => void
}) {
  const ruta = clase === 'ruta'
  const cosa = ruta ? 'ruta' : clase === 'evento' ? 'evento' : 'contenido'
  const este = ruta ? 'esta' : 'este'
  const lo = ruta ? 'la' : 'lo'
  return (
    <>
      <DialogoConfirmar
        abierto={abierto && visibilidad !== 'oculto'}
        onAbiertoChange={onAbiertoChange}
        icono={ViewIcon}
        titulo={`¿Publicar ${este} ${cosa}?`}
        descripcion={
          <>
            Al publicar {este} {cosa}, estará disponible para{' '}
            <strong>{visibilidad === 'privado' ? 'los colaboradores que seleccionaste' : 'tus colaboradores'}</strong>. Confirma que todo esté listo,
            ya que luego <strong>solo será posible realizar cambios limitados</strong>, como modificar textos.
          </>
        }
        accion={`Publicar ${cosa}`}
        onConfirmar={onConfirmar}
      />
      <DialogoConfirmar
        abierto={abierto && visibilidad === 'oculto'}
        onAbiertoChange={onAbiertoChange}
        icono={EyeOffIcon}
        titulo={`¿Ocultar ${este} ${cosa}?`}
        descripcion={
          <>
            Al ocultar {este} {cosa}, se volverá <strong>invisible para nuevos colaboradores</strong>.{' '}
            <strong>Aquellos que ya {lo} estén cursando podrán finalizar{lo} sin problemas</strong>.
          </>
        }
        accion={`Ocultar ${cosa}`}
        onConfirmar={onConfirmar}
      />
    </>
  )
}

// ── Pesos ────────────────────────────────────────────────────────────────────────────────────────────────────────

type PropsPesos = {
  items: ItemPeso[]
  pesos: Record<string, number>
  /** Demo `#ajustes-pesos-empty`: la sección de pesos sin evaluaciones aunque las haya. */
  pesosVacio?: boolean
  onPeso: (id: string, valor: number) => void
}

export function PanelPesos({ items: todos, pesos, pesosVacio = false, onPeso }: PropsPesos) {
  const items = pesosVacio ? [] : todos
  const visibles = items.filter((i) => !i.oculta)
  const editable = visibles.length >= 2
  const suma = sumaPesos(items, pesos)

  if (!items.length) {
    return (
      <Frame>
        <FramePanel>
        {/* Vacío con su ilustración glass (13-oct). */}
        <PrimeraVez icono="glass-chart" titulo="Aún no hay evaluaciones" descripcion="Agrega evaluaciones en Recursos. Cuando exista al menos una, aquí verás su peso en la nota final." />
        </FramePanel>
      </Frame>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {!visibles.length || visibles.length === 1 ? (
        <Text variant="muted" size="sm">
          {visibles.length
            ? 'Con una sola evaluación, el peso es automáticamente el 100 % de la nota final.'
            : 'Todas las evaluaciones están ocultas. Muéstralas en Recursos para asignar pesos.'}
        </Text>
      ) : null}

      {editable ? (
        <Frame spacing="sm">
          <FramePanel className="flex flex-col gap-3" aria-live="polite">
            <div className="flex items-baseline gap-2">
              <Text as="span" size="sm">
                El total debe ser 100 %. Llevas
              </Text>
              <Heading as="h3" level={3} className="tabular-nums">
                {suma}
              </Heading>
              <Text as="span" variant="muted" size="sm">
                /100
              </Text>
              {suma > 0 ? (
                <Badge variant={suma === 100 ? 'success-outline' : 'destructive-outline'} size="sm" className="self-center" aria-hidden="true">
                  <HugeiconsIcon icon={suma === 100 ? Tick02Icon : AlertCircleIcon} size={12} />
                </Badge>
              ) : null}
            </div>
            <Progress value={Math.min(suma, 100)} aria-label="Suma de pesos" />
          </FramePanel>
        </Frame>
      ) : null}

      <Frame spacing="sm">
        <FramePanel>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evaluación</TableHead>
                <TableHead className="w-32 text-right">Peso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, i) => {
                const valor = item.oculta ? 0 : visibles.length === 1 ? 100 : (pesos[item.id] ?? 0)
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex min-w-0 items-center gap-3">
                        <Text as="span" variant="muted" size="sm" className="w-5 tabular-nums">
                          {i + 1}
                        </Text>
                        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                          <Text as="span" weight="semibold" className="truncate">
                            {item.titulo}
                          </Text>
                          {item.oculta ? (
                            <Badge variant="secondary" size="sm" className="gap-1">
                              <HugeiconsIcon icon={EyeOffIcon} size={12} aria-hidden="true" />
                              Oculta · {fechaCorta(item.ocultaDesde ?? new Date().toISOString().slice(0, 10))}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <InputGroup className="ml-auto w-28">
                        <InputGroupInput
                          inputMode="numeric"
                          aria-label={`Peso de ${item.titulo}`}
                          value={String(valor)}
                          disabled={!editable || item.oculta}
                          onChange={(e) => {
                            const n = Math.max(0, Math.min(100, Math.round(Number(e.target.value.replace(/\D/g, '') || 0))))
                            onPeso(item.id, n)
                          }}
                        />
                        <InputGroupAddon align="inline-end">
                          <HugeiconsIcon icon={PercentIcon} size={14} aria-hidden="true" />
                        </InputGroupAddon>
                      </InputGroup>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </FramePanel>
      </Frame>
    </div>
  )
}

// ── Navegación ───────────────────────────────────────────────────────────────────────────────────────────────────

export function PanelNavegacion({
  navegacion,
  onNavegacion,
  clase = 'contenido',
}: {
  navegacion: TipoNavegacion
  onNavegacion: (v: TipoNavegacion) => void
  clase?: ClaseCreacion
}) {
  // Dentro de una ruta no hay páginas, hay contenidos: lo que se desbloquea en orden son ellos (HU-LMS-014 · RN-05, RN-06).
  const ruta = clase === 'ruta'
  const opciones: { valor: TipoNavegacion; titulo: string; icono: IconSvgElement; descripcion: ReactNode }[] = [
    {
      valor: 'lineal',
      titulo: 'Lineal',
      icono: SortByDown02Icon,
      descripcion: ruta ? (
        <>
          Los colaboradores deben completar los contenidos <strong>en el orden que definiste</strong>. Cada uno se desbloquea al terminar el
          anterior.
        </>
      ) : (
        <>
          Los colaboradores deben completar las páginas <strong>en orden</strong>. No pueden saltar a una página posterior desde el índice.
        </>
      ),
    },
    {
      valor: 'libre',
      titulo: 'Libre',
      icono: ShuffleIcon,
      descripcion: ruta ? (
        <>
          Los colaboradores pueden abrir <strong>cualquier contenido</strong> de la ruta, en el orden que quieran.
        </>
      ) : (
        <>
          Los colaboradores pueden abrir <strong>cualquier página</strong> desde el índice. La página de fin del contenido solo se habilita cuando
          completen el resto.
        </>
      ),
    },
  ]
  return (
    <div className="flex flex-col gap-4">
      <RadioGroup value={navegacion} onValueChange={(v) => onNavegacion(v as TipoNavegacion)} aria-label={`Tipo de navegación de ${ruta ? 'la ruta' : 'el contenido'}`} className="grid gap-3 md:grid-cols-2">
        {opciones.map((o) => (
          <FieldLabel key={o.valor} htmlFor={`cc-nav-${o.valor}`} className="bg-card">
            <Field orientation="horizontal" className="items-start!">
              <RadioGroupItem value={o.valor} id={`cc-nav-${o.valor}`} className="mt-0.5" />
              <FieldContent className="gap-2">
                <FieldTitle className="gap-2">
                  <HugeiconsIcon icon={o.icono} size={16} aria-hidden="true" />
                  {o.titulo}
                </FieldTitle>
                <FieldDescription>{o.descripcion}</FieldDescription>
              </FieldContent>
            </Field>
          </FieldLabel>
        ))}
      </RadioGroup>
    </div>
  )
}
