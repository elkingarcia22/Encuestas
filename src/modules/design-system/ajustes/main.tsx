import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon, Home02Icon, Moon02Icon, MoreHorizontalIcon, PartyIcon, Sun03Icon } from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Heading,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
  ToggleGroup,
  ToggleGroupItem,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'

import { CloseButton } from '@/shared/components/CloseButton'
import { Badge as BadgeLegible } from '@/shared/components/Badge'
import { ThemeSwitch } from '@/shared/components/ThemeSwitch'
import {
  AvataresLibreria,
  BotonesIaUbits,
  BuscadorLibreria,
  BuscadorUbits,
  EmpresaUbits,
  ConfirmarLibreria,
  ConfirmarUbits,
  ConsumoLibreria,
  ConsumoUbits,
  DialogoLibreria,
  DialogosUbits,
  EstadosLibreria,
  EstadosUbits,
  FilaAbiertaLibreria,
  FilaAbiertaUbits,
  FilasLibreria,
  AvisosUbits,
  CamposLibreria,
  CamposUbits,
  CasillaLibreria,
  CasillaUbits,
  HoverSinBordeLibreria,
  HoverSinBordeUbits,
  DrawerUbits,
  InvitacionUbits,
  MenuLibreria,
  MenuUbits,
  NotificacionesLibreria,
  NotificacionesUbits,
  NovedadesUbits,
  PerfilUbits,
  TarjetaContenidoUbits,
  TarjetaImagenLibreria,
} from './demos'
import { AbrirCrearContenido, CargaLibreria, CargaUbits, EdicionLibreria, EdicionUbits, GuardadoLibreria, GuardadoUbits, MarcoLibreria, MarcoUbits, TextoLibreria, TextoUbits, TokensLibreria, TokensUbits } from './demos-lms'
import { Reglas, type Regla } from '../patrones/piezas'
import { BarraEnVivo } from '../barra-lateral/components/barra-en-vivo'
import { AJUSTES_VACANTES } from './vacantes'
import { AJUSTES_ENCUESTAS } from './encuestas'
import { FICHAS_MARCO_DATOS } from './fichas-marco-datos'
import { FICHAS_ESTADOS_METRICAS } from './fichas-estados-metricas'
import { FICHAS_IA } from './fichas-ia'
import { FICHAS_LISTAS } from './fichas-listas'
import { FICHAS_FORMULARIOS } from './fichas-formularios'
import { FICHAS_CELEBRACION } from './fichas-celebracion'
import { AJUSTES_ACCESO } from './acceso'
import { ProposalCard } from '../agente-contextual/components/agent-kit'

// Ajustes propios: cada pieza del marco que todavía se ve distinta a como la define la librería, con el porqué, dónde
// vive y cuándo usarla. Pedido de Carlos en el follow-up del 16-sep: «lo que forzamos, que quede documentado para
// tomar decisiones». La lista sale del escaneo de la rama después de aplicar la revisión ReUI; si alguien fuerza algo
// nuevo, se agrega aquí antes de entregarlo.

type Estado = 'variante' | 'pedido' | 'decidir'

const ESTADO: Record<Estado, { etiqueta: string; badge: 'success-light' | 'info-light' | 'warning-light'; ayuda: string }> = {
  variante: { etiqueta: 'Variante UBITS', badge: 'success-light', ayuda: 'Se queda: está documentada y tiene reglas de uso.' },
  pedido: { etiqueta: 'Pedido a la librería', badge: 'info-light', ayuda: 'Se mantiene mientras la librería lo resuelve.' },
  decidir: { etiqueta: 'Por decidir', badge: 'warning-light', ayuda: 'Falta decidir si se queda o vuelve a la librería.' },
}

// De qué está hecho: los componentes de ReUI (que la librería trae vendorizados) con los que se arma la
// pieza. `slug` es su ficha en reui.io/components; las piezas hechas a mano llevan la lista vacía.
type Pieza = { nombre: string; slug: string }

export type Ajuste = {
  id: string
  titulo: string
  estado: Estado
  resumen: string
  piezas: Pieza[]
  hechoAMano?: string
  libreria: ReactNode
  ubits: ReactNode
  cambia: string[]
  porque: string
  donde: string[]
  usar: string
  evitar: string
}

// Exportada para las fichas de Componentes (7-oct): cada ficha lee de aquí qué cambió, por qué, cuándo usarla y
// dónde, así la ficha y Ajustes propios no se desincronizan.
export const AJUSTES_MARCO: Ajuste[] = [
  {
    id: 'novedades',
    titulo: 'Botón de novedades',
    estado: 'variante',
    resumen: 'El único botón de la barra superior con color: avisa que hay algo nuevo en el producto.',
    piezas: [{ nombre: 'Button', slug: 'button' }],
    libreria: (
      <Button variant="outline" size="sm">
        <HugeiconsIcon icon={PartyIcon} aria-hidden="true" data-icon="inline-start" />
        Novedades
      </Button>
    ),
    ubits: <NovedadesUbits />,
    cambia: ['Fondo azul al 10 % y borde azul al 28 %', 'Texto e icono en azul', 'Al pasar el cursor, azul al 15 %'],
    porque: 'Con el contorno gris se perdía entre los botones de icono; en primario competía con las acciones de la pantalla.',
    donde: ['Barra superior (AppHeader)'],
    usar: 'Anuncios del producto en la barra superior: novedades de versión.',
    evitar: 'Acciones de una pantalla. Para eso están primario, secundario y terciario.',
  },
  {
    id: 'cerrar',
    titulo: 'Botón de cerrar',
    estado: 'variante',
    resumen: 'Una sola «X» para paneles, tarjetas, avisos, formularios y diálogos.',
    piezas: [{ nombre: 'Button', slug: 'button' }],
    hechoAMano: 'El círculo con filo y sombra es un envoltorio propio (CloseButton) sobre el Button.',
    libreria: (
      <BotonIcono aria-label="Cerrar (librería)">
        <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" />
      </BotonIcono>
    ),
    ubits: <CloseButton label="Cerrar (UBITS)" onClick={() => undefined} />,
    cambia: ['Círculo de 32 px (nunca ovalado)', 'Fondo claro con filo y sombra mínima', 'Legible sobre fotos e ilustraciones'],
    porque: 'La «X» fantasma de la librería desaparecía sobre imágenes y cada pantalla la resolvía distinto.',
    donde: ['CloseButton (compartido): diálogos, avisos, tarjeta de invitación, drawers'],
    usar: 'Cerrar cualquier superficie que se superpone o se puede descartar.',
    evitar: 'Borrar datos: eso es una acción con confirmación, no un cierre.',
  },
  {
    id: 'empresa',
    titulo: 'Tarjeta de la empresa',
    estado: 'variante',
    resumen: 'El botón de arriba de la barra lateral: logo, nombre y el menú de empresa.',
    piezas: [{ nombre: 'Button', slug: 'button' }, { nombre: 'Avatar', slug: 'avatar' }, { nombre: 'DropdownMenu', slug: 'dropdown-menu' }],
    libreria: (
      <Button variant="outline" size="lg">
        <Avatar size="sm">
          <AvatarFallback>MC</AvatarFallback>
        </Avatar>
        Meta Colombia
      </Button>
    ),
    ubits: <EmpresaUbits nota="Es la tarjeta real de la barra lateral: ábrela." />,
    cambia: ['Logo en baldosa cuadrada con esquinas de la escala del tema', 'Sombra mínima', 'Relleno lateral ajustado al logo'],
    porque: 'El avatar redondo de la librería deforma los logos de las empresas; la tarjeta se lee como cuenta, no como botón.',
    donde: ['Barra lateral y riel (AccountPopover)'],
    usar: 'Mostrar y cambiar la empresa activa.',
    evitar: 'Otras listas de empresas o personas: ahí va Avatar normal.',
  },
  {
    id: 'espacio',
    titulo: 'Selector Workspace | Orbit',
    estado: 'variante',
    resumen: 'Cambia entre el producto y Orbit (en el design system, entre el sistema y el de la IA).',
    piezas: [{ nombre: 'Tabs', slug: 'tabs' }, { nombre: 'Sidebar', slug: 'sidebar' }],
    libreria: (
      <Tabs defaultValue="w">
        <TabsList>
          <TabsTrigger value="w">Workspace</TabsTrigger>
          <TabsTrigger value="s">Orbit</TabsTrigger>
        </TabsList>
      </Tabs>
    ),
    ubits: <BarraEnVivo id="workspace" alto="h-32" />,
    cambia: ['Bandeja de 40 px con filo', 'Opción activa en blanco con sombra mínima', 'Orbe de la IA junto a Orbit'],
    porque: 'Es el cambio de espacio más importante de la barra: necesita más presencia que unas pestañas de página.',
    donde: ['Barra lateral (AppSidebar) y riel (SidebarRail, en vertical)'],
    usar: 'Solo para cambiar de espacio, arriba de la barra lateral.',
    evitar: 'Pestañas dentro de una página: esas van con Tabs de la librería.',
  },
  {
    id: 'filas',
    titulo: 'Filas de la barra lateral',
    estado: 'variante',
    resumen: 'Cómo se ven las opciones del menú, sus grupos y la opción activa.',
    piezas: [{ nombre: 'Sidebar', slug: 'sidebar' }, { nombre: 'Collapsible', slug: 'collapsible' }, { nombre: 'Badge', slug: 'badge' }],
    libreria: <FilasLibreria nota="Fila de 32 px; la activa en el gris del tema." />,
    ubits: <BarraEnVivo id="workspace" alto="h-80" />,
    cambia: [
      'Fila de 36 px con icono en baldosa',
      'Activa: fondo azul al 10 %, texto azul y marca de 3 px en el borde',
      'Productos en medio peso y gris; títulos de grupo de 28 px',
    ],
    porque: 'En la librería la fila activa casi no se distinguía; el azul con marca ubica a la persona de un vistazo.',
    donde: ['Barra lateral (AppSidebar: ROW, GROUP_LABEL, NavIcon)', 'Medidas en Fundamentos › Marco'],
    usar: 'La navegación principal del producto y del design system.',
    evitar: 'Menús desplegables o listas dentro de una página.',
  },
  {
    id: 'riel',
    titulo: 'Botones del riel',
    estado: 'variante',
    resumen: 'La barra lateral plegada: solo iconos, con la opción activa marcada.',
    piezas: [{ nombre: 'Button', slug: 'button' }, { nombre: 'Tooltip', slug: 'tooltip' }, { nombre: 'DropdownMenu', slug: 'dropdown-menu' }],
    libreria: (
      <BotonIcono size="icon" aria-label="Inicio (librería)">
        <HugeiconsIcon icon={Home02Icon} aria-hidden="true" />
      </BotonIcono>
    ),
    ubits: <BarraEnVivo id="workspace-riel" alto="h-80" />,
    cambia: ['Botones de 40 px', 'Activo en azul al 10 % con marca en el borde', 'Menú flotante de 240 px al pasar el cursor'],
    porque: 'Mantiene la misma lectura que la barra abierta cuando se pliega (en ventanas de menos de 1.200 px se pliega sola).',
    donde: ['SidebarRail (compartido)'],
    usar: 'Solo en la barra plegada.',
    evitar: 'Barras de herramientas de una pantalla: ahí va Button ghost de la librería.',
  },
  {
    id: 'tema',
    titulo: 'Selector de tema',
    estado: 'variante',
    resumen: 'Sol y luna en pastillas, dentro del menú de perfil. El usuario lo prefirió a las pestañas de ReUI.',
    piezas: [{ nombre: 'ToggleGroup', slug: 'toggle-group' }, { nombre: 'DropdownMenu', slug: 'dropdown-menu' }],
    libreria: (
      <ToggleGroup variant="outline" size="sm" defaultValue={['claro']} aria-label="Tema (librería)">
        <ToggleGroupItem value="claro" aria-label="Claro">
          <HugeiconsIcon icon={Sun03Icon} aria-hidden="true" />
        </ToggleGroupItem>
        <ToggleGroupItem value="oscuro" aria-label="Oscuro">
          <HugeiconsIcon icon={Moon02Icon} aria-hidden="true" />
        </ToggleGroupItem>
      </ToggleGroup>
    ),
    ubits: <ThemeSwitch />,
    cambia: ['Bandeja gris en pastilla', 'Opción elegida elevada, con el icono en azul'],
    porque: 'Ocupa poco en la fila «Tema» del menú y se entiende sin texto.',
    donde: ['Menú de perfil (ProfilePopover)', 'ThemeSwitch (compartido)'],
    usar: 'Cambiar entre claro y oscuro.',
    evitar: 'Otras opciones de dos valores: ahí va ToggleGroup o Switch de la librería.',
  },
  {
    id: 'perfil',
    titulo: 'Foto de perfil del encabezado',
    estado: 'variante',
    resumen: 'El botón que abre el menú de perfil es la foto de la persona.',
    piezas: [{ nombre: 'Avatar', slug: 'avatar' }, { nombre: 'DropdownMenu', slug: 'dropdown-menu' }],
    libreria: (
      <Avatar>
        <AvatarFallback>CV</AvatarFallback>
      </Avatar>
    ),
    ubits: <PerfilUbits />,
    cambia: ['Anillo gris al pasar el cursor y azul con el menú abierto', 'Punto verde de «en línea» dentro del menú'],
    porque: 'A una foto no se le puede pintar el azul de los iconos del encabezado; el anillo cumple esa función.',
    donde: ['Encabezado (ProfilePopover)'],
    usar: 'Solo para el perfil de quien usa la plataforma.',
    evitar: 'Avatares de otras personas en listas o tablas.',
  },
  {
    id: 'invitacion',
    titulo: 'Avatares de la tarjeta de invitación',
    estado: 'decidir',
    resumen: 'Las iniciales de quienes ya fueron invitados, sobre los anillos de la ilustración.',
    piezas: [{ nombre: 'Avatar', slug: 'avatar' }, { nombre: 'Button', slug: 'button' }],
    libreria: <AvataresLibreria />,
    ubits: <InvitacionUbits />,
    cambia: ['Fondo azul o verde al 15 % con texto del mismo color'],
    porque: 'En gris se perdían sobre la ilustración.',
    donde: ['Tarjeta de invitación (InviteCard)'],
    usar: 'Pendiente: Carlos pidió avatares de color en todo el producto (azul suave, sin que parezcan botón).',
    evitar: 'Definir un color distinto en cada pantalla: debe quedar una sola variante de avatar.',
  },
  {
    id: 'notificaciones',
    titulo: 'Panel de notificaciones',
    estado: 'variante',
    resumen: 'El panel que abre la campana del encabezado.',
    piezas: [{ nombre: 'Popover', slug: 'popover' }, { nombre: 'Tabs', slug: 'tabs' }, { nombre: 'Badge', slug: 'badge' }, { nombre: 'Button', slug: 'button' }],
    libreria: <NotificacionesLibreria />,
    ubits: <NotificacionesUbits />,
    cambia: [
      '392 px de ancho, fondo sólido y sombra amplia',
      'Filtros «Todas / Sin leer» en pastilla',
      'Filas con icono, punto de no leído y acción en texto',
    ],
    porque: 'La lista necesita más ancho que un popover común y el fondo translúcido dejaba leer la pantalla de atrás.',
    donde: ['Encabezado (NotificationsPopover)'],
    usar: 'Avisos del producto hacia la persona.',
    evitar: 'Contenido de una pantalla: para eso hay drawers.',
  },
  {
    id: 'dialogos',
    titulo: 'Diálogos de acción y de novedades',
    estado: 'variante',
    resumen: 'Diálogos con franja gris al pie y anchos propios.',
    piezas: [{ nombre: 'Dialog', slug: 'dialog' }, { nombre: 'Button', slug: 'button' }, { nombre: 'Avatar', slug: 'avatar' }, { nombre: 'Badge', slug: 'badge' }, { nombre: 'Progress', slug: 'progress' }],
    libreria: <DialogoLibreria />,
    ubits: <DialogosUbits />,
    cambia: ['Sin relleno propio para que la franja gris del pie llegue al borde', 'Anchos de 516, 520, 620 y 760 px', 'Entrada con un rebote suave'],
    porque: 'La franja separa la nota («Selección · Meta Colombia») de los botones, como en el prototipo.',
    donde: ['ActionDialog y Announcements (compartidos)'],
    usar: 'Acciones cortas desde cualquier pantalla y avisos de novedades.',
    evitar: 'Confirmaciones de borrar: ahí va DialogoConfirmar (ConfirmarEliminar si hay que escribir la palabra).',
  },
  {
    id: 'confirmar',
    titulo: 'Ventana de confirmar',
    estado: 'variante',
    resumen: 'DialogoConfirmar: preguntar antes de eliminar, salir sin guardar, activar, descartar o enviar.',
    piezas: [{ nombre: 'AlertDialog', slug: 'alert-dialog' }, { nombre: 'Button', slug: 'button' }],
    libreria: <ConfirmarLibreria />,
    ubits: <ConfirmarUbits />,
    cambia: [
      'El icono va siempre arriba del título: la librería, en pantallas anchas, lo pasa a la izquierda',
      'Título, descripción y registro alineados a la izquierda en los dos tamaños (la librería centra la ventana chica); los botones, a la derecha',
      'Se fuerza con «!» en la cabecera, el icono y el título (el tema va sin capa)',
      'Lo que se va a tocar va en una tarjeta (RegistroConfirmar): icono, nombre, detalle y su estado en una insignia («Cambios sin guardar»); en la ventana chica se condensa en dos líneas, sin icono',
      'ActionDialog sigue la misma cabecera: el icono (media) arriba del título, en un IconTile xl elevated',
    ],
    porque: 'Una confirmación se lee de arriba abajo: el icono de lo que va a pasar, qué pasa y los botones (Cristian, 6-oct).',
    donde: [
      'DialogoConfirmar y RegistroConfirmar (design-system/estados/confirmaciones.tsx), y ConfirmarEliminar, que va por dentro',
      'ActionDialog (src/shared/components/ActionDialog.tsx): el icono arriba del título',
    ],
    usar: 'Toda confirmación, con o sin lo que se pierde en el cuerpo.',
    evitar: 'Una ventana con contenido (formulario, lista para elegir, vista previa): ahí va ActionDialog.',
  },
  {
    id: 'buscador',
    titulo: 'Buscador ⌘K',
    estado: 'variante',
    resumen: 'Buscar o preguntarle al agente desde cualquier pantalla.',
    piezas: [{ nombre: 'Command', slug: 'command' }, { nombre: 'Dialog', slug: 'dialog' }, { nombre: 'Kbd', slug: 'kbd' }],
    libreria: <BuscadorLibreria />,
    ubits: <BuscadorUbits />,
    cambia: ['820 px de ancho y lista de hasta 544 px', 'Orbe de la IA junto al campo y pestañas Todo / Ir a / Objetos / Preguntar', 'Atajos en teclas grises'],
    porque: 'Mezcla navegación y preguntas al agente: necesita el orbe y las pestañas para separar resultados.',
    donde: ['CommandPalette (compartido)'],
    usar: 'Solo el buscador global.',
    evitar: 'Buscadores dentro de una tabla o un filtro: ahí va Input o Command sin diálogo.',
  },
  {
    id: 'boton-icono',
    titulo: 'Terciario de solo icono, redondo',
    estado: 'variante',
    resumen: 'Los botones de solo icono sin borde (cerrar, más opciones, acciones de fila) van en círculo.',
    piezas: [{ nombre: 'Button', slug: 'button' }],
    libreria: (
      <Button variant="ghost" size="icon-sm" aria-label="Más opciones (librería)">
        <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
      </Button>
    ),
    ubits: (
      <BotonIcono aria-label="Más opciones (UBITS)">
        <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
      </BotonIcono>
    ),
    cambia: ['Radio completo (círculo)', 'Nombre obligatorio para lectores de pantalla'],
    porque: 'Carlos, follow up del 17-sep: «el terciario de solo icono debería ser 100 % redondo». Decisión del 18-sep.',
    donde: ['BotonIcono (compartido): 91 botones del producto y del design system'],
    usar: 'Cualquier botón de solo icono sin borde.',
    evitar: 'El riel de la barra lateral (tiene su propia forma) y los botones con texto: esos usan la esquina de la librería.',
  },
  {
    id: 'drawer',
    titulo: 'Drawer flotante',
    estado: 'variante',
    resumen: 'El único panel lateral del producto: flota a 12 px del borde, con esquinas redondeadas y sombra.',
    piezas: [{ nombre: 'Drawer', slug: 'drawer' }],
    libreria: (
      <Text as="p" variant="muted" size="sm" className="text-center">
        Sheet y Drawer de la librería van pegados al borde, de alto completo y sin esquinas.
      </Text>
    ),
    ubits: <DrawerUbits />,
    cambia: ['Flota a 12 px de los bordes', 'Esquinas de 16 px, borde y sombra grande', 'Cabecera con imagen, antetítulo y estado; pie con fondo gris'],
    porque: 'Decisión del 18-sep (Cristian): había dos paneles distintos, el Sheet en las pantallas y el flotante en los patrones de Nicolás. Queda el flotante.',
    donde: ['DrawerShell (design-system/drawers/components/drawer-shell.tsx)', 'Todas las pantallas y templates: ya no queda ningún Sheet'],
    usar: 'Crear, editar o ver el detalle de un registro sin salir de la pantalla.',
    evitar: 'Usar Sheet o Drawer de la librería directo: siempre DrawerShell.',
  },
  {
    id: 'fila-abierta',
    titulo: 'Fila abierta de la bandeja',
    estado: 'variante',
    resumen: 'La persona abierta en la bandeja de candidatos: la fila en azul suave, con todo lo de adentro teñido del mismo azul.',
    piezas: [{ nombre: 'Item', slug: 'item' }, { nombre: 'Checkbox', slug: 'checkbox' }, { nombre: 'Avatar', slug: 'avatar' }, { nombre: 'Badge', slug: 'badge' }],
    hechoAMano: 'El teñido se fuerza con «!» desde la fila: la librería no tiene un estado «abierta» que pinte lo que va dentro del Item.',
    libreria: <FilaAbiertaLibreria />,
    ubits: <FilaAbiertaUbits />,
    cambia: [
      'Fila en azul al 7 %',
      'Casilla sin fondo y con borde azul al 40 % (mientras no está marcada)',
      'Iniciales sobre azul al 8 % y en azul (al 15 % quedaban a 4,2:1, debajo del mínimo AA de 4,5); en oscuro, en el color del texto',
      'Etiquetas del ajuste («3/5») y «Espera» sin relleno: quedan su borde y su letra de color',
    ],
    porque:
      'Nicolás, 24 sep: con las piezas como vienen, la casilla, la cara y las etiquetas quedaban como parches blancos sobre el azul («se ve super feo»). Antes se probaron y descartaron un borde azul (parecía un campo enfocado), gris solo («no se ve que estuviera seleccionada»), gris con el riel del menú lateral y la lista en gris con la abierta en blanco («no me gusta eso gris»).',
    donde: ['Bandeja de la vacante en Exploración 1 (Fila y FILA_ABIERTA, exploraciones/uno/vacante.tsx)'],
    usar: 'La fila abierta de una lista cuyo detalle se ve al lado, como la bandeja con la ficha de la persona.',
    evitar: 'Copiar las clases en otras listas, o teñir las filas marcadas: marcar es la casilla; abrir es el azul.',
  },
  {
    id: 'avisos',
    titulo: 'Color de los avisos (toasts)',
    estado: 'pedido',
    resumen: 'Cada aviso lleva el icono de su tipo en su color: éxito, información, advertencia y error. Salen arriba y centrados.',
    piezas: [{ nombre: 'Toast', slug: 'toast' }],
    libreria: (
      <Text as="p" variant="muted" size="sm" className="text-center">
        ToastToaster solo pinta de rojo el icono de error; éxito, información y advertencia quedan en negro.
      </Text>
    ),
    ubits: <AvisosUbits />,
    cambia: ['Icono de éxito en verde, información en azul, advertencia en amarillo y error en rojo', 'Colores del tema (success, info, warning, destructive)', 'Arriba y centrados en todas las pantallas, apilados hacia abajo (la librería los pone abajo a la derecha desde sm)'],
    porque: 'Carlos, en el follow up del 17-sep: con todos los iconos en negro no se distingue un aviso de otro.',
    donde: ['Toaster (compartido), el único toaster del producto, en RootLayout'],
    usar: 'Aviso sin tipo: notify. Con tipo: toast.add({ type, title }), que decide el icono y el color; excepción aceptada el 29-sep porque notify no deja elegir el tipo (pedido a ingeniería).',
    evitar: 'Montar ToastToaster en una pantalla: el aviso sale dos veces.',
  },
  {
    id: 'ia',
    titulo: 'Botones de IA',
    estado: 'pedido',
    resumen: 'La familia de IA: primario con degradado, secundario con contorno y orbe, y solo icono. Los tres en pastilla.',
    piezas: [{ nombre: 'Button', slug: 'button' }],
    hechoAMano:
      'El degradado y el brillo del borde son CSS propio (new-chat.module.css y tarjeta-ia.module.css) encima del Button; el secundario y el de solo icono redefinen el radio.',
    libreria: <Button size="lg">Nueva conversación</Button>,
    ubits: <BotonesIaUbits />,
    cambia: [
      'Primario: degradado azul → morado → fucsia, sin borde',
      'Secundario: contorno de la librería con el orbe al inicio',
      'Solo icono: el orbe como icono',
      'Radio completo (pastilla) en los tres',
    ],
    porque:
      'Regla de Carlos: la IA se reconoce por su color y la pastilla es solo para la IA. La librería ya tiene su propio AiButton en el Storybook, pero no viene publicado en la versión instalada (0.5.5) y su degradado es otro (naranja → rosa → morado → azul). Desde el 5-oct hay un solo primario de IA, BotonIa: la copia de Crear vacante (BotonIaPrimario) y la del Storybook (AiButton) se borraron.',
    donde: [
      'Primario: barra lateral de Orbit y tarjeta de IA («Crear ahora»)',
      'Primario: BotonIa (compartido), el único primario de IA de las pantallas',
      'Secundario: BotonIaSecundario (compartido)',
      'Solo icono: ReopenAgentButton compact («Orbit Flow» al pasar el cursor)',
      'Orbit › Botones de IA',
    ],
    usar: 'Acciones que hace la IA. Una sola principal por vista: las demás bajan a secundario o a solo icono.',
    evitar: 'Cualquier acción que no sea de IA, otra copia del primario, y mezclar este degradado con el del AiButton de la librería.',
  },
  {
    id: 'opacos',
    titulo: 'Menús y paneles con fondo sólido',
    estado: 'pedido',
    resumen: 'Todos los menús del marco llevan fondo sólido.',
    piezas: [{ nombre: 'DropdownMenu', slug: 'dropdown-menu' }, { nombre: 'Popover', slug: 'popover' }],
    libreria: <MenuLibreria nota="Ábrelo sobre el texto de la página: el fondo es translúcido." />,
    ubits: <MenuUbits nota="Ábrelo: el menú de perfil real, con fondo sólido." />,
    cambia: ['Fondo del color del popover, sin transparencia'],
    porque: 'Con el fondo translúcido se leía la barra lateral de atrás.',
    donde: ['Menú de empresa, menú de perfil, notificaciones y menús del riel'],
    usar: 'Pedir al equipo de librería un estilo UBITS con menús opacos.',
    evitar: 'Agregar el mismo ajuste en otros menús mientras tanto.',
  },
  {
    id: 'anillos',
    titulo: 'Anillos de consumo',
    estado: 'pedido',
    resumen: 'Licencias y créditos de IA en el menú de empresa.',
    piezas: [{ nombre: 'DropdownMenu', slug: 'dropdown-menu' }],
    hechoAMano: 'Los dos anillos no existen en ReUI: son un SVG propio (account-gauge.module.css) dentro del menú de la cuenta.',
    libreria: <ConsumoLibreria />,
    ubits: <ConsumoUbits />,
    cambia: ['Progreso circular', 'Licencias en azul; créditos de IA con el degradado de la IA'],
    porque: 'La librería solo trae barra de progreso.',
    donde: ['AccountPopover + account-gauge.module.css'],
    usar: 'Pedir a la librería una variante circular de Progress.',
    evitar: 'Dibujar otros anillos a mano.',
  },
  {
    id: 'pensando',
    titulo: 'Estado de las conversaciones',
    estado: 'pedido',
    resumen: 'El punto junto a cada conversación de Orbit: leída, sin leer o razonando.',
    piezas: [],
    hechoAMano: 'No sale de la librería: es un punto propio en CSS (chat-status.module.css), con el latido del agente.',
    libreria: <EstadosLibreria />,
    ubits: <EstadosUbits />,
    cambia: ['Anillo vacío si ya se leyó', 'Punto azul si hay respuesta', 'Cometa con el degradado de la IA mientras razona'],
    porque: 'El estado «razonando» no existe en la librería.',
    donde: ['ChatStatusDot + chat-status.module.css'],
    usar: 'Solo el historial de Orbit.',
    evitar: 'Estados de otros registros: ahí va Badge.',
  },
  {
    id: 'pestanas',
    titulo: 'Pestañas subrayadas',
    estado: 'pedido',
    resumen: 'Las pestañas «line» de toda la app: la raya de la activa se apoya sobre la línea gris.',
    piezas: [{ nombre: 'Tabs', slug: 'tabs' }],
    libreria: (
      <Text as="p" variant="muted" size="sm" className="max-w-xs text-center">
        La librería deja 3px de relleno en la lista también en la variante «line»: la raya de la pestaña activa queda
        flotando 2px por encima de la línea gris.
      </Text>
    ),
    ubits: (
      <Tabs defaultValue="resumen">
        <TabsList variant="line">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="candidatos">Candidatos</TabsTrigger>
          <TabsTrigger value="actividad">Actividad</TabsTrigger>
        </TabsList>
      </Tabs>
    ),
    cambia: ['Sin relleno en la lista de pestañas «line»'],
    porque: 'Nicolás, 22 sep: «mira esos tabs cómo están de mal». Sin el relleno la raya pisa la línea, como en ReUI.',
    donde: ['src/shared/styles/global.css (regla global, .cn-tabs-list[data-variant=line])'],
    usar: 'Pedir a la librería que la variante «line» no lleve relleno; al publicarse, se borra la regla.',
    evitar: 'Corregir la raya pantalla por pantalla o tocar otras variantes de pestañas.',
  },
  {
    id: 'hover',
    titulo: 'Grises del hover',
    estado: 'decidir',
    resumen: 'El gris que aparece al pasar el cursor por filas y botones del marco (en UBITS, pasa el cursor por la barra y por las notificaciones).',
    piezas: [{ nombre: 'Sidebar', slug: 'sidebar' }, { nombre: 'Button', slug: 'button' }, { nombre: 'DropdownMenu', slug: 'dropdown-menu' }],
    libreria: <FilasLibreria nota="Pasa el cursor por Avisos internos: gris del acento del tema." />,
    ubits: <div className="flex flex-col items-center gap-3">
        <BarraEnVivo id="workspace" alto="h-56" />
        <NotificacionesUbits />
      </div>,
    cambia: ['Tonos distintos en riel, notificaciones, barra de procesos y filas'],
    porque: 'Se pusieron cuando el acento del tema era azul. Carlos lo ve como un forzado; Nicolás, como una decisión.',
    donde: ['SidebarRail, NotificationsPopover, ProcessCenter, AppSidebar'],
    usar: 'Decidir un solo tono y guardarlo en el tema.',
    evitar: 'Sumar tonos nuevos.',
  },
  {
    id: 'tarjeta-contenido',
    titulo: 'Tarjeta de contenido',
    estado: 'variante',
    resumen: 'La ficha de un curso, ruta, evento o podcast en un catálogo: imagen con aire, estado encima y ficha técnica debajo.',
    piezas: [
      { nombre: 'Card', slug: 'card' },
      { nombre: 'Badge', slug: 'badge' },
      { nombre: 'Avatar', slug: 'avatar' },
      { nombre: 'Progress', slug: 'progress' },
    ],
    libreria: <TarjetaImagenLibreria />,
    ubits: <TarjetaContenidoUbits />,
    cambia: [
      'La imagen no va de borde a borde: 6 px de aire alrededor y esquina de 10 px, las mismas medidas de la tarjeta del tour («Nos renovamos para ti») de la barra lateral; el texto lleva 16 px a los lados, 14 px arriba y 16 px abajo',
      'Sobre la imagen: la visibilidad arriba a la izquierda, el origen («Antiguo LMS») arriba a la derecha y, si el contenido está empezado, su avance al pie',
      'Son cinco versiones del mismo componente, no cinco piezas: **LMS Creator** (visibilidad y origen), **catálogo del colaborador** (sin etiquetas), **en progreso** («En progreso» en azul al lado del tipo), **completado** («Completado» en verde y la barra llena) e **historial** (completado más el botón de descargar el certificado sobre la portada). Se eligen con `estado` y `onDescargarCertificado`; lo que cambia no es el estilo sino qué sabe quien mira',
      'El avance se dice dos veces a propósito: la barra dice **cuánto** y el texto al lado del tipo dice **qué significa**. Una barra al 100 % sin la palabra «Completado» no se lee como terminada',
      'El logo del proveedor no va como un avatar: el `Avatar` de la librería es redondo y recorta la imagen para llenarlo (`object-cover`), y una marca sale cortada. Va en baldosa cuadrada de esquina suave, con fondo de la tarjeta y la imagen entera dentro con aire (`rounded-none! object-contain!` y 12 % de relleno), igual que el logo de empresa de la barra lateral',
      'Debajo, el orden del catálogo: tipo → título → proveedor → competencia → nivel, duración e idioma',
      'La ficha va **abreviada**: «1 hora» → «1 h», «30 minutos» → «30 m», «Español» → «ES». Los tres datos comparten un renglón y escritos enteros se comían el sitio del título o lo partían. Abrevia la propia tarjeta, no quien la usa, y lo que no reconoce lo deja igual: el horario de un evento pasa de largo',
      'Cada dato de la ficha técnica lleva su icono; el título se corta a dos renglones y baja un escalón de la escala del tema, a `text-sm` (14/20) en vez de los 16/24 que da el `Heading` level 6: a 16 pesaba de más dentro de la ficha. Sigue siendo un `h3`; lo único que cambia es el tamaño, con un token, no con una medida a mano',
      'Si la tarjeta se abre, al pasar por encima el borde se pone azul y la foto crece un poco (el hover del prototipo)',
    ],
    porque:
      'La tarjeta con imagen de la librería sirve para una promoción, no para un catálogo: no tiene dónde poner el estado, el avance ni la ficha técnica, y con la imagen a sangre las tarjetas de una cuadrícula se leen como banners. El orden de los campos es el mismo del catálogo de UBITS, para que un contenido se lea igual en el creador y en la universidad corporativa.',
    donde: [
      'LMS Creator › Contenidos, vista de cuadrícula',
      'LMS Creator › Agregar video, «Tus videos recientes» y «Tus videos» (solo insignia, imagen y título)',
      'Colaborador › Zona de estudio › Eventos: TarjetaSesion es esta misma tarjeta, con tipo «Sesión», la fecha en la esquina izquierda y «En vivo» o el calendario en la derecha (ya no es una copia, 2-oct)',
      'Desde el 5-oct, Universidad corporativa y las listas de la Zona de estudio (Plan de contenidos, Exclusivo para mí, Historial) son la tabla del sistema con la portada en miniatura: la versión «historial» con la descarga sobre la portada quedó sin uso, porque el certificado se baja desde el «⋯» de la fila',
      'TarjetaContenido (compartido), la única tarjeta de contenido (decisión 17)',
    ],
    usar: 'Cualquier cuadrícula de contenidos formativos: cursos, rutas, eventos, sesiones e ítems de un plan. Los campos son opcionales: se pasan los que el catálogo tenga.',
    evitar:
      'Promociones y banners, que son el caso de la tarjeta con imagen de la librería. Tampoco para listas: una lista de contenidos con portada es la tabla del sistema con la miniatura en la fila (CeldaTitulo).',
  },
  {
    id: 'edicion-en-linea',
    titulo: 'Edición en línea',
    estado: 'pedido',
    resumen: 'Cambiar un dato que ya existe sin salir de la pantalla: el título de un video, el nombre de una página, una nota.',
    piezas: [
      { nombre: 'Input', slug: 'input' },
      { nombre: 'Textarea', slug: 'textarea' },
      { nombre: 'Button', slug: 'button' },
      { nombre: 'Tooltip', slug: 'tooltip' },
    ],
    hechoAMano: 'Al Input y al Textarea se les quita el cromo: la librería no trae una variante sin borde ni fondo.',
    libreria: <EdicionLibreria />,
    ubits: <EdicionUbits />,
    cambia: [
      'Sin borde, sin fondo y sin relleno: se lee como texto corrido, no como un formulario',
      'Hereda la tipografía de donde vive, así que el mismo campo sirve para un título grande y para una nota',
      'Al pasar por encima aparece un fondo suave —eso es lo que anuncia que se puede editar— y al enfocar, el anillo de marca',
      'Con «multilinea» crece con el contenido, sin barra de desplazamiento',
      'En error sí aparece borde rojo, porque en un campo sin cromo el aviso pasaría desapercibido',
    ],
    porque:
      'Cambiar el título o la descripción de algo que se está creando no justifica un formulario aparte, y un campo con borde en medio de una pantalla de lectura la hace parecer un formulario. Que el campo esté siempre listo y solo se marque al pasar por encima deja leer y editar en el mismo sitio. Es el patrón que ya usa UBITS para títulos y descripciones.',
    donde: [
      'LMS Creator › Editor de video, título del proyecto',
      'EdicionEnLinea (compartido)',
    ],
    usar: 'Títulos y descripciones que se escriben en el momento, dentro de la pantalla donde viven.',
    evitar:
      'Formularios de verdad, donde los campos necesitan etiqueta, ayuda y borde. Tampoco en una lista donde el clic ya significa otra cosa: en el índice del creador renombrar es doble clic, para no chocar con seleccionar.',
  },
  {
    id: 'editor-texto',
    titulo: 'Editor de texto enriquecido',
    estado: 'pedido',
    resumen: 'Texto con formato: la descripción de un contenido, el recurso Texto, la descripción de una sección y las instrucciones.',
    piezas: [
      { nombre: 'Toggle', slug: 'toggle' },
      { nombre: 'Button', slug: 'button' },
      { nombre: 'Popover', slug: 'popover' },
      { nombre: 'Separator', slug: 'separator' },
    ],
    hechoAMano: 'El área de escritura es un bloque editable propio: la librería no trae un editor de texto enriquecido.',
    libreria: <TextoLibreria />,
    ubits: <TextoUbits />,
    cambia: [
      'Barra de formato arriba: negrita, cursiva y subrayado (se quedan presionados), listas, enlace, dos títulos y cita',
      'El enlace se escribe en un globo, no en una ventana del navegador',
      'El área copia el borde, el radio y el anillo de foco del Textarea del tema, también en rojo cuando falta',
    ],
    porque: 'Crear contenido pide texto con formato en cinco lugares y la librería solo tiene Textarea. Se pidió el editor a la librería.',
    donde: ['LMS Creator › Crear contenido: Portada, recurso Texto, Editar sección, texto complementario, asistencia', 'crear-contenido/components/editor-texto.tsx'],
    usar: 'Cuando lo escrito se muestra con formato a quien lo consume (colaboradores).',
    evitar: 'Campos cortos o comentarios internos: ahí va Textarea.',
  },
  {
    id: 'file-upload',
    titulo: 'Cargador de archivos',
    estado: 'variante',
    resumen: 'Subir un archivo (PDF, SCORM, imagen, video, logo) con el AdjuntoCsv del equipo (Estados › Procesos largos) a todo el ancho del campo.',
    piezas: [
      { nombre: 'Attachment', slug: 'attachment' },
      { nombre: 'Progress', slug: 'progress' },
    ],
    libreria: <CargaLibreria />,
    ubits: <CargaUbits />,
    cambia: [
      'Lo visible es el AdjuntoCsv del equipo: vacío, subiendo con su barra, listo y error, a todo el ancho (no cambia de tamaño con el nombre del archivo)',
      'Se le sumaron, sin cambiar los casos de CSV: el icono o la miniatura del archivo, el ancho, arrastrar y soltar, y el error sin «descargar detalle»',
      'La lógica (formato, peso, arrastrar y soltar) es el hook useFileUpload de flux-ui con los mensajes del producto en español',
    ],
    porque: 'Había dos cargadores en el proyecto; queda uno solo, el del equipo. El FileUpload del Storybook no viene en la versión instalada (0.5.5): cuando llegue, se evalúa reemplazarlo.',
    donde: [
      'LMS Creator (PDF, SCORM, portada, video, archivo descargable, logo, imagen del personaje) y Avisos internos (imagen)',
      'Configuración › Personalización (logo, fondo y logo de celular) y Design system › Formularios (CSV «Desde archivo»), desde el 29-sep',
      'AdjuntoCsv (design-system/estados/procesos.tsx); la lógica en crear-contenido/components/file-upload.tsx',
    ],
    usar: 'Subir un archivo que se valida antes de seguir, incluidas las cargas masivas por CSV.',
    evitar: 'Varios archivos a la vez en lista: ahí van los Attachment pequeños del adjunto de referencia.',
  },

  {
    id: 'marco-inmersivo',
    titulo: 'Marco de flujo a pantalla completa',
    estado: 'variante',
    resumen: 'Los flujos de crear (contenido, evento, video con IA, presentación, roleplay) tapan el workspace con su propia cabecera y pie.',
    piezas: [
      { nombre: 'Button', slug: 'button' },
      { nombre: 'Badge', slug: 'badge' },
      { nombre: 'Stepper', slug: 'stepper' },
      { nombre: 'Dialog', slug: 'dialog' },
    ],
    libreria: <MarcoLibreria />,
    ubits: <MarcoUbits />,
    cambia: [
      'Capa a todo el ancho por encima de la barra lateral y del header; lo de abajo queda inerte para el teclado y el lector',
      'Cabecera con título, estado y guardado; a la derecha las acciones y una sola salida, `BotonSalirCreacion`: «Salir de la creación», «Volver a añadir página» o «Salir de la edición», según a dónde lleve. Sin flecha junto al título ni X (regla de creación, 6-oct)',
      'Barra de los pasos (`BarraEditor`) con el `ChipGuardado` a la izquierda y sin «Cancelar»: «Atrás» y seguir a la derecha',
      'Pie fijo (`pie`) para los editores de tres columnas: la acción principal queda abajo, en el mismo sitio que en el setup; el centro es lo único que hace scroll',
      'Sus ventanas: lo que tiene contenido (elegir el recurso, subir, ajustes) va en ActionDialog; preguntar antes de salir, descartar o eliminar, en DialogoConfirmar (Design system › Modales; ConfiguredModal se retiró). «Agregar video» usa `wide` (736 px), porque ninguna de sus pestañas pasa de una columna',
    ],
    porque: 'Es el layout inmersivo de UBITS: mientras se crea algo, no se navega a otra parte. El editor de LMS Creator ya usaba una capa así, pero con la barra lateral visible.',
    donde: ['LMS Creator › Crear contenido, Crear evento, Agregar video, Presentación interactiva, Evaluador roleplay', 'crear-contenido/components/marco-inmersivo.tsx'],
    usar: 'Flujos de varios pasos que terminan en crear o publicar algo.',
    evitar: 'Listas, tableros y detalles: esos van en el workspace con PageShell.',
  },
  {
    id: 'save-indicator',
    titulo: 'Indicador de guardado',
    estado: 'pedido',
    resumen: 'En qué va el guardado automático, en una pastilla junto al título: sin guardar, guardando o guardado.',
    piezas: [
      { nombre: 'Badge', slug: 'badge' },
      { nombre: 'Spinner', slug: 'spinner' },
    ],
    libreria: <GuardadoLibreria />,
    ubits: <GuardadoUbits />,
    cambia: [
      'Pastilla al lado del título, no una línea de texto debajo: se lee de un vistazo sin bajar la mirada',
      '«Cambios sin guardar» en contorno, «Guardando…» con la ruedita y «Guardado» en verde con su marca',
      'Avisa al lector de pantalla cada cambio de estado (aria-live)',
      'En los pasos de un asistente va a la izquierda de la barra de abajo, en el sitio que antes tenía «Cancelar» (regla de creación, 6-oct)',
    ],
    porque:
      'Nació en Crear vacante y se adoptó en todo el creador: la pastilla verde se distingue del resto del texto de la cabecera, mientras que el indicador anterior —una línea gris con una nube— se perdía junto al título. La librería no trae uno: Spinner es solo la ruedita. Se pidió a la librería.',
    donde: [
      'Selección › Crear vacante · LMS Creator › Crear contenido, Crear evento, editor de Video con IA y de Presentación interactiva',
      'ChipGuardado (compartido)',
    ],
    usar: 'Pantallas que guardan solas mientras se edita, sin botón de guardar.',
    evitar: 'Confirmar una acción puntual (publicar, eliminar): eso va con un aviso (notify).',
  },
  {
    id: 'tokens-ia',
    titulo: 'Tokens de IA: insignia y costo',
    estado: 'pedido',
    resumen: 'El saldo de tokens en la cabecera de las superficies de IA, con la animación al gastar, y el costo dentro de los botones de IA.',
    piezas: [{ nombre: 'Badge', slug: 'badge' }],
    libreria: <TokensLibreria />,
    ubits: <TokensUbits />,
    cambia: [
      'Insignia (TokenBadge): borde en el degradado de la IA, moneda en morado y saldo en el color del texto, como el badge IA del prototipo',
      'Al gastar se aplasta y rebota, la moneda gira, el número baja contando y sube un «−N» en rojo',
      'Costo (TokenCost): moneda y número dentro del botón, en su color un poco más tenue; igual en el primario de IA y en el secundario',
      'Nada de «· 50 tokens» escrito: el lector de pantalla sí dice «50 tokens»',
      'Sin movimiento si la persona pidió reducir animaciones',
    ],
    porque: 'Es el badge IA de tokens de UBITS (React y vanilla), con su microinteracción. La librería no trae contador animado. Se pidió a la librería.',
    donde: [
      'LMS Creator › Portada, Video con IA (setup, editor, avatar), Presentación interactiva, Agente de evaluaciones',
      'TokenBadge y TokenCost (crear-contenido/components/tokens.tsx)',
    ],
    usar: 'Toda acción de IA que gasta tokens: el costo en el botón y el saldo en la cabecera de esa superficie.',
    evitar: 'Acciones de IA gratis: esas no llevan costo.',
  },
  {
    id: 'panel-generacion',
    titulo: 'Panel de generación de recursos',
    estado: 'pedido',
    resumen: 'Abajo a la izquierda, lo que la IA está generando en segundo plano (video, presentación); al terminar, un aviso fijo con «Ver página».',
    piezas: [
      { nombre: 'Card', slug: 'card' },
      { nombre: 'Item', slug: 'item' },
      { nombre: 'Spinner', slug: 'spinner' },
      { nombre: 'Alert', slug: 'alert' },
    ],
    libreria: <MarcoLibreria />,
    ubits: <AbrirCrearContenido />,
    cambia: [
      'Card flotante fija con sombra y una fila por recurso: «Generando 42%», «Listo · Haz clic para ver» o «Se eliminó el recurso»',
      'Se minimiza y se cierra; vuelve a salir cuando empieza otra generación',
      'Al terminar, un Alert fijo arriba, en cualquier paso, con «Ver página» y cerrar: se queda hasta que se cierra, porque un video puede tardar y el creador ya estar en otro paso (regla de Estados › Procesos: una alerta, sin aviso flotante)',
    ],
    porque:
      'El ProcessCenter del marco no recibe elementos de una pantalla. Pedido: que acepte procesos del módulo, y entonces este panel se reemplaza por él.',
    donde: ['LMS Creator › Crear contenido › Recursos', 'crear-contenido/components/panel-generacion.tsx'],
    usar: 'Generaciones largas de IA que siguen mientras la persona trabaja en otra página.',
    evitar: 'Cargas masivas o procesos de toda la plataforma: esos van al ProcessCenter.',
  },
  {
    id: 'campos',
    titulo: 'Campos de 40 px',
    estado: 'pedido',
    resumen: 'Todos los campos del playground son 4 px más altos que los de la librería.',
    piezas: [
      { nombre: 'Input', slug: 'input' },
      { nombre: 'Select', slug: 'select' },
      { nombre: 'Combobox', slug: 'combobox' },
      { nombre: 'InputGroup', slug: 'input-group' },
      { nombre: 'NumberField', slug: 'number-field' },
    ],
    hechoAMano: 'Una de las tres reglas de CSS del proyecto que le cambian la apariencia a un componente de flux-ui (con el hover de los botones sin borde y las casillas). Vive en src/index.css, con el número en --alto-campo, y le gana a la del tema porque va sin capa.',
    libreria: <CamposLibreria />,
    ubits: <CamposUbits />,
    cambia: [
      'Campo de texto, selector, selector con buscador y campo con icono: 40 px en vez de 36',
      'Campo numérico: 40 px tanto en su tamaño normal como en el grande',
      'El tamaño chico del campo numérico y el «sm» del selector no se tocan',
      'El buscador de las tablas tampoco: ya tenía un alto propio y se respeta',
      'Un campo que vive en una fila de acciones baja al alto de esa fila: no es un campo de formulario',
      'El compositor del agente y el buscador de comandos se quedan como estaban',
    ],
    porque: 'A 36 px los formularios largos se leían apretados. Pedido de UX el 22 de septiembre.',
    donde: ['src/index.css (.cn-input y familia): todo el playground, 43 pantallas con campo de texto y 31 con selector'],
    usar: 'Pedir al equipo de librería un estilo UBITS con los campos a 40 px, o un tamaño de campo que podamos elegir.',
    evitar:
      'Forzar el alto campo por campo en un formulario: ahí el alto es una regla del tema, no de la pantalla. La excepción es la fila de acciones: campos a 40 y botones a 36 no casan cuando van juntos, y en un formulario se arregla solo poniendo el botón en «lg», que también mide 40 —así está «Escuchar» junto al campo de voz del roleplay—. En la fila de acciones de una cabecera no se puede, porque el botón principal mide 36 en todas y no se cambia por una pantalla: ahí el campo baja a 36 con «h-9!», igual que el buscador de las tablas baja a 32. Pendiente de que UX lo deje escrito como norma (Dave, 6-oct).',
  },
  {
    id: 'rotulos-agente',
    titulo: 'Rótulos de Orbit Flow',
    estado: 'variante',
    resumen: 'Los rótulos en mayúsculas de las tarjetas del agente: «Actual», «Propuesta», «Lo que no sé», «Fortalezas», «Riesgos».',
    piezas: [],
    hechoAMano: 'Es una clase propia (KICKER) sobre el texto: 11 px, peso medio, letras espaciadas y en mayúsculas. La letra más pequeña del tema es xs (12 px).',
    libreria: (
      <Text as="p" variant="muted" size="sm" className="max-w-xs text-center">
        La letra más pequeña del tema es xs (12 px), sin mayúsculas ni espaciado entre letras.
      </Text>
    ),
    ubits: <ProposalCard className="w-full" current="Analista de operaciones" proposal="Analista de operaciones senior, con manejo de SQL" />,
    cambia: ['11 px, uno menos que Text xs', 'Mayúsculas con las letras espaciadas', 'Peso medio'],
    porque:
      'Regla del 23-sep (Cristian): los textos del agente vuelven a como estaban antes del 22-sep, con los rótulos en 11 px; el cambio a 13 px se revirtió. Con Text xs pasarían a 12 px.',
    donde: [
      'KICKER (agente-contextual/components/agent-styles.ts)',
      'Kit del agente (ProposalCard, AgentCard) y los casos Resumen de un registro, Explicar un dato, Comparar opciones, Revisar antes de publicar y Estados del panel',
    ],
    usar: 'Solo los rótulos de las tarjetas dentro del panel de Orbit Flow.',
    evitar: 'Otros antetítulos o etiquetas de una pantalla: ahí va Text xs de la librería.',
  },
  {
    id: 'hover-sin-borde',
    titulo: 'Hover de los botones sin borde',
    estado: 'pedido',
    resumen: 'Al pasar el cursor, los botones sin borde (el terciario y el de solo icono) se oscurecen con un velo, no con un gris fijo.',
    piezas: [{ nombre: 'Button', slug: 'button' }],
    hechoAMano: 'Una regla sin capa en src/index.css sobre el botón «ghost» de la librería, que es también el de BotonIcono.',
    libreria: <HoverSinBordeLibreria />,
    ubits: <HoverSinBordeUbits />,
    cambia: [
      'Hover y menú abierto: el color del texto al 4 % (6 % en oscuro) en vez del gris opaco del tema',
      'Sobre blanco se ve el mismo gris de antes; sobre el brillo azul de la cabecera o el gris de un marco, ahora se nota',
      'Los botones que ya forzaban su propio hover lo conservan',
    ],
    porque: 'Nicolás, 1 oct: «los hover en estos dos componentes no se ven», sobre el «⋯» y «Compartir» de la cabecera de la vacante. El gris de la librería solo contrasta con blanco.',
    donde: ['src/index.css (.cn-button-variant-ghost): todo el playground, con más efecto en cabeceras y en el gris de los marcos'],
    usar: 'Pedir a la librería que el hover del botón sin borde sea un velo y no un gris fijo; al publicarse, se borra la regla.',
    evitar: 'Arreglarlo botón por botón con otro color de fondo, o cambiar el botón a uno con borde solo para que se note el hover.',
  },
  {
    id: 'casillas',
    titulo: 'Casillas y radios visibles',
    estado: 'pedido',
    resumen: 'La casilla sin marcar y el radio sin elegir llevan el fondo de la página y un borde más oscuro, para verse también sobre gris.',
    piezas: [
      { nombre: 'Checkbox', slug: 'checkbox' },
      { nombre: 'RadioGroup', slug: 'radio-group' },
    ],
    hechoAMano: 'Una regla sin capa en src/index.css sobre la casilla y el radio de la librería, solo cuando están sin marcar.',
    libreria: <CasillaLibreria />,
    ubits: <CasillaUbits />,
    cambia: [
      'Sin marcar: fondo de la página (blanco en claro) en vez de transparente',
      'Borde: el color del texto al 30 % en vez del gris claro de los campos',
      'La marcada, la que tiene error, la que tiene el foco y las que una pantalla tiñe a mano no cambian',
    ],
    porque: 'Nicolás, 1 oct: «ese checkbox tampoco se ve», en el pie gris de «Importar CVs». Transparente y con un borde casi del color del fondo, se perdía. El radio sin elegir, igual: se vio el mismo día en el menú de estado de la vacante.',
    donde: ['src/index.css (.cn-checkbox y .cn-radio-group-item): todas las casillas y radios del playground, tablas incluidas'],
    usar: 'Pedir a la librería una casilla con fondo y un borde con contraste suficiente; al publicarse, se borra la regla.',
    evitar: 'Mover una casilla a un fondo blanco solo para que se vea, o teñirla pantalla por pantalla.',
  },
  {
    id: 'insignias',
    titulo: 'Insignias chicas a 10.5 px',
    estado: 'pedido',
    resumen: 'Las insignias «xs» y «sm» de la librería traen la letra en 9.6 y 10 px; aquí nunca bajan de 10.5 px.',
    piezas: [{ nombre: 'Badge', slug: 'badge' }],
    hechoAMano: 'Un envoltorio propio (src/shared/components/Badge) sobre la insignia de flux-ui: mismo alto y relleno, solo sube la letra de «xs» y «sm».',
    libreria: (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" size="xs">
          3/4
        </Badge>
        <Badge variant="warning-light" size="sm">
          Espera
        </Badge>
      </div>
    ),
    ubits: (
      <div className="flex items-center gap-2">
        <BadgeLegible variant="secondary" size="xs">
          3/4
        </BadgeLegible>
        <BadgeLegible variant="warning-light" size="sm">
          Espera
        </BadgeLegible>
      </div>
    ),
    cambia: ['«xs»: la letra pasa de 9.6 a 10.5 px y sigue de 16 px de alto', '«sm»: de 10 a 10.5 px, sigue de 18 px de alto', 'El tamaño normal y el grande (12 px) no se tocan'],
    porque: 'Accesibilidad: 10.5 px es lo mínimo para un texto en pantalla. Pedido de Nicolás el 25 de septiembre, al ver los contadores y las etiquetas de la bandeja de Selección.',
    donde: ['Selección: Vacantes, Mis candidatos y sus piezas','Falta: «Nuevo» de la barra lateral y la tarjeta de invitación, en la zona protegida'],
    // Decisión 22 de la auditoría (5-oct): se queda hasta que ingeniería ponga la regla global; está en Diferencias.
    usar: 'Importar Badge de src/shared/components/Badge y no de flux-ui en cualquier pantalla. Es temporal: cuando ingeniería fije el mínimo con una regla global, el envoltorio se borra y se vuelve a la de la librería.',
    evitar: 'Bajar la letra de una insignia con una clase propia, o usar la de flux-ui en «xs» o «sm».',
  },
  {
    id: 'insignia-pro',
    titulo: 'Insignia del plan Pro',
    estado: 'pedido',
    resumen: 'La librería no trae una insignia violeta: la del plan Pro copia la forma de «info-light» con un color nuevo del tema, «premium».',
    piezas: [{ nombre: 'Badge', slug: 'badge' }],
    hechoAMano: 'Un token nuevo en src/index.css (--premium y --premium-foreground, claro y oscuro) y las clases de «info-light» cambiadas a ese color sobre la insignia, con «!».',
    libreria: (
      <div className="flex items-center gap-2">
        <BadgeLegible variant="info-light" size="xs">
          Esencial
        </BadgeLegible>
        <BadgeLegible variant="info-light" size="xs">
          Pro
        </BadgeLegible>
      </div>
    ),
    ubits: (
      <div className="flex items-center gap-2">
        <BadgeLegible variant="info-light" size="xs">
          Esencial
        </BadgeLegible>
        <BadgeLegible
          variant="info-light"
          size="xs"
          className="border-premium/15! bg-premium/10! text-premium-foreground! dark:border-premium/25! dark:bg-premium/15! dark:text-premium!"
        >
          Pro
        </BadgeLegible>
      </div>
    ),
    cambia: ['Esencial: azul suave, la «info-light» de la librería sin cambios', 'Pro: violeta suave, mismo alto, relleno y borde que «info-light»', 'Contraste: 7,4:1 en claro y 5,4:1 en oscuro'],
    porque: 'Pedido de Charlie el 1 de octubre: el plan Pro se distingue en violeta del Esencial en azul. El violeta de «info» se había quitado el 17 de septiembre, así que se sumó uno propio para los planes.',
    donde: ['Botón de la empresa en la barra lateral («Plan · Pro»)'],
    usar: 'Solo para marcar el plan Pro. Si la librería publica una variante violeta, se borra el token y se usa la suya.',
    evitar: 'Usar «premium» como color de estado, de botón o decorativo: no es un color de acento del producto.',
  },
]

// Los del marco van primero; luego, los de cada módulo, con su título encima.
const GRUPOS = [
  { id: 'marco', titulo: 'Marco general', descripcion: 'Barra lateral, encabezado, menús y piezas compartidas.', ajustes: AJUSTES_MARCO },
  {
    id: 'vacantes',
    titulo: 'Selección › Vacantes',
    descripcion: 'Piezas nuevas del listado y del asistente «Crear vacante», y las de la librería a las que se les cambió algo.',
    ajustes: AJUSTES_VACANTES,
  },
  {
    id: 'encuestas',
    titulo: 'Desempeño y cultura › Encuestas',
    descripcion: 'Los gráficos del home y de los resultados, hechos con el marco de gráficos de la librería.',
    ajustes: AJUSTES_ENCUESTAS,
  },
  {
    id: 'acceso',
    titulo: 'Inicio de sesión',
    descripcion: 'Lo que el login fuerza sobre la librería (PR de Carlos, 7-oct).',
    ajustes: AJUSTES_ACCESO,
  },
  // Las piezas del equipo que no forzaban nada pero merecían su ficha (7-oct): así cada pieza del catálogo tiene una.
  {
    id: 'piezas',
    titulo: 'Piezas del sistema',
    descripcion: 'Marco de página, tablas, cifras, estados y piezas de IA, frente a lo que traería la librería.',
    ajustes: [...FICHAS_MARCO_DATOS, ...FICHAS_LISTAS, ...FICHAS_ESTADOS_METRICAS, ...FICHAS_CELEBRACION, ...FICHAS_FORMULARIOS, ...FICHAS_IA],
  },
]

// Todos los ajustes, del marco y de cada módulo. Componentes › Todos los componentes los reparte (7-oct): los de una
// pieza son su ficha y los que cambian toda la librería van en «Reglas globales».
export const AJUSTES = GRUPOS.flatMap((grupo) => grupo.ajustes)

// Los ajustes que no son de una pieza sino de toda la librería: se ven en la pestaña «Reglas globales».
export const REGLAS_GLOBALES = ['campos', 'hover', 'hover-sin-borde', 'casillas', 'insignias', 'opacos', 'pestanas']

export const ajusteDe = (id: string | undefined) => AJUSTES.find((ajuste) => ajuste.id === id)

const REGLAS: Regla[] = [
  { titulo: 'Primero la librería', detalle: 'Antes de forzar, busca una variante o propiedad en el Storybook. Si existe, úsala.' },
  { titulo: 'Si hay que forzar, se documenta aquí', detalle: 'Con qué cambia, por qué, dónde vive y cuándo usarlo. Sin esto no se entrega.' },
  { titulo: 'Un ajuste, un lugar', detalle: 'El ajuste vive en una pieza compartida (src/shared) y las pantallas la importan; nunca se copia la clase.' },
  { titulo: 'Si falta en la librería, se pide', detalle: 'Queda como «Pedido a la librería» hasta que el equipo lo resuelva; luego se quita el ajuste.' },
  {
    titulo: 'De qué está hecho cada uno',
    detalle:
      'En cada ficha, «Hecho con» lista los componentes de ReUI —la base de la librería— con los que se arma la pieza. Cada etiqueta abre su ficha en reui.io.',
  },
]

function Bloque({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <Heading as="h4" level={6}>
        {titulo}
      </Heading>
      {children}
    </div>
  )
}

function Lista({ items }: { items: string[] }) {
  return (
    <ul className="flex list-disc flex-col gap-0.5 ps-4">
      {items.map((item) => (
        <li key={item}>
          <Text as="span" variant="muted" size="sm">
            {item}
          </Text>
        </li>
      ))}
    </ul>
  )
}

// Los componentes de ReUI con los que se arma la pieza, cada uno enlazado a su ficha.
function Piezas({ ajuste }: { ajuste: Ajuste }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <Text as="span" variant="muted" size="xs" weight="medium">
          Hecho con
        </Text>
        {ajuste.piezas.map((pieza) => (
          <Badge
            key={pieza.nombre}
            variant="secondary"
            size="sm"
            render={<a href={`https://reui.io/components/${pieza.slug}`} target="_blank" rel="noreferrer" />}
          >
            {pieza.nombre}
          </Badge>
        ))}
        {ajuste.piezas.length === 0 ? (
          <Text as="span" variant="muted" size="xs">
            nada de la librería
          </Text>
        ) : null}
      </div>
      {ajuste.hechoAMano ? (
        <Text as="p" variant="muted" size="xs">
          {ajuste.hechoAMano}
        </Text>
      ) : null}
    </div>
  )
}

// Cada ejemplo es un panel del mismo marco (sin caja dentro de otra caja), lado a lado desde tablet.
function Muestra({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <FramePanel className="flex min-w-0 flex-col gap-3">
      <Text as="span" variant="muted" size="xs" weight="medium">
        {titulo}
      </Text>
      <div className="flex min-h-28 min-w-0 flex-1 items-center justify-center">{children}</div>
    </FramePanel>
  )
}

export function TarjetaAjuste({ ajuste }: { ajuste: Ajuste }) {
  const estado = ESTADO[ajuste.estado]
  return (
    <Frame id={ajuste.id}>
      <FrameHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <FrameTitle>{ajuste.titulo}</FrameTitle>
          <FrameDescription>{ajuste.resumen}</FrameDescription>
        </div>
        <Badge variant={estado.badge} title={estado.ayuda}>
          {estado.etiqueta}
        </Badge>
        <div className="w-full">
          <Piezas ajuste={ajuste} />
        </div>
      </FrameHeader>
      <div className="grid gap-1 md:grid-cols-2">
        <Muestra titulo="En la librería">{ajuste.libreria}</Muestra>
        <Muestra titulo="En UBITS">{ajuste.ubits}</Muestra>
      </div>
      <FramePanel className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Bloque titulo="Qué cambia">
          <Lista items={ajuste.cambia} />
        </Bloque>
        <Bloque titulo="Por qué">
          <Text as="p" variant="muted" size="sm">
            {ajuste.porque}
          </Text>
        </Bloque>
        <Bloque titulo="Dónde vive">
          <Lista items={ajuste.donde} />
        </Bloque>
        <Bloque titulo="Cuándo usarlo">
          <Text as="p" size="sm">
            {ajuste.usar}
          </Text>
          <Text as="p" variant="muted" size="sm">
            No: {ajuste.evitar}
          </Text>
        </Bloque>
      </FramePanel>
    </Frame>
  )
}

// Componentes › Todos los componentes › Reglas globales (7-oct): los ajustes que cambian toda la librería, no una pieza.
// Los de una pieza se ven en su ficha (/design-system/componentes/ficha/:id).
export function ReglasGlobales() {
  const reglas = REGLAS_GLOBALES.map((id) => ajusteDe(id)).filter((ajuste): ajuste is Ajuste => !!ajuste)
  return (
    <div className="flex flex-col gap-8">
      <Reglas titulo="Antes de forzar algo" reglas={REGLAS} />
      <div className="flex flex-col gap-4">
        {reglas.map((ajuste) => (
          <TarjetaAjuste key={ajuste.id} ajuste={ajuste} />
        ))}
      </div>
    </div>
  )
}

export { ESTADO as ESTADO_AJUSTE }
