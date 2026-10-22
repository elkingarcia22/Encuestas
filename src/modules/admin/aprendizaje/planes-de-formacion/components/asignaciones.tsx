import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowDataTransferHorizontalIcon,
  BookOpen01Icon,
  Building03Icon,
  Cancel01Icon,
  Copy01Icon,
  Csv01Icon,
  Delete02Icon,
  MoreHorizontalIcon,
  PlusSignIcon,
  Target02Icon,
  Edit02Icon,
  UserGroupIcon,
  UserIcon,
} from '@hugeicons/core-free-icons'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Field,
  FieldLabel,
  Input,
  Frame,
  FramePanel,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from '@ubits/flux-ui'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { Badge } from '@/shared/components/Badge'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { notify } from '@/shared/components/notify'
import { Persona } from '@/modules/design-system/data-grid/casos/seguimiento'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { DialogoConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { Marco, Rotulo } from '@/modules/design-system/patrones/ficha'
import { plural } from '@/modules/design-system/patrones/formato'
import { CATALOGO_COMPETENCIAS, CONTENIDOS, competenciaDe, contenidoDe, duracionTexto, portadaDe } from './catalogo'
import { nombreCompleto, useGrupos } from './grupos-datos'
import { PanelCatalogo } from './panel-catalogo'
import { PanelIntegrantes } from './panel-integrantes'
import { ListaParticipantes, SIN_SELECCION, itemsEnArchivo, type SeleccionParticipantes } from './panel-participantes'
import {
  TIPOS,
  aTodaLaEmpresa,
  conArchivo,
  conGrupos,
  devolver,
  miembrosDe,
  piezasDe,
  quitarPieza,
  sinQuitados,
  usuarioDelPlan,
  type Asignacion,
  type Pieza,
  type Plan,
  type TipoPlan,
} from './planes-datos'

// «Quién ve qué»: el plan en asignaciones, una tarjeta por cada una. Arriba de la tarjeta, a quiénes les llega (fichas que
// se quitan con su «x» y «Agregar» para sumar grupos, personas, toda la empresa o un archivo); abajo, qué ven (los
// contenidos o competencias, cada uno con «Reemplazar» y «Quitar», y «Agregar contenidos»). Todo se edita en la tarjeta,
// sin asistente de pasos: es lo que se toca todas las semanas (pedido del 14-oct: «facilitar la constante edición»).
//
// La anatomía es la del paso «Participantes» de Encuestas (Elkin): cada forma de elegir en su marco gris, las elegidas
// como fichas con «x» encima de la lista, y el conteo en la cabecera. La usan Crear plan (paso 2) y la página del plan.

export const ICONO_PIEZA: Record<Pieza['tipo'], typeof UserIcon> = {
  empresa: Building03Icon,
  grupo: UserGroupIcon,
  nombre: UserIcon,
  persona: UserIcon,
  archivo: Csv01Icon,
}
const MAS_FICHAS = 10
export const ARCHIVO = 'participantes-plan.csv'

const n = (cuantas: number) => cuantas.toLocaleString('es-CO')
const personas = (cuantas: number) => `${n(cuantas)} ${plural(cuantas, 'persona', 'personas')}`
const mayuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)

// Qué se está eligiendo, y para cuál asignación.
type Panel =
  | { que: 'grupos' | 'personas' | 'archivo' | 'items'; asignacion: Asignacion; vez: number }
  | { que: 'reemplazar'; asignacion: Asignacion; de: string; a: string }
  | { que: 'nombre'; asignacion: Asignacion; texto: string }

export function EditorAsignaciones({
  plan,
  guardado,
  onCambio,
  soloLectura = false,
  conErrores = false,
}: {
  plan: Plan
  // El plan como está guardado: la tarjeta que cambió desde entonces lo dice en su cabecera.
  guardado?: Plan
  onCambio: (plan: Plan) => void
  // Un plan No vigente se ve, pero no se cambia (RN-10).
  soloLectura?: boolean
  // En Crear plan, después de intentar seguir: lo que falta en cada tarjeta se marca.
  conErrores?: boolean
}) {
  useGrupos()
  const textos = TIPOS[plan.tipo]
  const [panel, setPanel] = useState<Panel | null>(null)
  const [eliminando, setEliminando] = useState<Asignacion | null>(null)

  const cambiarAsignacion = (nueva: Asignacion, extra?: (p: Plan) => Plan) => {
    const siguiente = { ...plan, asignaciones: plan.asignaciones.map((a) => (a.id === nueva.id ? nueva : a)) }
    onCambio(extra ? extra(siguiente) : siguiente)
  }

  const nueva = () => {
    const asignacion: Asignacion = { id: `a-${Date.now()}`, alcance: 'colaboradores', destinatarios: [], sumadas: [], personas: 0, items: [] }
    onCambio({ ...plan, asignaciones: [...plan.asignaciones, asignacion] })
  }

  const duplicar = (asignacion: Asignacion) => {
    const copia = { ...asignacion, id: `a-${Date.now()}` }
    const indice = plan.asignaciones.findIndex((a) => a.id === asignacion.id)
    onCambio({ ...plan, asignaciones: [...plan.asignaciones.slice(0, indice + 1), copia, ...plan.asignaciones.slice(indice + 1)] })
    notify('Asignación duplicada', 'Quedó justo debajo, con las mismas personas y lo mismo que ven. Cámbiale lo que necesites.', 'success')
  }

  const cerrar = () => setPanel(null)

  return (
    <div className="flex flex-col gap-4">
      {plan.asignaciones.length ? (
        plan.asignaciones.map((asignacion, indice) => (
          <TarjetaAsignacion
            key={asignacion.id}
            asignacion={asignacion}
            numero={indice + 1}
            marca={marcaDe(asignacion, guardado)}
            tipo={plan.tipo}
            horas={plan.horas}
            soloLectura={soloLectura}
            conErrores={conErrores}
            onAbrir={(que) => setPanel({ que, asignacion, vez: Date.now() })}
            onEmpresa={() => cambiarAsignacion(aTodaLaEmpresa(asignacion))}
            onQuitarPieza={(pieza) => cambiarAsignacion(quitarPieza(asignacion, pieza))}
            onDevolver={(usuario) => cambiarAsignacion(devolver(asignacion, usuario))}
            onReemplazar={(titulo) => setPanel({ que: 'reemplazar', asignacion, de: titulo, a: '' })}
            onQuitarItem={(titulo) => cambiarAsignacion({ ...asignacion, items: asignacion.items.filter((t) => t !== titulo) })}
            onDuplicar={() => duplicar(asignacion)}
            onNombrar={() => setPanel({ que: 'nombre', asignacion, texto: asignacion.nombre ?? '' })}
            onEliminar={() => setEliminando(asignacion)}
          />
        ))
      ) : (
        // Aún no hay nada: «Primera vez» con su ilustración glass, en el marco gris sin encabezado (se nombra sola).
        <Frame>
          <FramePanel className="flex flex-col items-center gap-2">
            <PrimeraVez
              className="py-10"
              icono="glass-add"
              titulo="Todavía no le llega a nadie"
              descripcion={`Una asignación dice a quiénes les llega el plan y qué ${textos.items} ven. Puedes tener varias: por ejemplo, ventas con unos ${textos.items} y líderes con otros.`}
              accion={soloLectura ? undefined : { texto: 'Nueva asignación', icono: PlusSignIcon, onClick: nueva }}
            />
            {conErrores && !soloLectura ? (
              <Text as="p" size="sm" variant="destructive" role="alert" className="pb-6">
                Agrega al menos una asignación con personas y {textos.items}.
              </Text>
            ) : null}
          </FramePanel>
        </Frame>
      )}

      {plan.asignaciones.length && !soloLectura ? (
        <div>
          <Button variant="outline" onClick={nueva}>
            <HugeiconsIcon icon={PlusSignIcon} aria-hidden="true" />
            Nueva asignación
          </Button>
        </div>
      ) : null}

      {/* Sumar grupos: la lista de grupos de Planes de formación, con los que ya están marcados. */}
      {panel?.que === 'grupos' ? (
        <PanelGrupos
          key={panel.vez}
          tipo={plan.tipo}
          elegidos={panel.asignacion.alcance === 'grupos' ? panel.asignacion.destinatarios : []}
          onCerrar={cerrar}
          onAplicar={(nombres) => {
            cambiarAsignacion(conGrupos(panel.asignacion, nombres))
            cerrar()
          }}
        />
      ) : null}

      {/* Sumar personas una a una: las que ya están sumadas salen marcadas; desmarcarlas las saca. */}
      {panel?.que === 'personas' ? (
        <PanelIntegrantes
          key={panel.vez}
          abierto
          onAbiertoChange={(abierto) => (abierto ? undefined : cerrar())}
          titulo="Agregar personas"
          grupo=""
          descripcion="Elige a quién sumar a esta asignación. Quien ya llega por un grupo no hace falta marcarlo."
          elegidos={panel.asignacion.sumadas ?? []}
          accion="Aplicar"
          onGuardar={(ids) => {
            const base = { ...panel.asignacion, sumadas: ids, fuera: (panel.asignacion.fuera ?? []).filter((id) => !ids.includes(id)) }
            cambiarAsignacion({ ...base, personas: miembrosDe(base).length }, (p) => sinQuitados(p, ids))
            cerrar()
          }}
        />
      ) : null}

      {/* Un archivo con personas y contenidos, como el «Importar participantes» de UBITS. */}
      {panel?.que === 'archivo' ? (
        <PanelArchivo
          key={panel.vez}
          tipo={plan.tipo}
          onCerrar={cerrar}
          onCargar={() => {
            const conGente = conArchivo(panel.asignacion, ARCHIVO, 42)
            cambiarAsignacion(panel.asignacion.items.length ? conGente : { ...conGente, items: itemsEnArchivo(plan.tipo) })
            notify('Archivo cargado', `${ARCHIVO}: 42 personas en esta asignación.`, 'success')
            cerrar()
          }}
        />
      ) : null}

      {/* Qué ven: el catálogo con lo que ya ven marcado. */}
      {panel?.que === 'items' ? (
        <PanelCatalogo
          key={panel.vez}
          abierto
          onAbiertoChange={(abierto) => (abierto ? undefined : cerrar())}
          tipo={plan.tipo}
          para="Lo que ven las personas de esta asignación. Quien tiene sus contenidos ajustados no cambia."
          elegidos={panel.asignacion.items}
          onGuardar={(items) => {
            cambiarAsignacion({ ...panel.asignacion, items })
            cerrar()
          }}
        />
      ) : null}

      {/* Reemplazar es 1→1 en esta asignación (RN-06); el actual no se ofrece (RN-07). */}
      <DialogoConfirmar
        abierto={panel?.que === 'reemplazar'}
        onAbiertoChange={(abierto) => (abierto ? undefined : cerrar())}
        icono={ArrowDataTransferHorizontalIcon}
        titulo={`Reemplazar ${textos.item}`}
        descripcion={`Las personas de esta asignación dejan de ver «${panel?.que === 'reemplazar' ? panel.de : ''}» y ven el que elijas. Su avance en el anterior se conserva.`}
        accion="Reemplazar"
        deshabilitada={panel?.que !== 'reemplazar' || !panel.a}
        onConfirmar={() => {
          if (panel?.que !== 'reemplazar' || !panel.a) return
          const items = [...new Set(panel.asignacion.items.map((t) => (t === panel.de ? panel.a : t)))]
          cambiarAsignacion({ ...panel.asignacion, items })
          cerrar()
        }}
      >
        {panel?.que === 'reemplazar' ? (
          <Field>
            <FieldLabel htmlFor="reemplazo-asignacion">Nuevo {textos.item}</FieldLabel>
            <Select value={panel.a || null} onValueChange={(valor) => setPanel({ ...panel, a: String(valor ?? '') })}>
              <SelectTrigger id="reemplazo-asignacion" className="w-full">
                <SelectValue placeholder={`Elige un ${textos.item}`} />
              </SelectTrigger>
              <SelectContent>
                {(plan.tipo === 'competencias' ? CATALOGO_COMPETENCIAS : CONTENIDOS)
                  .map((c) => c.titulo)
                  .filter((t) => t !== panel.de && !panel.asignacion.items.includes(t))
                  .map((titulo) => (
                    <SelectItem key={titulo} value={titulo}>
                      {titulo}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </Field>
        ) : null}
      </DialogoConfirmar>

      {/* El nombre es opcional: sin él, la tarjeta se llama «Asignación N» y se reconoce por sus fichas. */}
      <ActionDialog
        open={panel?.que === 'nombre'}
        onOpenChange={(abierto) => (abierto ? undefined : cerrar())}
        size="sm"
        title="Nombre de la asignación"
        sub="Para reconocerla de un vistazo en el plan. Las personas no lo ven."
        confirmLabel="Guardar nombre"
        onConfirm={() => {
          if (panel?.que !== 'nombre') return
          cambiarAsignacion({ ...panel.asignacion, nombre: panel.texto.trim() || undefined })
          cerrar()
        }}
      >
        {panel?.que === 'nombre' ? (
          <Field>
            <FieldLabel htmlFor="nombre-asignacion">Nombre</FieldLabel>
            <Input id="nombre-asignacion" value={panel.texto} maxLength={60} placeholder="Ej.: Derechos humanos" onChange={(evento) => setPanel({ ...panel, texto: evento.target.value })} />
          </Field>
        ) : null}
      </ActionDialog>

      <DialogoConfirmar
        abierto={eliminando !== null}
        onAbiertoChange={(abierto) => (abierto ? undefined : setEliminando(null))}
        size="sm"
        icono={Delete02Icon}
        titulo="¿Eliminar esta asignación?"
        descripcion={
          eliminando
            ? `${mayuscula(personas(miembrosDe(eliminando).length))} dejan de recibir sus ${n(eliminando.items.length)} ${plural(eliminando.items.length, textos.item, textos.items)}, salvo quien también esté en otra asignación. Se aplica al guardar.`
            : ''
        }
        accion="Eliminar"
        destructiva
        onConfirmar={() => {
          if (eliminando) onCambio({ ...plan, asignaciones: plan.asignaciones.filter((a) => a.id !== eliminando.id) })
          setEliminando(null)
        }}
      />
    </div>
  )
}

// Si una asignación es nueva o cambió desde lo guardado (sin contar el conteo de personas, que se recalcula solo).
export function marcaDe(asignacion: Asignacion, guardado?: Plan): 'Nueva' | 'Con cambios' | undefined {
  if (!guardado) return undefined
  const antes = guardado.asignaciones.find((a) => a.id === asignacion.id)
  if (!antes) return 'Nueva'
  const comparable = (a: Asignacion) => JSON.stringify({ ...a, personas: 0 })
  return comparable(antes) === comparable(asignacion) ? undefined : 'Con cambios'
}

function TarjetaAsignacion({
  asignacion,
  numero,
  marca,
  tipo,
  horas,
  soloLectura,
  conErrores,
  onAbrir,
  onEmpresa,
  onQuitarPieza,
  onDevolver,
  onReemplazar,
  onQuitarItem,
  onDuplicar,
  onNombrar,
  onEliminar,
}: {
  asignacion: Asignacion
  numero: number
  marca?: 'Nueva' | 'Con cambios'
  tipo: TipoPlan
  horas?: number
  soloLectura: boolean
  conErrores: boolean
  onAbrir: (que: 'grupos' | 'personas' | 'archivo' | 'items') => void
  onEmpresa: () => void
  onQuitarPieza: (pieza: Pieza) => void
  onDevolver: (usuario: string) => void
  onReemplazar: (titulo: string) => void
  onQuitarItem: (titulo: string) => void
  onDuplicar: () => void
  onNombrar: () => void
  onEliminar: () => void
}) {
  const textos = TIPOS[tipo]
  const piezas = piezasDe(asignacion)
  const cuantas = miembrosDe(asignacion).length
  const fuera = (asignacion.fuera ?? []).flatMap((id) => {
    const u = usuarioDelPlan(id)
    return u ? [{ id, nombre: nombreCompleto(u), area: u.area }] : []
  })
  const sinPersonas = cuantas === 0
  const sinItems = asignacion.items.length === 0
  // El bloque con título, acción y paneles adentro es el Marco del design system (como las pestañas del expediente).
  // Con nombre se llama como la nombraron; sin él, por su número. El número sigue debajo para ubicarla.
  return (
    <Marco
      titulo={asignacion.nombre?.trim() || `Asignación ${numero}`}
      descripcion={
        <span className="flex flex-wrap items-center gap-2 tabular-nums">
          {marca ? (
            <Badge variant={marca === 'Nueva' ? 'info-light' : 'warning-light'} size="sm">
              {marca}
            </Badge>
          ) : null}
          {asignacion.nombre?.trim() ? `Asignación ${numero} · ` : ''}
          {personas(cuantas)} · {n(asignacion.items.length)} {plural(asignacion.items.length, textos.item, textos.items)}
        </span>
      }
      accion={
        soloLectura ? null : (
          <DropdownMenu>
            <DropdownMenuTrigger render={<BotonIcono aria-label={`Acciones de la asignación ${numero}`} />}>
              <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={onNombrar}>
                <HugeiconsIcon icon={Edit02Icon} aria-hidden="true" />
                {asignacion.nombre?.trim() ? 'Cambiar nombre' : 'Ponerle nombre'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicar}>
                <HugeiconsIcon icon={Copy01Icon} aria-hidden="true" />
                Duplicar asignación
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onEliminar}>
                <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
                Eliminar asignación
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    >
      {/* ── Quiénes ── */}
      {/* Las dos partes con la misma cabecera: el rótulo a la izquierda y su «Agregar» a la derecha (war room del 14-oct:
          el de personas iba debajo, junto a las fichas, y el de contenidos a la derecha). Cada una en su panel. */}
      <FramePanel>
        <section aria-label="Quiénes" className="flex flex-col gap-2">
          <div className="flex min-h-7 items-center justify-between gap-3">
            <Rotulo>Quiénes</Rotulo>
            {soloLectura ? null : (
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" size="xs" />}>
                  <HugeiconsIcon icon={PlusSignIcon} aria-hidden="true" />
                  Agregar personas
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => onAbrir('grupos')}>
                      <HugeiconsIcon icon={UserGroupIcon} aria-hidden="true" />
                      Grupos
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAbrir('personas')} disabled={asignacion.alcance === 'empresa'}>
                      <HugeiconsIcon icon={UserIcon} aria-hidden="true" />
                      Personas una a una
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={onEmpresa} disabled={asignacion.alcance === 'empresa'}>
                      <HugeiconsIcon icon={Building03Icon} aria-hidden="true" />
                      Toda la empresa
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAbrir('archivo')}>
                      <HugeiconsIcon icon={Csv01Icon} aria-hidden="true" />
                      Desde un archivo
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {piezas.slice(0, MAS_FICHAS).map((pieza) =>
              soloLectura ? (
                // Para leer, no para tocar: la insignia, no el botón apagado (se leía como algo que falta).
                <Badge key={pieza.clave} variant="secondary" size="lg">
                  <HugeiconsIcon icon={ICONO_PIEZA[pieza.tipo]} aria-hidden="true" />
                  {pieza.texto}
                  {pieza.personas > 1 ? <span className="tabular-nums text-muted-foreground">· {n(pieza.personas)}</span> : null}
                </Badge>
              ) : (
                <Button key={pieza.clave} variant="secondary" size="xs" onClick={() => onQuitarPieza(pieza)} aria-label={`Quitar ${pieza.texto}`}>
                  <HugeiconsIcon icon={ICONO_PIEZA[pieza.tipo]} aria-hidden="true" />
                  {pieza.texto}
                  {pieza.personas > 1 ? <span className="tabular-nums text-muted-foreground">· {n(pieza.personas)}</span> : null}
                  <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" />
                </Button>
              ),
            )}
            {piezas.length > MAS_FICHAS ? (
              <Text as="span" size="sm" variant="muted">
                y {n(piezas.length - MAS_FICHAS)} más
              </Text>
            ) : null}
          </div>
          {sinPersonas ? (
            <Text as="p" size="sm" variant={conErrores ? 'destructive' : 'muted'} role={conErrores ? 'alert' : undefined}>
              Agrega grupos, personas o toda la empresa: todavía no le llega a nadie.
            </Text>
          ) : null}
          {/* Quien salió de esta asignación aunque su grupo esté (la movieron a otra o la dejaron fuera): se dice y se puede devolver. */}
          {fuera.length ? (
            <Popover>
              {/* Enlace en línea, sin la caja del botón (diferencias.json › button-enlace-en-linea). */}
              <PopoverTrigger render={<Button variant="link" size="xs" className="self-start px-0!" />}>
                {fuera.length === 1 ? `${fuera[0].nombre} quedó fuera de esta asignación` : `${n(fuera.length)} personas quedaron fuera de esta asignación`}
              </PopoverTrigger>
              <PopoverContent align="start" className="w-80 p-2">
                <div className="flex max-h-72 flex-col gap-0.5 overflow-y-auto">
                  {fuera.map((persona) => (
                    <Item key={persona.id} size="xs">
                      <ItemContent className="min-w-0">
                        <Persona nombre={persona.nombre} detalle={persona.area} />
                      </ItemContent>
                      {soloLectura ? null : (
                        <ItemActions>
                          <Button variant="ghost" size="xs" onClick={() => onDevolver(persona.id)}>
                            Devolver
                          </Button>
                        </ItemActions>
                      )}
                    </Item>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          ) : null}
        </section>
      </FramePanel>

      {/* ── Qué ven ── */}
      <FramePanel>
        <section aria-label="Qué ven" className="flex flex-col gap-2">
          <div className="flex min-h-7 items-center justify-between gap-3">
            <Rotulo>Qué ven</Rotulo>
            {soloLectura ? null : (
              <Button variant="ghost" size="xs" onClick={() => onAbrir('items')}>
                <HugeiconsIcon icon={PlusSignIcon} aria-hidden="true" />
                Agregar {textos.items}
              </Button>
            )}
          </div>
          {sinItems ? (
            <Text as="p" size="sm" variant={conErrores ? 'destructive' : 'muted'} role={conErrores ? 'alert' : undefined}>
              Todavía no ven nada. Agrega los {textos.items} de esta asignación.
            </Text>
          ) : (
            <div className="-mx-2 flex flex-col divide-y">
              {asignacion.items.map((titulo) => (
                <FilaItem
                  key={titulo}
                  titulo={titulo}
                  tipo={tipo}
                  horas={horas}
                  enfoque={asignacion.habilidades?.[titulo]}
                  soloLectura={soloLectura}
                  onReemplazar={() => onReemplazar(titulo)}
                  onQuitar={() => onQuitarItem(titulo)}
                />
              ))}
            </div>
          )}
        </section>
      </FramePanel>
    </Marco>
  )
}

// Un contenido o competencia en una línea: su portada pequeña, el título y de qué se trata. A la derecha, cambiarlo o
// quitarlo de esta asignación.
export function FilaItem({
  titulo,
  tipo,
  horas,
  enfoque,
  soloLectura,
  onReemplazar,
  onQuitar,
}: {
  titulo: string
  tipo: TipoPlan
  horas?: number
  enfoque?: string[]
  soloLectura: boolean
  onReemplazar: () => void
  onQuitar: () => void
}) {
  const competencia = tipo === 'competencias'
  const portada = portadaDe(titulo, competencia)
  const contenido = contenidoDe(titulo)
  const habilidades = competenciaDe(titulo)?.habilidades.length ?? 0
  const detalle = competencia
    ? [enfoque ? `Enfocada en ${enfoque.length} de ${habilidades} habilidades` : `${habilidades} ${plural(habilidades, 'habilidad', 'habilidades')}`, horas ? `${horas} h de estudio` : ''].filter(Boolean).join(' · ')
    : contenido
      ? `${contenido.tipo} · ${duracionTexto(contenido.minutos)}`
      : 'Contenido'
  return (
    <Item size="xs">
      <ItemMedia variant={portada ? 'image' : 'icon'}>
        {portada ? <img src={portada} alt="" /> : <HugeiconsIcon icon={competencia ? Target02Icon : BookOpen01Icon} aria-hidden="true" />}
      </ItemMedia>
      <ItemContent className="min-w-0">
        <ItemTitle className="truncate">{titulo}</ItemTitle>
        <ItemDescription>{detalle}</ItemDescription>
      </ItemContent>
      {soloLectura ? null : (
        <ItemActions>
          <BotonIcono aria-label={`Reemplazar ${titulo}`} onClick={onReemplazar}>
            <HugeiconsIcon icon={ArrowDataTransferHorizontalIcon} aria-hidden="true" />
          </BotonIcono>
          <BotonIcono aria-label={`Quitar ${titulo} de esta asignación`} onClick={onQuitar}>
            <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" />
          </BotonIcono>
        </ItemActions>
      )}
    </Item>
  )
}

// «Agregar grupos»: los grupos de Planes de formación, con los de la asignación ya marcados.
export function PanelGrupos({ tipo, elegidos, onCerrar, onAplicar }: { tipo: TipoPlan; elegidos: string[]; onCerrar: () => void; onAplicar: (nombres: string[]) => void }) {
  const grupos = useGrupos()
  const [valor, setValor] = useState<SeleccionParticipantes>(() => ({ ...SIN_SELECCION, grupos: grupos.filter((g) => elegidos.includes(g.nombre)).map((g) => g.id) }))
  const marcados = grupos.filter((g) => valor.grupos.includes(g.id))
  const suman = new Set(marcados.flatMap((g) => g.integrantes)).size
  return (
    <DrawerShell
      open
      onOpenChange={(abierto) => (abierto ? undefined : onCerrar())}
      size="xl"
      icon={UserGroupIcon}
      title="Agregar grupos"
      description="Un grupo entra completo y se mantiene al día: quien entre al grupo después, también recibe el plan."
      footerClassName="justify-between!"
      footer={
        <>
          <Text as="span" role="status" variant="muted" size="sm" className="tabular-nums">
            {marcados.length ? `${n(marcados.length)} ${plural(marcados.length, 'grupo', 'grupos')} · ${personas(suman)}` : 'Ningún grupo elegido'}
          </Text>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onCerrar}>
              Cancelar
            </Button>
            <Button onClick={() => onAplicar(marcados.map((g) => g.nombre))}>Aplicar</Button>
          </div>
        </>
      }
    >
      <ListaParticipantes modo="grupos" tipo={tipo} valor={valor} onCambio={setValor} />
    </DrawerShell>
  )
}

// «Desde un archivo»: el mismo cargue de UBITS (plantilla, colaboradores y lista de contenidos para descargar).
export function PanelArchivo({ tipo, onCerrar, onCargar }: { tipo: TipoPlan; onCerrar: () => void; onCargar: () => void }) {
  const [valor, setValor] = useState<SeleccionParticipantes>(SIN_SELECCION)
  return (
    <DrawerShell
      open
      onOpenChange={(abierto) => (abierto ? undefined : onCerrar())}
      size="lg"
      icon={Csv01Icon}
      title="Cargar desde un archivo"
      description="Las personas del archivo reemplazan a las de esta asignación. Si la asignación no tiene contenidos, se usan los del archivo."
      footer={
        <>
          <Button variant="outline" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button disabled={valor.archivo !== 'done'} onClick={onCargar}>
            Cargar
          </Button>
        </>
      }
    >
      <ListaParticipantes modo="archivo" tipo={tipo} valor={valor} onCambio={setValor} />
    </DrawerShell>
  )
}
