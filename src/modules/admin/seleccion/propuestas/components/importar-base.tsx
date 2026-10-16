import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Alert02Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  Download04Icon,
  File01Icon,
  FileImportIcon,
  InformationCircleIcon,
  Upload01Icon,
  UserAdd01Icon,
  UserSearch01Icon,
  Xls01Icon,
} from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  Attachment,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  Button,
  Checkbox,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  Separator,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from '@ubits/flux-ui'
import { useAccion } from './carga'
import { Badge } from '@/shared/components/Badge'
import { VentanaDeAccion } from '@/modules/design-system/drawers/components/drawer-anidado'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { notify, notifyAction } from '@/shared/components/notify'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { baseDeCandidatos, etiquetasDeLaBase, usePersonasDeLaBase, vacantesAbiertas } from '../base'
import {
  ORIGENES_LOTE,
  PESO_MAXIMO_PDF,
  autorizacionDeDatos,
  cuentasDe,
  origenDeLote,
  origenSugerido,
  pesoEnTexto,
  textoPersonas,
  type LoteCvs,
} from '../importacion'
import {
  CAMPOS_HOJA,
  ESTADO_FILA,
  LIMITE_FILAS,
  agregarAMano,
  datosDeFila,
  descargarPlantilla,
  importarHoja,
  leerHoja,
  mapeoSugerido,
  revisarFilas,
  type CampoHoja,
  type DatosFila,
  type EstadoFila,
  type Hoja,
  type ResultadoImportacion,
} from '../importacion-base'
import { QUIEN_MUEVE, nombreDeLista } from '../movimientos'
import { noSeGuardo } from '../simular'
import { AutorizacionAceptada, DialogoAutorizacion, EstadoLote, ZonaParaSoltar, useAutorizacion, useElegirArchivos, useImportaciones } from './importar-cvs'
import { FiltroChip } from './filtro-chip'
import { SelectorEtiquetas } from './selector-etiquetas'

// Importar candidatos a la base global («Mis candidatos»): elegir cómo (hojas de vida, hoja de cálculo, a mano), cada
// camino y el historial de importaciones de la base. Las reglas están en `importacion-base.ts`.
//
// - «Importar» abre una ventana corta para elegir qué se tiene a mano. Las hojas de vida siguen el recorrido de las
//   vacantes (`useImportaciones` sin vacante): leer en segundo plano, revisar lo dudoso y el detalle de cada lote.
// - La hoja de cálculo se resuelve en una sola ventana: el archivo, qué es cada columna, cómo queda cada fila (con lo
//   que falla corregible ahí mismo) y las opciones del lote. Se deshace desde el aviso.
// - A mano, una persona: si su correo ya está en la base, se dice quién es y se abre su ficha en vez de duplicarla.
// - El historial junta los dos tipos de lote; cada uno abre su detalle.

export type ImportarABase = {
  // Abre la ventana para elegir cómo importar.
  abrir: () => void
  // Abre el historial de importaciones de la base.
  verHistorial: () => void
  // Los lotes de la base (hojas de vida y hojas de cálculo), el más nuevo primero.
  lotes: LoteCvs[]
  // Las ventanas y paneles; se pintan una vez en la página.
  dialogos: ReactNode
  // Hay una ventana abierta: los atajos de la página esperan.
  ocupado: boolean
}

type Ventana = 'elegir' | 'hoja' | 'mano'

export function useImportarABase(opciones: {
  ruta: string
  // Abrir la ficha de alguien de la base (desde el detalle de un lote o al terminar de agregar a mano).
  onVerFicha: (personaId: string) => void
  // Ver a quienes entraron con un lote: la página filtra la base por ese lote.
  onVerLote: (loteId: string) => void
}): ImportarABase {
  const [ventana, setVentana] = useState<Ventana | null>(null)
  // El historial va aparte: lo que se abre desde él (importar, el detalle de un lote) se apila dentro, como drawer
  // anidado, y al cerrarlo se vuelve a él (8 oct, Nicolás: desde un panel no se abre una ventana encima).
  const [historial, setHistorial] = useState(false)
  // Cada vez que se abre una ventana empieza en blanco: cambia su `key`.
  const [vez, setVez] = useState(0)

  // Lo último que pasó la página, para los avisos que se tocan después.
  const alDia = useRef(opciones)
  useEffect(() => {
    alDia.current = opciones
  })
  // Ir a una ficha o a la gente de un lote cierra lo que esté abierto encima de la página.
  const verFicha = (personaId: string) => {
    setVentana(null)
    setHistorial(false)
    alDia.current.onVerFicha(personaId)
  }
  const verLote = (loteId: string) => {
    setVentana(null)
    setHistorial(false)
    alDia.current.onVerLote(loteId)
  }

  // Las hojas de vida van por el recorrido de siempre, sin vacante: entran a la base.
  const importaciones = useImportaciones({ onVerEntraron: verLote, onAbrirFicha: verFicha })

  const abrirVentana = (cual: Ventana) => {
    setVez((antes) => antes + 1)
    setVentana(cual)
  }
  const cerrar = (abierta: boolean) => !abierta && setVentana(null)

  const alImportarHoja = (resultado: ResultadoImportacion, vacante: string | null) => {
    setVentana(null)
    const entraron = resultado.entraron.length
    const partes = [
      entraron ? `${entraron} ${entraron === 1 ? 'entró' : 'entraron'} a tu base` : 'No entró nadie nuevo',
      resultado.actualizadas ? `${resultado.actualizadas} ${resultado.actualizadas === 1 ? 'actualizó' : 'actualizaron'} sus datos` : null,
      resultado.fuera ? `${resultado.fuera} ${resultado.fuera === 1 ? 'quedó' : 'quedaron'} fuera` : null,
      resultado.postuladas && vacante ? `${resultado.postuladas} se ${resultado.postuladas === 1 ? 'postuló' : 'postularon'} a ${vacante}` : null,
    ].filter(Boolean)
    // Lo primero que pasó y, si hay, lo que quedó fuera: el detalle completo está en el lote.
    notifyAction(`Importaste «${resultado.lote.nombre}»`, `${partes.slice(0, 2).join(' · ')}.`, {
      label: 'Deshacer',
      onClick: () => {
        resultado.deshacer()
        notify('Se deshizo la importación', `Salieron quienes entraron con «${resultado.lote.nombre}».`, 'success')
      },
    }, 'success')
  }

  const ventanas = (
    <>
      {importaciones.dialogos}
      <ElegirComo
        abierto={ventana === 'elegir'}
        anteriores={importaciones.lotes.length}
        onOpenChange={cerrar}
        onHojasDeVida={() => {
          setVentana(null)
          importaciones.abrir()
        }}
        onHojaDeCalculo={() => abrirVentana('hoja')}
        onAMano={() => abrirVentana('mano')}
        // Desde el historial ya se está en él: el enlace sobra.
        onHistorial={
          historial
            ? undefined
            : () => {
                setVentana(null)
                setHistorial(true)
              }
        }
      />
      <DialogoHoja key={`hoja-${vez}`} abierto={ventana === 'hoja'} ruta={opciones.ruta} onOpenChange={cerrar} onImportado={alImportarHoja} />
      <DialogoAMano key={`mano-${vez}`} abierto={ventana === 'mano'} onOpenChange={cerrar} onVerFicha={verFicha} onAgregada={() => setVentana(null)} />
    </>
  )

  const dialogos = (
    <>
      <Historial
        abierto={historial}
        lotes={importaciones.lotes}
        onOpenChange={setHistorial}
        onVer={importaciones.ver}
        onRevisar={importaciones.revisar}
        onImportar={() => abrirVentana('elegir')}
        ventanas={historial ? ventanas : null}
      />
      {historial ? null : ventanas}
    </>
  )

  return {
    abrir: () => abrirVentana('elegir'),
    verHistorial: () => setHistorial(true),
    lotes: importaciones.lotes,
    dialogos,
    ocupado: ventana !== null || historial || importaciones.ocupado,
  }
}

/* Piezas que comparten las ventanas ---------------------------------------------------------------------------- */

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SOLO_BASE = 'solo-base'

// La autorización al lado del botón que la necesita, como al importar hojas de vida: se acepta una vez y queda anotada.
function CasillaAutorizacion({ id, acepto, onCambiar, texto }: { id: string; acepto: boolean; onCambiar: (acepto: boolean) => void; texto: string }) {
  const [leyendo, setLeyendo] = useState(false)
  return (
    <>
      <Field orientation="horizontal" className="mr-2 w-auto! items-start! gap-2!">
        <Checkbox id={id} checked={acepto} onCheckedChange={(valor) => onCambiar(valor === true)} className="mt-0.5" />
        <FieldLabel htmlFor={id} className="block! text-sm font-normal! text-pretty">
          {texto}{' '}
          <Button variant="link" size="sm" className="h-auto! p-0!" onClick={() => setLeyendo(true)}>
            Leerla
          </Button>
        </FieldLabel>
      </Field>
      <DialogoAutorizacion abierto={leyendo} onOpenChange={setLeyendo} />
    </>
  )
}

// «Postularlas también a»: por defecto, solo a la base; si no, una vacante publicada (a su primera etapa).
function SelectorPostular({ id, valor, onCambiar }: { id: string; valor: string; onCambiar: (valor: string) => void }) {
  const vacantes = vacantesAbiertas()
  return (
    <Select value={valor} onValueChange={(nuevo) => onCambiar(nuevo as string)}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue>{(elegido: string) => (elegido === SOLO_BASE ? 'No, solo a mi base' : (vacantes.find((vacante) => vacante.id === elegido)?.titulo ?? ''))}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value={SOLO_BASE}>No, solo a mi base</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Vacantes publicadas</SelectLabel>
          {vacantes.map((vacante) => (
            <SelectItem key={vacante.id} value={vacante.id}>
              <span className="min-w-0 flex-1 truncate">{vacante.titulo}</span>
              <Text as="span" variant="muted" size="xs" className="shrink-0">
                {vacante.area}
              </Text>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

const vacanteElegida = (valor: string) => (valor === SOLO_BASE ? null : (vacantesAbiertas().find((vacante) => vacante.id === valor) ?? null))

/* Elegir cómo importar ----------------------------------------------------------------------------------------- */

type Camino = { icono: IconSvgElement; titulo: string; linea: string; ia?: boolean; onElegir: () => void }

function ElegirComo({
  abierto,
  anteriores,
  onOpenChange,
  onHojasDeVida,
  onHojaDeCalculo,
  onAMano,
  onHistorial,
}: {
  abierto: boolean
  anteriores: number
  onOpenChange: (abierto: boolean) => void
  onHojasDeVida: () => void
  onHojaDeCalculo: () => void
  onAMano: () => void
  onHistorial?: () => void
}) {
  const caminos: Camino[] = [
    { icono: FileImportIcon, titulo: 'CVs', linea: 'PDF o ZIP; la IA los lee y los deja en tu base', ia: true, onElegir: onHojasDeVida },
    { icono: Xls01Icon, titulo: 'Una hoja de cálculo', linea: 'Excel o CSV, una persona por fila', onElegir: onHojaDeCalculo },
    { icono: UserAdd01Icon, titulo: 'Una persona', linea: 'A mano, con su CV si lo tienes', onElegir: onAMano },
  ]
  return (
    <VentanaDeAccion
      open={abierto}
      onOpenChange={onOpenChange}
      title="Importar candidatos a tu base"
      sub="Entran a Mis candidatos sin ir todavía a ninguna vacante. ¿Qué tienes a mano?"
    >
      <ItemGroup className="gap-2!">
        {caminos.map((camino) => (
          <Item key={camino.titulo} variant="outline" render={<button type="button" />} onClick={camino.onElegir} className="w-full text-left">
            <ItemMedia variant="icon">
              <HugeiconsIcon icon={camino.icono} size={20} />
            </ItemMedia>
            <ItemContent>
              <ItemTitle className="flex items-center gap-1.5">
                {camino.ia ? <IconoIA /> : null}
                {camino.titulo}
              </ItemTitle>
              <ItemDescription>{camino.linea}</ItemDescription>
            </ItemContent>
            <ItemActions>
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} aria-hidden />
            </ItemActions>
          </Item>
        ))}
      </ItemGroup>
      {anteriores && onHistorial ? (
        <Button variant="link" size="sm" className="h-auto! self-start p-0!" onClick={onHistorial}>
          Ver importaciones anteriores ({anteriores})
        </Button>
      ) : null}
    </VentanaDeAccion>
  )
}

/* Una hoja de cálculo ------------------------------------------------------------------------------------------- */

const ACEPTA_HOJA = '.csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

// Los grupos de «Así quedan», en el orden en que importan.
type Grupo = 'entran' | 'actualizan' | 'igual' | 'repetidas' | 'problemas'

const GRUPOS: { grupo: Grupo; texto: string; ayuda: string }[] = [
  { grupo: 'entran', texto: 'Entran', ayuda: 'Ver solo las que entran a tu base' },
  { grupo: 'actualizan', texto: 'Actualizan sus datos', ayuda: 'Ver solo las que ya están y se actualizan' },
  { grupo: 'igual', texto: 'Se dejan igual', ayuda: 'Ver solo las que ya están y se dejan como están' },
  { grupo: 'repetidas', texto: 'Repetidas en el archivo', ayuda: 'Ver solo las que vienen dos veces' },
  { grupo: 'problemas', texto: 'Con problemas', ayuda: 'Ver solo las que no pueden entrar' },
]

const grupoDe = (estado: EstadoFila): Grupo =>
  ESTADO_FILA[estado].problema
    ? 'problemas'
    : estado === 'entra'
      ? 'entran'
      : estado === 'actualiza'
        ? 'actualizan'
        : estado === 'omitida'
          ? 'igual'
          : 'repetidas'

const textoCampo = (campo: CampoHoja) => CAMPOS_HOJA.find((uno) => uno.campo === campo)?.texto ?? ''

// «Candidatos feria Uniandes.xlsx» ya dice de dónde vienen; si el nombre no dice nada, «Otro lugar».
function origenDeHoja(archivo: string) {
  const sugerido = origenSugerido([archivo])
  return sugerido === 'correo' && !/correo|mail|bandeja/i.test(archivo) ? 'otro' : sugerido
}

function DialogoHoja({
  abierto,
  ruta,
  onOpenChange,
  onImportado,
}: {
  abierto: boolean
  ruta: string
  onOpenChange: (abierto: boolean) => void
  onImportado: (resultado: ResultadoImportacion, vacante: string | null) => void
}) {
  const [hoja, setHoja] = useState<Hoja | null>(null)
  const [problema, setProblema] = useState<string | null>(null)
  const [leyendo, setLeyendo] = useState<string | null>(null)
  const [mapeo, setMapeo] = useState<CampoHoja[]>([])
  const [correcciones, setCorrecciones] = useState<Record<number, Partial<DatosFila>>>({})
  const [decisiones, setDecisiones] = useState<Record<number, 'actualizar' | 'omitir'>>({})
  const [grupo, setGrupo] = useState<Grupo | null>(null)
  // Las filas que se tocaron con el filtro puesto no se van de la vista al cambiar de grupo (se corrige un correo
  // y la fila pasa a «Entran» sin que desaparezca mientras se escribe).
  const [tocadas, setTocadas] = useState<number[]>([])
  const [nombre, setNombre] = useState('')
  const [origen, setOrigen] = useState<string>('otro')
  const [etiquetas, setEtiquetas] = useState<string[]>([])
  const [postularA, setPostularA] = useState(SOLO_BASE)
  const [acepto, setAcepto] = useState(false)
  const personasBase = usePersonasDeLaBase()
  const disponibles = useMemo(() => etiquetasDeLaBase(personasBase), [personasBase])
  const autorizacion = useAutorizacion()

  const cargar = (nueva: Hoja) => {
    setHoja(nueva)
    setProblema(null)
    setMapeo(mapeoSugerido(nueva.columnas))
    setCorrecciones({})
    setDecisiones({})
    setGrupo(null)
    setTocadas([])
    setNombre('')
    setOrigen(origenDeHoja(nueva.archivo))
  }

  // Leer es asíncrono (un CSV de verdad): si se elige otro archivo antes de terminar, gana el último.
  const lectura = useRef(0)
  const recibir = (archivos: File[]) => {
    const archivo = archivos[0]
    if (!archivo) return
    const esta = ++lectura.current
    setLeyendo(archivo.name)
    void leerHoja(archivo).then((resultado) => {
      if (esta !== lectura.current) return
      setLeyendo(null)
      if ('problema' in resultado) setProblema(`No se pudo leer «${archivo.name}»: ${resultado.problema.toLowerCase()}.`)
      else cargar(resultado)
    })
  }
  const cambiar = useElegirArchivos(recibir)

  const faltaNombre = !mapeo.includes('nombre')
  const faltaContacto = !mapeo.includes('correo') && !mapeo.includes('celular')
  const faltan = faltaNombre || faltaContacto
  // Se revisa en cada cambio (una corrección, una decisión, alguien que entró a la base mientras tanto).
  const filas = hoja && !faltan ? revisarFilas(hoja, mapeo, correcciones, decisiones) : []
  const cuenta = (uno: Grupo) => filas.filter((fila) => grupoDe(fila.estado) === uno).length
  const entran = cuenta('entran') + cuenta('actualizan')
  const problemas = cuenta('problemas')
  const visibles = filas.filter((fila) => !grupo || grupoDe(fila.estado) === grupo || tocadas.includes(fila.indice))
  const existentes = filas.filter((fila) => fila.estado === 'actualiza' || fila.estado === 'omitida')
  const decisionComun = existentes.every((fila) => fila.estado === 'actualiza') ? 'actualizar' : existentes.every((fila) => fila.estado === 'omitida') ? 'omitir' : null
  const autorizado = Boolean(autorizacion) || acepto
  const nombreSugerido = hoja ? hoja.archivo.replace(/\.(csv|txt|xlsx|xls)$/i, '') : ''

  const tocar = (indices: number[]) => grupo && setTocadas((antes) => [...new Set([...antes, ...indices])])
  const corregir = (indice: number, campo: 'nombre' | 'correo', valor: string) => {
    setCorrecciones((antes) => ({ ...antes, [indice]: { ...antes[indice], [campo]: valor } }))
    tocar([indice])
  }
  const decidir = (indices: number[], decision: 'actualizar' | 'omitir') => {
    setDecisiones((antes) => ({ ...antes, ...Object.fromEntries(indices.map((indice) => [indice, decision])) }))
    tocar(indices)
  }
  // Una columna es un solo campo: si se elige uno que ya tenía otra columna, esa otra pasa a «No importar».
  const cambiarCampo = (columna: number, campo: CampoHoja) =>
    setMapeo((antes) => antes.map((uno, indice) => (indice === columna ? campo : campo !== 'ignorar' && uno === campo ? 'ignorar' : uno)))

  const importar = () => {
    if (!hoja) return
    // Si no se guarda, la ventana sigue abierta con todo lo que se ajustó y el aviso deja reintentar.
    if (noSeGuardo(`hoja:${nombre.trim() || nombreSugerido}`, 'No pudimos importar la hoja', importar, 'No entró nadie. Lo que ajustaste sigue aquí.')) return
    if (!autorizacion) autorizacionDeDatos.aceptar(QUIEN_MUEVE)
    const vacante = vacanteElegida(postularA)
    const resultado = importarHoja(hoja, filas, { nombre: nombre.trim() || nombreSugerido, etiquetas, origen, postularA: vacante, quien: QUIEN_MUEVE, ruta })
    onImportado(resultado, vacante?.titulo ?? null)
  }

  // La acción dice qué está pasando en su botón mientras corre.
  const accion = useAccion()
  return (
    <VentanaDeAccion
      open={abierto}
      onOpenChange={onOpenChange}
      size="wide"
      title="Importar una hoja de cálculo"
      sub={
        hoja
          ? 'Revisa qué es cada columna y cómo queda cada fila antes de importar. Lo que falla se corrige aquí mismo.'
          : 'Una persona por fila, con los títulos en la primera. Hacen falta el nombre y un correo o celular.'
      }
      note={hoja && autorizacion && problemas ? `${problemas === 1 ? '1 fila con problemas queda fuera' : `${problemas} filas con problemas quedan fuera`} si no la${problemas === 1 ? '' : 's'} corriges.` : undefined}
      footer={
        <>
          {hoja && !autorizacion ? (
            <CasillaAutorizacion id="autorizacion-hoja" acepto={acepto} onCambiar={setAcepto} texto="Tengo la autorización de datos de estas personas." />
          ) : null}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={!hoja || faltan || !entran || !autorizado || accion.enCurso} onClick={() => accion.correr(importar)}>
            {accion.enCurso ? <Spinner /> : <HugeiconsIcon icon={FileImportIcon} size={16} />}
            {accion.enCurso ? 'Importando…' : hoja && !faltan && entran ? `Importar ${textoPersonas(entran)}` : 'Importar'}
          </Button>
        </>
      }
    >
      {problema ? (
        <Alert variant="destructive">
          <HugeiconsIcon icon={Alert02Icon} size={16} />
          <AlertTitle>{problema}</AlertTitle>
          <AlertDescription>Se leen Excel (.xlsx) o CSV de hasta 5 MB, con los títulos de las columnas en la primera fila.</AlertDescription>
        </Alert>
      ) : null}

      {leyendo ? (
        <Text as="p" size="sm" variant="muted" className="flex items-center gap-2">
          <Spinner />
          Leyendo «{leyendo}»…
        </Text>
      ) : null}

      {!hoja ? (
        <>
          <ZonaParaSoltar
            grande
            titulo="Suelta aquí tu hoja de cálculo"
            descripcion="Arrástrala desde una carpeta de tu equipo o elígela con el botón"
            detalle={`Excel o CSV · hasta 5 MB · hasta ${LIMITE_FILAS.toLocaleString('es-CO')} filas`}
            acepta={ACEPTA_HOJA}
            soltando="Suéltala para empezar"
            boton="Elegir archivo"
            onArchivos={recibir}
          />
          <Button variant="outline" size="sm" className="w-fit" onClick={descargarPlantilla}>
            <HugeiconsIcon icon={Download04Icon} size={16} />
            Descargar la plantilla
          </Button>
        </>
      ) : (
        <>
          <Attachment state="done" size="sm" className="w-full! min-w-0!">
            <AttachmentMedia>
              <HugeiconsIcon icon={Xls01Icon} size={16} />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>{hoja.archivo}</AttachmentTitle>
              <AttachmentDescription>
                {hoja.filas.length === 1 ? '1 fila' : `${hoja.filas.length} filas`} · {hoja.columnas.length} columnas
              </AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions>
              <Input {...cambiar.getInputProps({ accept: ACEPTA_HOJA })} className="hidden" aria-hidden tabIndex={-1} />
              <Button variant="outline" size="xs" onClick={cambiar.openFileDialog}>
                <HugeiconsIcon icon={Upload01Icon} size={14} />
                Cambiar archivo
              </Button>
            </AttachmentActions>
          </Attachment>

          {hoja.aviso ? (
            <Alert variant="info">
              <HugeiconsIcon icon={InformationCircleIcon} size={16} />
              <AlertTitle>{hoja.aviso}</AlertTitle>
            </Alert>
          ) : null}

          {/* Columnas: cada una con el campo que se le reconoció por su título y un valor de muestra. */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <Text as="div" weight="medium">
                Columnas
              </Text>
              <Text as="p" variant="muted" size="sm">
                Elige qué dato es cada una. Lo que no se reconoció por su título queda en «No importar».
              </Text>
            </div>
            <div className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
              {hoja.columnas.map((columna, indice) => {
                const muestra = hoja.filas.find((fila) => fila[indice]?.trim())?.[indice] ?? ''
                return (
                  <div key={`${columna}-${indice}`} className="flex items-center gap-3">
                    <span className="flex min-w-0 flex-1 flex-col">
                      <Text as="span" size="sm" weight="medium" className="truncate">
                        {columna || `Columna ${indice + 1}`}
                      </Text>
                      <Text as="span" size="xs" variant="muted" className="truncate">
                        {muestra ? `Ej.: ${muestra}` : 'Vacía'}
                      </Text>
                    </span>
                    <Select value={mapeo[indice]} onValueChange={(valor) => cambiarCampo(indice, valor as CampoHoja)}>
                      <SelectTrigger size="sm" className="w-40 shrink-0" aria-label={`Qué dato es la columna «${columna}»`}>
                        <SelectValue>{(valor: CampoHoja) => textoCampo(valor)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {CAMPOS_HOJA.filter((uno) => uno.campo !== 'ignorar').map((uno) => (
                            <SelectItem key={uno.campo} value={uno.campo}>
                              {uno.texto}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                        <SelectSeparator />
                        <SelectGroup>
                          <SelectItem value="ignorar">No importar</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                )
              })}
            </div>
            {faltan ? (
              <Alert variant="warning">
                <HugeiconsIcon icon={Alert02Icon} size={16} />
                <AlertTitle>
                  {faltaNombre && faltaContacto
                    ? 'Faltan la columna del nombre y una de contacto'
                    : faltaNombre
                      ? 'Falta la columna del nombre'
                      : 'Falta una columna de contacto: correo o celular'}
                </AlertTitle>
                <AlertDescription>Elige arriba cuál es. Sin el nombre y una forma de contactarla, ninguna fila puede entrar.</AlertDescription>
              </Alert>
            ) : null}
          </div>

          {faltan ? null : (
            <>
              <Separator />

              {/* Así quedan: chips que filtran la tabla; sin ninguno puesto se ven todas. */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-0.5">
                  <Text as="div" weight="medium">
                    Así quedan
                  </Text>
                  <Text as="p" variant="muted" size="sm">
                    Quien ya está en tu base se reconoce por su correo. Corrige aquí el nombre o el correo de las filas que lo necesitan.
                  </Text>
                </div>
                <div role="group" aria-label="Qué filas ver" className="flex flex-wrap items-center gap-2">
                  {GRUPOS.filter((uno) => cuenta(uno.grupo) || grupo === uno.grupo).map((uno) => (
                    <FiltroChip
                      key={uno.grupo}
                      size="sm"
                      activo={grupo === uno.grupo}
                      onCambiar={(activo) => {
                        setGrupo(activo ? uno.grupo : null)
                        setTocadas([])
                      }}
                      texto={uno.texto}
                      cuenta={cuenta(uno.grupo)}
                      ayuda={uno.ayuda}
                    />
                  ))}
                </div>
                {existentes.length ? (
                  <Field orientation="horizontal" className="items-center!">
                    <FieldLabel htmlFor="decision-todas" className="font-normal!">
                      {existentes.length === 1 ? 'La que ya está en tu base' : `Las ${existentes.length} que ya están en tu base`}
                    </FieldLabel>
                    <Select value={decisionComun} onValueChange={(valor) => valor && decidir(existentes.map((fila) => fila.indice), valor as 'actualizar' | 'omitir')}>
                      <SelectTrigger id="decision-todas" size="sm" className="w-52 shrink-0">
                        <SelectValue placeholder="Cada una a su manera">
                          {(valor: string | null) => (valor === 'actualizar' ? 'Actualizar sus datos' : valor === 'omitir' ? 'Dejarlas como están' : 'Cada una a su manera')}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="actualizar">Actualizar sus datos</SelectItem>
                          <SelectItem value="omitir">Dejarlas como están</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                ) : null}

                <div className="max-h-80 overflow-y-auto rounded-lg border">
                  <Table className="table-fixed">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Fila</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Correo</TableHead>
                        <TableHead className="w-[22%]">Cargo</TableHead>
                        <TableHead className="w-48">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibles.map((fila) => {
                        // Lo que trae el archivo, sin corregir: decide si la celda es un campo para escribir (que no
                        // se vaya a mitad de camino cuando el dato ya queda bien).
                        const original = datosDeFila(hoja.filas[fila.indice], mapeo)
                        const corregirNombre = !original.nombre
                        const corregirCorreo = Boolean(original.correo) && !CORREO_VALIDO.test(original.correo)
                        const estado = ESTADO_FILA[fila.estado]
                        return (
                          <TableRow key={fila.indice}>
                            <TableCell>
                              <Text as="span" size="sm" variant="muted" className="tabular-nums">
                                {fila.indice + 2}
                              </Text>
                            </TableCell>
                            <TableCell>
                              {corregirNombre ? (
                                <Input
                                  value={correcciones[fila.indice]?.nombre ?? ''}
                                  onChange={(evento) => corregir(fila.indice, 'nombre', evento.target.value)}
                                  placeholder="Escribe su nombre"
                                  aria-label={`Nombre de la fila ${fila.indice + 2}`}
                                  aria-invalid={fila.estado === 'sin-nombre'}
                                />
                              ) : (
                                <Text as="span" size="sm" className="block truncate">
                                  {fila.datos.nombre}
                                </Text>
                              )}
                            </TableCell>
                            <TableCell>
                              {corregirCorreo ? (
                                <Input
                                  value={correcciones[fila.indice]?.correo ?? original.correo}
                                  onChange={(evento) => corregir(fila.indice, 'correo', evento.target.value)}
                                  aria-label={`Correo de la fila ${fila.indice + 2}`}
                                  aria-invalid={fila.estado === 'correo-invalido'}
                                />
                              ) : (
                                <Text as="span" size="sm" variant={fila.datos.correo ? undefined : 'muted'} className="block truncate">
                                  {fila.datos.correo || (fila.datos.celular ? `Solo celular: ${fila.datos.celular}` : 'Sin correo ni celular')}
                                </Text>
                              )}
                            </TableCell>
                            <TableCell>
                              <Text as="span" size="sm" variant={fila.datos.cargo ? undefined : 'muted'} className="block truncate">
                                {fila.datos.cargo || '—'}
                              </Text>
                            </TableCell>
                            <TableCell>
                              {fila.estado === 'actualiza' || fila.estado === 'omitida' ? (
                                <Select value={fila.estado === 'omitida' ? 'omitir' : 'actualizar'} onValueChange={(valor) => decidir([fila.indice], valor as 'actualizar' | 'omitir')}>
                                  <SelectTrigger size="sm" className="w-full" aria-label={`Qué hacer con ${fila.datos.nombre}, que ya está en tu base`}>
                                    <SelectValue>{(valor: string) => (valor === 'omitir' ? 'Dejarla como está' : 'Actualizar sus datos')}</SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectGroup>
                                      <SelectLabel>Ya está en tu base</SelectLabel>
                                      <SelectItem value="actualizar">Actualizar sus datos</SelectItem>
                                      <SelectItem value="omitir">Dejarla como está</SelectItem>
                                    </SelectGroup>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <span className="flex flex-col items-start gap-0.5">
                                  <Badge variant={estado.variante}>
                                    {estado.texto}
                                  </Badge>
                                  {fila.estado === 'repetida-archivo' && fila.repiteA !== undefined ? (
                                    <Text as="span" size="xs" variant="muted">
                                      Igual a la fila {fila.repiteA + 2}
                                    </Text>
                                  ) : null}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="nombre-hoja">Nombre del lote</FieldLabel>
                  <Input id="nombre-hoja" value={nombre} onChange={(evento) => setNombre(evento.target.value)} placeholder={nombreSugerido} />
                  <FieldDescription>Así lo encuentras después en «Importaciones».</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="origen-hoja">De dónde vienen</FieldLabel>
                  <Select value={origen} onValueChange={(valor) => setOrigen(valor as string)}>
                    <SelectTrigger id="origen-hoja" className="w-full">
                      <SelectValue>{(valor: string) => origenDeLote(valor).texto}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {ORIGENES_LOTE.map((uno) => (
                          <SelectItem key={uno.id} value={uno.id}>
                            {uno.texto}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldDescription>Queda como el origen de quienes entran.</FieldDescription>
                </Field>
                <Field className="sm:col-span-2">
                  <FieldLabel htmlFor="etiquetas-hoja">Etiquetas para todas</FieldLabel>
                  <SelectorEtiquetas id="etiquetas-hoja" valor={etiquetas} onCambiar={setEtiquetas} disponibles={disponibles} placeholder="Por ejemplo: Feria Uniandes 2026" />
                  <FieldDescription>Se suman a las que traiga la columna «Etiquetas», también a quien ya estaba.</FieldDescription>
                </Field>
                <Field className="sm:col-span-2">
                  <FieldLabel htmlFor="postular-hoja">Postularlas también a</FieldLabel>
                  <SelectorPostular id="postular-hoja" valor={postularA} onCambiar={setPostularA} />
                  <FieldDescription>
                    {postularA === SOLO_BASE
                      ? 'Quedan en tu base, sin ir a ninguna vacante.'
                      : 'Entran a la primera etapa, también quien ya estaba en tu base. Quien ya está en esa vacante no se duplica.'}
                  </FieldDescription>
                </Field>
              </div>

              {autorizacion ? <AutorizacionAceptada /> : null}
            </>
          )}
        </>
      )}
    </VentanaDeAccion>
  )
}

/* Una persona a mano ------------------------------------------------------------------------------------------- */

function DialogoAMano({
  abierto,
  onOpenChange,
  onVerFicha,
  onAgregada,
}: {
  abierto: boolean
  onOpenChange: (abierto: boolean) => void
  onVerFicha: (personaId: string) => void
  onAgregada: () => void
}) {
  const [datos, setDatos] = useState({ nombre: '', correo: '', celular: '', cargo: '', empresa: '', ciudad: '', anios: '' })
  const [etiquetas, setEtiquetas] = useState<string[]>([])
  const [hojaDeVida, setHojaDeVida] = useState<File | null>(null)
  const [problemaHoja, setProblemaHoja] = useState<string | null>(null)
  const [postularA, setPostularA] = useState(SOLO_BASE)
  const [acepto, setAcepto] = useState(false)
  // El error del correo se dice al salir del campo, no a mitad de escribirlo.
  const [correoVisto, setCorreoVisto] = useState(false)
  const personasBase = usePersonasDeLaBase()
  const disponibles = useMemo(() => etiquetasDeLaBase(personasBase), [personasBase])
  const autorizacion = useAutorizacion()

  const poner = (campo: keyof typeof datos) => (evento: { target: { value: string } }) => setDatos((antes) => ({ ...antes, [campo]: evento.target.value }))

  // Un solo PDF: queda en su ficha tal cual, sin que la IA lo lea.
  const elegir = useElegirArchivos((archivos) => {
    const archivo = archivos[0]
    if (!archivo) return
    if (!/\.pdf$/i.test(archivo.name)) setProblemaHoja(`«${archivo.name}» no es un PDF.`)
    else if (archivo.size > PESO_MAXIMO_PDF) setProblemaHoja(`«${archivo.name}» pesa más de 10 MB.`)
    else {
      setHojaDeVida(archivo)
      setProblemaHoja(null)
    }
  })

  const correo = datos.correo.trim()
  const correoMal = Boolean(correo) && !CORREO_VALIDO.test(correo)
  const existente = correo && !correoMal ? baseDeCandidatos.deCorreo(correo) : undefined
  const falta = [!datos.nombre.trim() ? 'el nombre' : null, !correo && !datos.celular.trim() ? 'un correo o un celular' : null].filter((uno): uno is string => Boolean(uno))
  const autorizado = Boolean(autorizacion) || acepto
  const listo = !falta.length && !correoMal && !existente && autorizado

  const agregar = () => {
    if (!listo) return
    if (noSeGuardo(`mano:${correo || datos.celular.trim()}`, `No pudimos agregar a ${datos.nombre.trim()}`, agregar, 'No entró a tu base. Sus datos siguen aquí.')) return
    if (!autorizacion) autorizacionDeDatos.aceptar(QUIEN_MUEVE)
    const vacante = vacanteElegida(postularA)
    const anios = Number.parseInt(datos.anios, 10)
    const { persona, deshacer } = agregarAMano(
      {
        nombre: datos.nombre.trim(),
        correo,
        celular: datos.celular.trim(),
        cargo: datos.cargo.trim(),
        empresa: datos.empresa.trim(),
        ciudad: datos.ciudad.trim(),
        anios: Number.isFinite(anios) ? anios : null,
        etiquetas: [],
      },
      { etiquetas, origen: 'Agregado a mano', hojaDeVida: hojaDeVida ?? undefined, postularA: vacante, quien: QUIEN_MUEVE },
    )
    onAgregada()
    // Dos avisos, porque cada uno lleva un solo botón: el de deshacer queda detrás y el de su ficha, al frente.
    notifyAction('¿La agregaste por error?', undefined, {
      label: 'Deshacer',
      onClick: () => {
        deshacer()
        notify(`${persona.nombre} salió de tu base`, undefined, 'success')
      },
    }, 'info')
    const detalle = [datos.cargo.trim() || null, hojaDeVida ? 'con su CV' : null, vacante ? `se postuló a ${vacante.titulo}` : null].filter(Boolean)
    notifyAction(`${persona.nombre} entró a tu base`, detalle.length ? `${detalle.join(' · ')}.` : undefined, {
      label: 'Ver su ficha',
      onClick: () => onVerFicha(persona.id),
    }, 'success')
  }

  // La acción dice qué está pasando en su botón mientras corre.
  const accion = useAccion()
  return (
    <VentanaDeAccion
      open={abierto}
      onOpenChange={onOpenChange}
      size="wide"
      title="Agregar una persona a tu base"
      sub="Entra a Mis candidatos sin ir todavía a ninguna vacante. Hacen falta su nombre y un correo o un celular."
      note={autorizacion && falta.length ? `Falta ${nombreDeLista(falta)}.` : undefined}
      footer={
        <>
          {!autorizacion ? (
            <CasillaAutorizacion id="autorizacion-mano" acepto={acepto} onCambiar={setAcepto} texto="Tengo la autorización de datos de esta persona." />
          ) : null}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={!listo || accion.enCurso} onClick={() => accion.correr(agregar)}>
            {accion.enCurso ? <Spinner /> : <HugeiconsIcon icon={UserAdd01Icon} size={16} />}
            {accion.enCurso ? 'Agregando…' : 'Agregar a mi base'}
          </Button>
        </>
      }
    >
      {existente ? (
        <Alert variant="info">
          <HugeiconsIcon icon={UserSearch01Icon} size={16} />
          <AlertTitle>
            Ya está en tu base: {existente.nombre} ({existente.cargo})
          </AlertTitle>
          <AlertDescription>Con este correo no se agrega otra vez. En su ficha completas sus datos o la postulas.</AlertDescription>
          <AlertAction>
            <Button variant="outline" size="sm" onClick={() => onVerFicha(existente.id)}>
              Ver su ficha
            </Button>
          </AlertAction>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="mano-nombre">Nombre completo</FieldLabel>
          <Input id="mano-nombre" value={datos.nombre} onChange={poner('nombre')} placeholder="Por ejemplo: María Pérez Gómez" />
        </Field>
        <Field data-invalid={correoVisto && correoMal ? true : undefined}>
          <FieldLabel htmlFor="mano-correo">Correo</FieldLabel>
          <Input
            id="mano-correo"
            type="email"
            value={datos.correo}
            onChange={poner('correo')}
            onBlur={() => setCorreoVisto(true)}
            placeholder="nombre@correo.com"
            aria-invalid={correoVisto && correoMal ? true : undefined}
          />
          {correoVisto && correoMal ? <FieldError>Revisa el correo: le falta algo (por ejemplo, «@correo.com»).</FieldError> : null}
        </Field>
        <Field>
          <FieldLabel htmlFor="mano-celular">Celular</FieldLabel>
          <Input id="mano-celular" type="tel" value={datos.celular} onChange={poner('celular')} placeholder="+57 300 000 0000" />
          <FieldDescription>El correo o el celular: con uno basta.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="mano-cargo">Cargo actual</FieldLabel>
          <Input id="mano-cargo" value={datos.cargo} onChange={poner('cargo')} placeholder="Por ejemplo: Analista de datos" />
        </Field>
        <Field>
          <FieldLabel htmlFor="mano-empresa">Empresa</FieldLabel>
          <Input id="mano-empresa" value={datos.empresa} onChange={poner('empresa')} />
        </Field>
        <Field>
          <FieldLabel htmlFor="mano-ciudad">Ciudad</FieldLabel>
          <Input id="mano-ciudad" value={datos.ciudad} onChange={poner('ciudad')} />
        </Field>
        <Field>
          <FieldLabel htmlFor="mano-anios">Años de experiencia</FieldLabel>
          <Input id="mano-anios" type="number" inputMode="numeric" min={0} max={60} value={datos.anios} onChange={poner('anios')} />
        </Field>
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="mano-etiquetas">Etiquetas</FieldLabel>
          <SelectorEtiquetas id="mano-etiquetas" valor={etiquetas} onCambiar={setEtiquetas} disponibles={disponibles} placeholder="Por ejemplo: Referidos" />
        </Field>
        <Field className="sm:col-span-2" data-invalid={problemaHoja ? true : undefined}>
          <FieldLabel>
            CV{' '}
            <Text as="span" variant="muted" size="sm" weight="normal">
              (opcional)
            </Text>
          </FieldLabel>
          <Input {...elegir.getInputProps({ accept: '.pdf,application/pdf' })} className="hidden" aria-hidden tabIndex={-1} />
          {hojaDeVida ? (
            <Attachment state="done" size="sm" className="w-full! min-w-0!">
              <AttachmentMedia>
                <HugeiconsIcon icon={File01Icon} size={16} />
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>{hojaDeVida.name}</AttachmentTitle>
                <AttachmentDescription>PDF · {pesoEnTexto(hojaDeVida.size)}</AttachmentDescription>
              </AttachmentContent>
              <AttachmentActions>
                <BotonIcono aria-label={`Quitar ${hojaDeVida.name}`} onClick={() => setHojaDeVida(null)}>
                  <HugeiconsIcon icon={Cancel01Icon} size={14} />
                </BotonIcono>
              </AttachmentActions>
            </Attachment>
          ) : (
            <Button variant="outline" size="sm" className="self-start" onClick={elegir.openFileDialog}>
              <HugeiconsIcon icon={Upload01Icon} size={16} />
              Adjuntar su CV
            </Button>
          )}
          {problemaHoja ? <FieldError>{problemaHoja} Se adjunta un PDF de hasta 10 MB.</FieldError> : <FieldDescription>Un PDF de hasta 10 MB. Queda en su ficha.</FieldDescription>}
        </Field>
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="postular-mano">Postularla también a</FieldLabel>
          <SelectorPostular id="postular-mano" valor={postularA} onCambiar={setPostularA} />
          {postularA === SOLO_BASE ? null : <FieldDescription>Entra a la primera etapa de la vacante.</FieldDescription>}
        </Field>
      </div>

      {autorizacion ? <AutorizacionAceptada /> : null}
    </VentanaDeAccion>
  )
}

/* El historial de importaciones -------------------------------------------------------------------------------- */

function Historial({
  abierto,
  lotes,
  onOpenChange,
  onVer,
  onRevisar,
  onImportar,
  ventanas,
}: {
  abierto: boolean
  lotes: LoteCvs[]
  onOpenChange: (abierto: boolean) => void
  onVer: (loteId: string) => void
  onRevisar: (loteId: string) => void
  onImportar: () => void
  // Lo que se abre desde aquí (importar, el detalle de un lote): dentro, como drawer anidado.
  ventanas?: ReactNode
}) {
  const pendientes = lotes.reduce((suma, lote) => suma + cuentasDe(lote).dudosos, 0)
  return (
    <DrawerShell
      open={abierto}
      onOpenChange={onOpenChange}
      size="lg"
      kicker="Mis candidatos"
      title="Importaciones"
      description={
        lotes.length
          ? `${lotes.length === 1 ? '1 importación' : `${lotes.length} importaciones`} a tu base. ${pendientes ? `${pendientes === 1 ? '1 CV espera' : `${pendientes} CVs esperan`} que confirmes un dato.` : 'No hay nada pendiente.'}`
          : 'Lo que importaste a tu base: CVs y hojas de cálculo.'
      }
      icon={FileImportIcon}
      footer={
        lotes.length ? (
          <Button onClick={onImportar}>
            <HugeiconsIcon icon={FileImportIcon} size={16} />
            Importar candidatos
          </Button>
        ) : undefined
      }
    >
      {lotes.length ? (
        <ItemGroup className="gap-2!">
          {lotes.map((lote) => {
            const cuentas = cuentasDe(lote)
            const esHoja = lote.tipo === 'hoja-de-calculo'
            return (
              <Item key={lote.id} variant="outline" className="cursor-pointer items-start!" onClick={() => onVer(lote.id)}>
                <ItemMedia variant="icon">
                  {lote.estado === 'leyendo' ? <Spinner /> : <HugeiconsIcon icon={esHoja ? Xls01Icon : FileImportIcon} size={18} />}
                </ItemMedia>
                <ItemContent className="min-w-0 gap-2!">
                  <span className="flex min-w-0 flex-col">
                    <ItemTitle className="w-full! truncate">{lote.nombre}</ItemTitle>
                    <ItemDescription className="truncate">
                      {[lote.id, esHoja ? 'Hoja de cálculo' : 'CVs', `${lote.quien === QUIEN_MUEVE ? 'Tú' : lote.quien}, ${lote.fecha.toLowerCase()}`].join(' · ')}
                    </ItemDescription>
                  </span>
                  <EstadoLote lote={lote} />
                </ItemContent>
                {/* La acción no abre dos veces el detalle: el clic se queda en el botón. */}
                <ItemActions onClick={(evento) => evento.stopPropagation()}>
                  {cuentas.dudosos && lote.estado === 'terminado' ? (
                    <Button size="sm" onClick={() => onRevisar(lote.id)}>
                      Revisar {cuentas.dudosos} {cuentas.dudosos === 1 ? 'dudosa' : 'dudosas'}
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => onVer(lote.id)}>
                      Ver
                    </Button>
                  )}
                </ItemActions>
              </Item>
            )
          })}
        </ItemGroup>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={FileImportIcon} size={20} />
            </EmptyMedia>
            <EmptyTitle>Todavía no has importado a nadie</EmptyTitle>
            <EmptyDescription>Trae CVs, la hoja de cálculo de una feria o a una persona a mano: entran a tu base sin ir a ninguna vacante.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={onImportar}>
              <HugeiconsIcon icon={FileImportIcon} size={16} />
              Importar candidatos
            </Button>
          </EmptyContent>
        </Empty>
      )}
      {ventanas}
    </DrawerShell>
  )
}
