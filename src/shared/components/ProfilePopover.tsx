import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowDataTransferHorizontalIcon,
  CircleLock01Icon,
  LifebuoyIcon,
  LogoutSquare01Icon,
  ComputerIcon,
  Moon02Icon,
  Sun03Icon,
} from '@hugeicons/core-free-icons'
import { useNavigate } from 'react-router'
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Text,
  ToggleGroup,
  ToggleGroupItem,
  useTheme,
  type ThemeMode,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import avatarPhoto from '@/shared/assets/avatar-carolina.jpg'
import { Hint } from '@/shared/components/Hint'
import { notify } from '@/shared/components/notify'

// Opción del selector de tema (el diseño original, que el usuario prefirió a las pestañas de ReUI): la elegida va
// elevada como un botón outline (fondo, filo y sombra).
// Cada opción reacciona por su cuenta: se marca la que tiene el cursor (18 sep).
// Esquinas (1 oct): ya no en pastilla. La bandeja va a 8px y cada opción a 6px (8 menos los 2px de aire), concéntricas
// y nunca más redondas que el menú de 12px.
const THEME_ITEM =
  'size-6.5! min-w-0! rounded-[6px]! border! border-transparent! p-0! transition-colors not-aria-pressed:hover:bg-foreground/10! aria-pressed:border-border! aria-pressed:bg-background! aria-pressed:shadow-xs! dark:aria-pressed:border-input! dark:aria-pressed:bg-input/30!'

const THEME_TRACK = 'rounded-[8px]! bg-muted p-0.5'
const THEME_ICON_OFF = 'text-muted-foreground!'

// Las tres opciones del tema, en el orden en que las recorre la fila.
const TEMAS: { valor: ThemeMode; etiqueta: string; icono: typeof Sun03Icon }[] = [
  { valor: 'light', etiqueta: 'Claro', icono: Sun03Icon },
  { valor: 'dark', etiqueta: 'Oscuro', icono: Moon02Icon },
  { valor: 'system', etiqueta: 'Sistema', icono: ComputerIcon },
]

// Avatar circular con la foto de la persona (las iniciales solo si la foto no carga). Punto verde de «en línea» solo
// en el menú; su anillo toma el color de la superficie de atrás.
function ProfileAvatar({ size }: { size: 'sm' | 'md' }) {
  return (
    <Avatar className={size === 'sm' ? 'size-full!' : 'size-10!'}>
      <AvatarImage src={avatarPhoto} alt="" className="object-cover" />
      <AvatarFallback className="bg-foreground/8! font-medium text-foreground!">
        {/* El tamaño va en el texto: el cn de la librería descartaba el color al combinarlo con un tamaño. */}
        <span className={size === 'sm' ? 'text-[11px]' : 'text-sm'}>CV</span>
      </AvatarFallback>
      {size === 'md' ? <AvatarBadge aria-hidden="true" className="size-2.5 bg-success! ring-popover!" /> : null}
    </Avatar>
  )
}

// Menú de perfil del header, calcado del ejemplo «User profile dropdown menu with theme toggle» de ReUI
// (c-dropdown-menu-14) con la misma información de antes: cabecera con foto, nombre, rol y correo; los accesos; el tema
// con el selector sol/luna original en su fila; «Cerrar sesión» con la variante de peligro y la versión al pie.
// El disparador es el avatar circular con foto, aparte del botón de procesos. Con el menú abierto lo rodea un anillo
// azul (a la foto no se le puede pintar el azul de los iconos del header).
export function ProfilePopover() {
  const navigate = useNavigate()
  const { mode, setMode } = useTheme()
  const [open, setOpen] = useState(false)
  const modo: ThemeMode = mode === 'dark' || mode === 'system' ? mode : 'light'
  const indice = TEMAS.findIndex((tema) => tema.valor === modo)
  const actual = TEMAS[indice]
  const siguiente = TEMAS[(indice + 1) % TEMAS.length]

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <Hint label="Tu perfil">
        <DropdownMenuTrigger
          render={
            <BotonIcono
              className="size-8.5! border-0! p-0! ring-offset-2 ring-offset-background transition-shadow hover:bg-transparent! hover:ring-2 hover:ring-foreground/10 aria-expanded:ring-2 aria-expanded:ring-primary dark:hover:bg-transparent!"
              aria-label="Perfil"
            />
          }
        >
          <ProfileAvatar size="sm" />
        </DropdownMenuTrigger>
      </Hint>

      {/* El menú de la librería es translúcido y se leía lo de atrás: se deja con fondo sólido. */}
      <DropdownMenuContent align="end" sideOffset={8} className="w-62 bg-popover!">
        {/* Diagramación en bloques (1 oct, referencia de Charlie): arriba dos tarjetas —quién eres y dónde estás— y debajo
            las opciones en lista. Esquinas de 10px: nada dentro de un menú de 12px puede ser más redondo que el menú. */}
        <div className="flex flex-col gap-1 p-0.5">
          {/* Quién eres: foto, nombre y correo a 2px (van en pareja) y el rol en su línea. */}
          <div className="flex items-start gap-3 rounded-sm border bg-muted/30 p-2.5">
            <ProfileAvatar size="md" />
            <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5 pt-0.5">
              <Text as="span" size="sm" weight="medium" className="w-full truncate leading-tight">
                Carolina Vargas
              </Text>
              <Text as="span" variant="muted" size="xs" className="w-full truncate">
                carolina.vargas@meta.com
              </Text>
            </div>
          </div>

          {/* Dónde estás: la vista actual y el cambio al Portal colaborador, como «Workspace actual» de la referencia.
              Toda la tarjeta es una opción del menú (teclado y lector la anuncian como «Cambiar al Portal colaborador»);
              el icono de la derecha solo indica que cambia de vista. */}
          <DropdownMenuItem
            aria-label="Cambiar al Portal colaborador"
            className="group/vista items-center! gap-3! rounded-sm! border bg-muted/30! p-2.5! data-highlighted:bg-muted!"
            onClick={() => {
              navigate('/portal-colaborador')
              notify('Estás en el Portal colaborador')
            }}
          >
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-xs text-muted-foreground!">Vista actual</span>
              <span className="truncate text-sm font-medium">Administrador</span>
              <span className="truncate text-xs text-muted-foreground!">Meta Colombia</span>
            </span>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-sm border bg-background shadow-xs transition-colors group-data-highlighted/vista:border-primary/30 group-data-highlighted/vista:text-primary">
              <HugeiconsIcon icon={ArrowDataTransferHorizontalIcon} size={16} aria-hidden="true" />
            </span>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {/* Antes era un botón del header; ahora vive aquí, junto a los accesos de la cuenta (1 oct). */}
          <DropdownMenuItem onClick={() => notify('Centro de ayuda · guías y contacto')}>
            <HugeiconsIcon icon={LifebuoyIcon} aria-hidden="true" />
            Centro de ayuda
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => notify('Cambiar contraseña')}>
            <HugeiconsIcon icon={CircleLock01Icon} aria-hidden="true" />
            Cambiar contraseña
          </DropdownMenuItem>
        </DropdownMenuGroup>

        {/* Tema: fila con el mismo aire que las opciones y el selector a la derecha (no cierra el menú). Tres opciones desde
            el 1 oct: claro, oscuro y sistema (sigue al equipo). La fila entera es una opción del menú para el teclado
            (AA 4.1.2 y 2.1.1): Enter o Espacio pasan a la siguiente en orden claro → oscuro → sistema. */}
        <DropdownMenuItem
          closeOnClick={false}
          // Sin fondo al pasar el cursor (17 sep): la fila no se ilumina, el que responde es el selector.
          className="group hover:bg-transparent! focus:bg-transparent! data-highlighted:bg-transparent!"
          aria-label={`Tema: ${actual.etiqueta.toLowerCase()}. Cambiar a ${siguiente.etiqueta.toLowerCase()}`}
          onClick={() => setMode(siguiente.valor)}
        >
          <HugeiconsIcon icon={actual.icono} size={16} strokeWidth={1.6} className="text-muted-foreground" />
          <span className="flex-1">Tema</span>
          {/* Cada botón se puede pulsar y se ilumina por su cuenta. El clic no sube a la fila (si no, cambiaría el tema dos
              veces). La fila sigue siendo opción del menú para el teclado. */}
          <span className="flex" onClick={(e) => e.stopPropagation()}>
            <ToggleGroup
              value={[modo]}
              onValueChange={(v) => v[0] && setMode(v[0] as ThemeMode)}
              spacing={0.5}
              className={THEME_TRACK}
            >
              {TEMAS.map((tema) => (
                <ToggleGroupItem key={tema.valor} value={tema.valor} aria-label={`Tema ${tema.etiqueta.toLowerCase()}`} className={THEME_ITEM}>
                  <HugeiconsIcon icon={tema.icono} size={14} className={modo === tema.valor ? 'text-primary!' : THEME_ICON_OFF} />
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive" onClick={() => notify('Sesión cerrada')}>
            <HugeiconsIcon icon={LogoutSquare01Icon} aria-hidden="true" />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
