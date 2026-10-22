import { useState, type CSSProperties } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  Building03Icon,
  HierarchySquare02Icon,
  LockPasswordIcon,
  PaintBrush01Icon,
  Tick02Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  cn,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
// La insignia del proyecto: sube «xs» a 10.5px, el mínimo legible (regla del 25 sep).
import { Badge } from '@/shared/components/Badge'
import { Link, useLocation } from 'react-router'
import metaLogo from '@/shared/assets/meta.png'
import { notify } from '@/shared/components/notify'
import { CONFIGURACION_ADMIN, CONFIGURACION_EMPRESA, getSectionId } from '@/shared/layouts/nav-config'
import { setEmpresaActiva, useEmpresaActiva } from './empresa-activa'
import gauge from './account-gauge.module.css'

type Company = {
  id: string
  name: string
  plan: string
  logo?: string
  initial: string
  // Degradado de la baldosa cuando la empresa no tiene logo.
  tone?: string
  people: number
  licenses: [number, number]
  // Una bolsa por producto con IA, que no se suman (13 oct, PM de Selección: «son bolsas de crédito independientes»).
  credits: { seleccion: [number, number]; lms: [number, number] }
}

const COMPANIES: Company[] = [
  { id: 'meta', name: 'Meta Colombia', plan: 'Pro', logo: metaLogo, initial: 'MC', people: 940, licenses: [940, 1000], credits: { seleccion: [13180, 30000], lms: [3760, 5000] } },
  // UBITS usa su propio producto, así que también es una empresa de la plataforma. Está aquí para poder enseñar el
  // caso de una empresa con **dos catálogos** —el que le vende a sus clientes y Ubits College, su formación
  // interna—, que no se podía contar desde una empresa que no es UBITS (Dave, 6-oct).
  { id: 'ubits', name: 'UBITS', plan: 'Pro', logo: '/ubits-logo.svg', initial: 'UB', people: 318, licenses: [318, 350], credits: { seleccion: [34000, 40000], lms: [18000, 20000] } },
  { id: 'alpha', name: 'Alpha Logística', plan: 'Esencial', initial: 'AL', people: 212, licenses: [212, 250], credits: { seleccion: [6200, 7000], lms: [2200, 3000] } },
  { id: 'beta', name: 'Beta Retail', plan: 'Esencial', initial: 'BR', people: 1480, licenses: [1480, 2000], credits: { seleccion: [22000, 40000], lms: [9000, 20000] } },
  { id: 'omega', name: 'Omega Salud', plan: 'Esencial', initial: 'OS', people: 96, licenses: [96, 150], credits: { seleccion: [1500, 3000], lms: [600, 2000] } },
]

const CONFIG = [
  { name: 'Gestión de usuarios', icon: UserGroupIcon },
  { name: 'Personalización', icon: PaintBrush01Icon },
  { name: 'Organigrama', icon: HierarchySquare02Icon },
  { name: 'Datos de empresa', icon: Building03Icon },
  { name: 'Roles y permisos', icon: LockPasswordIcon },
]

const format = (value: number) => value.toLocaleString('es-CO')

// Insignia del plan (1 oct, Charlie): Esencial en azul (`info-light` de la librería) y Pro en violeta. La librería no
// trae una insignia violeta: Pro copia la forma de `info-light` con el token `premium` del tema (src/index.css).
// Concesión documentada en Design system › Marco › Ajustes propios («Insignia del plan Pro»).
const PLAN_PRO =
  'border-premium/15! bg-premium/10! text-premium-foreground! dark:border-premium/25! dark:bg-premium/15! dark:text-premium!'

// Baldosa de la empresa con radio proporcional a su tamaño, tomado de la escala del tema. La versión instalada de
// flux-ui solo trae avatar redondo; por eso se fuerzan las esquinas.
const LOGO_SHAPE = {
  mini: 'size-4.5! rounded-sm! after:rounded-sm!',
  row: 'size-5! rounded-sm! after:rounded-sm!',
  card: 'size-7! rounded-md! after:rounded-md!',
  head: 'size-9! rounded-sm! after:rounded-sm!',
}

function CompanyLogo({ company, size, className }: { company: Company; size: keyof typeof LOGO_SHAPE; className?: string }) {
  const shape = LOGO_SHAPE[size]
  const small = size === 'mini' || size === 'row'
  return (
    <Avatar
      className={cn(
        'shrink-0 shadow-xs',
        // Sin logo: baldosa en azul muy suave. Las iniciales se quedan en gris oscuro para que no se lea como una
        // insignia (esas van en azul sobre azul).
        company.logo ? 'bg-background' : 'bg-primary/10',
        shape,
        className,
      )}
    >
      {company.logo ? <AvatarImage src={company.logo} alt="" className="rounded-none! object-contain! p-[18%]" /> : null}
      <AvatarFallback className={cn('bg-transparent!', shape)}>
        {/* El color va en la letra con «!»: al resaltar la fila, el menú pinta todo el texto de oscuro. */}
        <span className={`${small ? 'text-[9px]' : 'text-[10px]'} font-semibold tracking-wide text-foreground/70!`}>
          {company.initial}
        </span>
      </AvatarFallback>
    </Avatar>
  )
}

// Medidor en anillo: porcentaje en el centro, nombre y lo que queda al lado, y el consumo a la derecha.
// Licencias va siempre en azul; los créditos, con el degradado de la IA (ver account-gauge.module.css).
// Exportado para su ficha en el design system (Componentes › Anillos de consumo, 7-oct).
export function Gauge({ label, value, ai }: { label: string; value: [number, number]; ai?: boolean }) {
  const [used, total] = value
  const percent = Math.round((used / total) * 100)
  return (
    <div className="flex min-w-0 items-center gap-3 px-2.5 py-2">
      {/* Sin `role="img"`: dentro del menú solo se admiten opciones y rompía su estructura (AA 4.1.2). El porcentaje del
          centro ya es texto, así que el anillo no necesita nombre propio. */}
      <span
        className={cn('relative flex size-8 shrink-0 items-center justify-center rounded-full', ai && gauge.ai)}
        style={
          {
            '--p': `${percent}%`,
            '--p-num': percent,
            ...(ai ? {} : { background: `conic-gradient(var(--primary) ${percent}%, var(--border) 0)` }),
          } as CSSProperties
        }
      >
        {/* Puntas redondas al inicio y al final del trazo (ver account-gauge.module.css). */}
        {percent > 0 ? (
          <>
            <span aria-hidden="true" className={cn(gauge.cap, gauge.capStart)} />
            <span aria-hidden="true" className={cn(gauge.cap, gauge.capEnd)} />
          </>
        ) : null}
        <span className="flex size-6.5 items-center justify-center rounded-full bg-popover tabular-nums text-[9px] font-medium tabular-nums">
          {percent}%
        </span>
      </span>
      {/* Nombre y consumo pegados (1 oct, «reduce el espacio»), como el nombre y los colaboradores de arriba. */}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-xs leading-tight font-medium">{label}</span>
        <span className="truncate text-[11px] leading-tight text-muted-foreground tabular-nums">
          {format(used)} de {format(total)}
        </span>
      </span>
    </div>
  )
}

// Tarjeta de cuenta (logo, nombre y chevron) y su menú, del mismo ancho que la tarjeta:
// empresa con plan y consumo, configuración con iconos sueltos, y «Cambiar de empresa» en un submenú
// que deja ver de un vistazo las otras empresas.
// `compact` es la versión del riel (barra plegada): el disparador es la baldosa con el logo, y el menú es el mismo.
// `cliente` deja ver la tarjeta de la empresa también dentro del design system (las fichas la muestran tal cual).
export function AccountPopover({ compact = false, cliente = false }: { compact?: boolean; cliente?: boolean } = {}) {
  const [open, setOpen] = useState(false)
  // La empresa vive fuera del menú: hay pantallas que muestran cosas distintas según cuál sea (los catálogos de
  // Contenidos, el primer caso). Antes se la guardaba aquí y nadie más se enteraba.
  const companyId = useEmpresaActiva()
  const company = COMPANIES.find((item) => item.id === companyId) ?? COMPANIES[0]
  const { pathname } = useLocation()
  const seccion = getSectionId(pathname)

  // En las páginas del design system la marca no es la del cliente: es la del sistema, Bold+.
  if (!cliente && (seccion === 'design-system' || seccion === 'design-system-ai')) {
    if (compact) {
      return (
        <BotonIcono
          size="icon"
          nativeButton={false}
          render={<Link to="/design-system" />}
          aria-label="BOLD+ · ir al inicio del design system"
          className="size-10! [border-color:var(--border)]! bg-background! [background-clip:border-box]! shadow-xs transition-colors hover:bg-foreground/4! dark:[border-color:var(--input)]! dark:hover:bg-foreground/4!"
        >
          <Avatar className="size-6.5 rounded-sm">
            <AvatarFallback className="rounded-sm bg-primary text-primary-foreground">
              <span className="text-xs">B</span>
            </AvatarFallback>
          </Avatar>
        </BotonIcono>
      )
    }
    return (
      <Button
        variant="outline"
        nativeButton={false}
        render={<Link to="/design-system" />}
        size="lg" className="w-full justify-start gap-3! pr-2.5! pl-1.75! text-left shadow-xs"
      >
        <Avatar className="size-7 shrink-0 rounded-md">
          <AvatarFallback className="rounded-md bg-primary text-primary-foreground">B</AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">BOLD+</span>
      </Button>
    )
  }

  const switchTo = (next: Company) => {
    if (next.id === company.id) return
    setEmpresaActiva(next.id)
    notify(`Ahora estás en ${next.name}`)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      {compact ? (
        // En el riel el disparador es la baldosa del logo, con el mismo aspecto que tenía antes de abrir el menú.
        <DropdownMenuTrigger
          render={
            <BotonIcono
              size="icon"
              aria-label={`${company.name} · abrir menú de la cuenta`}
              className="size-10! [border-color:var(--border)]! bg-background! [background-clip:border-box]! shadow-xs transition-colors hover:bg-foreground/4! data-popup-open:bg-foreground/4! dark:[border-color:var(--input)]! dark:hover:bg-foreground/4!"
            />
          }
        >
          {/* El logo de la empresa en la que estás: antes iba fijo el de Meta y al cambiar de empresa el riel
              seguía mostrándolo. */}
          <CompanyLogo company={company} size="mini" className="size-6.5 bg-transparent! shadow-none!" />
        </DropdownMenuTrigger>
      ) : (
        <DropdownMenuTrigger
          render={<Button variant="outline" size="lg" className="h-auto! w-full justify-start gap-3! py-1.5! pr-2.5! pl-1.75! text-left shadow-xs" />}
        >
          <CompanyLogo company={company} size="card" />
          {/* Debajo del nombre, el plan contratado en una insignia informativa (pedido de diseño, 1 oct). */}
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-sm leading-tight font-semibold">{company.name}</span>
            <span className="flex items-center gap-1.5 text-xs leading-tight font-normal text-muted-foreground">
              Plan
              <Badge variant="info-light" size="xs" className={company.plan === 'Pro' ? PLAN_PRO : undefined}>
                {company.plan}
              </Badge>
            </span>
          </span>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            size={16}
            className={cn('shrink-0 text-muted-foreground transition-transform duration-200', open && 'rotate-180')}
          />
        </DropdownMenuTrigger>
      )}

      {/* El menú de la librería es translúcido y se leía la barra de atrás: se deja con fondo sólido. */}
      <DropdownMenuContent
        align="start"
        side={compact ? 'right' : 'bottom'}
        sideOffset={compact ? 10 : 6}
        className={cn('p-1! bg-popover!', compact ? 'w-72!' : 'w-(--anchor-width)!')}
      >
        {/* Misma organización que el menú de perfil (1 oct): arriba dos tarjetas con borde suave y esquinas de 10px —quién
            es la empresa con su consumo, y el cambio de empresa— y debajo la configuración en lista. Nada dentro de un menú
            de 12px es más redondo que el menú (18 sep). */}
        <div className="flex flex-col gap-1 p-0.5">
          {/* La empresa y su consumo en una sola tarjeta: nombre y colaboradores pegados (1 oct, «menos espacio») y,
              tras una línea, los dos anillos. */}
          <div className="flex flex-col divide-y overflow-hidden rounded-sm border bg-muted/30">
            <div className="flex items-center gap-3 p-2.5">
              <CompanyLogo company={company} size="head" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm leading-tight font-semibold">{company.name}</span>
                {/* Solo el número de colaboradores, sin la etiqueta del plan (pedido de diseño). */}
                <span className="truncate text-[13px] leading-tight text-muted-foreground">{format(company.people)} colaboradores</span>
              </div>
            </div>
            <Gauge label="Licencias" value={company.licenses} />
            <Gauge label="Créditos de Selección" value={company.credits.seleccion} ai />
            <Gauge label="Créditos de LMS Creator" value={company.credits.lms} ai />
          </div>

          {/* Cambiar de empresa en tarjeta, como «Vista actual» del perfil: toda la tarjeta abre el submenú y el icono de la
              derecha dice que cambia. Se oculta la flecha que la librería le pone al disparador del submenú. */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="group/cambio items-center! gap-3! rounded-sm! border bg-muted/30! p-2.5! data-highlighted:bg-muted! data-popup-open:bg-muted! [&>svg]:hidden!">
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-xs text-muted-foreground!">Tus empresas</span>
                <span className="truncate text-sm font-medium">Cambiar de empresa</span>
                <span className="truncate text-xs text-muted-foreground!">{COMPANIES.length} empresas</span>
              </span>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-sm border bg-background shadow-xs transition-colors group-data-highlighted/cambio:border-primary/30 group-data-highlighted/cambio:text-primary group-data-popup-open/cambio:border-primary/30 group-data-popup-open/cambio:text-primary">
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} aria-hidden="true" />
              </span>
            </DropdownMenuSubTrigger>
          {/* Selector de empresas: la actual arriba en una tarjeta teñida con check lleno; las demás en filas
              de dos líneas (plan y personas) que muestran una flecha al pasar el cursor. Sin «Agregar empresa» (pedido de diseño). */}
          <DropdownMenuSubContent sideOffset={8} className="w-72! bg-popover! p-1.5!">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex! items-center justify-between px-2! pt-1! pb-2! text-xs! font-medium! text-muted-foreground!">
                Tus empresas
                <Badge variant="secondary" radius="full" size="xs">
                  <span className="tabular-nums text-[10px] tabular-nums">{COMPANIES.length}</span>
                </Badge>
              </DropdownMenuLabel>
              <div className="flex flex-col gap-0.5">
                {[company, ...COMPANIES.filter((item) => item.id !== company.id)].map((item) => {
                  const current = item.id === company.id
                  return (
                    <DropdownMenuItem
                      key={item.id}
                      className={cn(
                        'group/company gap-3! px-2! py-2!',
                        current && 'mb-1 bg-primary/6! ring-1 ring-primary/20 ring-inset data-highlighted:bg-primary/10!',
                      )}
                      onClick={() => switchTo(item)}
                    >
                      <CompanyLogo company={item} size="card" />
                      {/* Nombre y plan pegados (1 oct, «menos espacio»). */}
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm leading-tight font-medium">{item.name}</span>
                        {/* En la empresa actual el gris va un poco más oscuro: sobre su fondo azul resaltado el gris del tema
                            quedaba en 4.4:1 (AA pide 4.5). */}
                        <span className={cn('truncate text-xs leading-tight', current ? 'text-foreground/70!' : 'text-muted-foreground!')}>
                          {item.plan} · {format(item.people)} personas
                        </span>
                      </span>
                      {current ? (
                        // El color va en el propio icono: al resaltar la fila, el menú pinta de oscuro todos los iconos
                        // de adentro y el check blanco se volvía negro sobre el azul.
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary **:text-primary-foreground!">
                          <HugeiconsIcon icon={Tick02Icon} size={12} strokeWidth={2.5} />
                        </span>
                      ) : (
                        <HugeiconsIcon
                          icon={ArrowRight01Icon}
                          size={14}
                          className="shrink-0 -translate-x-1 text-muted-foreground! opacity-0 **:text-muted-foreground! transition-all duration-200 group-data-highlighted/company:translate-x-0 group-data-highlighted/company:opacity-100"
                        />
                      )}
                    </DropdownMenuItem>
                  )
                })}
              </div>
            </DropdownMenuGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        </div>

        <DropdownMenuSeparator />

        {/* Título del bloque (1 oct): el rótulo del menú de la librería, dentro de su grupo (fuera revienta Base UI). */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>Configuración</DropdownMenuLabel>
          {CONFIG.map((item) => {
            // En las plantillas del design system, Configuración lleva a sus pantallas (Gestión de usuarios y
            // las demás); en el admin, a las que ya existen. En el resto todavía no hay pantalla: solo avisa.
            const ruta =
              seccion === 'plantilla-admin'
                ? CONFIGURACION_EMPRESA[item.name]
                : seccion === 'admin'
                  ? CONFIGURACION_ADMIN[item.name]
                  : undefined
            return (
              <DropdownMenuItem
                key={item.name}
                render={ruta ? <Link to={ruta} /> : undefined}
                onClick={ruta ? undefined : () => notify(item.name)}
              >
                <HugeiconsIcon icon={item.icon} size={16} strokeWidth={1.6} className="text-muted-foreground" />
                {item.name}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
