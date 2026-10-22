import { useEffect, useMemo, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon, Download01Icon, File01Icon, FileImportIcon, PlusSignIcon } from '@hugeicons/core-free-icons'
import {
  Button,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Progress,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  Text,
} from '@ubits/flux-ui'
import { AdjuntoCsv } from '@/modules/design-system/estados/procesos'
import { DialogoConfirmar, DialogoSalir, RegistroConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { PILL } from '@/modules/design-system/drawers/components/drawer-styles'
import { AiThinking } from '@/shared/components/AiThinking'
import { notify } from '@/shared/components/notify'
import { publishProcess } from '@/shared/components/process-store'
import { EncabezadoPaso } from '../../../encuestas/components/pasos-drawer'
import { FilasSeparadas } from '../../../encuestas/components/marco-lista'
import { ZonaArchivo } from '../../../encuestas/components/zona-archivo'
import type { Ciclo } from '../../modelo/ciclos'
import { EXTENSIONES, MAXIMO_BYTES, MODOS, admiteModo, analizarArchivo, modoDe, personasDelCiclo, pestanaDe, plantillaCsv, type DatosCargaCiclo, type GrupoPersona, type Modo } from '../../modelo/carga/carga-objetivos'
import { Revision, type CambioGrupo } from './revision'

// «Cargar objetivos» (9-oct, como el prototipo y con el armado de «Cargar encuestas»): un panel de IA en dos pasos.
// 1. Archivo: el ciclo (si se abrió desde la lista), qué va a hacer el archivo —crear, editar o actualizar el avance;
//    cambia qué columnas trae, por eso se elige antes de subir nada— y el archivo, con su plantilla para descargar.
// 2. Revisión: lo leído, por persona, en cuatro pestañas según lo que le falta a cada una.
// Solo se cargan las personas listas; las demás quedan fuera y se dice antes de confirmar. La carga sigue en segundo
// plano en el Centro de procesos. Es un panel con datos: no se cierra al tocar fuera y, con la revisión empezada, salir
// pregunta antes.

const LECTURA = ['Leyendo las filas del archivo…', 'Buscando a cada persona en UBITS…', 'Revisando pesos y metas…', 'Armando la revisión…']
const MS_TICK = 180
const NUEVO_CICLO = '__nuevo-ciclo__'
const CICLO_NUEVO_MOCK: Ciclo = {
  id: NUEVO_CICLO,
  nombre: 'Nuevo ciclo',
  periodo: 'Trimestre',
  inicio: '-',
  cierre: '-',
  estado: 'Borrador',
  objetivos: 0,
  personas: 0,
  avance: 0,
  cumplidos: 0,
  reportando: 0,
  anterior: null,
}
const pesoDe = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`)

function descargarPlantilla(modo: Modo) {
  const enlace = document.createElement('a')
  enlace.href = URL.createObjectURL(new Blob([plantillaCsv(modo)], { type: 'text/csv;charset=utf-8' }))
  enlace.download = `plantilla-${modo}-objetivos.csv`
  enlace.click()
  URL.revokeObjectURL(enlace.href)
}

export function PanelCargaObjetivos({ abierto, onAbiertoChange, ciclos, cicloFijo, onNuevoCiclo }: { abierto: boolean; onAbiertoChange: (abierto: boolean) => void; ciclos: readonly Ciclo[]; cicloFijo?: Ciclo; /** Si viene, el selector de ciclo ofrece «Nuevo ciclo»: permite cargar objetivos para un ciclo nuevo y luego ir a crearlo. */ onNuevoCiclo?: (datos?: DatosCargaCiclo) => void }) {
  const [modo, setModo] = useState<Modo | null>(null)
  const [cicloId, setCicloId] = useState<string | null>(cicloFijo?.id ?? null)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [leyendo, setLeyendo] = useState<number | null>(null)
  const [grupos, setGrupos] = useState<GrupoPersona[] | null>(null)
  const [porQuitar, setPorQuitar] = useState<GrupoPersona | null>(null)
  const [confirmar, setConfirmar] = useState(false)
  const [salir, setSalir] = useState(false)
  const reloj = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearInterval(reloj.current), [])

  const esNuevoCiclo = cicloId === NUEVO_CICLO
  const ciclo = cicloFijo ?? (esNuevoCiclo ? CICLO_NUEVO_MOCK : ciclos.find((opcion) => opcion.id === cicloId) ?? null)
  const personas = useMemo(() => (ciclo ? personasDelCiclo(ciclo) : []), [ciclo])
  const elegibles = modo ? ciclos.filter((opcion) => admiteModo(opcion, modo)) : ciclos.filter((opcion) => opcion.estado !== 'Finalizado')
  const cicloValido = ciclo !== null && (!modo || admiteModo(ciclo, modo))
  const listos = (grupos ?? []).filter((grupo) => modo && pestanaDe(grupo, modo) === 'listos')
  const objetivosListos = listos.reduce((s, grupo) => s + grupo.objetivos.length, 0)
  const fuera = (grupos?.length ?? 0) - listos.length

  const reiniciar = () => {
    window.clearInterval(reloj.current)
    setModo(null)
    setCicloId(cicloFijo?.id ?? null)
    setArchivo(null)
    setLeyendo(null)
    setGrupos(null)
  }
  const cerrar = () => {
    setSalir(false)
    onAbiertoChange(false)
    reiniciar()
  }
  // Con la revisión empezada hay trabajo que se perdería: salir pregunta. Antes de eso, se sale directo.
  const pedirCierre = () => (grupos ? setSalir(true) : cerrar())

  const analizar = () => {
    if (!archivo || !ciclo || !modo) return
    setLeyendo(0)
    window.clearInterval(reloj.current)
    reloj.current = window.setInterval(() => {
      setLeyendo((previo) => {
        const siguiente = Math.min(100, (previo ?? 0) + 10)
        if (siguiente >= 100) {
          window.clearInterval(reloj.current)
          const leidos = analizarArchivo(archivo.name, ciclo, modo)
          setGrupos(leidos)
          window.setTimeout(() => setLeyendo(null), 300)
        }
        return siguiente
      })
    }, MS_TICK)
  }

  const cambiar: CambioGrupo = (identificador, cambio) => setGrupos((actuales) => actuales?.map((grupo) => (grupo.identificador === identificador ? cambio(grupo) : grupo)) ?? null)

  const cargar = () => {
    if (!ciclo || !modo) return
    if (esNuevoCiclo) {
      setConfirmar(false)
      cerrar()
      onNuevoCiclo?.({
        archivo: archivo?.name ?? 'objetivos.csv',
        grupos: listos,
      })
      notify('Objetivos y participantes cargados', 'Completa los datos del ciclo para terminar de crearlo.', 'success')
      return
    }
    const id = `carga-objetivos-${Date.now()}`
    const titulo = `${modoDe(modo).etiqueta} · ${ciclo.nombre}`
    const n = objetivosListos
    let avance = 0
    const tick = window.setInterval(() => {
      avance = Math.min(100, avance + 20)
      const listo = avance >= 100
      publishProcess({ id, title: titulo, meta: listo ? `${n} ${n === 1 ? 'objetivo' : 'objetivos'} · listo` : `Cargando ${n} ${n === 1 ? 'objetivo' : 'objetivos'}`, progress: listo ? undefined : avance, done: listo, icon: FileImportIcon })
      if (listo) {
        window.clearInterval(tick)
        notify(modo === 'actualizar' ? `Avance registrado en ${n} ${n === 1 ? 'objetivo' : 'objetivos'}` : `${n} ${n === 1 ? 'objetivo cargado' : 'objetivos cargados'}`, ciclo.nombre, 'success')
      }
    }, 600)
    publishProcess({ id, title: titulo, meta: `Cargando ${n} ${n === 1 ? 'objetivo' : 'objetivos'}`, progress: 0, icon: FileImportIcon })
    setConfirmar(false)
    cerrar()
    notify('La carga sigue en segundo plano', 'Puedes seguir trabajando: el avance está en el Centro de procesos.', 'info')
  }

  const pie =
    leyendo !== null ? (
      <Button variant="outline" className={PILL} onClick={pedirCierre}>
        Cerrar
      </Button>
    ) : grupos ? (
      <>
        <Button className={PILL} disabled={objetivosListos === 0} onClick={() => setConfirmar(true)}>
          <HugeiconsIcon icon={FileImportIcon} aria-hidden="true" />
          {modo ? modoDe(modo).accion : 'Cargar'} ({objetivosListos})
        </Button>
      </>
    ) : (
      <>
        <Button variant="ghost" className={`mr-auto ${PILL}`} disabled={!modo} onClick={() => modo && descargarPlantilla(modo)}>
          <HugeiconsIcon icon={Download01Icon} aria-hidden="true" />
          Descargar plantilla
        </Button>
        <Button variant="outline" className={PILL} onClick={cerrar}>
          Cancelar
        </Button>
        <Button className={PILL} disabled={!modo || !cicloValido || !archivo} onClick={analizar}>
          Analizar archivo
        </Button>
      </>
    )

  return (
    <>
      <DrawerShell
        open={abierto}
        onOpenChange={(valor) => (valor ? onAbiertoChange(true) : pedirCierre())}
        disablePointerDismissal
        size={grupos ? 'xl' : 'lg'}
        ai
        title={leyendo !== null ? 'Analizando el archivo' : 'Cargar objetivos'}
        description={leyendo !== null ? 'La IA está leyendo tu archivo.' : grupos && ciclo ? `${esNuevoCiclo ? 'Nuevo ciclo' : ciclo.nombre} · ${modo ? modoDe(modo).etiqueta.toLowerCase() : ''}` : 'Crea, edita o actualiza objetivos de muchas personas a la vez con un archivo.'}
        // «← Volver» arriba (regla «panel-volver-arriba», 13-oct): de los grupos al archivo.
        onVolver={leyendo === null && grupos ? () => setGrupos(null) : undefined}
        footer={pie}
      >
        {leyendo !== null ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <AiThinking label={LECTURA[Math.min(LECTURA.length - 1, Math.floor(leyendo / 25))]} size="md" />
            <div className="flex w-80 flex-col gap-2">
              <Progress value={leyendo} aria-label="Avance del análisis" />
              <Text size="xs" variant="muted">
                {archivo?.name}
              </Text>
            </div>
          </div>
        ) : grupos && modo ? (
          <div className="flex flex-col gap-6">
            <EncabezadoPaso
              titulo="Revisa lo que vamos a cargar"
              descripcion={`${modoDe(modo).intencion} ${grupos.length} ${grupos.length === 1 ? 'persona' : 'personas'} en el archivo · ${listos.length} ${listos.length === 1 ? 'lista' : 'listas'} para cargar${fuera > 0 ? ` · ${fuera} por resolver` : ''}.`}
            />
            <Revision key={modo} grupos={grupos} modo={modo} personas={personas} onCambio={cambiar} onQuitar={setPorQuitar} />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {cicloFijo ? null : (
              <Frame>
                <FrameHeader>
                  <FrameTitle>¿A qué ciclo van?</FrameTitle>
                  <FrameDescription>
                    {esNuevoCiclo ? 'Se creará un nuevo ciclo con los objetivos y participantes del archivo.' : 'Los objetivos se resuelven contra las personas de ese ciclo. Un ciclo finalizado ya no recibe cambios.'}
                  </FrameDescription>
                </FrameHeader>
                <FramePanel className="flex flex-col gap-2">
                  <Select
                    value={cicloId ?? ''}
                    onValueChange={(valor) => {
                      if (valor === NUEVO_CICLO) {
                        setModo('crear')
                      }
                      setCicloId(valor as string)
                    }}
                  >
                    <SelectTrigger className="w-full" aria-label="Ciclo">
                      <SelectValue placeholder="Elige un ciclo">
                        {ciclo ? (
                          esNuevoCiclo ? (
                            <span className="flex items-center gap-2">
                              <HugeiconsIcon icon={PlusSignIcon} className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                              Nuevo ciclo
                            </span>
                          ) : (
                            `${ciclo.nombre} · ${ciclo.estado}`
                          )
                        ) : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {onNuevoCiclo ? (
                        <>
                          <SelectItem value={NUEVO_CICLO} label="Nuevo ciclo">
                            <HugeiconsIcon icon={PlusSignIcon} aria-hidden="true" />
                            Nuevo ciclo
                          </SelectItem>
                          <SelectSeparator />
                        </>
                      ) : null}
                      {elegibles.map((opcion) => (
                        <SelectItem key={opcion.id} value={opcion.id} label={`${opcion.nombre} · ${opcion.estado}`}>
                          {opcion.nombre} · {opcion.estado}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {ciclo && modo && !admiteModo(ciclo, modo) ? (
                    <Text as="p" size="xs" variant="destructive">
                      {modo === 'actualizar' ? 'El avance solo se registra en un ciclo en curso.' : 'Un ciclo finalizado ya no recibe cambios.'}
                    </Text>
                  ) : null}
                </FramePanel>
              </Frame>
            )}
            <Frame>
              <FrameHeader>
                <FrameTitle>¿Qué quieres hacer?</FrameTitle>
                <FrameDescription>Cada operación pide su propia plantilla: elígela antes de subir el archivo.</FrameDescription>
              </FrameHeader>
              {/* Menos relleno: las filas de opciones ya traen el suyo (diferencias.json › frame-panel-relleno-no-se-quita). */}
              <FramePanel className="py-1!">
                <RadioGroup value={modo ?? ''} onValueChange={(valor) => setModo(valor as Modo)} className="gap-0">
                  <FilasSeparadas>
                    {MODOS.map((opcion) => {
                      const bloqueado = esNuevoCiclo && opcion.id !== 'crear'
                      return (
                        <label
                          key={opcion.id}
                          htmlFor={`modo-${opcion.id}`}
                          className={`flex items-start gap-3 py-3 ${bloqueado ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        >
                          <RadioGroupItem value={opcion.id} id={`modo-${opcion.id}`} disabled={bloqueado} className="mt-0.5" />
                          <span className="flex min-w-0 flex-col gap-0.5">
                            <Text as="span" size="sm" weight="semibold">
                              {opcion.etiqueta}
                            </Text>
                            <Text as="span" size="xs" variant="muted">
                              {bloqueado
                                ? opcion.id === 'actualizar'
                                  ? 'El avance solo se registra en un ciclo en curso.'
                                  : 'Solo para ciclos que ya tienen objetivos creados.'
                                : opcion.descripcion}
                            </Text>
                          </span>
                        </label>
                      )
                    })}
                  </FilasSeparadas>
                </RadioGroup>
              </FramePanel>
            </Frame>
            {modo ? (
              <Frame>
                <FrameHeader>
                  <FrameTitle>Sube el archivo</FrameTitle>
                  <FrameDescription>Con las columnas de la plantilla: {modoDe(modo).columnas.join(', ')}.</FrameDescription>
                </FrameHeader>
                <FramePanel>
                  {/* «!»: el adjunto del design system trae un ancho fijo; aquí ocupa la fila, como en «Cargar encuestas». */}
                  {archivo ? (
                    <AdjuntoCsv estado="done" className="w-full!" icono={File01Icon} vacio={{ titulo: '', descripcion: '' }} nombre={archivo.name} descripcion={pesoDe(archivo.size)} onElegir={() => undefined} onQuitar={() => setArchivo(null)} />
                  ) : (
                    <ZonaArchivo
                      titulo="Elige el archivo o arrástralo aquí"
                      descripcion="CSV o Excel · hasta 10 MB"
                      extensiones={EXTENSIONES}
                      maximoBytes={MAXIMO_BYTES}
                      onArchivo={setArchivo}
                      onRechazo={(rechazo) => notify(rechazo.titulo, rechazo.detalle, 'error')}
                    />
                  )}
                </FramePanel>
              </Frame>
            ) : null}
          </div>
        )}
      </DrawerShell>

      <DialogoConfirmar
        abierto={confirmar}
        onAbiertoChange={setConfirmar}
        icono={FileImportIcon}
        titulo={
          esNuevoCiclo
            ? '¿Cargar objetivos y crear ciclo?'
            : modo === 'actualizar'
              ? '¿Registrar el avance?'
              : modo === 'editar'
                ? '¿Editar los objetivos?'
                : '¿Cargar los objetivos?'
        }
        descripcion={
          esNuevoCiclo
            ? `${objetivosListos} ${objetivosListos === 1 ? 'objetivo' : 'objetivos'} de ${listos.length} ${listos.length === 1 ? 'persona' : 'personas'}. Se creará el borrador del ciclo con estos objetivos y participantes listos para configurar.`
            : <>{objetivosListos} {objetivosListos === 1 ? 'objetivo' : 'objetivos'} de {listos.length} {listos.length === 1 ? 'persona' : 'personas'}{ciclo ? <> en <strong className="font-semibold">{ciclo.nombre}</strong></> : ''}. {fuera > 0 ? `Solo entran las personas listas: ${fuera} ${fuera === 1 ? 'persona queda' : 'personas quedan'} fuera de esta carga.` : 'Entran todas las personas del archivo.'}</>
        }
        accion={esNuevoCiclo ? 'Cargar y configurar' : modo ? modoDe(modo).accion : 'Cargar'}
        onConfirmar={cargar}
      >
        {/* Qué ciclo recibe la carga y a cuántas personas toca (regla «preguntar-antes»). */}
        {ciclo ? (
          <RegistroConfirmar
            icono={FileImportIcon}
            nombre={esNuevoCiclo ? 'Nuevo ciclo' : ciclo.nombre}
            detalle={`${archivo?.name ?? 'Archivo'} · ${listos.length} ${listos.length === 1 ? 'persona' : 'personas'} · ${objetivosListos} ${objetivosListos === 1 ? 'objetivo' : 'objetivos'}`}
            estado={esNuevoCiclo ? undefined : ciclo.estado}
            tono="neutro"
          />
        ) : null}
      </DialogoConfirmar>

      <DialogoConfirmar
        abierto={porQuitar !== null}
        onAbiertoChange={(valor) => (valor ? undefined : setPorQuitar(null))}
        icono={Delete02Icon}
        titulo="¿Quitar a esta persona de la carga?"
        descripcion={`Los ${porQuitar?.objetivos.length ?? 0} ${porQuitar?.objetivos.length === 1 ? 'objetivo' : 'objetivos'} de «${porQuitar?.persona?.name ?? porQuitar?.identificador ?? ''}» no se cargan. El archivo no cambia: si la necesitas, vuelve a analizarlo.`}
        accion="Quitar"
        destructiva
        onConfirmar={() => {
          if (porQuitar) setGrupos((actuales) => actuales?.filter((grupo) => grupo.identificador !== porQuitar.identificador) ?? null)
          setPorQuitar(null)
        }}
      >
        {porQuitar ? (
          <RegistroConfirmar
            nombre={porQuitar.persona?.name ?? porQuitar.identificador}
            detalle={`${porQuitar.objetivos.length} ${porQuitar.objetivos.length === 1 ? 'objetivo' : 'objetivos'} · ${archivo?.name ?? 'archivo'}`}
            tono="neutro"
          />
        ) : null}
      </DialogoConfirmar>

      {/* La ventana de salir del sistema (regla «salir-con-dialogo», 13-oct): «Seguir aquí» y la salida en azul. */}
      <DialogoSalir
        abierto={salir}
        onAbiertoChange={setSalir}
        salida="Salir de la creación"
        descripcion="Se pierde lo que revisaste y corregiste: no se carga nada y el archivo no se guarda."
        onSalir={cerrar}
      />
    </>
  )
}
