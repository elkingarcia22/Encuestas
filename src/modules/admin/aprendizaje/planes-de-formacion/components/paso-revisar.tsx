import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { BookOpen01Icon, Building03Icon, Csv01Icon, Delete02Icon, InformationCircleIcon, MoreHorizontalIcon, PlusSignIcon, Target02Icon, UserGroupIcon, UserIcon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  FramePanel,
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  Separator,
  Text,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { DialogoConfirmar, RegistroConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { plural } from '@/modules/design-system/patrones/formato'
import { Marco, Rotulo } from '@/modules/design-system/patrones/ficha'
import { competenciaDe, contenidoDe, duracionTexto, portadaDe } from './catalogo'
import { TIPOS, miembrosDe, piezasDe, type Asignacion, type Pieza, type TipoPlan } from './planes-datos'

// Paso 4 · Revisar y guardar: una ficha de solo lectura por asignación (a quiénes → qué ven, en orden), cada una con
// «Editar quiénes» y «Editar qué ven», que llevan al paso 2 o 3 de ESA asignación. Debajo, «Agregar otra asignación»
// (otro grupo con otros contenidos) y el aviso de lo que pasa al guardar.

const ICONO_PIEZA: Record<Pieza['tipo'], typeof UserIcon> = {
  empresa: Building03Icon,
  grupo: UserGroupIcon,
  nombre: UserIcon,
  persona: UserIcon,
  archivo: Csv01Icon,
}
const MAS_FICHAS = 10
const n = (cuantas: number) => cuantas.toLocaleString('es-CO')
const personas = (cuantas: number) => `${n(cuantas)} ${plural(cuantas, 'persona', 'personas')}`

export function PasoRevisar({
  tipo,
  horas,
  asignaciones,
  conErrores,
  aviso,
  onEditar,
  onOtra,
  onQuitar,
}: {
  tipo: TipoPlan
  horas: number
  asignaciones: Asignacion[]
  conErrores: boolean
  /** El aviso de lo que pasa al guardar. */
  aviso: string
  onEditar: (id: string, paso: 'quienes' | 'que') => void
  onOtra: () => void
  onQuitar: (id: string) => void
}) {
  const [quitando, setQuitando] = useState<{ asignacion: Asignacion; numero: number } | null>(null)
  const textos = TIPOS[tipo]

  return (
    <div className="flex flex-col gap-4">
      {asignaciones.map((asignacion, indice) => (
        <FichaAsignacion
          key={asignacion.id}
          asignacion={asignacion}
          numero={indice + 1}
          tipo={tipo}
          horas={horas}
          conErrores={conErrores}
          puedeQuitar={asignaciones.length > 1}
          onEditar={(paso) => onEditar(asignacion.id, paso)}
          onQuitar={() => setQuitando({ asignacion, numero: indice + 1 })}
        />
      ))}

      {/* Otra asignación: otro grupo con otros contenidos. Empieza en el paso 2, con la asignación nueva. */}
      <Empty className="rounded-xl border border-dashed py-8">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={PlusSignIcon} aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>¿Otro grupo ve otros {textos.items}?</EmptyTitle>
          <EmptyDescription>Agrega otra asignación al mismo plan: sus personas y lo que ven, con las mismas fechas.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" onClick={onOtra}>
            <HugeiconsIcon icon={PlusSignIcon} aria-hidden="true" />
            Agregar otra asignación
          </Button>
        </EmptyContent>
      </Empty>

      <Alert variant="info">
        <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
        <AlertDescription>
          <p>{aviso}</p>
        </AlertDescription>
      </Alert>

      <DialogoConfirmar
        abierto={quitando !== null}
        onAbiertoChange={(abierto) => (abierto ? undefined : setQuitando(null))}
        icono={Delete02Icon}
        titulo="¿Quitar esta asignación?"
        descripcion={`Sus personas dejan de recibir el plan y sus ${textos.items} salen de él. Las demás asignaciones no cambian.`}
        cancelar="Cancelar"
        accion="Quitar asignación"
        destructiva
        onConfirmar={() => {
          if (quitando) onQuitar(quitando.asignacion.id)
          setQuitando(null)
        }}
      >
        {quitando ? (
          <RegistroConfirmar
            nombre={quitando.asignacion.nombre?.trim() || `Asignación ${quitando.numero}`}
            detalle={`${personas(miembrosDe(quitando.asignacion).length)} · ${n(quitando.asignacion.items.length)} ${plural(quitando.asignacion.items.length, textos.item, textos.items)}`}
          />
        ) : null}
      </DialogoConfirmar>
    </div>
  )
}

function FichaAsignacion({
  asignacion,
  numero,
  tipo,
  horas,
  conErrores,
  puedeQuitar,
  onEditar,
  onQuitar,
}: {
  asignacion: Asignacion
  numero: number
  tipo: TipoPlan
  horas: number
  conErrores: boolean
  puedeQuitar: boolean
  onEditar: (paso: 'quienes' | 'que') => void
  onQuitar: () => void
}) {
  const textos = TIPOS[tipo]
  const competencias = tipo === 'competencias'
  const piezas = piezasDe(asignacion)
  const cuantas = miembrosDe(asignacion).length
  const minutos = asignacion.items.reduce((suma, titulo) => suma + (contenidoDe(titulo)?.minutos ?? 0), 0)
  const idTitulo = `revisar-${asignacion.id}`

  return (
    <Marco
      id={idTitulo}
      titulo={asignacion.nombre?.trim() || `Asignación ${numero}`}
      descripcion={`${asignacion.nombre?.trim() ? `Asignación ${numero} · ` : ''}${personas(cuantas)} · ${n(asignacion.items.length)} ${plural(asignacion.items.length, textos.item, textos.items)}${!competencias && minutos ? ` · ${duracionTexto(minutos)}` : ''}`}
      accion={
        // El «⋯» primero de la fila; después los dos «Editar».
        <div className="flex shrink-0 items-center gap-1">
          {puedeQuitar ? (
            <DropdownMenu>
              <DropdownMenuTrigger render={<BotonIcono aria-label={`Acciones de la asignación ${numero}`} />}>
                <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuGroup>
                  <DropdownMenuItem variant="destructive" onClick={onQuitar}>
                    <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
                    Quitar asignación
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          <Button variant="ghost" size="sm" onClick={() => onEditar('quienes')}>
            Editar quiénes
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEditar('que')}>
            Editar qué ven
          </Button>
        </div>
      }
    >
      <FramePanel className="flex flex-col gap-4">
        <section aria-label="Quiénes" className="flex flex-col gap-2">
          <Rotulo>Quiénes</Rotulo>
          {piezas.length ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {piezas.slice(0, MAS_FICHAS).map((pieza) => (
                <Badge key={pieza.clave} variant="secondary" size="lg">
                  <HugeiconsIcon icon={ICONO_PIEZA[pieza.tipo]} aria-hidden="true" />
                  {pieza.texto}
                  {pieza.personas > 1 ? <span className="tabular-nums text-muted-foreground">· {n(pieza.personas)}</span> : null}
                </Badge>
              ))}
              {piezas.length > MAS_FICHAS ? (
                <Text as="span" size="sm" variant="muted">
                  y {n(piezas.length - MAS_FICHAS)} más
                </Text>
              ) : null}
            </div>
          ) : null}
          {!cuantas ? (
            <Text as="p" size="sm" variant={conErrores ? 'destructive' : 'muted'} role={conErrores ? 'alert' : undefined}>
              Todavía no le llega a nadie.
            </Text>
          ) : null}
        </section>

        <Separator />

        <section aria-label="Qué ven" className="flex flex-col gap-2">
          <Rotulo>Qué ven, en este orden</Rotulo>
          {asignacion.items.length ? (
            <ol className="-mx-2 flex flex-col divide-y">
              {asignacion.items.map((titulo, indice) => {
                const portada = portadaDe(titulo, competencias)
                const contenido = contenidoDe(titulo)
                const habilidades = competenciaDe(titulo)?.habilidades.length ?? 0
                return (
                  <li key={titulo}>
                    <Item size="xs">
                      <ItemMedia variant={portada ? 'image' : 'icon'}>
                        {portada ? <img src={portada} alt="" /> : <HugeiconsIcon icon={competencias ? Target02Icon : BookOpen01Icon} aria-hidden="true" />}
                      </ItemMedia>
                      <ItemContent className="min-w-0">
                        <ItemTitle className="w-full">
                          <span className="truncate">
                            <span className="tabular-nums text-muted-foreground">{indice + 1}.</span> {titulo}
                          </span>
                        </ItemTitle>
                        <ItemDescription>
                          {competencias
                            ? `${habilidades} ${plural(habilidades, 'habilidad', 'habilidades')} · ${horas} h de estudio`
                            : contenido
                              ? `${contenido.tipo} · ${duracionTexto(contenido.minutos)}`
                              : 'Contenido'}
                        </ItemDescription>
                      </ItemContent>
                    </Item>
                  </li>
                )
              })}
            </ol>
          ) : (
            <Text as="p" size="sm" variant={conErrores ? 'destructive' : 'muted'} role={conErrores ? 'alert' : undefined}>
              Todavía no ve nada.
            </Text>
          )}
        </section>
      </FramePanel>
    </Marco>
  )
}
