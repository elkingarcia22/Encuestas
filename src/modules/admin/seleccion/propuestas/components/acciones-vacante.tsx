import { useId, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon, Copy01Icon, Delete02Icon, Link01Icon, MoreHorizontalIcon, PencilEdit02Icon, Share08Icon, Tick02Icon, ViewIcon, ViewOffIcon } from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Field,
  FieldDescription,
  FieldLabel,
  Heading,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  RadioGroup,
  RadioGroupItem,
} from '@ubits/flux-ui'
import { enlaceVacante } from '../../vacantes/components/datos'
import { Badge } from '@/shared/components/Badge'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { notify, notifyAction } from '@/shared/components/notify'
import {
  ESTADOS_PUBLICACION,
  ESTADO_BADGE,
  ESTADO_EXPLICACION,
  buscarVacanteUI,
  type EstadoPublicacion,
  type Miembro,
  type VacanteUI,
} from '../datos'
import { CompartirVacante, EditarVacante, enProcesoDe } from './editar-vacante'
import { DialogoCompartirVacante as DialogoCompartirConPermisos, DialogoEliminarVacantes, DialogoEstadoVacante, type CambioDeEstado } from './dialogos-vacante'
import type { PermisoVacante } from '../permisos'
import { noSeGuardo } from '../simular'

// La cabecera de una vacante: su estado y lo que se puede hacer con ella.
//
// La regla que ordena todo esto: **se confirma lo que sale de la empresa o lo que no se puede deshacer; el resto
// se hace y se ofrece «Deshacer»**. Publicar, cerrar, despublicar con gente aplicando y eliminar salen afuera o
// tocan a personas: preguntan. Esconderla del portal es reversible en un clic: no pregunta, avisa y deja deshacer.
//
// Glow up del 24 sep (Nicolás: «necesito que hagas esto mucho más hermoso»). Antes eran una insignia de estado, una
// raya y cuatro iconos sueltos del mismo peso —ojo, lápiz, compartir y papelera—, y el estado salía dos veces: una
// junto al título y otra en el selector. Ahora son dos piezas:
// - `EstadoVacante`, junto al título: la insignia **es** el selector, con un punto vivo mientras recibe gente.
// - `AccionesVacante`, a la derecha, en el orden «⋯» · terciario · secundario · primario de las reglas: compartir
//   con las caras de quien ya tiene acceso y lo que se usa poco o no tiene vuelta atrás (editar, sacar del portal,
//   eliminar) dentro de «⋯».
//
// 29 sep, reunión con Elkin: a la vista quedan solo las tres acciones que más se usan —Compartir, Importar CVs y el
// Agente IA—; «Editar» casi no se usa y pasó al menú «⋯», como primera opción.
//
// 7 oct (IN-04, IN-05, IN-06): las ventanas de cambiar el estado, compartir y eliminar viven en `dialogos-vacante.tsx`
// y son las mismas que usa la lista del inicio. Cerrar pregunta cómo terminó, reabrir empieza de cero y guarda la vez
// anterior en el historial, un borrador incompleto no se publica, y eliminar ofrece cerrarla en su lugar.
//
// `CompartirVacante` se reexporta desde aquí (vive en `editar-vacante.tsx`, que es quien la necesita entera para
// su tercer paso) para que la pantalla la pueda usar suelta sin importar dos archivos.
export { CompartirVacante } from './editar-vacante'

// El punto de la insignia. Publicada y en el portal late despacio: está recibiendo gente ahora mismo. En borrador o
// cerrada es un punto quieto, porque no está pasando nada. Sin animación si la persona la tiene apagada.
function PuntoEstado({ vivo }: { vivo: boolean }) {
  return (
    <span className="relative flex size-2 shrink-0" aria-hidden="true">
      {vivo ? <span className="absolute inset-0 rounded-full bg-current opacity-40 motion-safe:animate-ping" /> : null}
      <span className="relative size-2 rounded-full bg-current" />
    </span>
  )
}

// Lo que cambia con cada estado, para el aviso: más corto que la explicación del selector (8 oct, avisos más cortos).
const ESTADO_CORTO: Record<EstadoPublicacion, string> = {
  Borrador: 'Nadie la ve fuera del equipo.',
  Publicada: 'Ya recibe aplicaciones.',
  Cerrada: 'Ya no recibe aplicaciones.',
}

export function EstadoVacante({
  vacante,
  onCambio,
  soloLectura = false,
  onTerminar,
}: {
  vacante: VacanteUI
  onCambio: (cambio: Partial<VacanteUI>) => void
  // Sin permiso para publicarla o cerrarla (VA-11): la insignia dice el estado y no se abre.
  soloLectura?: boolean
  // Un borrador al que le falta algo no se publica: se lleva a terminarlo en el paso pendiente.
  onTerminar?: (vacante: VacanteUI, paso: number) => void
}) {
  // Estado al que se quiere pasar, mientras se confirma. Null = no hay nada preguntándose.
  const [destino, setDestino] = useState<EstadoPublicacion | null>(null)
  // El menú se controla a mano porque las opciones de tipo radio no lo cierran solas (así se ve la marca al
  // elegir), y aquí detrás de la confirmación se quedaba abierto.
  const [menuEstado, setMenuEstado] = useState(false)

  const publicada = vacante.estado === 'Publicada'
  // Publicada pero fuera del portal: se dice con palabras en la propia insignia, no con un icono tachado que hay que
  // saber leer. Es un estado en el que la vacante puede pasarse semanas sin que nadie se dé cuenta. Antes se decía
  // en dos sitios más («Solo el equipo» junto al título y «Fuera del portal» junto a los iconos).
  const escondida = publicada && vacante.oculta

  // Publicar y cerrar cambian lo que pasa fuera de la empresa. Volver a borrador con gente aplicando también:
  // la vacante desaparece del portal y quien ya aplicó se queda sin saber en qué quedó. Eso se pregunta.
  // Volver a borrador sin una sola aplicación no tiene a quién afectar: se hace y se deja deshacer.
  const hayQueConfirmar = (siguiente: EstadoPublicacion) =>
    siguiente === 'Publicada' || siguiente === 'Cerrada' || vacante.aplicaciones > 0

  const aplicarEstado = (siguiente: EstadoPublicacion, cambio: Partial<VacanteUI> = { estado: siguiente }, avisar: string[] = []) => {
    // Lo que había antes, campo por campo: «Deshacer» devuelve justo eso (al reabrir cambian los días y el historial).
    const previo = Object.fromEntries(Object.keys(cambio).map((campo) => [campo, vacante[campo as keyof VacanteUI]])) as Partial<VacanteUI>
    const reabierta = siguiente === 'Publicada' && vacante.estado === 'Cerrada'
    setDestino(null)
    if (noSeGuardo(`estado:${vacante.id}:${siguiente}`, `No pudimos ${reabierta ? 'reabrir' : siguiente === 'Publicada' ? 'publicar' : siguiente === 'Cerrada' ? 'cerrar' : 'volver a borrador'} la vacante`, () => aplicarEstado(siguiente, cambio, avisar), 'Sigue como estaba.')) return
    onCambio(cambio)
    notifyAction(
      reabierta
        ? 'Vacante reabierta'
        : siguiente === 'Publicada'
          ? 'Publicada en el portal de empleo'
          : siguiente === 'Cerrada'
            ? 'Vacante cerrada'
            : 'De vuelta a borrador',
      reabierta
        ? avisar.length
          ? `Les avisamos a ${avisar.length === 1 ? '1 persona' : `${avisar.length} personas`} del proceso.`
          : 'Ya recibe aplicaciones otra vez.'
        : siguiente === 'Cerrada' && cambio.desenlace
          ? cambio.desenlace
          : ESTADO_CORTO[siguiente],
      { label: 'Deshacer', onClick: () => onCambio(previo) }, 'success',
    )
  }

  if (soloLectura)
    return (
      <Badge variant={escondida ? 'warning-light' : ESTADO_BADGE[vacante.estado]} size="lg" className="h-7 gap-1.5 px-2.5 text-sm">
        {escondida ? <HugeiconsIcon icon={ViewOffIcon} size={14} aria-hidden="true" /> : <PuntoEstado vivo={publicada} />}
        {escondida ? 'Oculta del portal' : vacante.estado}
      </Badge>
    )

  return (
    <>
      <DropdownMenu open={menuEstado} onOpenChange={setMenuEstado}>
        {/* Una sola caja: el disparador **es** la insignia de estado. La flecha, más tenue que el texto, dice que se
            puede cambiar sin competir con la palabra. */}
        <DropdownMenuTrigger
          nativeButton={false}
          render={
            <Badge
              variant={escondida ? 'warning-light' : ESTADO_BADGE[vacante.estado]}
              size="lg"
              className="h-7 cursor-pointer gap-1.5 px-2.5 text-sm transition-[filter] select-none hover:brightness-95 data-[popup-open]:brightness-95"
              aria-label={`Estado: ${vacante.estado}${escondida ? ', oculta del portal' : ''}. Cambiar estado de la vacante`}
            />
          }
        >
          {escondida ? (
            <HugeiconsIcon icon={ViewOffIcon} size={14} aria-hidden="true" />
          ) : (
            <PuntoEstado vivo={publicada} />
          )}
          {escondida ? 'Publicada · oculta del portal' : vacante.estado}
          <HugeiconsIcon icon={ArrowDown01Icon} size={14} className="-mr-0.5 opacity-60" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-88">
          {/* La etiqueta va dentro del grupo: fuera de él Base UI revienta. */}
          <DropdownMenuGroup>
            <DropdownMenuLabel>Estado de la vacante</DropdownMenuLabel>
            {/* El estado actual con un radio a la izquierda, junto a su nombre (1 oct, Nicolás: «mejor a la izquierda
                radio button para que se vea mejor la selección»). La opción de radio del menú de la librería marca la
                elegida con un ✓ a la derecha, lejos del nombre y perdido entre las descripciones; por eso cada opción
                es un ítem normal con el radio de la librería solo como dibujo (`inert`): el menú sigue siendo lo que se
                recorre con las flechas y se elige con Enter, y el lector de pantalla oye cuál es el actual. */}
            {ESTADOS_PUBLICACION.map((estado) => {
              const actual = estado === vacante.estado
              return (
                <DropdownMenuItem
                  key={estado}
                  className="items-start! gap-2.5"
                  onClick={() => {
                    setMenuEstado(false)
                    if (actual) return
                    // Cada opción dice su consecuencia en el menú; la confirmación es para las que salen afuera.
                    if (hayQueConfirmar(estado)) setDestino(estado)
                    else aplicarEstado(estado)
                  }}
                >
                  <span inert aria-hidden="true" className="flex h-5 shrink-0 items-center">
                    <RadioGroup value={actual ? estado : ''}>
                      <RadioGroupItem value={estado} />
                    </RadioGroup>
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span>
                      {estado}
                      {actual ? <span className="sr-only"> (estado actual)</span> : null}
                    </span>
                    <span className="text-xs text-muted-foreground">{ESTADO_EXPLICACION[estado]}</span>
                  </span>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ── Cambiar de estado ── */}
      <DialogoEstadoVacante
        vacantes={[vacante]}
        destino={destino}
        onCerrar={() => setDestino(null)}
        onAplicar={(cambios: CambioDeEstado[], avisar) => destino && cambios[0] && aplicarEstado(destino, cambios[0].cambio, avisar)}
        onTerminar={(una, paso) => {
          setDestino(null)
          onTerminar?.(una, paso)
        }}
      />
    </>
  )
}

// Las pantallas viejas de Vacantes (el detalle y la lista de Elkin) y la lista sin ruta `exploraciones/uno/vacantes`
// usan esta ventana de Cristian (auditoría del 8-oct). Las de Selección (cabecera de la vacante e inicio de Vacantes) usan
// la de `dialogos-vacante.tsx`, que además respeta quién puede cambiar el acceso (VA-11) y se abre dentro del panel.
// Cuánto se queda «Copiado» en el botón antes de volver a «Copiar».
const MS_COPIADO = 2000

// El enlace público de la vacante con el botón de copiar pegado al campo (el mismo de la ventana de Compartir de
// Cristian y Elkin). Fuera del portal, el enlace existe pero no recibe a nadie: se dice.
function EnlaceParaCandidatos({ titulo, oculta }: { titulo: string; oculta: boolean }) {
  const enlace = enlaceVacante(titulo)
  const [copiado, setCopiado] = useState(false)
  const campo = useId()

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(enlace)
      setCopiado(true)
      window.setTimeout(() => setCopiado(false), MS_COPIADO)
      notify('Copiamos el enlace de la vacante', undefined, 'success')
    } catch {
      notify('No pudimos copiar el enlace', 'Selecciónalo en el campo y cópialo a mano.', 'error')
    }
  }

  return (
    <Field className="pb-2">
      <FieldLabel htmlFor={campo}>Enlace para candidatos</FieldLabel>
      <InputGroup>
        <InputGroupAddon>
          <HugeiconsIcon icon={Link01Icon} aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput id={campo} readOnly value={enlace} onFocus={(evento) => evento.target.select()} />
        <InputGroupAddon align="inline-end">
          <InputGroupButton variant="secondary" size="xs" onClick={copiar}>
            <HugeiconsIcon icon={copiado ? Tick02Icon : Copy01Icon} aria-hidden="true" />
            {copiado ? 'Copiado' : 'Copiar'}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <FieldDescription>
        {oculta
          ? 'Está fuera del portal: quien abra el enlace no puede postularse hasta que la devuelvas.'
          : 'Compártelo para que los candidatos se postulen directamente.'}
      </FieldDescription>
    </Field>
  )
}

// La única ventana de «Compartir» de una vacante (auditoría del 8-oct, H-220 y H-248): la abren la cabecera de la
// vacante, el menú «⋯» de cada fila de las listas y el detalle. Título fijo; el nombre de la vacante va en el cuerpo.
// Con el enlace para candidatos arriba solo si la vacante está publicada.
export function DialogoCompartirVacante({
  abierto,
  onAbiertoChange,
  titulo,
  conEnlace,
  oculta = false,
  equipo,
  onEquipo,
}: {
  abierto: boolean
  onAbiertoChange: (abierto: boolean) => void
  titulo: string
  conEnlace: boolean
  oculta?: boolean
  equipo: Miembro[]
  onEquipo: (equipo: Miembro[]) => void
}) {
  return (
    <ActionDialog
      open={abierto}
      onOpenChange={onAbiertoChange}
      title="Compartir vacante"
      sub="Dale acceso a gente de la empresa y decide qué puede hacer cada quien."
      lead={
        <Heading as="h3" level={6}>
          {titulo}
        </Heading>
      }
      cancelLabel="Listo"
    >
      {conEnlace ? <EnlaceParaCandidatos titulo={titulo} oculta={oculta} /> : null}
      <CompartirVacante titulo={titulo} equipo={equipo} onEquipo={onEquipo} />
    </ActionDialog>
  )
}

// El botón «Compartir» de una pantalla que no lleva el equipo de la vacante en su estado (el detalle de Vacantes): trae
// el equipo de la vacante, o a quien la lleva como dueño del proceso, y abre la misma ventana de arriba.
export function BotonCompartirVacante({
  vacante,
}: {
  vacante: { id: string; titulo: string; estado: 'Publicada' | 'Pausada' | 'Borrador'; reclutador: { nombre: string; iniciales: string } }
}) {
  const [abierto, setAbierto] = useState(false)
  const [equipo, setEquipo] = useState<Miembro[]>(
    () =>
      buscarVacanteUI(vacante.id)?.equipo ?? [
        { ...vacante.reclutador, correo: `${vacante.reclutador.nombre.split(' ')[0].toLowerCase()}@ubits.com`, permiso: 'Dueña del proceso' },
      ],
  )
  return (
    <>
      <Button variant="outline" onClick={() => setAbierto(true)}>
        <HugeiconsIcon icon={Share08Icon} aria-hidden="true" />
        Compartir
      </Button>
      <DialogoCompartirVacante
        abierto={abierto}
        onAbiertoChange={setAbierto}
        titulo={vacante.titulo}
        conEnlace={vacante.estado !== 'Borrador'}
        oculta={vacante.estado === 'Pausada'}
        equipo={equipo}
        onEquipo={setEquipo}
      />
    </>
  )
}


export function AccionesVacante({
  vacante,
  onCambio,
  onEliminar,
  primario,
  onEditar,
  compartir,
  permiso,
}: {
  vacante: VacanteUI
  onCambio: (cambio: Partial<VacanteUI>) => void
  onEliminar?: () => void
  // El botón azul de la pantalla («Importar CVs»). Entra aquí para que la fila quede completa en el orden de las
  // reglas: «⋯» · terciario · secundario · primario · IA (el «⋯» primero, a la izquierda de todo).
  primario?: ReactNode
  // Editar en otra parte (la creación por pasos de la exploración 1). Sin esto abre el editor de siempre.
  onEditar?: () => void
  // «Compartir» abierto desde fuera: al llegar de publicar, la ventana ya está abierta.
  compartir?: { abierto: boolean; onAbierto: (abierto: boolean) => void }
  // Lo que puede hacer quien mira (VA-11). Sin esto, todo.
  permiso?: PermisoVacante
}) {
  const puedeEditar = permiso?.edita ?? true
  const administra = permiso?.administra ?? true
  const [editando, setEditando] = useState(false)
  const [compartiendoAqui, setCompartiendoAqui] = useState(false)
  const compartiendo = compartir?.abierto ?? compartiendoAqui
  const setCompartiendo = compartir?.onAbierto ?? setCompartiendoAqui
  const editar = () => (onEditar ? onEditar() : setEditando(true))
  const [eliminando, setEliminando] = useState(false)
  // «Cerrarla en su lugar», desde la ventana de eliminar: guarda su historia y su gente.
  const [cerrando, setCerrando] = useState(false)

  const enProceso = enProcesoDe(vacante.id).length
  const publicada = vacante.estado === 'Publicada'
  // Dos caras y el resto en número: con tres ya no se reconoce a nadie y el botón se estira.
  const caras = vacante.equipo.slice(0, 2)
  const resto = vacante.equipo.length - caras.length

  const cambiarVisibilidad = (ocultar: boolean) => {
    if (noSeGuardo(`visible:${vacante.id}:${ocultar}`, ocultar ? 'No pudimos ocultarla del portal' : 'No pudimos mostrarla en el portal', () => cambiarVisibilidad(ocultar), 'Sigue como estaba.')) return
    onCambio({ oculta: ocultar })
    notifyAction(
      ocultar ? 'Oculta del portal' : 'Visible en el portal',
      ocultar ? 'Nadie nuevo puede aplicar.' : 'Cualquiera puede verla y aplicar.',
      { label: 'Deshacer', onClick: () => onCambio({ oculta: !ocultar }) }, 'success',
    )
  }

  const cerrar = (cambio: Partial<VacanteUI>) => {
    const previo = { estado: vacante.estado, desenlace: vacante.desenlace }
    setCerrando(false)
    if (noSeGuardo(`cerrar:${vacante.id}`, 'No pudimos cerrar la vacante', () => cerrar(cambio), 'Sigue abierta.')) return
    onCambio(cambio)
    notifyAction('Vacante cerrada', cambio.desenlace ?? ESTADO_CORTO.Cerrada, { label: 'Deshacer', onClick: () => onCambio(previo) }, 'success')
  }

  const eliminar = () => {
    setEliminando(false)
    if (noSeGuardo(`eliminar:${vacante.id}`, `No pudimos eliminar «${vacante.titulo}»`, eliminar, 'Sigue con su proceso.')) return
    onEliminar?.()
    // Eliminar es definitivo, como en Greenhouse, Lever o Ashby (13 oct, PM: cancela entrevistas y devuelve créditos):
    // sin «Deshacer»; por eso la ventana pide escribir «eliminar».
    notify(`«${vacante.titulo}» eliminada`, enProceso ? `Con ${enProceso} ${enProceso === 1 ? 'persona' : 'personas'} en proceso.` : undefined, 'success')
  }

  return (
    <>
      {/* «⋯» primero de la fila, a la izquierda de todo (25 sep, Nicolás: «siempre es el último en la izquierda»): ⋯ ·
          terciario · secundario · primario · IA. */}
      {/* Con «Solo ver» no hay nada que hacer en este menú: no se muestra (VA-11). «Puede editar» solo edita. */}
      {puedeEditar ? (
        <DropdownMenu>
          <Hint label="Más acciones">
            <DropdownMenuTrigger render={<BotonIcono size="icon" aria-label="Más acciones de la vacante" />}>
              <HugeiconsIcon icon={MoreHorizontalIcon} size={18} aria-hidden="true" />
            </DropdownMenuTrigger>
          </Hint>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={editar}>
                <HugeiconsIcon icon={PencilEdit02Icon} size={16} aria-hidden="true" />
                Editar la vacante
              </DropdownMenuItem>
              {/* Sacar del portal solo existe con la vacante publicada: en borrador o cerrada no hay portal del que
                  esconderla, y una opción que no hace nada enseña a no mirar el menú. */}
              {publicada && administra ? (
                <DropdownMenuItem onClick={() => cambiarVisibilidad(!vacante.oculta)}>
                  <HugeiconsIcon icon={vacante.oculta ? ViewIcon : ViewOffIcon} size={16} aria-hidden="true" />
                  {vacante.oculta ? 'Mostrar en el portal de empleo' : 'Ocultar del portal de empleo'}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuGroup>
            {administra ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem variant="destructive" onClick={() => setEliminando(true)}>
                    <HugeiconsIcon icon={Delete02Icon} size={16} aria-hidden="true" />
                    Eliminar la vacante
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      {/* Compartir con la cara de quien ya la ve, como en Figma o Notion: antes de abrir la ventana ya se sabe si
          falta alguien. El nombre completo va en el globo. */}
      <Hint label={`${vacante.equipo.length === 1 ? 'Tiene' : 'Tienen'} acceso: ${vacante.equipo.map((miembro) => miembro.nombre).join(', ')}`}>
        <Button variant="outline" className="gap-2 ps-1.5" onClick={() => setCompartiendo(true)}>
          <AvatarGroup className="-space-x-1.5">
            {caras.map((miembro) => (
              <Avatar key={miembro.correo} size="sm">
                <AvatarFallback>{miembro.iniciales}</AvatarFallback>
              </Avatar>
            ))}
            {resto > 0 ? (
              <AvatarGroupCount className="size-6 rounded-full border bg-background text-xs font-medium text-muted-foreground">
                +{resto}
              </AvatarGroupCount>
            ) : null}
          </AvatarGroup>
          Compartir
        </Button>
      </Hint>

      {primario}

      {/* ── Compartir ── (con el enlace para candidatos arriba: al publicar se abre esta misma y se manda el enlace de una
          vez, 29 sep, reunión con Elkin) */}
      <DialogoCompartirConPermisos
        vacante={vacante}
        abierto={compartiendo}
        onAbierto={setCompartiendo}
        onEquipo={(equipo) => onCambio({ equipo })}
        administra={administra}
        duena={permiso?.duena?.nombre}
      />

      {/* ── Editar ── */}
      {onEditar ? null : <EditarVacante vacante={vacante} open={editando} onOpenChange={setEditando} onGuardar={onCambio} />}

      {/* ── Eliminar ── */}
      <DialogoEliminarVacantes
        vacantes={eliminando ? [vacante] : []}
        onCerrar={() => setEliminando(false)}
        onConfirmar={eliminar}
        onCerrarEnSuLugar={
          vacante.estado === 'Cerrada'
            ? undefined
            : () => {
                setEliminando(false)
                setCerrando(true)
              }
        }
      />
      <DialogoEstadoVacante
        vacantes={cerrando ? [vacante] : []}
        destino={cerrando ? 'Cerrada' : null}
        onCerrar={() => setCerrando(false)}
        onAplicar={(cambios) => cambios[0] && cerrar(cambios[0].cambio)}
      />
    </>
  )
}
