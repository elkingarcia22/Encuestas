import { useEffect, useId, useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  Alert02Icon,
  Cancel01Icon,
  DragDropVerticalIcon,
  InformationCircleIcon,
  LockIcon,
  Search01Icon,
  Tick02Icon,
  UserAdd01Icon,
} from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Label,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Sortable,
  SortableItem,
  SortableItemHandle,
  Spinner,
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  Textarea,
} from '@ubits/flux-ui'
import { useAccion } from './carga'
import { Badge } from '@/shared/components/Badge'
import { VentanaDeAccion } from '@/modules/design-system/drawers/components/drawer-anidado'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { ImagenGlass } from '@/shared/components/ImagenGlass'
import { DialogoConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { notify, notifyAction } from '@/shared/components/notify'
import { EtiquetaIA } from '@/modules/design-system/ia/etiqueta-ia'
import { pesos } from '../../vacantes/detalle/components/data'
import { noSeGuardo } from '../simular'
import {
  BIBLIOTECA_ETAPAS,
  CANDIDATURAS,
  ESTADOS_PUBLICACION,
  ESTADO_EXPLICACION,
  ETIQUETAS,
  PERSONAS_EMPRESA,
  type EstadoPublicacion,
  type EtapaVacante,
  type Miembro,
  type Permiso,
  type VacanteUI,
} from '../datos'

// Editar la vacante: los tres pasos que hoy son tres pantallas separadas, en un solo panel.
//
// Hoy en el producto real hay que entrar por «editar», guardar, salir, entrar por «flujo del candidato», guardar,
// salir, y entrar por «visibilidad». Son tres guardados y tres salidas para un mismo objeto, y nunca se ve el
// conjunto. Aquí es un panel con pasos: se puede saltar de uno a otro, se guarda una vez y al final se dice qué
// cambió.
//
// **Por qué un diálogo grande y no un panel lateral:** el paso 1 es un formulario largo que respira mejor en dos
// columnas (un lateral de 36rem lo dejaría todo en una columna y el paso se haría el doble de alto), y el paso 2
// se arrastra con el ratón: un lateral flotante hace que arrastrar quede pegado al borde de la pantalla. Además
// los laterales de este módulo ya son la ficha del candidato; usar uno también para editar los pondría a competir.
// Se sigue el ancho que ya usa «Importar CVs» en esta misma carpeta, un paso más ancho por el formulario.
//
// Este archivo también es el dueño de «Compartir» (la lista del equipo con sus permisos), porque el paso 3 la
// necesita entera. `acciones-vacante.tsx` la reexporta: así los dos archivos no se importan en círculo.

// ── Permisos ──

const PERMISOS: Permiso[] = ['Dueña del proceso', 'Puede editar', 'Solo ver']

// Qué puede hacer cada quien. Se lee antes de elegir, no después de equivocarse.
const PERMISO_EXPLICACION: Record<Permiso, string> = {
  'Dueña del proceso': 'Publica, cierra, edita, da acceso y puede eliminar la vacante.',
  'Puede editar': 'Mueve candidatos, edita la vacante y escribe notas. No puede eliminarla.',
  'Solo ver': 'Ve la vacante y a los candidatos. No cambia nada.',
}

// ── Cuánta gente hay en juego ──
//
// Las cifras que hacen que una advertencia sirva para algo. Salen de las candidaturas reales, no de un texto fijo.

export const enProcesoDe = (vacanteId: string) => CANDIDATURAS.filter((c) => c.vacante.id === vacanteId)

// Los candidatos guardan su etapa entre las cinco de plantilla, así que una etapa añadida a mano empieza vacía
// (lo dice `datos.ts`). Por eso esto cuenta de verdad: no adivina.
export const enEtapaDe = (vacanteId: string, etapaId: string) =>
  enProcesoDe(vacanteId).filter((c) => c.etapa === etapaId).length

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Compartir: quién tiene acceso y a quién se invita
// ══════════════════════════════════════════════════════════════════════════════════════════════

export function CompartirVacante({
  titulo,
  equipo,
  onEquipo,
}: {
  titulo: string
  equipo: Miembro[]
  onEquipo: (equipo: Miembro[]) => void
}) {
  const campo = useId()
  const [busqueda, setBusqueda] = useState('')
  const [elegidos, setElegidos] = useState<string[]>([])
  const [permisoNuevo, setPermisoNuevo] = useState<Permiso>('Solo ver')

  // Quien ya tiene acceso no vuelve a salir en «Invitar»: invitar dos veces a la misma persona es el error más
  // fácil de cometer y el más molesto de deshacer.
  const disponibles = PERSONAS_EMPRESA.filter((persona) => !equipo.some((miembro) => miembro.correo === persona.correo))
  const filtradas = disponibles.filter((persona) =>
    `${persona.nombre} ${persona.correo}`.toLowerCase().includes(busqueda.trim().toLowerCase()),
  )

  // Alguien que no está en la lista (el jefe que contrata, otra sede): se le invita con su correo de la empresa (VA-49).
  const correoEscrito = busqueda.trim().toLowerCase()
  const esCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoEscrito)
  const yaTiene = equipo.some((miembro) => miembro.correo.toLowerCase() === correoEscrito)
  const invitarCorreo = () => {
    if (noSeGuardo(`invitar:${correoEscrito}`, `No pudimos invitar a ${correoEscrito}`, invitarCorreo, 'No le llegó nada.')) return
    const usuario = correoEscrito.split('@')[0]
    const nombre = usuario.replace(/[._-]+/g, ' ').replace(/\b\p{L}/gu, (letra) => letra.toUpperCase())
    const iniciales = nombre.split(' ').filter(Boolean).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase()
    onEquipo([...equipo, { nombre, iniciales, correo: correoEscrito, permiso: permisoNuevo }])
    setBusqueda('')
    notify(`Invitamos a ${correoEscrito}`, `${permisoNuevo}. Le llega un correo.`, 'success')
  }

  const compartir = () => {
    const nuevos = disponibles
      .filter((persona) => elegidos.includes(persona.correo))
      .map((persona) => ({ ...persona, permiso: permisoNuevo }))
    if (!nuevos.length) return
    if (noSeGuardo(`compartir:${nuevos.map((persona) => persona.correo).join(',')}`, 'No pudimos darles acceso', compartir, 'Nadie nuevo ve la vacante.')) return

    onEquipo([...equipo, ...nuevos])
    setElegidos([])
    setBusqueda('')
    // Se dice a quién le llegó, con nombre: «compartido» a secas no deja comprobar nada.
    notify(
      nuevos.length === 1 ? `${nuevos[0].nombre} ya tiene acceso` : `${nuevos.length} personas ya tienen acceso`,
      `${permisoNuevo}. ${nuevos.length === 1 ? 'Le' : 'Les'} llega un correo.`, 'success',
    )
  }

  return (
    <Tabs defaultValue="acceso" className="gap-4">
      <TabsList variant="line">
        <TabsTrigger value="acceso" className="flex-none px-3">
          Con acceso ({equipo.length})
        </TabsTrigger>
        <TabsTrigger value="invitar" className="flex-none px-3">
          Invitar
        </TabsTrigger>
      </TabsList>

      <TabsContent value="acceso" className="flex flex-col gap-3">
        <ItemGroup className="gap-2">
          {equipo.map((miembro) => {
            // Siempre tiene que quedar alguien al mando: si solo hay una dueña, no se le puede bajar el permiso
            // ni quitarle el acceso. Es lo que evita la vacante huérfana que nadie puede cerrar.
            const duenas = equipo.filter((otro) => otro.permiso === 'Dueña del proceso').length
            const ultima = miembro.permiso === 'Dueña del proceso' && duenas === 1

            return (
              <Item key={miembro.correo} variant="outline" size="sm">
                <ItemMedia>
                  <Avatar>
                    <AvatarFallback>{miembro.iniciales}</AvatarFallback>
                  </Avatar>
                </ItemMedia>
                <ItemContent className="min-w-0!">
                  <ItemTitle className="w-full truncate">{miembro.nombre}</ItemTitle>
                  <ItemDescription className="w-full truncate">{miembro.correo}</ItemDescription>
                </ItemContent>
                <ItemActions>
                  {ultima ? (
                    <Badge variant="secondary">
                      Dueña del proceso
                    </Badge>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
                        {miembro.permiso}
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-80">
                        {/* La etiqueta va dentro del grupo: fuera de él Base UI revienta. */}
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>Qué puede hacer {miembro.nombre.split(' ')[0]}</DropdownMenuLabel>
                          <DropdownMenuRadioGroup
                            value={miembro.permiso}
                            onValueChange={(valor) =>
                              onEquipo(
                                equipo.map((otro) =>
                                  otro.correo === miembro.correo ? { ...otro, permiso: valor as Permiso } : otro,
                                ),
                              )
                            }
                          >
                            {PERMISOS.map((permiso) => (
                              <DropdownMenuRadioItem key={permiso} value={permiso} className="items-start!">
                                <span className="flex flex-col gap-0.5">
                                  <span>{permiso}</span>
                                  <span className="text-xs text-muted-foreground">{PERMISO_EXPLICACION[permiso]}</span>
                                </span>
                              </DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={function quitar() {
                            if (noSeGuardo(`quitar-acceso:${miembro.correo}`, `No pudimos quitarle el acceso a ${miembro.nombre}`, quitar)) return
                            const antes = equipo
                            onEquipo(equipo.filter((otro) => otro.correo !== miembro.correo))
                            // Se deshace (VA-49): quitarle el acceso a alguien por error no debería costar invitarla otra vez.
                            notifyAction(`${miembro.nombre} ya no tiene acceso`, `Deja de ver «${titulo}».`, { label: 'Deshacer', onClick: () => onEquipo(antes) }, 'success')
                          }}
                        >
                          <HugeiconsIcon icon={Cancel01Icon} size={16} aria-hidden="true" />
                          Quitar acceso
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </ItemActions>
              </Item>
            )
          })}
        </ItemGroup>
        <Text as="p" variant="muted" size="xs">
          Quien tiene acceso ve a todos los candidatos de esta vacante, incluidas las pretensiones salariales.
        </Text>
      </TabsContent>

      <TabsContent value="invitar" className="flex flex-col gap-3">
        <InputGroup>
          <InputGroupAddon>
            <HugeiconsIcon icon={Search01Icon} size={16} aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar por nombre o correo"
            aria-label="Buscar personas de la empresa"
          />
        </InputGroup>

        {filtradas.length ? (
          <ItemGroup className="max-h-64 gap-2 overflow-y-auto">
            {filtradas.map((persona) => {
              const marcada = elegidos.includes(persona.correo)
              return (
                <Label key={persona.correo} htmlFor={`${campo}-${persona.correo}`} className="font-normal">
                  <Item variant="outline" size="sm" className="w-full cursor-pointer">
                    <ItemMedia>
                      <Avatar>
                        <AvatarFallback>{persona.iniciales}</AvatarFallback>
                      </Avatar>
                    </ItemMedia>
                    <ItemContent className="min-w-0!">
                      <ItemTitle className="w-full truncate">{persona.nombre}</ItemTitle>
                      <ItemDescription className="w-full truncate">{persona.correo}</ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <Checkbox
                        id={`${campo}-${persona.correo}`}
                        checked={marcada}
                        onCheckedChange={(valor) =>
                          setElegidos((previos) =>
                            valor === true
                              ? [...previos, persona.correo]
                              : previos.filter((correo) => correo !== persona.correo),
                          )
                        }
                      />
                    </ItemActions>
                  </Item>
                </Label>
              )
            })}
          </ItemGroup>
        ) : esCorreo && !yaTiene ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="default">
                <ImagenGlass nombre="glass-profile" />
              </EmptyMedia>
              <EmptyTitle>No está en la lista</EmptyTitle>
              <EmptyDescription>Invítala con su correo: le llega el enlace y entra con su cuenta de la empresa.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" onClick={invitarCorreo}>
                Invitar a {correoEscrito}
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="default">
                <ImagenGlass nombre="glass-profile" />
              </EmptyMedia>
              <EmptyTitle>{disponibles.length ? 'Nadie con ese nombre' : 'Ya está toda la empresa'}</EmptyTitle>
              <EmptyDescription>
                {disponibles.length
                  ? 'Prueba con el apellido, o escribe su correo completo para invitarla.'
                  : 'Todas las personas de la lista ya tienen acceso a esta vacante.'}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        <Separator />

        <div className="flex flex-wrap items-end justify-between gap-3">
          <Field className="w-56">
            <FieldLabel>Con qué permiso entran</FieldLabel>
            <Select value={permisoNuevo} onValueChange={(valor) => setPermisoNuevo(valor as Permiso)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERMISOS.map((permiso) => (
                  <SelectItem key={permiso} value={permiso}>
                    {permiso}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>{PERMISO_EXPLICACION[permisoNuevo]}</FieldDescription>
          </Field>
          <Button disabled={!elegidos.length} onClick={compartir}>
            <HugeiconsIcon icon={UserAdd01Icon} size={16} aria-hidden="true" />
            {elegidos.length ? `Compartir con ${elegidos.length}` : 'Compartir'}
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  )
}

// ══════════════════════════════════════════════════════════════════════════════════════════════
// El editor
// ══════════════════════════════════════════════════════════════════════════════════════════════

const PASOS = [
  { titulo: 'Información', detalle: 'Qué es el cargo' },
  { titulo: 'Etapas', detalle: 'Por dónde pasa la gente' },
  { titulo: 'Visibilidad', detalle: 'Quién la ve' },
]

const MODALIDADES = ['Presencial', 'Híbrido', 'Remoto']
const CONTRATOS = ['Término indefinido', 'Término fijo a un año', 'Prestación de servicios', 'Aprendizaje']
const SENIORITIES = ['Junior', 'Semi senior', 'Senior', 'Líder']
const EXPERIENCIAS = ['Sin experiencia', '1 a 2 años', '3 a 5 años', 'Más de 5 años']
const IDIOMAS = ['No requerido', 'Inglés A2', 'Inglés B1', 'Inglés B2', 'Inglés C1']

// Las vacantes que ya existen traen valores escritos a mano («4 a 7 años») que no están en estas listas. Si no se
// suman, la lista muestra el valor pero no deja volver a él después de cambiarlo, y el dato se pierde sin avisar.
const conElActual = (opciones: string[], actual: string) => (opciones.includes(actual) ? opciones : [actual, ...opciones])

// Lo que se puede editar. Es un borrador aparte: nada toca la vacante hasta «Guardar cambios».
type Borrador = Pick<
  VacanteUI,
  | 'titulo'
  | 'area'
  | 'sede'
  | 'modalidad'
  | 'contrato'
  | 'seniority'
  | 'experiencia'
  | 'idioma'
  | 'rango'
  | 'descripcion'
  | 'requisitos'
  | 'etiquetas'
  | 'etapas'
  | 'estado'
  | 'oculta'
  | 'equipo'
>

const CAMPOS: (keyof Borrador)[] = [
  'titulo',
  'area',
  'sede',
  'modalidad',
  'contrato',
  'seniority',
  'experiencia',
  'idioma',
  'rango',
  'descripcion',
  'requisitos',
  'etiquetas',
  'etapas',
  'estado',
  'oculta',
  'equipo',
]

const del = (vacante: VacanteUI): Borrador =>
  Object.fromEntries(CAMPOS.map((campo) => [campo, vacante[campo]])) as Borrador

export function EditarVacante({
  vacante,
  open,
  onOpenChange,
  onGuardar,
  pasoInicial = 1,
}: {
  vacante: VacanteUI
  open: boolean
  onOpenChange: (abierto: boolean) => void
  onGuardar: (cambio: Partial<VacanteUI>) => void
  // Desde el tablero se abre directo en «Etapas»: las columnas son las etapas de la vacante.
  pasoInicial?: number
}) {
  const campo = useId()
  const [paso, setPaso] = useState(pasoInicial)
  const [borrador, setBorrador] = useState<Borrador>(() => del(vacante))
  const [requisitoNuevo, setRequisitoNuevo] = useState('')
  // Etapa que se está quitando: el aviso necesita saber cuál para decir a dónde va la gente.
  const [quitando, setQuitando] = useState<EtapaVacante | null>(null)
  const [preguntarSalida, setPreguntarSalida] = useState(false)

  // Al abrir se parte siempre de la vacante de verdad y del primer paso: un borrador viejo dentro del panel es
  // peor que no tener borrador, porque no se ve que está ahí.
  useEffect(() => {
    if (!open) return
    setBorrador(del(vacante))
    setPaso(pasoInicial)
    setRequisitoNuevo('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const cambiar = (parte: Partial<Borrador>) => setBorrador((previo) => ({ ...previo, ...parte }))

  // Qué cambió de verdad, campo por campo. Sirve para dos cosas: saber si hay que preguntar al salir y mandarle
  // a la pantalla solo lo que se movió, no la vacante entera.
  const cambios = useMemo(() => {
    const parcial: Partial<VacanteUI> = {}
    for (const nombre of CAMPOS) {
      if (JSON.stringify(borrador[nombre]) !== JSON.stringify(vacante[nombre])) {
        Object.assign(parcial, { [nombre]: borrador[nombre] })
      }
    }
    return parcial
  }, [borrador, vacante])

  const cuantosCambios = Object.keys(cambios).length
  const enProceso = enProcesoDe(vacante.id).length

  // Etapas de la biblioteca que todavía no están en esta vacante.
  const porAnadir = BIBLIOTECA_ETAPAS.filter((etapa) => !borrador.etapas.some((puesta) => puesta.id === etapa.id))

  const cerrar = (abierto: boolean) => {
    if (abierto) return onOpenChange(true)
    // Salir con cambios sin guardar se pregunta; salir sin tocar nada, no. Preguntar siempre enseña a decir
    // «sí» sin leer, y entonces el día que importa tampoco se lee.
    if (cuantosCambios) return setPreguntarSalida(true)
    onOpenChange(false)
  }

  // Guardar dice «Guardando…» con su spinner un momento: es una acción, y su respuesta va en el botón.
  const accion = useAccion()
  const guardar = () => {
    // Si no se guarda, la ventana sigue abierta con los cambios y el aviso deja reintentar.
    if (noSeGuardo(`editar-vacante:${vacante.id}:${cuantosCambios}`, 'No pudimos guardar los cambios', guardar, 'Siguen aquí, sin perderse.')) return
    onGuardar(cambios)
    onOpenChange(false)
    notify('Vacante actualizada', cuantosCambios === 1 ? 'Se guardó un cambio.' : `Se guardaron ${cuantosCambios} cambios.`, 'success')
  }

  // Quitar una etapa: la gente que está en ella pasa a la etapa de antes (o a la primera, si era la primera).
  // Es la pregunta que ningún ATS contesta antes de borrar; aquí se contesta con el número real.
  const destinoAlQuitar = (etapa: EtapaVacante) => {
    const indice = borrador.etapas.findIndex((otra) => otra.id === etapa.id)
    return borrador.etapas[indice - 1] ?? borrador.etapas[indice + 1] ?? null
  }

  const quitarEtapa = (etapa: EtapaVacante) => {
    cambiar({ etapas: borrador.etapas.filter((otra) => otra.id !== etapa.id) })
    setQuitando(null)
  }

  const gente = quitando ? enEtapaDe(vacante.id, quitando.id) : 0
  const destino = quitando ? destinoAlQuitar(quitando) : null

  return (
    <>
      {/* El armazón es `ActionDialog`, como el resto de ventanas del playground, en su tamaño ancho: los pasos y
          el formulario van en el cuerpo con scroll, y los botones de avanzar y guardar en su pie gris. */}
      <VentanaDeAccion
        open={open}
        onOpenChange={cerrar}
        size="wide"
        title={vacante.titulo ? `Editar «${vacante.titulo}»` : 'Crear vacante'}
        sub={
          vacante.titulo
            ? 'Los tres pasos se guardan juntos al final. Se puede saltar de uno a otro sin perder nada.'
            : 'Queda en borrador hasta que la publiques. Los tres pasos se guardan juntos al final.'
        }
        note={
          cuantosCambios === 0
            ? 'Sin cambios todavía'
            : cuantosCambios === 1
              ? '1 cambio sin guardar'
              : `${cuantosCambios} cambios sin guardar`
        }
        footer={
          <>
            {paso > 1 ? (
              <Button variant="outline" onClick={() => setPaso(paso - 1)}>
                Atrás
              </Button>
            ) : null}
            {paso < PASOS.length ? (
              <Button variant="outline" onClick={() => setPaso(paso + 1)}>
                Siguiente
              </Button>
            ) : null}
            {/* Se puede guardar desde cualquier paso: quien entró solo a cambiar el título no tiene por qué pasar
                por las etapas y los permisos para salir. */}
            <Button disabled={!cuantosCambios || accion.enCurso} onClick={() => accion.correr(guardar)}>
              {accion.enCurso ? <Spinner /> : <HugeiconsIcon icon={Tick02Icon} size={16} aria-hidden="true" />}
              {accion.enCurso ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </>
        }
      >
        {/* Los tres pasos son navegables en los dos sentidos: no es un formulario que se llena por primera vez,
            es una vacante que ya existe y a la que se le viene a cambiar una cosa suelta. */}
        <Stepper value={paso} onValueChange={setPaso} className="pt-1">
          <StepperNav>
            {PASOS.map((item, indice) => (
              <StepperItem key={item.titulo} step={indice + 1} completed={paso > indice + 1}>
                <StepperTrigger>
                  <StepperIndicator>
                    {paso > indice + 1 ? (
                      <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} aria-hidden="true" />
                    ) : (
                      indice + 1
                    )}
                  </StepperIndicator>
                  <StepperTitle>{item.titulo}</StepperTitle>
                </StepperTrigger>
                {indice < PASOS.length - 1 ? <StepperSeparator /> : null}
              </StepperItem>
            ))}
          </StepperNav>
        </Stepper>

        <Separator />

        <div className="flex flex-col gap-6 py-1">
          {/* ── Paso 1 · Información ── */}
          {paso === 1 ? (
            <>
              <Text as="div" weight="medium">
                El puesto
              </Text>

              <Field>
                <FieldLabel htmlFor={`${campo}-titulo`}>Título del cargo</FieldLabel>
                <Input
                  id={`${campo}-titulo`}
                  value={borrador.titulo}
                  onChange={(event) => cambiar({ titulo: event.target.value })}
                />
                <FieldDescription>Es lo que ve la persona en el portal de empleo.</FieldDescription>
              </Field>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor={`${campo}-area`}>Área</FieldLabel>
                  <Input
                    id={`${campo}-area`}
                    value={borrador.area}
                    onChange={(event) => cambiar({ area: event.target.value })}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`${campo}-sede`}>Sede</FieldLabel>
                  <Input
                    id={`${campo}-sede`}
                    value={borrador.sede}
                    onChange={(event) => cambiar({ sede: event.target.value })}
                  />
                </Field>
                <Field>
                  <FieldLabel>Modalidad</FieldLabel>
                  <Select value={borrador.modalidad} onValueChange={(valor) => cambiar({ modalidad: valor as string })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {conElActual(MODALIDADES, borrador.modalidad).map((opcion) => (
                        <SelectItem key={opcion} value={opcion}>
                          {opcion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Separator />

              <div className="flex flex-col gap-1">
                <Text as="div" weight="medium">
                  Lo que se ofrece
                </Text>
                <Text as="p" variant="muted" size="sm">
                  Contra esto se compara lo que pide cada persona en su CV.
                </Text>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Contrato</FieldLabel>
                  <Select value={borrador.contrato} onValueChange={(valor) => cambiar({ contrato: valor as string })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {conElActual(CONTRATOS, borrador.contrato).map((opcion) => (
                        <SelectItem key={opcion} value={opcion}>
                          {opcion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Seniority</FieldLabel>
                  <Select value={borrador.seniority} onValueChange={(valor) => cambiar({ seniority: valor as string })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {conElActual(SENIORITIES, borrador.seniority).map((opcion) => (
                        <SelectItem key={opcion} value={opcion}>
                          {opcion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Experiencia</FieldLabel>
                  <Select
                    value={borrador.experiencia}
                    onValueChange={(valor) => cambiar({ experiencia: valor as string })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {conElActual(EXPERIENCIAS, borrador.experiencia).map((opcion) => (
                        <SelectItem key={opcion} value={opcion}>
                          {opcion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Idioma</FieldLabel>
                  <Select value={borrador.idioma} onValueChange={(valor) => cambiar({ idioma: valor as string })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {conElActual(IDIOMAS, borrador.idioma).map((opcion) => (
                        <SelectItem key={opcion} value={opcion}>
                          {opcion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Rango salarial al mes</FieldLabel>
                  <div className="flex items-center gap-2">
                    {([0, 1] as const).map((extremo) => (
                      <InputGroup key={extremo}>
                        <InputGroupAddon>$</InputGroupAddon>
                        <InputGroupInput
                          type="number"
                          step="0.1"
                          min="0"
                          inputMode="decimal"
                          className="tabular-nums"
                          aria-label={extremo === 0 ? 'Desde' : 'Hasta'}
                          value={borrador.rango[extremo]}
                          onChange={(event) => {
                            const numero = Number(event.target.value)
                            const rango: [number, number] = [...borrador.rango]
                            rango[extremo] = Number.isFinite(numero) ? numero : 0
                            cambiar({ rango })
                          }}
                        />
                        <InputGroupAddon align="inline-end">M</InputGroupAddon>
                      </InputGroup>
                    ))}
                  </div>
                  <FieldDescription>
                    De {pesos(borrador.rango[0])} a {pesos(borrador.rango[1])} al mes. Es contra lo que se compara la
                    pretensión de cada persona.
                  </FieldDescription>
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor={`${campo}-descripcion`}>Descripción</FieldLabel>
                <Textarea
                  id={`${campo}-descripcion`}
                  rows={5}
                  value={borrador.descripcion.join('\n\n')}
                  onChange={(event) =>
                    cambiar({ descripcion: event.target.value.split(/\n{2,}/).map((parrafo) => parrafo.trim()) })
                  }
                />
                <FieldDescription>Una línea en blanco separa un párrafo del siguiente.</FieldDescription>
              </Field>

              <Field>
                <FieldLabel>Requisitos</FieldLabel>
                <FieldDescription>
                  Son la vara con la que se mide a cada persona: de aquí sale el «cumple 2 de {borrador.requisitos.length}»
                  de la ficha. Cambiarlos cambia el ajuste de quien ya está en el proceso.
                </FieldDescription>
                <ItemGroup className="gap-2">
                  {borrador.requisitos.map((requisito, indice) => (
                    <Item key={`${requisito}-${indice}`} variant="muted" size="sm">
                      <ItemContent className="min-w-0!">
                        <ItemTitle className="w-full truncate">{requisito}</ItemTitle>
                      </ItemContent>
                      <ItemActions>
                        <BotonIcono
                          size="icon-xs"
                          aria-label={`Quitar el requisito «${requisito}»`}
                          onClick={() =>
                            cambiar({ requisitos: borrador.requisitos.filter((_, otro) => otro !== indice) })
                          }
                        >
                          <HugeiconsIcon icon={Cancel01Icon} size={14} aria-hidden="true" />
                        </BotonIcono>
                      </ItemActions>
                    </Item>
                  ))}
                </ItemGroup>
                <div className="flex gap-2">
                  <Input
                    value={requisitoNuevo}
                    placeholder="Añadir un requisito"
                    aria-label="Añadir un requisito"
                    onChange={(event) => setRequisitoNuevo(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter' || !requisitoNuevo.trim()) return
                      event.preventDefault()
                      cambiar({ requisitos: [...borrador.requisitos, requisitoNuevo.trim()] })
                      setRequisitoNuevo('')
                    }}
                  />
                  <Button
                    variant="outline"
                    disabled={!requisitoNuevo.trim()}
                    onClick={() => {
                      cambiar({ requisitos: [...borrador.requisitos, requisitoNuevo.trim()] })
                      setRequisitoNuevo('')
                    }}
                  >
                    <HugeiconsIcon icon={Add01Icon} size={16} aria-hidden="true" />
                    Añadir
                  </Button>
                </div>
              </Field>

              <Field>
                <FieldLabel>Etiquetas</FieldLabel>
                <FieldDescription>Una vacante puede llevar varias y la lista de vacantes se filtra por ellas.</FieldDescription>
                <div className="flex flex-wrap items-center gap-2">
                  {borrador.etiquetas.map((etiqueta) => (
                    <Badge key={etiqueta} variant="secondary" className="gap-1 pr-1">
                      {etiqueta}
                      <BotonIcono
                        size="icon-xs"
                        aria-label={`Quitar la etiqueta ${etiqueta}`}
                        className="size-4!"
                        onClick={() =>
                          cambiar({ etiquetas: borrador.etiquetas.filter((otra) => otra !== etiqueta) })
                        }
                      >
                        <HugeiconsIcon icon={Cancel01Icon} size={12} aria-hidden="true" />
                      </BotonIcono>
                    </Badge>
                  ))}
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
                      <HugeiconsIcon icon={Add01Icon} size={16} aria-hidden="true" />
                      Etiqueta
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>Etiquetas en uso</DropdownMenuLabel>
                        {ETIQUETAS.filter((etiqueta) => !borrador.etiquetas.includes(etiqueta)).map((etiqueta) => (
                          <DropdownMenuItem
                            key={etiqueta}
                            onClick={() => cambiar({ etiquetas: [...borrador.etiquetas, etiqueta] })}
                          >
                            {etiqueta}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Field>
            </>
          ) : null}

          {/* ── Paso 2 · Etapas ── */}
          {paso === 2 ? (
            <>
              <Alert variant="info">
                <HugeiconsIcon icon={InformationCircleIcon} size={16} aria-hidden="true" />
                <AlertTitle>Estas etapas son solo de esta vacante</AlertTitle>
                <AlertDescription>
                  Una vacante de planta necesita examen médico y una de diseño un reto; no tiene sentido una sola
                  plantilla para todas. Lo que se cambie aquí no toca a las demás vacantes.
                </AlertDescription>
              </Alert>

              <Sortable
                value={borrador.etapas}
                onValueChange={(etapas) => cambiar({ etapas })}
                getItemValue={(etapa) => etapa.id}
                className="flex flex-col gap-2"
              >
                {borrador.etapas.map((etapa, indice) => {
                  const cuantos = enEtapaDe(vacante.id, etapa.id)
                  const fija = etapa.origen === 'plantilla'
                  return (
                    <SortableItem key={etapa.id} value={etapa.id}>
                      <Item variant="outline" size="sm" className="items-start!">
                        <SortableItemHandle aria-label={`Mover ${etapa.titulo}`} className="mt-0.5">
                          <HugeiconsIcon
                            icon={DragDropVerticalIcon}
                            size={16}
                            aria-hidden="true"
                            className="text-muted-foreground"
                          />
                        </SortableItemHandle>
                        <ItemContent className="min-w-0! gap-1!">
                          <ItemTitle className="w-full">
                            <span className="text-muted-foreground tabular-nums">{indice + 1}.</span>
                            <span className="min-w-0 flex-1 truncate">{etapa.titulo}</span>
                            {etapa.ia ? (
                              <EtiquetaIA size="xs" className="shrink-0">IA</EtiquetaIA>
                            ) : null}
                            {cuantos ? (
                              <Badge variant="secondary" className="shrink-0 tabular-nums">
                                {cuantos} {cuantos === 1 ? 'persona' : 'personas'}
                              </Badge>
                            ) : null}
                          </ItemTitle>
                          <ItemDescription className="w-full">{etapa.descripcion}</ItemDescription>
                        </ItemContent>
                        <ItemActions>
                          {/* Las cinco de plantilla se mueven pero no se quitan: cada candidato guarda su etapa
                              por ellas, así que quitarlas dejaría gente sin sitio donde estar. El candado lo dice
                              sin tener que abrir nada. */}
                          {fija ? (
                            <Badge variant="outline" className="shrink-0 gap-1">
                              <HugeiconsIcon icon={LockIcon} size={12} aria-hidden="true" />
                              Fija
                            </Badge>
                          ) : (
                            <BotonIcono
                              size="icon-xs"
                              aria-label={`Quitar la etapa ${etapa.titulo}`}
                              onClick={() => setQuitando(etapa)}
                            >
                              <HugeiconsIcon icon={Cancel01Icon} size={14} aria-hidden="true" />
                            </BotonIcono>
                          )}
                        </ItemActions>
                      </Item>
                    </SortableItem>
                  )
                })}
              </Sortable>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <Text as="p" variant="muted" size="xs" className="max-w-md">
                  Las etapas marcadas «Fija» vienen con el producto y no se pueden quitar, solo cambiar de orden.
                </Text>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="outline" disabled={!porAnadir.length} />}>
                    <HugeiconsIcon icon={Add01Icon} size={16} aria-hidden="true" />
                    Añadir etapa
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-88">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Etapas que se pueden añadir</DropdownMenuLabel>
                      {porAnadir.map((etapa) => (
                        <DropdownMenuItem
                          key={etapa.id}
                          className="items-start!"
                          onClick={() => cambiar({ etapas: [...borrador.etapas, { ...etapa, origen: 'propia' }] })}
                        >
                          <span className="flex flex-col gap-0.5">
                            <span className="flex items-center gap-1.5">
                              {etapa.titulo}
                              {etapa.ia ? (
                                <EtiquetaIA size="xs">IA</EtiquetaIA>
                              ) : null}
                            </span>
                            <span className="text-xs text-muted-foreground">{etapa.descripcion}</span>
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          ) : null}

          {/* ── Paso 3 · Visibilidad y equipo ── */}
          {paso === 3 ? (
            <>
              <Field>
                <FieldLabel>Estado</FieldLabel>
                <RadioGroup
                  value={borrador.estado}
                  onValueChange={(valor) => cambiar({ estado: valor as EstadoPublicacion })}
                  className="grid gap-3"
                >
                  {ESTADOS_PUBLICACION.map((estado) => (
                    <FieldLabel key={estado} htmlFor={`${campo}-estado-${estado}`}>
                      <Field orientation="horizontal">
                        <FieldContent>
                          <FieldTitle>{estado}</FieldTitle>
                          <FieldDescription>{ESTADO_EXPLICACION[estado]}</FieldDescription>
                        </FieldContent>
                        <RadioGroupItem value={estado} id={`${campo}-estado-${estado}`} />
                      </Field>
                    </FieldLabel>
                  ))}
                </RadioGroup>
              </Field>

              {/* El ojo tachado de la cabecera, aquí con todas sus letras. Solo tiene sentido si está publicada:
                  en borrador o cerrada no hay portal del que esconderla. */}
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>Visible en el portal de empleo</FieldTitle>
                  <FieldDescription>
                    {borrador.estado !== 'Publicada'
                      ? `En «${borrador.estado}» no sale en el portal pase lo que pase.`
                      : borrador.oculta
                        ? 'Ahora mismo está oculta del portal: la ve el equipo, pero nadie puede aplicar.'
                        : 'Cualquiera puede verla y aplicar desde el portal.'}
                  </FieldDescription>
                </FieldContent>
                <Switch
                  checked={borrador.estado === 'Publicada' && !borrador.oculta}
                  disabled={borrador.estado !== 'Publicada'}
                  onCheckedChange={(valor) => cambiar({ oculta: !valor })}
                  aria-label="Visible en el portal de empleo"
                />
              </Field>

              {borrador.estado === 'Cerrada' && enProceso ? (
                <Alert variant="warning">
                  <HugeiconsIcon icon={Alert02Icon} size={16} aria-hidden="true" />
                  <AlertTitle>
                    {enProceso} {enProceso === 1 ? 'persona sigue' : 'personas siguen'} en el proceso
                  </AlertTitle>
                  <AlertDescription>
                    Al cerrar dejan de entrar candidatos nuevos, pero quien ya está adentro no se mueve ni recibe
                    ningún correo. Hay que responderles a mano.
                  </AlertDescription>
                </Alert>
              ) : null}

              <Separator />

              <div className="flex flex-col gap-1">
                <Text as="div" weight="medium">
                  Equipo
                </Text>
                <Text as="div" variant="muted" size="sm">
                  Quién puede entrar a esta vacante y qué puede hacer.
                </Text>
              </div>
              <CompartirVacante
                titulo={borrador.titulo}
                equipo={borrador.equipo}
                onEquipo={(equipo) => cambiar({ equipo })}
              />
            </>
          ) : null}
        </div>
      </VentanaDeAccion>

      {/* Quitar una etapa: se dice cuánta gente hay que mover y a dónde va, antes de quitarla. */}
      <DialogoConfirmar
        abierto={quitando !== null}
        onAbiertoChange={(abierto) => (abierto ? undefined : setQuitando(null))}
        titulo={`¿Quitar «${quitando?.titulo ?? ''}» del proceso?`}
        descripcion={
          gente
            ? `Hay ${gente} ${gente === 1 ? 'persona' : 'personas'} en esta etapa. ${
                destino
                  ? `${gente === 1 ? 'Pasa' : 'Pasan'} a «${destino.titulo}», la etapa de antes.`
                  : 'No queda ninguna otra etapa a la que moverlas.'
              } No se les avisa nada.`
            : `Nadie está en esta etapa ahora mismo${
                enProceso
                  ? `, así que ${enProceso === 1 ? 'la persona que hay' : `las ${enProceso} personas que hay`} en el proceso no se ${enProceso === 1 ? 'mueve' : 'mueven'} de sitio.`
                  : '.'
              }`
        }
        cancelar="Dejarla"
        accion="Quitar la etapa"
        destructiva={Boolean(gente)}
        onConfirmar={() => quitando && quitarEtapa(quitando)}
      >
        <Text as="p" variant="muted" size="xs">
          La etapa se puede volver a añadir desde la biblioteca; la gente que se movió no vuelve sola.
        </Text>
      </DialogoConfirmar>

      {/* Salir con cambios sin guardar. */}
      <DialogoConfirmar
        abierto={preguntarSalida}
        onAbiertoChange={setPreguntarSalida}
        titulo={cuantosCambios === 1 ? 'Hay un cambio sin guardar' : `Hay ${cuantosCambios} cambios sin guardar`}
        descripcion="Si sales ahora, la vacante se queda como estaba antes de abrir el editor."
        cancelar="Seguir editando"
        accion="Salir sin guardar"
        destructiva
        onConfirmar={() => {
          setPreguntarSalida(false)
          onOpenChange(false)
        }}
      />
    </>
  )
}
