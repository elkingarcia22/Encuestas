import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Bookmark01Icon,
  BookmarkAdd01Icon,
  Briefcase01Icon,
  Calendar03Icon,
  Cancel01Icon,
  Delete02Icon,
  FileImportIcon,
  FilterIcon,
  FilterResetIcon,
  Location01Icon,
  Notification01Icon,
  NotificationOff01Icon,
  Search01Icon,
  UserMultipleIcon,
  Alert02Icon,
} from '@hugeicons/core-free-icons'
import {
  Button,
  Checkbox,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
  FieldLabel,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Text,
  cn,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { ImagenGlass } from '@/shared/components/ImagenGlass'
import { personasTexto } from '../movimientos'
import {
  EXPERIENCIAS,
  SITUACION_TEXTO,
  SIN_FILTROS,
  coincideTexto,
  describirFiltros,
  filtrarBase,
  paisDe,
  vacantesAbiertas,
  type FiltroSituacion,
  type FiltrosBase,
  type PersonaViva,
} from '../base'
import { FiltroChip } from '@/modules/design-system/navegacion/filtro-chip'
import { CampoFiltro } from '@/modules/design-system/navegacion/campo-filtro'
import type { Base, CuentasBase } from './use-base'

// Las piezas para consultar la base global («Mis candidatos»). Todas leen y cambian los filtros de `useBase`, así que
// una búsqueda puesta en una pieza se ve en las demás.
//
// Cómo se acomodan (2 oct, Nicolás: «esto aquí parece un vómito»): eran cuatro filas con tres formas de control, un chip
// suelto en una fila propia y cifras que ya estaban arriba. Ahora, todo alineado a la izquierda bajo el título: buscar,
// «Filtros» (los cuatro campos y los dos atajos en un globo), las búsquedas guardadas y comparar con una vacante (IA, al
// final); debajo los grupos de la base; y, solo si hay algo puesto, una fila con cada filtro y su «x». El orden vive en
// los encabezados de la tabla.

const sinTildes = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/* Buscar ------------------------------------------------------------------------------------------------------- */

// Varias palabras se suman: «SQL Medellín» es quien sabe SQL y vive en Medellín.
export function BuscadorBase({ base, className }: { base: Base; className?: string }) {
  return (
    <InputGroup className={cn('w-80 max-w-full', className)}>
      <InputGroupAddon>
        <HugeiconsIcon icon={Search01Icon} size={16} />
      </InputGroupAddon>
      <InputGroupInput
        value={base.filtros.texto}
        onChange={(evento) => base.cambiar({ texto: evento.target.value })}
        placeholder="Nombre, cargo o lo que sabe hacer"
        aria-label="Buscar por nombre, correo, cargo, empresa, ciudad o lo que sabe hacer"
      />
      {base.filtros.texto ? (
        <InputGroupAddon align="inline-end">
          <InputGroupButton size="icon-xs" aria-label="Borrar la búsqueda" onClick={() => base.cambiar({ texto: '' })}>
            <HugeiconsIcon icon={Cancel01Icon} size={14} />
          </InputGroupButton>
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  )
}

/* La situación: los segmentos ---------------------------------------------------------------------------------- */

// «En proceso» y «Libres» van sin número (13 oct, información repetida): sus cifras están arriba, en «Cómo va tu base».
const SEGMENTOS: { valor: Exclude<FiltroSituacion, 'todas'>; texto: string; ayuda: string; cuenta?: keyof CuentasBase }[] = [
  { valor: 'proceso', texto: 'En proceso', ayuda: 'Ver solo a quien está en una vacante abierta' },
  { valor: 'libre', texto: 'Libres', ayuda: 'Ver solo a quien no está ni estuvo en ningún proceso' },
  { valor: 'descartada', texto: 'Se descartaron', ayuda: 'Ver solo a quien se descartó en un proceso y no está en otro', cuenta: 'descartada' },
  { valor: 'contratada', texto: 'Contratadas', ayuda: 'Ver solo a quien ya contrataron', cuenta: 'contratada' },
  { valor: 'duplicados', texto: 'Posibles duplicados', ayuda: 'Ver solo a quien parece estar dos veces en la base', cuenta: 'duplicados' },
]

// Se excluyen entre sí, como las etapas del pipeline de una vacante: sin ninguna puesta se ve toda la base; la puesta
// lleva la «x» para volver a todo. Cada una cuenta con los demás filtros puestos.
export function ChipsSituacion({ base, size }: { base: Base; size?: 'default' | 'sm' }) {
  return (
    <div role="group" aria-label="Filtrar por en qué anda" className="flex flex-wrap items-center gap-2">
      {SEGMENTOS.map((segmento) => (
        <FiltroChip
          key={segmento.valor}
          size={size}
          activo={base.filtros.situacion === segmento.valor}
          onCambiar={(activo) => base.cambiar({ situacion: activo ? segmento.valor : 'todas' })}
          icono={segmento.valor === 'duplicados' ? UserMultipleIcon : undefined}
          texto={segmento.texto}
          cuenta={segmento.cuenta ? base.cuentas[segmento.cuenta] : undefined}
          ayuda={segmento.ayuda}
        />
      ))}
    </div>
  )
}

/* «Filtros»: etiqueta, ciudad, experiencia y los dos atajos (sin origen desde el 8 oct: no se sabe por dónde llega cada persona) ------------------------------------------- */

type Opcion = { value: string; label: string }

// El campo de «Filtros» vive en el design system desde el 14 oct; se sigue exportando desde aquí.
export { CampoFiltro }

const conTodas = (todas: string, valores: string[]): Opcion[] => [{ value: 'todas', label: todas }, ...valores.map((valor) => ({ value: valor, label: valor }))]


// Un atajo que se prende y se apaga, con cuántas personas hay. Lo usa también el historial de Créditos (5 oct).
export function CasillaFiltro({ id, marcada, onCambiar, texto, cuenta }: { id: string; marcada: boolean; onCambiar: (marcada: boolean) => void; texto: string; cuenta: number }) {
  return (
    <Field orientation="horizontal">
      <Checkbox id={id} checked={marcada} onCheckedChange={(valor) => onCambiar(valor === true)} />
      <FieldLabel htmlFor={id} className="flex-1">
        {texto}
        <Text as="span" variant="muted" size="sm" className="ml-auto tabular-nums">
          {cuenta}
        </Text>
      </FieldLabel>
    </Field>
  )
}

// Cuántos de los del globo están puestos: es el número del botón y lo que quita «Quitar estos filtros». Etiqueta y
// experiencia ya no están en el globo (13 oct, PM: las etiquetas de una persona son sus habilidades, y «dos años de
// experiencia» sin decir en qué no dice nada: eso se le pide al agente), pero si el agente las puso se ven y se quitan.
const DEL_GLOBO: Partial<FiltrosBase> = {
  etiquetas: [],
  pais: 'todas',
  ciudad: 'todas',
  experiencia: 'todas',
  origen: 'todas',
  esperan: false,
  enProceso: false,
  recientes: false,
  duplicados: false,
}
const puestosEnElGlobo = (filtros: FiltrosBase) =>
  [
    filtros.etiquetas.length > 0,
    filtros.pais !== 'todas' || filtros.ciudad !== 'todas',
    filtros.experiencia !== 'todas',
    filtros.esperan,
    filtros.enProceso,
    filtros.recientes,
    filtros.duplicados,
  ].filter(Boolean).length

// 13 oct (reunión con la PM y el TL): la bolsa es para buscar gente, no para seguir procesos. Queda la ubicación (país y
// después ciudad: «si me pones ciudad, me tienes que poner país») y cuatro casillas: esperando acción, en algún proceso,
// entraron este mes y posibles duplicados. Sin los grupos de abajo (libres, descartadas, contratadas: el producto no
// tiene esos estados de la persona).
export function BotonFiltros({ base }: { base: Base }) {
  const { filtros } = base
  const puestos = puestosEnElGlobo(filtros)
  const ciudades = filtros.pais === 'todas' ? [] : base.ciudades.filter((ciudad) => paisDe(ciudad) === filtros.pais)
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>
        <HugeiconsIcon icon={FilterIcon} size={16} />
        Filtros
        {puestos ? (
          <Badge variant="invert" className="tabular-nums">
            {puestos}
          </Badge>
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[22rem]">
        <PopoverHeader>
          <PopoverTitle>Filtrar a las personas</PopoverTitle>
          <PopoverDescription>Se suman a lo que buscas.</PopoverDescription>
        </PopoverHeader>
        <div className="flex flex-col gap-3">
          <CampoFiltro
            id="filtro-pais"
            nombre="País"
            valor={filtros.pais}
            opciones={conTodas('Todos los países', base.paises)}
            onCambiar={(pais) => base.cambiar({ pais, ciudad: 'todas' })}
          />
          {/* La ciudad, después del país: sin país no se elige ciudad. */}
          <CampoFiltro
            id="filtro-ciudad"
            nombre="Ciudad"
            valor={filtros.ciudad}
            opciones={conTodas(filtros.pais === 'todas' ? 'Primero elige el país' : `Todas las de ${filtros.pais}`, ciudades)}
            onCambiar={(ciudad) => base.cambiar({ ciudad })}
          />
          <Separator />
          <CasillaFiltro id="filtro-esperan" marcada={filtros.esperan} onCambiar={(esperan) => base.cambiar({ esperan })} texto="Esperando acción" cuenta={base.cuentas.esperan} />
          <CasillaFiltro id="filtro-proceso" marcada={filtros.enProceso} onCambiar={(enProceso) => base.cambiar({ enProceso })} texto="En algún proceso" cuenta={base.cuentas.enProceso} />
          <CasillaFiltro id="filtro-recientes" marcada={filtros.recientes} onCambiar={(recientes) => base.cambiar({ recientes })} texto="Entraron este mes" cuenta={base.cuentas.recientes} />
          <CasillaFiltro id="filtro-duplicados" marcada={filtros.duplicados} onCambiar={(duplicados) => base.cambiar({ duplicados })} texto="Posibles duplicados" cuenta={base.cuentas.duplicados} />
          {puestos ? (
            <Button variant="ghost" size="sm" className="self-start" onClick={() => base.cambiar(DEL_GLOBO)}>
              <HugeiconsIcon icon={FilterResetIcon} size={16} />
              Quitar estos filtros
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Lo que está puesto, a la vista: un chip por filtro con su «x», y «Limpiar filtros» al final. Solo aparece si hay algo
// del globo o un lote; la búsqueda ya se ve puesta donde está.
export function FiltrosPuestos({ base }: { base: Base }) {
  const { filtros } = base
  if (!puestosEnElGlobo(filtros) && !base.loteFiltro && !base.paraVacante) return null
  const experiencia = EXPERIENCIAS.find((una) => una.valor === filtros.experiencia)?.texto
  const ubicacion = filtros.ciudad !== 'todas' ? `${filtros.ciudad}, ${paisDe(filtros.ciudad)}` : filtros.pais !== 'todas' ? filtros.pais : null
  return (
    <div role="group" aria-label="Filtros puestos" className="flex w-full flex-wrap items-center gap-2">
      {ubicacion ? (
        <FiltroChip
          activo
          onCambiar={() => base.cambiar({ pais: 'todas', ciudad: 'todas' })}
          icono={Location01Icon}
          texto={`Ubicación: ${ubicacion}`}
          ayuda={`Ver solo a quien vive en ${ubicacion}`}
        />
      ) : null}
      {filtros.experiencia !== 'todas' && experiencia ? (
        <FiltroChip activo onCambiar={() => base.quitar('experiencia')} icono={Briefcase01Icon} texto={experiencia} ayuda={`Ver solo a quien tiene ${experiencia.toLowerCase()} de experiencia`} />
      ) : null}
      {filtros.esperan ? <ChipEsperan base={base} /> : null}
      {filtros.enProceso ? (
        <FiltroChip activo onCambiar={() => base.quitar('enProceso')} texto="En algún proceso" cuenta={base.cuentas.enProceso} ayuda="Ver solo a quien sigue en al menos una vacante abierta" />
      ) : null}
      {filtros.recientes ? <ChipRecientes base={base} /> : null}
      {filtros.duplicados ? (
        <FiltroChip activo onCambiar={() => base.quitar('duplicados')} icono={UserMultipleIcon} texto="Posibles duplicados" cuenta={base.cuentas.duplicados} ayuda="Ver solo a quien parece estar dos veces en la base" />
      ) : null}
      {/* La búsqueda para una vacante que armó Orbit Flow: la lista va de la que más encaja a la que menos. */}
      {base.paraVacante ? (
        <FiltroChip
          activo
          onCambiar={() => base.cambiar({ paraVacante: null })}
          texto={`Para ${base.paraVacante.titulo}`}
          ayuda="Dejar de ordenar por lo que pide esta vacante"
        />
      ) : null}
      <ChipLote base={base} />
      <LimpiarFiltros base={base} />
    </div>
  )
}

/* Chips sueltos ------------------------------------------------------------------------------------------------- */

export function ChipRecientes({ base, size }: { base: Base; size?: 'default' | 'sm' }) {
  return (
    <FiltroChip
      size={size}
      activo={base.filtros.recientes}
      onCambiar={(recientes) => base.cambiar({ recientes })}
      icono={Calendar03Icon}
      texto="Entraron este mes"
      cuenta={base.cuentas.recientes}
      ayuda="Ver solo a quien entró a la base en los últimos 30 días"
    />
  )
}

// «Esperando acción» junto a quien espera algo del equipo en una vacante, con qué y dónde al pasar el cursor (igual que
// en el tablero de la vacante).
export function InsigniaEspera({ persona }: { persona: PersonaViva }) {
  if (!persona.espera) return null
  return (
    <Hint label={`${persona.espera.accion} · ${persona.espera.vacante}`} side="top">
      <Badge variant="warning-light" className="shrink-0">
        Esperando acción
      </Badge>
    </Hint>
  )
}

// «Acción requerida»: quien espera algo del equipo en alguna vacante (revisar su hoja de vida, agendar, un documento).
export function ChipEsperan({ base, size }: { base: Base; size?: 'default' | 'sm' }) {
  return (
    <FiltroChip
      size={size}
      activo={base.filtros.esperan}
      onCambiar={(esperan) => base.cambiar({ esperan })}
      icono={Alert02Icon}
      texto="Esperando acción"
      cuenta={base.cuentas.esperan}
      ayuda="Ver solo a quien espera una respuesta tuya en alguna vacante"
    />
  )
}

// Solo aparece al llegar desde un lote (el historial de importaciones o el aviso al terminar): su «x» vuelve a toda la base.
export function ChipLote({ base, size }: { base: Base; size?: 'default' | 'sm' }) {
  if (!base.loteFiltro) return null
  const nombre = base.loteVisto?.nombre ?? 'importado'
  return (
    <FiltroChip
      size={size}
      activo
      onCambiar={(activo) => !activo && base.setLoteFiltro(null)}
      icono={FileImportIcon}
      texto={`Del lote «${nombre}»`}
      cuenta={base.alcance.length}
      ayuda={`Ver solo a quienes entraron con «${nombre}»`}
    />
  )
}

/* Comparar con una vacante --------------------------------------------------------------------------------------- */

// La IA compara a cada persona con los requisitos de la vacante: al elegirla, la lista se ordena por lo que más sirve y
// cada fila dice cuántos requisitos cumple.
export function CompararConVacante({ base, className }: { base: Base; className?: string }) {
  const abiertas = vacantesAbiertas()
  const opciones: Opcion[] = [{ value: 'ninguna', label: 'No comparar' }, ...abiertas.map((vacante) => ({ value: vacante.id, label: vacante.titulo }))]
  return (
    <Select
      value={base.filtros.paraVacante ?? 'ninguna'}
      onValueChange={(valor) => base.cambiar({ paraVacante: valor === 'ninguna' ? null : String(valor) })}
      items={opciones}
    >
      <SelectTrigger className={cn('w-64', className)} aria-label="Comparar con una vacante">
        <IconoIA />
        <SelectValue>
          {(valor: string) => (valor === 'ninguna' ? 'Comparar con una vacante' : `Para ${opciones.find((una) => una.value === valor)?.label ?? 'una vacante'}`)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {opciones.map((opcion) => (
          <SelectItem key={opcion.value} value={opcion.value}>
            {opcion.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/* Búsquedas guardadas ---------------------------------------------------------------------------------------- */

// Cada búsqueda dice cuántas personas la cumplen hoy, y la campana avisa cuando entra alguien nuevo que la cumple. Se
// aplica tocándola; al final, guardar la que está puesta.
export function BusquedasGuardadas({ base }: { base: Base }) {
  const [abierto, setAbierto] = useState(false)
  const aplicar = (id: string) => {
    const busqueda = base.busquedas.find((una) => una.id === id)
    if (busqueda) base.aplicarBusqueda(busqueda)
    setAbierto(false)
  }

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger render={<Button variant="outline" />}>
        <HugeiconsIcon icon={Bookmark01Icon} size={16} />
        Búsquedas guardadas
        <Badge variant="secondary" className="tabular-nums">
          {base.busquedas.length}
        </Badge>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[26rem] gap-2 p-2">
        {base.busquedas.length ? (
          <ItemGroup className="gap-1!">
            {base.busquedas.map((busqueda) => (
              <Item
                key={busqueda.id}
                size="sm"
                // La que está puesta, en azul suave (nada de gris para marcar lo elegido).
                className={cn('cursor-pointer rounded-lg! hover:bg-accent/50', base.busquedaActiva === busqueda.id && 'bg-primary/7! hover:bg-primary/7')}
                aria-current={base.busquedaActiva === busqueda.id || undefined}
                onClick={() => aplicar(busqueda.id)}
              >
                <ItemContent className="min-w-0">
                  {/* Botón: la fila se toca con el ratón, y el nombre se alcanza con Tab. */}
                  <Button
                    variant="link"
                    className="h-auto! w-fit max-w-full justify-start! p-0!"
                    onClick={(evento) => {
                      evento.stopPropagation()
                      aplicar(busqueda.id)
                    }}
                  >
                    <span className="truncate">{busqueda.nombre}</span>
                  </Button>
                  {/* Primero cuántas: es lo que cambia de un día a otro; lo que filtra se corta si es largo. */}
                  <ItemDescription className="line-clamp-1">
                    {busqueda.cuantas === 1 ? '1 persona hoy' : `${busqueda.cuantas} personas hoy`} · {describirFiltros(busqueda.filtros)}
                  </ItemDescription>
                </ItemContent>
                <ItemActions onClick={(evento) => evento.stopPropagation()}>
                  <Hint label={busqueda.avisar ? 'Te avisamos cuando entra alguien así. Tocar para apagar' : 'Avisarme cuando entre alguien así'}>
                    <BotonIcono
                      size="icon-sm"
                      aria-pressed={busqueda.avisar}
                      aria-label={busqueda.avisar ? `Dejar de avisarme por «${busqueda.nombre}»` : `Avisarme cuando entre alguien para «${busqueda.nombre}»`}
                      onClick={() => base.alternarAviso(busqueda.id)}
                    >
                      <HugeiconsIcon icon={busqueda.avisar ? Notification01Icon : NotificationOff01Icon} size={16} />
                    </BotonIcono>
                  </Hint>
                  <Hint label="Quitar esta búsqueda">
                    <BotonIcono size="icon-sm" aria-label={`Quitar «${busqueda.nombre}»`} onClick={() => base.quitarBusqueda(busqueda.id)}>
                      <HugeiconsIcon icon={Delete02Icon} size={16} />
                    </BotonIcono>
                  </Hint>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        ) : (
          <Text as="p" variant="muted" size="sm" className="px-2 py-3 text-pretty">
            Guarda una búsqueda para volver a ella con un clic y enterarte cuando entre alguien así.
          </Text>
        )}
        <Separator />
        {/* Sin nada puesto no hay qué guardar: el botón se ve, apagado, y dice por qué. */}
        <Hint label={base.hayFiltros ? `Guardar «${describirFiltros(base.filtros)}»` : 'Busca algo o pon un filtro para guardarlo'}>
          <span className="w-fit">
            <Button
              variant="ghost"
              size="sm"
              disabled={!base.hayFiltros || base.busquedaActiva !== null}
              onClick={() => {
                setAbierto(false)
                base.guardarBusqueda()
              }}
            >
              <HugeiconsIcon icon={BookmarkAdd01Icon} size={16} />
              {base.busquedaActiva ? 'Esta búsqueda ya está guardada' : 'Guardar esta búsqueda'}
            </Button>
          </span>
        </Hint>
      </PopoverContent>
    </Popover>
  )
}

export function LimpiarFiltros({ base, className }: { base: Base; className?: string }) {
  if (!base.hayFiltros) return null
  return (
    <Button variant="ghost" size="sm" className={className} onClick={base.limpiar}>
      <HugeiconsIcon icon={FilterResetIcon} size={16} />
      Limpiar filtros
    </Button>
  )
}

/* Los estados vacíos ------------------------------------------------------------------------------------------- */

// Cómo se nombra cada filtro al proponer quitarlo.
function nombreDelFiltro(campo: keyof FiltrosBase, filtros: FiltrosBase) {
  if (campo === 'texto') return `la búsqueda «${filtros.texto.trim()}»`
  if (campo === 'situacion') return filtros.situacion === 'duplicados' ? '«Posibles duplicados»' : `«${SITUACION_TEXTO[filtros.situacion as keyof typeof SITUACION_TEXTO]}»`
  if (campo === 'etiquetas') return `la etiqueta «${filtros.etiquetas.join(', ')}»`
  if (campo === 'ciudad') return `«${filtros.ciudad}»`
  if (campo === 'pais') return `«${filtros.pais}»`
  if (campo === 'esperan') return '«Esperando acción»'
  if (campo === 'enProceso') return '«En algún proceso»'
  if (campo === 'duplicados') return '«Posibles duplicados»'
  if (campo === 'experiencia') return `«${EXPERIENCIAS.find((una) => una.valor === filtros.experiencia)?.texto}»`
  if (campo === 'origen') return `el origen «${filtros.origen}»`
  return '«Entraron este mes»'
}

const CAMPOS_QUE_FILTRAN: (keyof FiltrosBase)[] = ['texto', 'situacion', 'etiquetas', 'pais', 'ciudad', 'experiencia', 'origen', 'recientes', 'esperan', 'enProceso', 'duplicados']

// Tres vacíos distintos, cada uno con su salida:
// · La base no tiene a nadie (el primer día): importar.
// · Se buscó y no salió nadie: quitar el filtro que más gente deja fuera (dice cuántas aparecen) o limpiar todo.
// · Se escribió algo que nadie sabe hacer («Pyton»): buscar lo que sí hay en la base y se le parece («Python»).
export function VaciaBase({ base }: { base: Base }) {
  if (!base.todas.length) {
    return (
      <Empty className="py-16">
        <EmptyHeader>
          {/* Con la ilustración de los vacíos del sistema (PrimeraVez), no un icono de línea (auditoría, 5-oct). */}
          <EmptyMedia variant="default">
            <ImagenGlass nombre="glass-profile" />
          </EmptyMedia>
          <EmptyTitle>Tu base de candidatos está vacía</EmptyTitle>
          <EmptyDescription>
            Aquí queda todo el que pasa por Selección: quien aplica a una vacante, quien llega en un lote de CVs y quien agregas a mano.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={base.importar.abrir}>
            <HugeiconsIcon icon={FileImportIcon} size={16} />
            Importar candidatos
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  const { filtros, alcance } = base
  // El filtro que, quitado, deja ver a más gente.
  const puestos = CAMPOS_QUE_FILTRAN.filter((campo) => JSON.stringify(filtros[campo]) !== JSON.stringify(SIN_FILTROS[campo]) && (campo !== 'texto' || filtros.texto.trim()))
  const [masRestrictivo] = puestos
    .map((campo) => ({ campo, cuantas: filtrarBase(alcance, filtros, campo).length }))
    .filter((uno) => uno.cuantas > 0)
    .sort((a, b) => b.cuantas - a.cuantas)

  // Lo que se escribió y nadie tiene: se ofrece lo que sí hay en la base y empieza igual.
  const habilidades = [...new Set(alcance.flatMap((persona) => persona.habilidades))]
  const palabras = filtros.texto.trim().split(/\s+/).filter((palabra) => palabra.length >= 3)
  const perdidas = palabras.filter((palabra) => !alcance.some((persona) => coincideTexto(persona, palabra)))
  const sugeridas = perdidas.flatMap((palabra) =>
    habilidades
      .filter((habilidad) => sinTildes(habilidad).startsWith(sinTildes(palabra).slice(0, 3)))
      .slice(0, 3)
      .map((habilidad) => ({ palabra, habilidad })),
  )

  return (
    <Empty className="py-14">
      <EmptyHeader>
        {/* La ilustración de SinResultados; las salidas son las suyas: quitar el filtro que más deja fuera o lo que se parece. */}
        <EmptyMedia variant="default">
          <ImagenGlass nombre="glass-search" />
        </EmptyMedia>
        <EmptyTitle>Nadie con esa búsqueda</EmptyTitle>
        <EmptyDescription>
          Ninguna de las {personasTexto(alcance.length)} {base.loteFiltro ? 'del lote' : 'de la base'} coincide con {describirFiltros({ ...filtros, paraVacante: null })}.
          {perdidas.length ? ` Nadie en la base dice saber «${perdidas.join('», «')}».` : ''}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {sugeridas.length ? (
          <div className="flex flex-wrap justify-center gap-2">
            {sugeridas.map(({ palabra, habilidad }) => (
              <Button
                key={`${palabra}-${habilidad}`}
                variant="outline"
                size="sm"
                onClick={() => base.cambiar({ texto: filtros.texto.replace(palabra, habilidad) })}
              >
                <HugeiconsIcon icon={Search01Icon} size={16} />
                Buscar «{habilidad}»
              </Button>
            ))}
          </div>
        ) : null}
        <div className="flex flex-wrap justify-center gap-2">
          {masRestrictivo ? (
            <Button variant="outline" onClick={() => base.quitar(masRestrictivo.campo)}>
              <HugeiconsIcon icon={Cancel01Icon} size={16} />
              Quitar {nombreDelFiltro(masRestrictivo.campo, filtros)} ({personasTexto(masRestrictivo.cuantas)})
            </Button>
          ) : null}
          <Button variant={masRestrictivo ? 'ghost' : 'outline'} onClick={base.limpiar}>
            <HugeiconsIcon icon={FilterResetIcon} size={16} />
            Limpiar filtros
          </Button>
        </div>
      </EmptyContent>
    </Empty>
  )
}
