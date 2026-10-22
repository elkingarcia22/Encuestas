import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowDataTransferHorizontalIcon,
  Building03Icon,
  Cancel01Icon,
  Csv01Icon,
  Delete02Icon,
  Edit02Icon,
  InformationCircleIcon,
  Logout01Icon,
  PlusSignIcon,
  UserGroupIcon,
  UserIcon,
} from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Field,
  FieldLabel,
  FramePanel,
  Input,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { notify } from '@/shared/components/notify'
import { Persona } from '@/modules/design-system/data-grid/casos/seguimiento'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { VentanaDeAccion } from '@/modules/design-system/drawers/components/drawer-anidado'
import { DialogoConfirmar, RegistroConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { Marco, Rotulo } from '@/modules/design-system/patrones/ficha'
import { plural } from '@/modules/design-system/patrones/formato'
import { ARCHIVO, FilaItem, ICONO_PIEZA, PanelArchivo, PanelGrupos } from './asignaciones'
import { cambiosEntre } from './cambios'
import { CATALOGO_COMPETENCIAS, CONTENIDOS } from './catalogo'
import { nombreCompleto, useGrupos } from './grupos-datos'
import { PanelCatalogo } from './panel-catalogo'
import { PanelIntegrantes } from './panel-integrantes'
import { itemsEnArchivo } from './panel-participantes'
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
} from './planes-datos'

// «Editar asignación»: una asignación entera en un panel, para cambiarla sin perder de vista la tabla de la pestaña
// «Asignaciones». Arriba, su nombre; después, 1. a quiénes les llega y 2. qué ven, cada uno con su «Agregar»; al final,
// qué cambia para quién si se aplica. El panel trabaja sobre una copia: «Aplicar» la pasa al borrador del plan (que se
// guarda con «Guardar», abajo en la página) y «Cancelar» la descarta. Lo que se elige dentro (grupos, personas, archivo,
// catálogo, reemplazar, nombre, eliminar) se abre como vista del mismo panel, no encima (regla del 9-oct).

const n = (cuantas: number) => cuantas.toLocaleString('es-CO')
const personas = (cuantas: number) => `${n(cuantas)} ${plural(cuantas, 'persona', 'personas')}`

// Lo que se sabe de cada pieza, en la línea gris de su fila.
function detalleDe(pieza: Pieza) {
  if (pieza.tipo === 'empresa') return `${personas(pieza.personas)} · quien entre a la empresa también lo recibe`
  if (pieza.tipo === 'grupo') return `Grupo · ${personas(pieza.personas)} · se mantiene al día`
  if (pieza.tipo === 'archivo') return `Archivo · ${personas(pieza.personas)}`
  const usuario = pieza.tipo === 'persona' ? usuarioDelPlan(pieza.clave.slice('persona:'.length)) : undefined
  return usuario ? `Persona sumada · ${usuario.area}` : 'Persona sumada'
}

// Lo que se abre dentro del panel.
type Vista =
  | { que: 'grupos' | 'personas' | 'archivo' | 'items'; vez: number }
  | { que: 'reemplazar'; de: string; a: string }
  | { que: 'nombre'; texto: string }
  | { que: 'eliminar' }
  | { que: 'salir' }

// Para comparar: lo que cambia del plan desde el panel (sus asignaciones y quién se quitó).
const firma = (plan: Plan) => JSON.stringify([plan.asignaciones, plan.quitados ?? []])

export function PanelAsignacion({
  plan,
  asignacion,
  nueva,
  abierto,
  onCerrar,
  onCambio,
}: {
  // El borrador del plan, como está en la página.
  plan: Plan
  asignacion: Asignacion
  // Recién creada con «Nueva asignación»: todavía no está en el borrador y no hay nada que eliminar.
  nueva: boolean
  abierto: boolean
  onCerrar: () => void
  onCambio: (plan: Plan) => void
}) {
  useGrupos()
  const textos = TIPOS[plan.tipo]
  // El borrador al abrir, y el mismo con la asignación nueva sumada: contra ellos se mide qué cambió aquí. Se quedan fijos
  // mientras el panel sale, aunque «Aplicar» ya haya cambiado el borrador de la página.
  const [base] = useState<Plan>(plan)
  const [inicial] = useState<Plan>(() => (nueva ? { ...plan, asignaciones: [...plan.asignaciones, asignacion] } : plan))
  const [copia, setCopia] = useState<Plan>(inicial)
  const [vista, setVista] = useState<Vista | null>(null)
  const cerrarVista = () => setVista(null)

  const local = copia.asignaciones.find((a) => a.id === asignacion.id) ?? asignacion
  const numero = copia.asignaciones.findIndex((a) => a.id === asignacion.id) + 1
  const nombre = local.nombre?.trim() || `Asignación ${numero}`
  const piezas = piezasDe(local)
  const cuantas = miembrosDe(local).length
  // Solo quien recibiría la asignación si no lo hubieran sacado (al quitar su grupo, deja de contar como «fuera»).
  const recibirian = local.fuera?.length ? miembrosDe({ ...local, fuera: [] }) : []
  const fuera = (local.fuera ?? []).flatMap((id) => {
    const u = usuarioDelPlan(id)
    return u && recibirian.includes(id) ? [{ id, nombre: nombreCompleto(u), area: u.area }] : []
  })

  const cambiar = (nuevaAsignacion: Asignacion, extra?: (p: Plan) => Plan) =>
    setCopia((actual) => {
      const siguiente = { ...actual, asignaciones: actual.asignaciones.map((a) => (a.id === nuevaAsignacion.id ? nuevaAsignacion : a)) }
      return extra ? extra(siguiente) : siguiente
    })

  const hayCambios = firma(copia) !== firma(inicial)
  // Qué cambia para las personas si se aplica: el borrador de la página contra el mismo con esta asignación cambiada.
  const lineas = useMemo(() => (hayCambios ? cambiosEntre(base, copia) : []), [hayCambios, base, copia])

  const aplicar = () => {
    onCambio(copia)
    notify(nueva ? 'Asignación agregada al plan' : 'Asignación actualizada', 'Se aplica a las personas al guardar el plan.', 'info')
    onCerrar()
  }
  // Cerrar (la X, Escape o «Cancelar») con algo cambiado pregunta antes de descartarlo; sin cambios cierra directo.
  const pedirCerrar = () => (hayCambios ? setVista({ que: 'salir' }) : onCerrar())

  return (
    <DrawerShell
      open={abierto}
      onOpenChange={(abrir) => (abrir ? undefined : pedirCerrar())}
      // Tocar fuera no lo cierra: con algo cambiado se perdería sin querer (regla del 8-oct).
      disablePointerDismissal
      size="lg"
      icon={UserGroupIcon}
      title={nueva ? 'Nueva asignación' : 'Editar asignación'}
      description="Los cambios se guardan junto con el plan."
      footerClassName="justify-between!"
      footer={
        <>
          {nueva ? (
            <span />
          ) : (
            <Button variant="destructive" onClick={() => setVista({ que: 'eliminar' })}>
              <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
              Eliminar asignación
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={pedirCerrar}>
              Cancelar
            </Button>
            <Button disabled={!hayCambios} onClick={aplicar}>
              Aplicar
            </Button>
          </div>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {/* El registro va en el cuerpo, no en el título del panel (regla del 1-oct). */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <Text as="p" size="sm" weight="semibold" className="truncate">
              {nombre}
            </Text>
            <Text as="p" size="sm" variant="muted" className="tabular-nums">
              {local.nombre?.trim() ? `Asignación ${numero} · ` : ''}
              {personas(cuantas)} · {n(local.items.length)} {plural(local.items.length, textos.item, textos.items)}
            </Text>
          </div>
          <Button variant="ghost" size="xs" onClick={() => setVista({ que: 'nombre', texto: local.nombre ?? '' })}>
            <HugeiconsIcon icon={Edit02Icon} aria-hidden="true" />
            Cambiar nombre
          </Button>
        </div>

        {/* ── 1. Personas ── */}
        {/* Cada parte es un Marco del design system: título y «Agregar» arriba, la lista en su panel. */}
        <Marco
          titulo={`1. Personas · ${n(cuantas)}`}
          accion={
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" size="xs" />}>
                  <HugeiconsIcon icon={PlusSignIcon} aria-hidden="true" />
                  Agregar
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => setVista({ que: 'grupos', vez: Date.now() })}>
                      <HugeiconsIcon icon={UserGroupIcon} aria-hidden="true" />
                      Grupos
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setVista({ que: 'personas', vez: Date.now() })} disabled={local.alcance === 'empresa'}>
                      <HugeiconsIcon icon={UserIcon} aria-hidden="true" />
                      Personas una a una
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => cambiar(aTodaLaEmpresa(local))} disabled={local.alcance === 'empresa'}>
                      <HugeiconsIcon icon={Building03Icon} aria-hidden="true" />
                      Toda la empresa
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setVista({ que: 'archivo', vez: Date.now() })}>
                      <HugeiconsIcon icon={Csv01Icon} aria-hidden="true" />
                      Desde un archivo
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
          }
        >
          <FramePanel className="flex flex-col gap-3">
            {piezas.length ? (
              <div className="-mx-2 flex flex-col divide-y">
                {piezas.map((pieza) => (
                  <Item key={pieza.clave} size="xs">
                    <ItemMedia variant="icon">
                      <HugeiconsIcon icon={ICONO_PIEZA[pieza.tipo]} aria-hidden="true" />
                    </ItemMedia>
                    <ItemContent className="min-w-0">
                      <ItemTitle className="truncate">{pieza.texto}</ItemTitle>
                      <ItemDescription>{detalleDe(pieza)}</ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <BotonIcono aria-label={`Quitar ${pieza.texto} de esta asignación`} onClick={() => cambiar(quitarPieza(local, pieza))}>
                        <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" />
                      </BotonIcono>
                    </ItemActions>
                  </Item>
                ))}
              </div>
            ) : (
              <Text as="p" size="sm" variant="muted">
                Todavía no le llega a nadie. Agrega grupos, personas o toda la empresa.
              </Text>
            )}
            {/* Quien salió de esta asignación aunque su grupo esté (la pasaron a otra o la dejaron fuera): se puede devolver. */}
            {fuera.length ? (
              <div className="flex flex-col gap-1">
                <Rotulo>
                  {fuera.length === 1
                    ? 'Quedó fuera de esta asignación (la pasaron a otra o la sacaron)'
                    : `${n(fuera.length)} personas quedaron fuera de esta asignación (las pasaron a otra o las sacaron)`}
                </Rotulo>
                <div className="-mx-2 flex flex-col">
                  {fuera.map((persona) => (
                    <Item key={persona.id} size="xs">
                      <ItemContent className="min-w-0">
                        <Persona nombre={persona.nombre} detalle={persona.area} />
                      </ItemContent>
                      <ItemActions>
                        <Button variant="ghost" size="xs" onClick={() => cambiar(devolver(local, persona.id))}>
                          Devolver
                        </Button>
                      </ItemActions>
                    </Item>
                  ))}
                </div>
              </div>
            ) : null}
          </FramePanel>
        </Marco>

        {/* ── 2. Contenidos que ven ── */}
        <Marco
          titulo={`2. ${textos.items.charAt(0).toUpperCase() + textos.items.slice(1)} que ven · ${n(local.items.length)}`}
          accion={
            <Button variant="ghost" size="xs" onClick={() => setVista({ que: 'items', vez: Date.now() })}>
              <HugeiconsIcon icon={PlusSignIcon} aria-hidden="true" />
              Agregar
            </Button>
          }
        >
          <FramePanel>
            {local.items.length ? (
              <div className="-mx-2 flex flex-col divide-y">
                {local.items.map((titulo) => (
                  <FilaItem
                    key={titulo}
                    titulo={titulo}
                    tipo={plan.tipo}
                    horas={plan.horas}
                    enfoque={local.habilidades?.[titulo]}
                    soloLectura={false}
                    onReemplazar={() => setVista({ que: 'reemplazar', de: titulo, a: '' })}
                    onQuitar={() => cambiar({ ...local, items: local.items.filter((t) => t !== titulo) })}
                  />
                ))}
              </div>
            ) : (
              <Text as="p" size="sm" variant="muted">
                Todavía no ven nada. Agrega los {textos.items} de esta asignación.
              </Text>
            )}
          </FramePanel>
        </Marco>

        {/* Qué cambia para quién: lo mismo que dirá «Ver cambios» de la página, solo con lo de este panel. */}
        <Alert variant="info">
          <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
          <AlertTitle>{lineas.length ? 'Al aplicar' : 'Sin cambios todavía'}</AlertTitle>
          <AlertDescription>
            {lineas.length ? (
              <ul className="flex flex-col gap-1">
                {lineas.slice(0, 4).map((linea) => (
                  <li key={linea.id}>
                    {linea.texto}
                    {linea.detalle ? <span className="text-muted-foreground"> · {linea.detalle}</span> : null}
                  </li>
                ))}
                {lineas.length > 4 ? <li className="text-muted-foreground">y {n(lineas.length - 4)} cambios más</li> : null}
              </ul>
            ) : (
              <p>Lo que cambies aquí se suma a los cambios del plan y les llega a las personas al guardar.</p>
            )}
          </AlertDescription>
        </Alert>
      </div>

      {/* Lo que se elige dentro: vistas del mismo panel, con «← Editar asignación» para volver. */}
      {vista?.que === 'grupos' ? (
        <PanelGrupos
          key={vista.vez}
          tipo={plan.tipo}
          elegidos={local.alcance === 'grupos' ? local.destinatarios : []}
          onCerrar={cerrarVista}
          onAplicar={(nombres) => {
            cambiar(conGrupos(local, nombres))
            cerrarVista()
          }}
        />
      ) : null}

      {vista?.que === 'personas' ? (
        <PanelIntegrantes
          key={vista.vez}
          abierto
          onAbiertoChange={(abrir) => (abrir ? undefined : cerrarVista())}
          titulo="Agregar personas"
          grupo=""
          descripcion="Elige a quién sumar a esta asignación. Quien ya llega por un grupo no hace falta marcarlo."
          elegidos={local.sumadas ?? []}
          accion="Aplicar"
          onGuardar={(ids) => {
            const base = { ...local, sumadas: ids, fuera: (local.fuera ?? []).filter((id) => !ids.includes(id)) }
            cambiar({ ...base, personas: miembrosDe(base).length }, (p) => sinQuitados(p, ids))
            cerrarVista()
          }}
        />
      ) : null}

      {vista?.que === 'archivo' ? (
        <PanelArchivo
          key={vista.vez}
          tipo={plan.tipo}
          onCerrar={cerrarVista}
          onCargar={() => {
            const conGente = conArchivo(local, ARCHIVO, 42)
            cambiar(local.items.length ? conGente : { ...conGente, items: itemsEnArchivo(plan.tipo) })
            cerrarVista()
          }}
        />
      ) : null}

      {vista?.que === 'items' ? (
        <PanelCatalogo
          key={vista.vez}
          abierto
          onAbiertoChange={(abrir) => (abrir ? undefined : cerrarVista())}
          tipo={plan.tipo}
          para="Lo que ven las personas de esta asignación. Quien tiene sus contenidos ajustados no cambia."
          elegidos={local.items}
          onGuardar={(items) => {
            cambiar({ ...local, items })
            cerrarVista()
          }}
        />
      ) : null}

      {/* Reemplazar es 1→1 en esta asignación (RN-06); el actual no se ofrece (RN-07). */}
      <DialogoConfirmar
        abierto={vista?.que === 'reemplazar'}
        onAbiertoChange={(abrir) => (abrir ? undefined : cerrarVista())}
        icono={ArrowDataTransferHorizontalIcon}
        titulo={`Reemplazar ${textos.item}`}
        descripcion={`Las personas de esta asignación dejan de ver «${vista?.que === 'reemplazar' ? vista.de : ''}» y ven el que elijas. Su avance en el anterior se conserva.`}
        accion="Reemplazar"
        deshabilitada={vista?.que !== 'reemplazar' || !vista.a}
        onConfirmar={() => {
          if (vista?.que !== 'reemplazar' || !vista.a) return
          cambiar({ ...local, items: [...new Set(local.items.map((t) => (t === vista.de ? vista.a : t)))] })
          cerrarVista()
        }}
      >
        {vista?.que === 'reemplazar' ? (
          <Field>
            <FieldLabel htmlFor="reemplazo-panel-asignacion">Nuevo {textos.item}</FieldLabel>
            <Select value={vista.a || null} onValueChange={(valor) => setVista({ ...vista, a: String(valor ?? '') })}>
              <SelectTrigger id="reemplazo-panel-asignacion" className="w-full">
                <SelectValue placeholder={`Elige un ${textos.item}`} />
              </SelectTrigger>
              <SelectContent>
                {(plan.tipo === 'competencias' ? CATALOGO_COMPETENCIAS : CONTENIDOS)
                  .map((c) => c.titulo)
                  .filter((t) => t !== vista.de && !local.items.includes(t))
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

      {/* El nombre es opcional: sin él, la asignación se llama «Asignación N». */}
      <VentanaDeAccion
        open={vista?.que === 'nombre'}
        onOpenChange={(abrir) => (abrir ? undefined : cerrarVista())}
        size="sm"
        title="Nombre de la asignación"
        sub="Para reconocerla de un vistazo en el plan. Las personas no lo ven."
        confirmLabel="Guardar nombre"
        onConfirm={() => {
          if (vista?.que !== 'nombre') return
          cambiar({ ...local, nombre: vista.texto.trim() || undefined })
        }}
      >
        {vista?.que === 'nombre' ? (
          <Field>
            <FieldLabel htmlFor="nombre-panel-asignacion">Nombre</FieldLabel>
            <Input id="nombre-panel-asignacion" value={vista.texto} maxLength={60} placeholder="Ej.: Derechos humanos" onChange={(evento) => setVista({ ...vista, texto: evento.target.value })} />
          </Field>
        ) : null}
      </VentanaDeAccion>

      <DialogoConfirmar
        abierto={vista?.que === 'eliminar'}
        onAbiertoChange={(abrir) => (abrir ? undefined : cerrarVista())}
        icono={Delete02Icon}
        titulo="¿Eliminar esta asignación?"
        descripcion={`${personas(miembrosDe(asignacion).length)} ${plural(miembrosDe(asignacion).length, 'deja', 'dejan')} de recibir sus ${n(asignacion.items.length)} ${plural(asignacion.items.length, textos.item, textos.items)}, salvo quien también esté en otra asignación. Se aplica al guardar el plan.`}
        accion="Eliminar"
        destructiva
        onConfirmar={() => {
          onCambio({ ...base, asignaciones: base.asignaciones.filter((a) => a.id !== asignacion.id) })
          notify('Asignación eliminada', 'Se aplica a las personas al guardar el plan.', 'info')
          cerrarVista()
          onCerrar()
        }}
      >
        <RegistroConfirmar nombre={asignacion.nombre?.trim() || `Asignación ${numero}`} detalle={`${personas(miembrosDe(asignacion).length)} · ${n(asignacion.items.length)} ${plural(asignacion.items.length, textos.item, textos.items)}`} tono="neutro" />
      </DialogoConfirmar>

      {/* Cerrar con cambios: «Seguir editando» o «Descartar» (regla del 8-oct). */}
      <DialogoConfirmar
        abierto={vista?.que === 'salir'}
        onAbiertoChange={(abrir) => (abrir ? undefined : cerrarVista())}
        size="sm"
        icono={Logout01Icon}
        titulo="¿Descartar los cambios de esta asignación?"
        descripcion="Lo que cambiaste en este panel se pierde. El resto de los cambios del plan se conserva."
        cancelar="Seguir editando"
        accion="Descartar"
        destructiva
        onConfirmar={() => {
          cerrarVista()
          onCerrar()
        }}
      />
    </DrawerShell>
  )
}
