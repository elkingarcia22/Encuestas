import { useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  BrowserIcon,
  CircleLock01Icon,
  LogoutSquare01Icon,
  MarketingIcon,
  MoreHorizontalIcon,
  Note05Icon,
  Notification01Icon,
  Search01Icon,
} from '@hugeicons/core-free-icons'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  Avatar,
  AvatarFallback,
  AvatarGroup,
  Badge,
  Button,
  Checkbox,
  DrawerClose,
  Command,
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Field,
  FieldLabel,
  Frame,
  FrameHeader,
  Input,
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Heading,
  Progress,
  ProgressLabel,
  ProgressValue,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  Text,
  TrafficLight,
  cn,
  toast,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { DialogoConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { TarjetaContenido } from '@/shared/components/TarjetaContenido'
import { TarjetaSesion } from '@/modules/portal-colaborador/aprendizaje/zona-de-estudio/components/pestana-eventos'
import { PROVEEDOR_EVENTO, proximasSesiones } from '@/modules/portal-colaborador/aprendizaje/zona-de-estudio/components/datos'
import promoSeleccion from '@/shared/assets/promo-seleccion.jpg'

import { DrawerShell } from '../drawers/components/drawer-shell'
import { BotonIa } from '@/shared/components/BotonIa'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import { ReopenAgentButton } from '../agente-contextual/components/agent-kit'
import { AccountPopover, Gauge } from '@/shared/components/AccountPopover'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { ChangelogDialog } from '@/shared/components/Announcements'
import { ChatStatusDot } from '@/shared/components/ChatStatusDot'
import { CommandPalette } from '@/shared/components/CommandPalette'
import { InviteCard } from '@/shared/components/InviteCard'
import { NotificationsPopover } from '@/shared/components/NotificationsPopover'
import { NovedadesButton } from '@/shared/components/NovedadesButton'
import { ProfilePopover } from '@/shared/components/ProfilePopover'

// Ejemplos de la página Ajustes propios. Del lado de la librería, la pieza tal como viene; del lado de UBITS, la pieza
// real del marco importada (no una copia). Los que se abren llevan una nota para saber qué tocar.

export function ConNota({ nota, children }: { nota: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2">
      {children}
      <Text as="span" variant="muted" size="xs" className="text-center">
        {nota}
      </Text>
    </div>
  )
}

// ── Piezas del marco en vivo (antes eran capturas; follow up del 17-sep: una imagen no cambia con el tema) ──
export function NovedadesUbits() {
  const [abierto, setAbierto] = useState(false)
  return (
    <ConNota nota="Es el botón real del encabezado: ábrelo.">
      <NovedadesButton onClick={() => setAbierto(true)} />
      <ChangelogDialog open={abierto} onOpenChange={setAbierto} />
    </ConNota>
  )
}

export function EmpresaUbits({ nota }: { nota: string }) {
  return (
    <ConNota nota={nota}>
      <div className="w-64">
        <AccountPopover cliente />
      </div>
    </ConNota>
  )
}

// Los dos anillos reales del menú de empresa, a la vista sin abrir nada (7-oct: en la ficha solo se veía el botón).
export function ConsumoUbits() {
  return (
    <div className="flex w-full max-w-64 flex-col rounded-xl border bg-popover p-1 shadow-xs">
      <Gauge label="Licencias" value={[470, 500]} />
      <Gauge label="Créditos de IA" value={[5600, 10000]} ai />
    </div>
  )
}

export function PerfilUbits() {
  return (
    <ConNota nota="Pasa el cursor o ábrelo para ver el anillo.">
      <ProfilePopover />
    </ConNota>
  )
}

export function InvitacionUbits() {
  return (
    <div className="w-64">
      <InviteCard onClose={() => undefined} />
    </div>
  )
}

// Avisos con el icono de su tipo en su color (Toaster.tsx). Se lanzan al toaster del marco, el único del producto.
export function AvisosUbits() {
  const tipos = [
    { tipo: 'success', etiqueta: 'Éxito', titulo: 'Plan publicado' },
    { tipo: 'info', etiqueta: 'Información', titulo: 'Cambios guardados como borrador' },
    { tipo: 'warning', etiqueta: 'Advertencia', titulo: 'Quedan 3 licencias libres' },
    { tipo: 'error', etiqueta: 'Error', titulo: 'No se pudo guardar' },
  ] as const
  return (
    <ConNota nota="Lánzalos: salen arriba y centrados.">
      <div className="flex flex-wrap justify-center gap-2">
        {tipos.map((item) => (
          <Button key={item.tipo} variant="outline" size="sm" onClick={() => toast.add({ type: item.tipo, title: item.titulo })}>
            {item.etiqueta}
          </Button>
        ))}
      </div>
    </ConNota>
  )
}

// El drawer del producto (DrawerShell): el único panel lateral desde el 18-sep.
export function DrawerUbits() {
  const [abierto, setAbierto] = useState(false)
  return (
    <ConNota nota="Ábrelo: es el mismo que usan las pantallas.">
      <Button variant="outline" onClick={() => setAbierto(true)}>
        Abrir el drawer
      </Button>
      <DrawerShell
        open={abierto}
        onOpenChange={setAbierto}
        title="Historial de cambios"
        description="Cierre del plan de onboarding"
        footer={<DrawerClose render={<Button variant="outline" />}>Cerrar</DrawerClose>}
      >
        <Text as="p" variant="muted" size="sm">
          Cabecera con título, bajada y cerrar; cuerpo con scroll; pie con las acciones.
        </Text>
      </DrawerShell>
    </ConNota>
  )
}

// ── Fila abierta de la bandeja ──
// La fila de la bandeja de Exploración 1 (`Fila` y `FILA_ABIERTA` en exploraciones/uno/vacante.tsx) con sus clases
// copiadas. Es la misma fila en los dos lados; solo cambia si lleva el teñido forzado. Si cambia allá, se cambia aquí.
function FilaBandeja({ tenida }: { tenida: boolean }) {
  const [marcada, setMarcada] = useState(false)
  return (
    <Item size="sm" aria-current className="w-80 max-w-full items-start! rounded-lg! bg-primary/7">
      <ItemMedia className="mt-3">
        <Checkbox
          checked={marcada}
          onCheckedChange={(valor) => setMarcada(valor === true)}
          aria-label={`Elegir a Laura Méndez (${tenida ? 'UBITS' : 'librería'})`}
          className={cn(tenida && !marcada && 'border-primary/40! bg-transparent!')}
        />
      </ItemMedia>
      <ItemMedia>
        <Avatar>
          <AvatarFallback className={cn(tenida && 'bg-primary/8! text-primary! dark:text-foreground!')}>LM</AvatarFallback>
        </Avatar>
      </ItemMedia>
      <ItemContent className="min-w-0! gap-0.5!">
        <ItemTitle className="w-full!">
          <span className="min-w-0 flex-1 truncate text-primary dark:text-foreground">Laura Méndez</span>
          <Badge variant="warning-light" size="xs" className={cn('shrink-0 tabular-nums', tenida && 'bg-transparent!')}>
            3/5
          </Badge>
        </ItemTitle>
        <ItemDescription className="w-full!">
          <span className="truncate">Analista de datos · Rappi</span>
        </ItemDescription>
        <ItemDescription className="w-full! pt-0.5">
          <span className="flex h-5 items-center gap-1.5 truncate text-xs">
            <Badge variant="warning-light" size="xs" className={cn('shrink-0', tenida && 'bg-transparent!')}>
              Espera
            </Badge>
            <span className="truncate">Confirmar la entrevista</span>
          </span>
        </ItemDescription>
      </ItemContent>
    </Item>
  )
}

export function FilaAbiertaLibreria() {
  return (
    <ConNota nota="Como vienen: casilla, cara y etiquetas quedan como parches.">
      <FilaBandeja tenida={false} />
    </ConNota>
  )
}

export function FilaAbiertaUbits() {
  return (
    <ConNota nota="Todo teñido del mismo azul. Márcala: la casilla marcada es la de la librería.">
      <FilaBandeja tenida />
    </ConNota>
  )
}

// ── Diálogos ──
export function DialogoLibreria() {
  const [abierto, setAbierto] = useState(false)
  return (
    <ConNota nota="Ábrelo: relleno de 24 px y botones al pie sin franja.">
      <Button variant="outline" onClick={() => setAbierto(true)}>
        Abrir diálogo de la librería
      </Button>
      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicar vacante</DialogTitle>
            <DialogDescription>Queda en borrador hasta que la publiques.</DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="demo-vacante-lib">Nombre de la vacante</FieldLabel>
            <Input id="demo-vacante-lib" placeholder="Analista de operaciones" />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setAbierto(false)}>Duplicar vacante</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConNota>
  )
}

export function DialogosUbits() {
  const [accion, setAccion] = useState(false)
  const [novedades, setNovedades] = useState(false)
  return (
    <ConNota nota="Ábrelos: franja gris al pie, anchos propios y la «X» circular.">
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="outline" onClick={() => setAccion(true)}>
          Diálogo de acción
        </Button>
        <Button variant="outline" onClick={() => setNovedades(true)}>
          Novedades
        </Button>
      </div>
      <ActionDialog
        open={accion}
        onOpenChange={setAccion}
        title="Duplicar vacante"
        sub="Queda en borrador hasta que la publiques."
        note="Selección · Meta Colombia"
        confirmLabel="Duplicar vacante"
      >
        <Field>
          <FieldLabel htmlFor="demo-vacante-ubits">Nombre de la vacante</FieldLabel>
          <Input id="demo-vacante-ubits" placeholder="Analista de operaciones" />
        </Field>
      </ActionDialog>
      <ChangelogDialog open={novedades} onOpenChange={setNovedades} />
    </ConNota>
  )
}

// ── Ventana de confirmar ──
// La de la librería en su tamaño normal: en pantallas anchas pone el icono a la izquierda del título.
export function ConfirmarLibreria() {
  const [abierto, setAbierto] = useState(false)
  return (
    <ConNota nota="Ábrela: en pantallas anchas el icono va a la izquierda y el texto alineado a la izquierda.">
      <Button variant="outline" onClick={() => setAbierto(true)}>
        Abrir la de la librería
      </Button>
      <AlertDialog open={abierto} onOpenChange={setAbierto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <HugeiconsIcon icon={LogoutSquare01Icon} aria-hidden="true" />
            </AlertDialogMedia>
            <AlertDialogTitle>¿Salir sin guardar los cambios?</AlertDialogTitle>
            <AlertDialogDescription>Si sales ahora, se pierde lo que cambiaste.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Seguir editando</AlertDialogCancel>
            <AlertDialogAction onClick={() => setAbierto(false)}>Guardar y salir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConNota>
  )
}

// La del sistema (DialogoConfirmar): el icono siempre arriba y todo alineado a la izquierda, en los dos tamaños.
export function ConfirmarUbits() {
  const [abierto, setAbierto] = useState(false)
  return (
    <ConNota nota="Ábrela: el icono arriba del título y todo alineado a la izquierda, igual en la ventana chica y en la normal.">
      <Button variant="outline" onClick={() => setAbierto(true)}>
        Abrir la de UBITS
      </Button>
      <DialogoConfirmar
        abierto={abierto}
        onAbiertoChange={setAbierto}
        icono={LogoutSquare01Icon}
        titulo="¿Salir sin guardar los cambios?"
        descripcion="Si sales ahora, se pierde lo que cambiaste."
        cancelar="Seguir editando"
        accion="Guardar y salir"
        onConfirmar={() => setAbierto(false)}
      />
    </ConNota>
  )
}

// ── Filas de la barra y gris del hover ──
const FILAS = [
  { titulo: 'Tareas', icono: Note05Icon, activa: true },
  { titulo: 'Avisos internos', icono: MarketingIcon, activa: false },
]

export function FilasLibreria({ nota }: { nota: string }) {
  return (
    <ConNota nota={nota}>
      <SidebarMenu className="w-56">
        {FILAS.map((fila) => (
          <SidebarMenuItem key={fila.titulo}>
            <SidebarMenuButton isActive={fila.activa}>
              <HugeiconsIcon icon={fila.icono} aria-hidden="true" />
              {fila.titulo}
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </ConNota>
  )
}

// ── Panel de notificaciones ──
export function NotificacionesLibreria() {
  return (
    <ConNota nota="Ábrelo: popover de la librería con el mismo contenido.">
      <Popover>
        <PopoverTrigger render={<Button variant="outline" size="icon-sm" aria-label="Notificaciones (librería)" />}>
          <HugeiconsIcon icon={Notification01Icon} aria-hidden="true" />
        </PopoverTrigger>
        <PopoverContent align="center">
          <PopoverHeader>
            <PopoverTitle>Notificaciones</PopoverTitle>
            <PopoverDescription>3 sin leer</PopoverDescription>
          </PopoverHeader>
          <ItemGroup>
            <Item size="sm">
              <ItemMedia variant="icon">
                <HugeiconsIcon icon={MarketingIcon} aria-hidden="true" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Aviso publicado</ItemTitle>
                <ItemDescription>312 personas recibieron la política de vacaciones.</ItemDescription>
              </ItemContent>
            </Item>
          </ItemGroup>
        </PopoverContent>
      </Popover>
    </ConNota>
  )
}

export function NotificacionesUbits() {
  return (
    <ConNota nota="Ábrelo: es el panel real del encabezado.">
      <NotificationsPopover onOpenProcesses={() => undefined} onOpenChangelog={() => undefined} />
    </ConNota>
  )
}

// ── Menús (fondo y «Cerrar sesión») ──
export function MenuLibreria({ nota }: { nota: string }) {
  return (
    <ConNota nota={nota}>
      <DropdownMenu>
        <DropdownMenuTrigger render={<BotonIcono size="icon" aria-label="Perfil (librería)" />}>
          <Avatar>
            <AvatarFallback>CV</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>carolina.vargas@meta.com</DropdownMenuLabel>
            <DropdownMenuItem>
              <HugeiconsIcon icon={BrowserIcon} aria-hidden="true" />
              Portal colaborador
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HugeiconsIcon icon={CircleLock01Icon} aria-hidden="true" />
              Cambiar contraseña
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">
            <HugeiconsIcon icon={LogoutSquare01Icon} aria-hidden="true" />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ConNota>
  )
}

export function MenuUbits({ nota }: { nota: string }) {
  return (
    <ConNota nota={nota}>
      <ProfilePopover />
    </ConNota>
  )
}

// ── Buscador ──
export function BuscadorLibreria() {
  const [abierto, setAbierto] = useState(false)
  return (
    <ConNota nota="Ábrelo: la paleta de comandos de la librería.">
      <Button variant="outline" onClick={() => setAbierto(true)}>
        <HugeiconsIcon icon={Search01Icon} aria-hidden="true" data-icon="inline-start" />
        Buscar
      </Button>
      <CommandDialog open={abierto} onOpenChange={setAbierto}>
        <Command>
          <CommandInput placeholder="Buscar o preguntar" />
          <CommandList>
            <CommandGroup heading="Ir a">
              <CommandItem>Selección › Vacantes</CommandItem>
              <CommandItem>Selección › Plantillas de selección</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </ConNota>
  )
}

export function BuscadorUbits() {
  const [abierto, setAbierto] = useState(false)
  return (
    <ConNota nota="Ábrelo: es el buscador real (⌘K).">
      <Button variant="outline" onClick={() => setAbierto(true)}>
        <HugeiconsIcon icon={Search01Icon} aria-hidden="true" data-icon="inline-start" />
        Abrir el buscador
      </Button>
      <CommandPalette open={abierto} onOpenChange={setAbierto} />
    </ConNota>
  )
}

// ── Botón de IA ──
// El primario de IA real, el único (BotonIa, 5-oct): aquí había una copia del degradado armada a mano.
export function BotonIaUbits() {
  return <BotonIa>Nueva conversación</BotonIa>
}

// La familia de IA completa: primario (degradado), secundario (contorno con el orbe) y solo icono. Los tres en pastilla.
export function BotonesIaUbits() {
  return (
    <ConNota nota="Los tres en pastilla: la pastilla es la marca de la IA.">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <BotonIaUbits />
        <BotonIaSecundario>Crear con IA</BotonIaSecundario>
        <ReopenAgentButton compact onClick={() => undefined} />
      </div>
    </ConNota>
  )
}

// ── Avatares ──
export function AvataresLibreria() {
  return (
    <AvatarGroup>
      <Avatar size="lg">
        <AvatarFallback>LM</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback>JR</AvatarFallback>
      </Avatar>
    </AvatarGroup>
  )
}

// ── Anillos ──
export function ConsumoLibreria() {
  return (
    <div className="flex w-full max-w-64 flex-col gap-4">
      <Progress value={94}>
        <ProgressLabel>Licencias</ProgressLabel>
        <ProgressValue className="ms-auto" />
      </Progress>
      <Progress value={56}>
        <ProgressLabel>Créditos de IA</ProgressLabel>
        <ProgressValue className="ms-auto" />
      </Progress>
    </div>
  )
}

// ── Estado de las conversaciones ──
const CONVERSACIONES = [
  { titulo: 'Resumen encuesta de clima', estado: 'read', etiqueta: 'Leída' },
  { titulo: 'Evaluaciones vencidas en Ventas', estado: 'unread', etiqueta: 'Sin leer' },
  { titulo: 'Política de vacaciones', estado: 'thinking', etiqueta: 'Razonando' },
] as const

export function EstadosLibreria() {
  return (
    <TrafficLight
      data={{
        label: 'Estado de las conversaciones',
        items: [
          { label: 'Leída', value: '', color: 'var(--muted-foreground)' },
          { label: 'Sin leer', value: '', color: 'var(--primary)' },
          { label: 'Razonando', value: '', color: 'var(--info)' },
        ],
      }}
    />
  )
}

export function EstadosUbits() {
  return (
    <div className="flex flex-col gap-2.5">
      {CONVERSACIONES.map((conversacion) => (
        <div key={conversacion.titulo} className="flex items-center gap-2">
          <ChatStatusDot path={`/design-system/ajustes/${conversacion.estado}`} status={conversacion.estado} />
          <Text as="span" size="sm">
            {conversacion.titulo}
          </Text>
          <Text as="span" variant="muted" size="xs">
            {conversacion.etiqueta}
          </Text>
        </div>
      ))}
    </div>
  )
}

// ── Tarjeta de contenido ──

// La tarjeta con imagen como la arma la librería: la imagen ocupa el ancho completo y toca los bordes.
export function TarjetaImagenLibreria() {
  return (
    <ConNota nota="La imagen llega hasta el borde y no hay sitio fijo para el estado ni para la ficha técnica.">
      <Card className="w-64 gap-0! overflow-hidden py-0!">
        <img src={promoSeleccion} alt="" className="aspect-video w-full object-cover" />
        <CardContent className="flex flex-col gap-1 p-4">
          {/* El mismo título largo que en la de UBITS: si cada una lleva el suyo, la comparación no vale. */}
          <Heading as="h3" level={6}>
            Protocolos de supervivencia y seguridad ante sismos
          </Heading>
          <Text size="sm" className="text-muted-foreground">
            Curso · 8 páginas
          </Text>
        </CardContent>
      </Card>
    </ConNota>
  )
}

// La misma tarjeta con la composición del catálogo: imagen con aire, estado encima y ficha técnica debajo.
//
// No es una tarjeta, son cinco: lo que cambia de una a otra no es el estilo sino **qué sabe quien mira**. En LMS
// Creator importa si está publicado; en el catálogo del colaborador eso sobra y lo que importa es si ya lo empezó. Por
// eso se enseñan las cinco juntas: así se ve que es el mismo componente con distintas props, no cinco piezas
// (Dave, 2-oct).
const VERSIONES_TARJETA = [
  {
    nombre: 'LMS Creator',
    props: { visibilidad: 'Borrador', visibilidadColor: 'secondary' as const, origen: 'Antiguo LMS' },
  },
  { nombre: 'Catálogo del colaborador', props: {} },
  { nombre: 'En progreso', props: { progreso: 45, estado: 'en-progreso' as const } },
  { nombre: 'Completado', props: { progreso: 100, estado: 'completado' as const } },
  { nombre: 'Historial', props: { progreso: 100, estado: 'completado' as const, onDescargarCertificado: () => undefined } },
]

// La misma tarjeta **acostada** (`orientacion="horizontal"`), para listas: el índice de una ruta —donde lo que hay
// dentro son contenidos, no páginas— y el catálogo en lista. No es otra pieza: son los mismos datos puestos de otro
// modo, y por eso la portada va en 4:3, el título en un solo renglón y la ficha técnica sin envolver.
//
// Las cinco son el índice de una ruta, pero visto desde dos sitios, y por eso enseñan cosas distintas:
//
//  · **El colaborador** ve cómo va: sin iniciar, en progreso o completado. No ve la visibilidad, que no es asunto suyo.
//  · **Quien la arma, en Creator**, ve a quién le llega cada escalón —público o privado— y no un avance que todavía
//    no existe.
//
// La primera sirve además para el catálogo en lista, que es la misma ficha sin estado. Ninguna lleva checkbox:
// elegir contenidos para una ruta se hace en una **tabla**, no con tarjetas, así que la tarjeta solo aparece cuando
// el contenido **ya está** dentro (Dave, 2-oct).
const ACOSTADAS_TARJETA = [
  // Las tres del colaborador: la misma ruta, vista por quien la va a hacer. Lo que cambia es cómo va.
  { nombre: 'En una ruta · colaborador · sin iniciar', props: {} },
  { nombre: 'En una ruta · colaborador · en progreso', props: { progreso: 45, estado: 'en-progreso' as const } },
  { nombre: 'En una ruta · colaborador · completado', props: { progreso: 100, estado: 'completado' as const } },
  // Las dos de Creator: la misma ruta, vista por quien la arma. Aquí no hay avance que enseñar —todavía no la hace
  // nadie— y lo que importa es **a quién le llega** cada escalón: si uno es privado, hay que verlo al armarla.
  {
    nombre: 'En una ruta · Creator · contenido público',
    props: { visibilidad: 'Publicado', visibilidadColor: 'success-light' as const },
  },
  {
    nombre: 'En una ruta · Creator · contenido privado',
    props: { visibilidad: 'Privado', visibilidadColor: 'info-light' as const },
  },
]

/**
 * Dos sesiones de verdad de «Mis eventos»: una **en curso** y una **futura**. Son las dos formas que tiene esa
 * tarjeta, y lo que cambia es la esquina derecha de la portada: en vivo lleva la insignia con el punto, y la que
 * todavía no empieza lleva el botón de añadir al calendario, que es lo único que de verdad se puede hacer con ella
 * (Dave, 2-oct).
 */
/** La misma foto que enseña la tarjeta de evento, para que las dos fichas se comparen con el mismo material. */
const FOTO_EJEMPLO = (() => {
  const { mis, publicos } = proximasSesiones()
  return [...mis, ...publicos].find((s) => s.imagen)?.imagen
})()

const SESIONES_EJEMPLO = (() => {
  const { mis, publicos } = proximasSesiones()
  const todas = [...mis, ...publicos]
  return [
    { nombre: 'Eventos · en curso', sesion: todas.find((s) => s.enVivo) },
    { nombre: 'Eventos · futuro', sesion: todas.find((s) => !s.enVivo) },
  ].filter((x) => x.sesion)
})()

export function TarjetaContenidoUbits() {
  return (
    <ConNota nota="Mismo Card, Badge, Avatar y Progress de la librería; lo propio es el orden de los campos y los estados.">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-4">
            {/* La de Eventos (TarjetaSesion) es esta misma tarjeta con la fecha y «En vivo» en las esquinas de la
              portada: desde el 2-oct ya no es una copia, así que un cambio aquí le llega sola (Dave, 2-oct). */}
          {SESIONES_EJEMPLO.map((x) => (
            <div key={x.nombre} className="flex w-56 flex-col gap-2">
              <Text as="span" size="xs" variant="muted">
                {x.nombre}
              </Text>
              <TarjetaSesion sesion={x.sesion!} />
            </div>
          ))}
          {VERSIONES_TARJETA.map((v) => (
            <div key={v.nombre} className="flex w-56 flex-col gap-2">
              <Text as="span" size="xs" variant="muted">
                {v.nombre}
              </Text>
              {/* Un título largo a propósito: la tarjeta corta a dos renglones y reserva ese alto siempre, y con
                  «Onboarding comercial Q3» eso no se veía (Dave, 2-oct). */}
              {/* Foto y logo de verdad, los mismos que usa el catálogo: con la imagen de relleno y las iniciales del
                  proveedor no se veía ni cómo se lee una insignia sobre una foto ni cómo queda la marca en su baldosa,
                  que son dos de las cosas que esta ficha documenta (Dave, 2-oct). */}
              <TarjetaContenido
                titulo="Protocolos de supervivencia y seguridad ante sismos"
                imagen={FOTO_EJEMPLO}
                tipo="Curso"
                proveedor={PROVEEDOR_EVENTO.nombre}
                logoProveedor={PROVEEDOR_EVENTO.logo}
                competencia="Productividad"
                nivel="Básico"
                duracion="1 h"
                idioma="Español"
                {...v.props}
              />
              </div>
            ))}
        </div>

        {/* Acostada, en su propio bloque porque necesita el ancho entero: en una fila estrecha la ficha técnica se
            corta, y que no se corte es justo lo que documenta. */}
        <div className="flex flex-col gap-3">
          <Text as="span" size="xs" variant="muted">
            Acostada, para listas: el índice de una ruta —visto por el colaborador y por quien la arma— y el catálogo
            en lista
          </Text>
          {ACOSTADAS_TARJETA.map((v) => (
            <div key={v.nombre} className="flex flex-col gap-1.5">
              <Text as="span" size="xs" variant="muted">
                {v.nombre}
              </Text>
              <TarjetaContenido
                titulo="Protocolos de supervivencia y seguridad ante sismos"
                imagen={FOTO_EJEMPLO}
                tipo="Curso"
                nivel="Básico"
                duracion="1 h"
                idioma="Español"
                orientacion="horizontal"
                {...v.props}
              />
            </div>
          ))}
        </div>
      </div>
    </ConNota>
  )
}

// Campos de 40px: los dos ejemplos son el mismo Input de la librería. El de la izquierda se fuerza a 36px con `h-9!`
// (la única manera de enseñar el alto original, porque el del proyecto ya es global) y el de la derecha es el real.
export function CamposLibreria() {
  return (
    <ConNota nota="36 px: el alto que trae la librería.">
      <Input className="h-9! w-56" defaultValue="Analista de datos" readOnly aria-label="Campo de la librería" />
    </ConNota>
  )
}

export function CamposUbits() {
  return (
    <ConNota nota="40 px: el alto del playground. Es el campo real, sin forzar.">
      <Input className="w-56" defaultValue="Analista de datos" readOnly aria-label="Campo de UBITS" />
    </ConNota>
  )
}

// Los dos de abajo se muestran sobre el gris de un marco, que es donde fallaba lo de la librería. Del lado de la
// librería se le devuelve a mano lo que trae (con `!`, para ganarle a la regla del tema); del lado de UBITS, la pieza
// tal cual, sin nada encima.
function SobreGris({ children }: { children: ReactNode }) {
  return (
    <Frame className="w-64">
      <FrameHeader className="flex flex-row items-center gap-2">{children}</FrameHeader>
    </Frame>
  )
}

export function HoverSinBordeLibreria() {
  return (
    <ConNota nota="Pasa el cursor: el gris opaco de la librería se confunde con el fondo.">
      <SobreGris>
        <Button variant="ghost" size="icon" className="rounded-full! hover:bg-muted! dark:hover:bg-muted/50!" aria-label="Más acciones (librería)">
          <HugeiconsIcon icon={MoreHorizontalIcon} size={18} aria-hidden="true" />
        </Button>
        <Button variant="ghost" className="hover:bg-muted! dark:hover:bg-muted/50!">
          Expandir
        </Button>
      </SobreGris>
    </ConNota>
  )
}

export function HoverSinBordeUbits() {
  return (
    <ConNota nota="Pasa el cursor: un velo del color del texto, que se nota sobre cualquier fondo.">
      <SobreGris>
        <BotonIcono size="icon" aria-label="Más acciones">
          <HugeiconsIcon icon={MoreHorizontalIcon} size={18} aria-hidden="true" />
        </BotonIcono>
        <Button variant="ghost">Expandir</Button>
      </SobreGris>
    </ConNota>
  )
}

export function CasillaLibreria() {
  return (
    <ConNota nota="Transparente y con el borde de los campos: sobre gris casi no se ve.">
      <SobreGris>
        <Field orientation="horizontal" className="w-auto! items-center! gap-2!">
          <Checkbox id="casilla-libreria" className="border-input! bg-transparent! dark:bg-input/30!" />
          <FieldLabel htmlFor="casilla-libreria" className="font-normal!">
            Tengo la autorización
          </FieldLabel>
        </Field>
      </SobreGris>
    </ConNota>
  )
}

export function CasillaUbits() {
  return (
    <ConNota nota="Con el fondo de la página y un borde más oscuro. Es la casilla real, sin forzar.">
      <SobreGris>
        <Field orientation="horizontal" className="w-auto! items-center! gap-2!">
          <Checkbox id="casilla-ubits" />
          <FieldLabel htmlFor="casilla-ubits" className="font-normal!">
            Tengo la autorización
          </FieldLabel>
        </Field>
      </SobreGris>
    </ConNota>
  )
}
