import { useMemo, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { InformationCircleIcon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FramePanel,
  Input,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  Switch,
  Text,
  useComboboxAnchor,
} from '@ubits/flux-ui'
import { FilasSeparadas, MarcoLista } from '../../components/marco-lista'
import type { PopulationScope } from '../../modelo/descargas/anonimato'
import { reportTypeFor, type DownloadEntry } from '../../modelo/descargas/tipos'
import type { SegmentDefinition } from '../../modelo/surveyResults'
import { numero } from '../components/escala'
import { TextoCompleto } from '@/shared/components/TextoCompleto'

// Las piezas del panel de descargas. Cada bloque configurable del reporte es una fila con su
// interruptor y, debajo, su propia personalización; lo demás es el responsable de la NOM 035, el
// filtro de población y la lista de lo ya pedido.
import { ImagenGlass } from '@/shared/components/ImagenGlass'

export type Opcion = { id: string; label: string }

/** Varias opciones en fichas, con buscador. Las opciones se buscan por su nombre. */
export function SelectorVarios({
  id,
  opciones,
  valor,
  onCambio,
  placeholder,
  error,
}: {
  id: string
  opciones: readonly Opcion[]
  valor: ReadonlySet<string>
  onCambio: (valor: ReadonlySet<string>) => void
  placeholder: string
  error?: boolean
}) {
  const ancla = useComboboxAnchor()
  const porNombre = useMemo(() => new Map(opciones.map((opcion) => [opcion.label, opcion.id])), [opciones])
  const nombres = useMemo(() => opciones.map((opcion) => opcion.label), [opciones])
  const elegidas = opciones.filter((opcion) => valor.has(opcion.id)).map((opcion) => opcion.label)
  return (
    <Combobox multiple items={nombres} value={elegidas} autoHighlight onValueChange={(nuevo) => onCambio(new Set((nuevo as string[]).map((nombre) => porNombre.get(nombre)).filter((clave): clave is string => clave !== undefined)))}>
      <ComboboxChips ref={ancla} aria-invalid={error || undefined}>
        <ComboboxValue>
          {(actuales: string[]) => (
            <>
              {actuales.map((nombre) => (
                <ComboboxChip key={nombre}>{nombre}</ComboboxChip>
              ))}
              <ComboboxChipsInput id={id} placeholder={actuales.length ? '' : placeholder} />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={ancla}>
        <ComboboxEmpty>No encontramos nada con ese nombre.</ComboboxEmpty>
        <ComboboxList>
          {(nombre: string) => (
            <ComboboxItem key={nombre} value={nombre}>
              {nombre}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

export type Selector = { opciones: readonly Opcion[]; valor: ReadonlySet<string>; onCambio: (valor: ReadonlySet<string>) => void; placeholder: string }

/**
 * Un bloque del reporte: interruptor, rótulo y, si está encendido y tiene con qué elegir, su propio
 * selector. `indice` es la posición real en el archivo (las apagadas no cuentan).
 */
export function FilaBloque({
  id,
  titulo,
  descripcion,
  indice,
  activo,
  onActivo,
  motivoNoDisponible,
  rotuloSelector,
  avisoVacio,
  selector,
}: {
  id: string
  titulo: string
  descripcion: string
  indice?: string | null
  activo: boolean
  onActivo: (activo: boolean) => void
  motivoNoDisponible?: string | null
  rotuloSelector?: string
  avisoVacio?: string
  selector?: Selector | null
}) {
  const disponible = !motivoNoDisponible
  const vacio = activo && selector && selector.valor.size === 0
  // Una fila de la lista del marco (FilasSeparadas): su respiro arriba y abajo; la línea entre filas la pone la lista.
  return (
    <div className="flex flex-col gap-3 py-3">
      <Field orientation="horizontal" data-disabled={!disponible || undefined}>
        <FieldContent>
          <FieldLabel htmlFor={`bloque-${id}`}>
            {indice ? (
              <Badge variant="secondary" size="xs" radius="full" className="tabular-nums">
                {indice}
              </Badge>
            ) : null}
            {titulo}
          </FieldLabel>
          <FieldDescription>{motivoNoDisponible ?? descripcion}</FieldDescription>
        </FieldContent>
        <Switch id={`bloque-${id}`} checked={activo} onCheckedChange={onActivo} disabled={!disponible} />
      </Field>
      {activo && selector ? (
        <Field>
          {rotuloSelector ? <FieldLabel htmlFor={`selector-${id}`}>{rotuloSelector}</FieldLabel> : null}
          <SelectorVarios id={`selector-${id}`} opciones={selector.opciones} valor={selector.valor} onCambio={selector.onCambio} placeholder={selector.placeholder} error={Boolean(vacio)} />
          {vacio && avisoVacio ? <FieldError>{avisoVacio}</FieldError> : null}
        </Field>
      ) : null}
    </div>
  )
}

/** Quien avala el reporte de la NOM 035: opcional, pero completo en cuanto se enciende. */
export function CamposResponsable({
  activo,
  onActivo,
  nombre,
  onNombre,
  identificacion,
  onIdentificacion,
  mostrarErrores,
}: {
  activo: boolean
  onActivo: (activo: boolean) => void
  nombre: string
  onNombre: (valor: string) => void
  identificacion: string
  onIdentificacion: (valor: string) => void
  mostrarErrores: boolean
}) {
  const faltaNombre = mostrarErrores && nombre.trim() === ''
  const faltaId = mostrarErrores && identificacion.trim() === ''
  return (
    <div className="flex flex-col gap-3 py-3">
      <Field orientation="horizontal">
        <FieldContent>
          <FieldLabel htmlFor="responsable-nom035">Responsable profesional</FieldLabel>
          <FieldDescription>Va en la portada y al cierre del reporte.</FieldDescription>
        </FieldContent>
        <Switch id="responsable-nom035" checked={activo} onCheckedChange={onActivo} />
      </Field>
      {activo ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field data-invalid={faltaNombre || undefined}>
            <FieldLabel htmlFor="responsable-nombre">Nombre completo</FieldLabel>
            <Input id="responsable-nombre" value={nombre} onChange={(evento) => onNombre(evento.target.value)} aria-invalid={faltaNombre || undefined} />
            {faltaNombre ? <FieldError>Escribe su nombre.</FieldError> : null}
          </Field>
          <Field data-invalid={faltaId || undefined}>
            <FieldLabel htmlFor="responsable-id">Cédula o identificación</FieldLabel>
            <Input id="responsable-id" value={identificacion} onChange={(evento) => onIdentificacion(evento.target.value)} aria-invalid={faltaId || undefined} />
            {faltaId ? <FieldError>Escribe su identificación.</FieldError> : null}
          </Field>
        </div>
      ) : null}
    </div>
  )
}

/** Generar el reporte solo para unos grupos, con la regla de anonimato a la vista. */
export function FiltroPoblacion({
  segmentos,
  alcance,
  bloqueo,
  activo,
  onActivo,
  clave,
  onClave,
  grupos,
  onGrupos,
}: {
  segmentos: readonly SegmentDefinition[]
  alcance: PopulationScope
  bloqueo: string | null
  activo: boolean
  onActivo: (activo: boolean) => void
  clave: string
  onClave: (clave: string) => void
  grupos: ReadonlySet<string>
  onGrupos: (grupos: ReadonlySet<string>) => void
}) {
  const segmento = segmentos.find((candidato) => candidato.key === clave)
  const opciones = segmentos.map((candidato) => ({ value: candidato.key, label: candidato.label }))
  return (
    <div className="flex flex-col gap-3 py-3">
      <Field orientation="horizontal">
        <FieldContent>
          <FieldLabel htmlFor="filtrar-poblacion">Filtrar población</FieldLabel>
          <FieldDescription>Genera el reporte solo para los grupos que elijas.</FieldDescription>
        </FieldContent>
        <Switch id="filtrar-poblacion" checked={activo} onCheckedChange={onActivo} />
      </Field>
      {activo ? (
        <>
          <Field>
            <FieldLabel htmlFor="filtro-demografico">Demográfico</FieldLabel>
            <Select value={clave} onValueChange={(valor) => onClave(valor as string)} items={opciones}>
              <SelectTrigger id="filtro-demografico" className="w-full bg-background!">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {opciones.map((opcion) => (
                  <SelectItem key={opcion.value} value={opcion.value}>
                    {opcion.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {segmento ? (
            <Field>
              <FieldLabel htmlFor="filtro-grupos">Grupos</FieldLabel>
              <SelectorVarios id="filtro-grupos" opciones={segmento.options} valor={grupos} onCambio={onGrupos} placeholder={`Elige ${segmento.label.toLowerCase()}`} />
            </Field>
          ) : null}
          {/* La cifra viaja con la selección y no solo con el rechazo: quien ve «42 respuestas» antes de
              descargar entiende la regla la única vez que lo detiene. */}
          {grupos.size > 0 ? (
            bloqueo ? (
              // Informativo y no rojo (Elkin, 14-oct): nadie se equivocó, es la regla de anonimato haciendo su trabajo.
              <Alert variant="info">
                <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
                <AlertDescription>{bloqueo}</AlertDescription>
              </Alert>
            ) : (
              <Text size="xs" variant="muted">
                {numero(alcance.completed)} respuestas en esta selección.
              </Text>
            )
          ) : null}
        </>
      ) : null}
    </div>
  )
}

/** Lo ya pedido: el avance mientras se prepara y, al terminar, el recibo con la opción de repetir. */
export function ListaDescargas({ entradas, onEntregar, vacio }: { entradas: readonly DownloadEntry[]; onEntregar: (id: string) => void; vacio: ReactNode }) {
  if (entradas.length === 0) {
    return (
      <Empty className="py-10">
        <EmptyHeader>
          <EmptyMedia variant="default">
              <ImagenGlass nombre="glass-document" />
            </EmptyMedia>
          <EmptyTitle>Aún no has pedido reportes</EmptyTitle>
          <EmptyDescription>{vacio}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }
  // Como las listas de los drawers del módulo: un marco con su recuento y las filas separadas por una línea.
  return (
    <MarcoLista
      titulo={
        <span className="inline-flex items-center gap-2">
          Reportes pedidos
          <Badge variant="secondary" size="xs" radius="full" className="tabular-nums">
            {entradas.length}
          </Badge>
        </span>
      }
      descripcion="Se pueden volver a descargar."
    >
      <FramePanel className="py-1!">
        <FilasSeparadas>
          {entradas.map((entrada) => {
            const tipo = reportTypeFor(entrada.kind)
            const listo = entrada.status === 'ready'
            return (
              <Item key={entrada.id} size="sm">
                <ItemMedia variant="icon">{listo ? <HugeiconsIcon icon={tipo.icon} aria-hidden="true" /> : <Spinner />}</ItemMedia>
                <ItemContent className="min-w-0">
                  <TextoCompleto texto={tipo.title}><ItemTitle className="w-full truncate">{tipo.title}</ItemTitle></TextoCompleto>
                  <TextoCompleto texto={entrada.fileName}><ItemDescription className="truncate" title={entrada.fileName}>
                    {entrada.fileName}
                  </ItemDescription></TextoCompleto>
                  {listo ? null : <Progress value={Math.round(entrada.progress)} aria-label={`Preparando ${tipo.title}`} className="mt-1" />}
                </ItemContent>
                <ItemActions>
                  {!listo ? (
                    <Text as="span" size="xs" variant="muted" className="tabular-nums">
                      {Math.round(entrada.progress)}%
                    </Text>
                  ) : entrada.delivered ? (
                    <Button variant="ghost" size="sm" onClick={() => onEntregar(entrada.id)}>
                      Descargar
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => onEntregar(entrada.id)}>
                      Reintentar
                    </Button>
                  )}
                </ItemActions>
              </Item>
            )
          })}
        </FilasSeparadas>
      </FramePanel>
    </MarcoLista>
  )
}
