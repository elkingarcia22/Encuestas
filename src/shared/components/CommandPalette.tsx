import { useEffect, useMemo, useState, type RefObject } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { Add01Icon, ArrowTurnBackwardIcon, Briefcase01Icon, Clock01Icon, File01Icon, UserIcon } from '@hugeicons/core-free-icons'
import { useNavigate } from 'react-router'
import { Command, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut, Dialog, DialogContent, DialogDescription, DialogTitle, IconTile, Kbd } from '@ubits/flux-ui'
import { ICONO_IA, sidebarNavs } from '@/shared/layouts/nav-config'
import { Orb } from './Orb'
import { PALETTE_OBJECTS } from './shell-data'
import { notify } from './notify'

type CommandPaletteProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Dónde devolver el foco al cerrar (lo guarda useCommandPalette al abrir).
  returnFocus?: RefObject<HTMLElement | null>
}

// Lo que se puede abrir desde el buscador: una página del menú, un objeto (vacante, candidato, contenido) o una acción.
type Entrada = {
  id: string
  titulo: string
  bajada: string
  icono: IconSvgElement
  accion: string
  to?: string
  toast?: string
}

// Diagramación tomada de la referencia de Charlie (1 oct): filas con margen y esquinas (la marcada en el gris de la
// librería), baldosa de icono a la izquierda, título con su bajada y la acción solo en la fila marcada.
const ROW = 'mx-2 gap-3! px-2.5! py-2! animate-in fade-in slide-in-from-left-[6px] duration-300'

// Encabezados de grupo en frase normal y gris, sin versalitas: 13px y en negrita (1 oct, Charlie).
const GROUP =
  'p-0! **:[[cmdk-group-heading]]:px-5! **:[[cmdk-group-heading]]:pt-4! **:[[cmdk-group-heading]]:pb-1.5! **:[[cmdk-group-heading]]:text-[13px]! **:[[cmdk-group-heading]]:font-semibold!'

// Baldosa de icono de cada fila: gris suave, 40px y esquinas de 10px. En la fila marcada se oscurece un punto para no
// perderse sobre el fondo gris de la fila, como en la referencia.
const TILE =
  'size-10! rounded-[10px]! bg-muted! text-foreground/75! [--icon-tile-icon-size:18px] transition-colors group-data-selected/command-item:bg-foreground/8!'

// 1 · Acciones rápidas: crear lo que más se crea, cada una con su pantalla real.
const ACCIONES: Entrada[] = [
  { id: 'accion-vacante', titulo: 'Crear vacante', bajada: 'Selección · asistente paso a paso', icono: Add01Icon, accion: 'Crear', to: '/admin/seleccion/vacantes/crear' },
  { id: 'accion-contenido', titulo: 'Crear contenido', bajada: 'Aprendizaje · curso o lección con IA', icono: Add01Icon, accion: 'Crear', to: '/admin/aprendizaje/lms-creator/crear-contenido' },
  { id: 'accion-encuesta', titulo: 'Crear encuesta', bajada: 'Desempeño y cultura · encuesta nueva', icono: Add01Icon, accion: 'Crear', to: '/admin/desempeno-cultura/encuestas/crear' },
]

// Icono de cada objeto según lo que es (vacante, candidato o contenido).
function iconoDe(meta: string) {
  if (meta.startsWith('vacante')) return Briefcase01Icon
  if (meta.startsWith('candidato')) return UserIcon
  return File01Icon
}

const capital = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)

const OBJETOS: Entrada[] = PALETTE_OBJECTS.map((o) => ({
  id: `obj-${o.title}`,
  titulo: o.title,
  bajada: capital(o.meta),
  icono: iconoDe(o.meta),
  accion: o.action,
  to: o.to,
  toast: o.toast,
}))

// Las páginas reales del menú del administrador, aplanadas: la bajada dice de qué producto cuelgan.
function paginasDelMenu(): Entrada[] {
  const nav = sidebarNavs.admin
  const paginas: Entrada[] = [{ id: `pag-${nav.home.path}`, titulo: nav.home.title, bajada: 'Workspace', icono: nav.home.icon, accion: 'Ir a', to: nav.home.path }]
  for (const grupo of nav.groups) {
    for (const item of grupo.items) {
      if (!item.children?.length) {
        paginas.push({ id: `pag-${item.path}`, titulo: item.title, bajada: grupo.label || 'Workspace', icono: item.icon, accion: 'Ir a', to: item.path })
        continue
      }
      for (const hijo of item.children) {
        paginas.push({ id: `pag-${hijo.path}`, titulo: hijo.title, bajada: item.title, icono: hijo.icon ?? item.icon, accion: 'Ir a', to: hijo.path })
        for (const hoja of hijo.children ?? []) {
          paginas.push({ id: `pag-${hoja.path}`, titulo: hoja.title, bajada: `${item.title} › ${hijo.title}`, icono: hoja.icon ?? hijo.icon ?? item.icon, accion: 'Ir a', to: hoja.path })
        }
      }
    }
  }
  return paginas
}

const INDICE: Entrada[] = [...ACCIONES, ...OBJETOS, ...paginasDelMenu()]
const POR_ID = new Map(INDICE.map((e) => [e.id, e]))

// Sin tildes ni mayúsculas, para que «planes de formacion» encuentre «Planes de formación».
const normalizar = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

function buscar(texto: string) {
  const palabras = normalizar(texto).split(/\s+/).filter(Boolean)
  if (!palabras.length) return []
  return INDICE.filter((e) => {
    const donde = normalizar(`${e.titulo} ${e.bajada}`)
    return palabras.every((p) => donde.includes(p))
  }).slice(0, 8)
}

// 3 · Últimas búsquedas: lo último que se abrió desde el buscador, guardado en este navegador. Si el navegador no deja
// guardar (ventana privada), se muestran las de ejemplo.
const CLAVE_RECIENTES = 'ubits-busquedas-recientes'
const RECIENTES_INICIALES = [
  'obj-Analista de datos',
  'obj-Onboarding operativo',
  'pag-/admin/aprendizaje/planes-de-formacion/planes',
  'obj-Andrés Malo',
  'pag-/admin/seleccion/vacantes',
]

function leerRecientes(): string[] {
  try {
    const guardadas: unknown = JSON.parse(localStorage.getItem(CLAVE_RECIENTES) ?? 'null')
    return Array.isArray(guardadas) && guardadas.length ? guardadas.filter((id): id is string => typeof id === 'string') : RECIENTES_INICIALES
  } catch {
    return RECIENTES_INICIALES
  }
}

function guardarRecientes(ids: string[]) {
  try {
    localStorage.setItem(CLAVE_RECIENTES, JSON.stringify(ids))
  } catch {
    // Sin almacenamiento: las recientes duran lo que dura la página.
  }
}

// La acción («Crear», «Abrir», «Ir a», «Preguntar») y el ↵ aparecen solo en la fila marcada, como en la referencia.
function Accion({ children }: { children: string }) {
  return (
    <CommandShortcut className="flex items-center gap-2 text-sm! tracking-normal! opacity-0 transition-opacity group-data-selected/command-item:opacity-100">
      {children}
      <Kbd className="h-6! border bg-background! px-2!">
        <HugeiconsIcon icon={ArrowTurnBackwardIcon} size={14} />
      </Kbd>
    </CommandShortcut>
  )
}

function Fila({ entrada, icono, onSelect, style }: { entrada: Entrada; icono?: IconSvgElement; onSelect: () => void; style: object }) {
  return (
    <CommandItem value={entrada.id} onSelect={onSelect} className={ROW} style={style}>
      <IconTile variant="solid" className={TILE}>
        {(icono ?? entrada.icono) === ICONO_IA ? <Orb className="size-4.5" /> : <HugeiconsIcon icon={icono ?? entrada.icono} size={18} />}
      </IconTile>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[15px] font-medium">{entrada.titulo}</span>
        <span className="truncate text-sm text-muted-foreground">{entrada.bajada}</span>
      </span>
      <Accion>{entrada.accion}</Accion>
    </CommandItem>
  )
}

function FilaOrbit({ titulo, onSelect, style }: { titulo: string; onSelect: () => void; style: object }) {
  return (
    <CommandItem value="preguntar" onSelect={onSelect} className={ROW} style={style}>
      <Orb className="size-10" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[15px] font-medium">{titulo}</span>
        <span className="truncate text-sm text-muted-foreground">Inicia una nueva conversación con Orbit</span>
      </span>
      <Accion>Preguntar</Accion>
    </CommandItem>
  )
}

const PREGUNTA_SUGERIDA = '¿Cuántas vacantes de analista están abiertas y en qué etapa van?'

// Buscador ⌘K en dos momentos (1 oct, referencias de Charlie):
// - Sin escribir: 1. Acciones rápidas, 2. Preguntar a Orbit y 3. Últimas búsquedas.
// - Al escribir: «Pregunta «…»» a Orbit arriba y, debajo, lo que coincide en el producto (páginas del menú, vacantes,
//   candidatos y contenidos). Queda marcado el primer resultado, que suele ser lo que se busca; Orbit queda a una flecha.
//   Sin coincidencias, se dice y queda Orbit marcado.
export function CommandPalette({ open, onOpenChange, returnFocus }: CommandPaletteProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [recientes, setRecientes] = useState(leerRecientes)
  // La fila marcada se controla para que, al escribir, quede en el primer resultado y no en la pregunta a Orbit.
  const [marcada, setMarcada] = useState('')

  const typed = query.trim()
  const resultados = useMemo(() => buscar(typed), [typed])
  // Las 5 últimas (1 oct, Charlie). Si hay menos guardadas, se completan con las de ejemplo.
  const ultimas = [...new Set([...recientes, ...RECIENTES_INICIALES])]
    .map((id) => POR_ID.get(id))
    .filter((e): e is Entrada => Boolean(e))
    .slice(0, 5)

  // Al escribir, la lista de la librería vuelve a marcar su primera fila (Orbit). Un cuadro después se marca el primer
  // resultado, como en la referencia; sin resultados, se queda Orbit.
  const primero = typed ? (resultados[0]?.id ?? 'preguntar') : ''
  useEffect(() => {
    if (!primero) return
    const id = requestAnimationFrame(() => setMarcada(primero))
    return () => cancelAnimationFrame(id)
  }, [primero, typed])

  const close = () => onOpenChange(false)

  const abrir = (entrada: Entrada) => {
    close()
    // Lo que se abre pasa al primer lugar de las últimas búsquedas (las acciones de crear no cuentan).
    if (!entrada.id.startsWith('accion-')) {
      const siguientes = [entrada.id, ...recientes.filter((id) => id !== entrada.id)].slice(0, 6)
      setRecientes(siguientes)
      guardarRecientes(siguientes)
    }
    if (entrada.to) navigate(entrada.to)
    if (entrada.toast) notify(entrada.toast)
  }

  const preguntar = (texto: string) => {
    close()
    navigate(`/suite-ai/chat/libre?q=${encodeURIComponent(texto)}`)
  }

  let row = 0
  const delay = () => ({ animationDelay: `${row++ * 35}ms`, animationFillMode: 'both' })

  return (
    // Al terminar de cerrarse se limpia la búsqueda: la próxima vez abre vacío.
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) {
          setQuery('')
          setMarcada('')
        }
      }}
    >
      {/* Entrada del prototipo: baja 8px y crece desde 97% con un rebote suave. */}
      <DialogContent
        showCloseButton={false}
        finalFocus={returnFocus}
        className="top-27.5! translate-y-0! gap-0! overflow-hidden p-0! duration-300! ease-[cubic-bezier(0.22,1.2,0.36,1)]! slide-in-from-top-[8px] zoom-in-97! sm:max-w-205!"
      >
        <DialogTitle className="sr-only">Buscar o ir a</DialogTitle>
        <DialogDescription className="sr-only">Crea, abre lo último que buscaste, busca en UBITS o pregúntale a Orbit.</DialogDescription>

        {/* `min-w-0` y filas que pueden partirse: en un teléfono (320px) no se recorta nada (AA 1.4.10). */}
        <Command shouldFilter={false} value={marcada} onValueChange={setMarcada} className="min-w-0 rounded-none! bg-transparent p-0!">
          {/* Campo sin caja (1 oct, referencia): la lupa y el texto pegados arriba, 56px de alto y una línea debajo. Es el
              CommandInput de la librería (semántica de combobox, anuncia la fila marcada); se le quitan borde, fondo y
              sombra de su grupo para que se lea como la cabecera de la ventana. */}
          <div className="border-b px-2 **:data-[slot=input-group]:h-14! **:data-[slot=input-group]:border-0! **:data-[slot=input-group]:bg-transparent! **:data-[slot=input-group]:shadow-none! **:data-[slot=input-group]:ring-0! **:data-[slot=command-input]:text-base!">
            <CommandInput autoFocus value={query} onValueChange={setQuery} placeholder="Buscar o ir a…" aria-label="Buscar o ir a" />
          </div>

          {/* Se anuncia al cambiar (AA 4.1.3): quien no ve la lista sabe cuántos resultados hay al escribir. */}
          <span role="status" className="sr-only">
            {typed ? `${resultados.length} resultados` : ''}
          </span>

          <CommandList label="Resultados" className="max-h-[min(44rem,76vh)]! pb-2">
            {typed ? (
              <>
                <CommandGroup heading="Orbit" className={GROUP}>
                  <FilaOrbit titulo={`Pregunta «${typed}»…`} onSelect={() => preguntar(typed)} style={delay()} />
                </CommandGroup>

                <CommandGroup heading="Resultados" className={GROUP}>
                  {resultados.length ? (
                    resultados.map((e) => <Fila key={e.id} entrada={e} onSelect={() => abrir(e)} style={delay()} />)
                  ) : (
                    <p className="px-5 pt-1 pb-3 text-sm text-muted-foreground">No encontramos «{typed}» en UBITS. Pregúntale a Orbit.</p>
                  )}
                </CommandGroup>
              </>
            ) : (
              <>
                <CommandGroup heading="Acciones rápidas" className={GROUP}>
                  {ACCIONES.map((e) => (
                    <Fila key={e.id} entrada={e} onSelect={() => abrir(e)} style={delay()} />
                  ))}
                </CommandGroup>

                <CommandGroup heading="Preguntar a Orbit" className={GROUP}>
                  <FilaOrbit titulo={PREGUNTA_SUGERIDA} onSelect={() => preguntar(PREGUNTA_SUGERIDA)} style={delay()} />
                </CommandGroup>

                {ultimas.length ? (
                  <CommandGroup heading="Últimas búsquedas" className={GROUP}>
                    {ultimas.map((e) => (
                      <Fila key={e.id} entrada={e} icono={Clock01Icon} onSelect={() => abrir(e)} style={delay()} />
                    ))}
                  </CommandGroup>
                ) : null}
              </>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
