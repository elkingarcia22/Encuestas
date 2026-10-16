import { Fragment } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, CheckmarkCircle02Icon, File01Icon, FileImportIcon, Globe02Icon, PlusSignIcon, RotateLeft01Icon, ViewOffSlashIcon } from '@hugeicons/core-free-icons'
import {
  Heading,
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Input,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
  Progress,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  Text,
} from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { RangoDeFechas } from '@/modules/design-system/formularios/rango-de-fechas'
import { PUBLIC_VISIBILITY_BLOCK_MESSAGE, RECENT_UPLOADS, SURVEY_TYPE_OPTIONS, getImmediateValidationError, isAnonymityThresholdValid, isDateRangeValid, publicVisibilityBlock, type SurveyTypeOption } from '../../modelo/carga-historica'
import { EncabezadoPaso } from '../pasos-drawer'
import { ZonaArchivo } from '../zona-archivo'
import { AdjuntoCsv } from '@/modules/design-system/estados/procesos'
import type { CargaHistorica } from './use-carga-historica'
import { TextoCompleto } from '@/shared/components/TextoCompleto'

// Los pasos sencillos de la carga histórica: archivos, elegir una encuesta del lote, datos generales,
// qué hacer después de lanzar una carga, la pestaña «Cargas» y los dos callejones sin salida
// (archivo ilegible o sin datos de encuesta).
import { ImagenGlass } from '@/shared/components/ImagenGlass'

const EXTENSIONES = ['.xlsx', '.csv', '.pdf', '.png', '.jpg', '.jpeg']
const MAXIMO_BYTES = 10 * 1024 * 1024
const pesoDe = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`)
import { PrimeraVez } from '@/shared/components/PrimeraVez'

export function PasoArchivos({ carga }: { carga: CargaHistorica }) {
  const agregar = (nuevos: File[]) => {
    const error = getImmediateValidationError(nuevos)
    if (error) return notify('No pudimos usar ese archivo', error)
    carga.setArchivos([...carga.archivos.filter((previo) => !nuevos.some((nuevo) => nuevo.name === previo.name)), ...nuevos])
  }
  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-3">
        <EncabezadoPaso
          titulo="¿Qué encuesta quieres cargar?"
          descripcion="Sube el reporte o la base de respuestas de una encuesta de Clima, Cultura o NPS. Detectamos el tipo, las fechas, la participación, las secciones y los participantes."
        />
        <ZonaArchivo
          titulo="Elige los archivos o arrástralos aquí"
          descripcion="Excel, CSV, PDF o imágenes · hasta 10 MB"
          extensiones={EXTENSIONES}
          maximoBytes={MAXIMO_BYTES}
          onArchivos={agregar}
          onRechazo={(rechazo) => notify(rechazo.titulo, rechazo.detalle)}
        />
        {carga.archivos.length > 0 ? (
          // Cada archivo elegido, con el mismo adjunto del design system en su estado listo.
          <div className="flex flex-col gap-2">
            {carga.archivos.map((archivo) => (
              <AdjuntoCsv
                key={archivo.name}
                estado="done"
                className="w-full!"
                icono={File01Icon}
                vacio={{ titulo: '', descripcion: '' }}
                nombre={archivo.name}
                descripcion={pesoDe(archivo.size)}
                onElegir={() => undefined}
                onQuitar={() => carga.setArchivos(carga.archivos.filter((otro) => otro !== archivo))}
              />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  )
}

export function PasoElegir({ carga }: { carga: CargaHistorica }) {
  const opciones = carga.revision.filter((item) => !carga.cargadas.includes(item.groupKey))
  return (
    <section className="flex flex-col gap-3">
      <EncabezadoPaso titulo="Elige la encuesta" descripcion="Encontramos varias encuestas en tus archivos. Se carga una a la vez; las demás quedan para después." />
      {opciones.length === 0 ? (
        <PrimeraVez icono="glass-document" titulo="No se detectó ninguna encuesta" descripcion="Revisa que los archivos sean el reporte o la base de respuestas de una encuesta." className="py-8" />
      ) : (
        <RadioGroup value={carga.elegida ?? ''} onValueChange={(valor) => carga.setElegida(valor as string)} className="grid gap-2">
          {opciones.map((item) => (
            <FieldLabel key={item.groupKey} htmlFor={`lote-${item.groupKey}`}>
              <Field orientation="horizontal">
                <RadioGroupItem value={item.groupKey} id={`lote-${item.groupKey}`} />
                <FieldContent>
                  <FieldTitle>{item.name}</FieldTitle>
                  <FieldDescription>
                    {item.fileNames.length} {item.fileNames.length === 1 ? 'archivo' : 'archivos'}
                    {item.analysis.totalRespondents != null ? ` · ${item.analysis.totalRespondents} respuestas` : ''}
                    {item.analysis.sections.length ? ` · ${item.analysis.sections.length} secciones` : ''}
                  </FieldDescription>
                </FieldContent>
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
      )}
    </section>
  )
}

export function PasoGenerales({ carga }: { carga: CargaHistorica }) {
  const item = carga.actual
  if (!item) return null
  const bloqueo = publicVisibilityBlock(item.analysis)
  const fechasMal = !isDateRangeValid(item)
  const umbralMal = !isAnonymityThresholdValid(item)
  const tipos = SURVEY_TYPE_OPTIONS.map((tipo) => ({ value: tipo, label: tipo }))
  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPaso titulo="Confirma los datos generales" descripcion="Es lo que identificamos en los archivos. Ajústalo si algo no coincide." />
      {carga.simulada ? (
        <Alert variant="info">
          <AlertTitle>Datos extraídos de un documento</AlertTitle>
          <AlertDescription>Leímos este archivo como imagen o PDF: revisa con cuidado lo que identificamos antes de cargarlo.</AlertDescription>
        </Alert>
      ) : null}
      <section className="flex flex-col gap-4">
        <Field data-invalid={carga.errorNombre || undefined}>
          <FieldLabel htmlFor="carga-nombre">Nombre de la encuesta</FieldLabel>
          <Input id="carga-nombre" value={item.name} onChange={(evento) => carga.editar({ name: evento.target.value })} aria-invalid={carga.errorNombre || undefined} />
          {carga.errorNombre && carga.duplicada ? <FieldError>Ya existe una encuesta llamada «{carga.duplicada}» del mismo año. Cámbiale el nombre para distinguirlas.</FieldError> : null}
        </Field>
        <Field>
          <FieldLabel htmlFor="carga-tipo">Tipo de encuesta</FieldLabel>
          <Select value={item.type || null} onValueChange={(valor) => carga.editar({ type: valor as SurveyTypeOption })} items={tipos}>
            <SelectTrigger id="carga-tipo" className="w-full">
              <SelectValue placeholder="Elige el tipo" />
            </SelectTrigger>
            <SelectContent>
              {tipos.map((tipo) => (
                <SelectItem key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldDescription>No lo adivinamos: una carga con el tipo equivocado se compararía con las encuestas que no son.</FieldDescription>
        </Field>
      </section>
      <section className="flex flex-col gap-4">
        <Heading as="h3" level={6}>Periodo de la medición</Heading>
        <Field data-invalid={fechasMal || undefined}>
          <FieldLabel htmlFor="carga-fechas">Fecha de inicio y de cierre</FieldLabel>
          <RangoDeFechas id="carga-fechas" valor={item.startDate ? { from: item.startDate, to: item.endDate } : undefined} onCambio={(rango) => carga.editar({ startDate: rango?.from, endDate: rango?.to })} invalido={fechasMal} />
          <FieldDescription>Las fechas en las que se aplicó la encuesta que estás cargando. Las sugerimos a partir del nombre del archivo.</FieldDescription>
          {fechasMal ? <FieldError>La fecha de cierre no puede ser anterior a la de inicio.</FieldError> : null}
        </Field>
      </section>
      <FieldSet>
        <FieldLegend variant="label">Visibilidad de la encuesta</FieldLegend>
        <FieldDescription>Solo puede cargarse como pública si los archivos traen las respuestas de cada participante.</FieldDescription>
        <RadioGroup value={item.visibility} onValueChange={(valor) => carga.editar({ visibility: valor as 'publica' | 'anonima' })} className="grid gap-2 sm:grid-cols-2">
          {(
            [
              ['publica', 'Pública', Globe02Icon],
              ['anonima', 'Anónima', ViewOffSlashIcon],
            ] as const
          ).map(([valor, etiqueta, icono]) => {
            const deshabilitada = valor === 'publica' && bloqueo !== null
            return (
              <FieldLabel key={valor} htmlFor={`carga-visibilidad-${valor}`}>
                <Field orientation="horizontal" data-disabled={deshabilitada || undefined}>
                  <RadioGroupItem value={valor} id={`carga-visibilidad-${valor}`} disabled={deshabilitada} />
                  <HugeiconsIcon icon={icono} aria-hidden="true" className="text-muted-foreground" />
                  <FieldContent>
                    <FieldTitle>{etiqueta}</FieldTitle>
                  </FieldContent>
                </Field>
              </FieldLabel>
            )
          })}
        </RadioGroup>
        {bloqueo ? <FieldDescription>{PUBLIC_VISIBILITY_BLOCK_MESSAGE[bloqueo]}</FieldDescription> : null}
      </FieldSet>
      {item.visibility === 'anonima' ? (
        <Field data-invalid={umbralMal || undefined}>
          <FieldLabel htmlFor="carga-umbral">Umbral de anonimato</FieldLabel>
          <Input id="carga-umbral" inputMode="numeric" className="w-32" value={item.anonymityThreshold} onChange={(evento) => carga.editar({ anonymityThreshold: evento.target.value })} aria-invalid={umbralMal || undefined} />
          <FieldDescription>Número mínimo de respuestas requeridas para mostrar resultados de un grupo.</FieldDescription>
          {umbralMal ? <FieldError>Escribe un número entero de 1 o más.</FieldError> : null}
        </Field>
      ) : null}
    </div>
  )
}

export function PasoSiguiente({ carga }: { carga: CargaHistorica }) {
  const quedan = carga.pendientes.length
  return (
    <section className="flex flex-col gap-4">
      <Alert variant="success">
        <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden="true" />
        <AlertTitle>La carga empezó</AlertTitle>
        <AlertDescription>Se está guardando en segundo plano: la verás avanzar en la lista de encuestas y en Cargas.</AlertDescription>
      </Alert>
      <Heading as="h3" level={6}>¿Qué quieres hacer ahora?</Heading>
      <ItemGroup className="gap-2">
        <Item variant="outline" render={<button type="button" />} onClick={carga.cargarPendiente} className="w-full text-left">
          <ItemMedia variant="icon">
            <HugeiconsIcon icon={FileImportIcon} aria-hidden="true" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Cargar la siguiente encuesta del lote</ItemTitle>
            <ItemDescription>
              {quedan} {quedan === 1 ? 'encuesta pendiente' : 'encuestas pendientes'} en los archivos que subiste
            </ItemDescription>
          </ItemContent>
        </Item>
        <Item variant="outline" render={<button type="button" />} onClick={carga.empezarDeNuevo} className="w-full text-left">
          <ItemMedia variant="icon">
            <HugeiconsIcon icon={PlusSignIcon} aria-hidden="true" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Cargar una nueva encuesta</ItemTitle>
            <ItemDescription>Empieza de cero con otros archivos. Se descartan las encuestas pendientes</ItemDescription>
          </ItemContent>
        </Item>
      </ItemGroup>
    </section>
  )
}

const ESTADO_TAREA = { loading: { texto: 'Cargando', variante: 'info-outline' as const }, completed: { texto: 'Cargada', variante: 'success-outline' as const }, failed: { texto: 'Con error', variante: 'destructive-outline' as const } }

// «Cargas»: lo que corre en esta sesión y el historial, cada uno en su marco con una línea entre fila y fila (como la
// estructura del último paso), no una tarjeta por carga.
export function PestanaCargas({ carga }: { carga: CargaHistorica }) {
  const enCurso = carga.tareas.filter((tarea) => tarea.status === 'loading').length
  return (
    <div className="flex flex-col gap-6">
      {carga.tareas.length > 0 ? (
        <Frame>
          <FrameHeader>
            <FrameTitle>En esta sesión</FrameTitle>
            <FrameDescription>{enCurso > 0 ? 'Sigue cargando aunque cierres el panel.' : 'Todas las cargas terminaron.'}</FrameDescription>
          </FrameHeader>
          <FramePanel className="py-1!">
            <ItemGroup className="gap-0!">
              {carga.tareas.map((tarea, indice) => (
                <Fragment key={tarea.id}>
                  {indice > 0 ? <ItemSeparator /> : null}
                  <Item size="sm" className="px-0!">
                    <ItemMedia variant="icon">{tarea.status === 'loading' ? <Spinner /> : <HugeiconsIcon icon={tarea.status === 'failed' ? Alert02Icon : CheckmarkCircle02Icon} aria-hidden="true" />}</ItemMedia>
                    <ItemContent className="min-w-0">
                      <TextoCompleto texto={tarea.name}><ItemTitle className="w-full truncate">{tarea.name}</ItemTitle></TextoCompleto>
                      {tarea.status === 'loading' ? (
                        <div className="flex items-center gap-2">
                          <Progress value={tarea.progress} aria-label={`Avance de ${tarea.name}`} className="flex-1" />
                          <Text as="span" size="xs" variant="muted" className="tabular-nums">
                            {tarea.progress}%
                          </Text>
                        </div>
                      ) : (
                        <ItemDescription>{tarea.status === 'failed' ? 'No se pudo terminar la carga' : 'Ya está en la lista de encuestas'}</ItemDescription>
                      )}
                    </ItemContent>
                    <ItemActions>
                      {tarea.status === 'failed' ? (
                        <Button variant="outline" size="sm" onClick={() => carga.reintentar(tarea.id)}>
                          <HugeiconsIcon icon={RotateLeft01Icon} aria-hidden="true" />
                          Reintentar
                        </Button>
                      ) : (
                        <Badge variant={ESTADO_TAREA[tarea.status].variante}>{ESTADO_TAREA[tarea.status].texto}</Badge>
                      )}
                    </ItemActions>
                  </Item>
                </Fragment>
              ))}
            </ItemGroup>
          </FramePanel>
        </Frame>
      ) : null}
      <Frame>
        <FrameHeader>
          <FrameTitle>Historial</FrameTitle>
          <FrameDescription>Las encuestas que cargaste en los últimos 7 días.</FrameDescription>
        </FrameHeader>
        <FramePanel className="py-1!">
          <ItemGroup className="gap-0!">
            {RECENT_UPLOADS.map((reciente, indice) => (
              <Fragment key={reciente.id}>
                {indice > 0 ? <ItemSeparator /> : null}
                <Item size="sm" className="px-0!">
                  <ItemMedia variant="icon">
                    <HugeiconsIcon icon={File01Icon} aria-hidden="true" />
                  </ItemMedia>
                  <ItemContent>
                    <TextoCompleto texto={reciente.name}><ItemTitle className="truncate">{reciente.name}</ItemTitle></TextoCompleto>
                    <ItemDescription>
                      {reciente.type} · {reciente.loadedAt}
                    </ItemDescription>
                  </ItemContent>
                </Item>
              </Fragment>
            ))}
          </ItemGroup>
        </FramePanel>
      </Frame>
    </div>
  )
}

export function SinSalida({ carga }: { carga: CargaHistorica }) {
  const vacio = carga.paso === 'empty'
  return (
    <Empty className="py-12">
      <EmptyHeader>
        {/* Ilustración glass como los estados del design system: el archivo sin datos y el error, cada uno con la suya. */}
        <EmptyMedia variant="default">
          <ImagenGlass nombre={vacio ? 'glass-document' : 'glass-danger'} />
        </EmptyMedia>
        <EmptyTitle>{vacio ? 'No encontramos datos de encuesta' : (carga.error?.title ?? 'No pudimos continuar')}</EmptyTitle>
        <EmptyDescription>{vacio ? 'El archivo no trae participación, secciones ni preguntas que podamos leer. Revisa que sea el reporte o la base de respuestas de la encuesta.' : carga.error?.detail}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          variant="outline"
          onClick={() => {
            carga.setArchivos([])
            carga.volverAArchivos()
          }}
        >
          Subir otros archivos
        </Button>
      </EmptyContent>
    </Empty>
  )
}
