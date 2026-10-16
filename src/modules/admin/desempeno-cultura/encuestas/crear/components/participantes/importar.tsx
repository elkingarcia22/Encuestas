import { useMemo, useRef, useState, type ReactNode } from 'react'
import { useParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, ArrowDown01Icon, Delete02Icon, File01Icon, Logout01Icon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  FramePanel,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
  Progress,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
} from '@ubits/flux-ui'
import { AiThinking } from '@/shared/components/AiThinking'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { notify } from '@/shared/components/notify'
import { FilasSeparadas, MarcoLista } from '../../../components/marco-lista'
import { EncabezadoPaso } from '../../../components/pasos-drawer'
import { ListaDatos } from '@/modules/admin/seleccion/vacantes/crear/components/piezas-resumen'
import { AdjuntoCsv } from '@/modules/design-system/estados/procesos'
import { DialogoConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { PILL } from '@/modules/design-system/drawers/components/drawer-styles'
import { Persona } from '@/modules/design-system/data-grid/casos/seguimiento'
import { pagina } from '@/modules/design-system/templates/admin-compartido/lista'
import { COLLABORATORS } from '../../../modelo/collaborators'
import {
  EXTENSIONES_PARTICIPANTES,
  MOTIVOS_DESCARTE,
  TAMANO_MAXIMO_PARTICIPANTES,
  claveImportado,
  participantesDeFilas,
  quitarImportados,
  type FilaDescartada,
  type MotivoDescarte,
} from '../../../modelo/importarParticipantes'
import { formatCount, resolveImportedRows, type ResolvedImportRow } from '../../../modelo/participants'
import { leerLibro } from '../../../modelo/planilla'
import type { ImportedDemographic, ImportedUser, ParticipantsSelection } from '../../../modelo/surveyBuilderTypes'
import { fallaEnQA } from '../../../modelo/surveyCasos'
import { AccionesSeleccion, Paginacion } from '../../../components/tabla-piezas'
import { ZonaArchivo } from '../../../components/zona-archivo'
import { FallaIa } from '../../../components/falla-ia'

// «Importar con IA», siempre el mismo recorrido: en el panel lateral se elige el archivo, se lee de verdad
// (CSV o Excel) y se cruza con el directorio —una fila es de alguien que ya está en UBITS si coincide su
// username o su correo—. Todo lo leído llega marcado; se desmarca lo que no se quiera y «Cargar» lo suma a
// «Participantes cargados», sin repetir a nadie. Volver a importar repite el recorrido y va sumando. Las
// columnas de más se ofrecen como datos demográficos en el paso siguiente.

const MS_ANALISIS = 1800

export type LoteImportado = { usuarios: ImportedUser[]; demograficos: ImportedDemographic[]; archivo: string }

const personas = (cuantas: number) => `${formatCount(cuantas)} ${cuantas === 1 ? 'persona' : 'personas'}`

// Una persona del archivo: nombre y correo (o usuario), si ya está en UBITS o es nueva, y su área.
function FilaImportada({ fila, control, accion, className }: { fila: ResolvedImportRow; control?: ReactNode; accion?: ReactNode; className?: string }) {
  const { user, person } = fila
  const area = user.area || person?.area
  return (
    <Item size="sm" className={`gap-3 ${className ?? ''}`}>
      {control}
      <ItemContent>
        <Persona nombre={user.name || person?.name || user.username} detalle={user.email || user.username || undefined} />
      </ItemContent>
      <ItemActions className="gap-2">
        <Badge variant={person ? 'secondary' : 'info-light'} size="xs">
          {person ? 'Ya en UBITS' : 'Nueva'}
        </Badge>
        {area ? (
          <Badge variant="outline" size="xs" className="hidden sm:inline-flex">
            {area}
          </Badge>
        ) : null}
        {accion}
      </ItemActions>
    </Item>
  )
}

/* ------------------------------------------------------------ el panel lateral */

type Revision = { archivo: string; filas: readonly ResolvedImportRow[]; demograficos: ImportedDemographic[]; descartadas: readonly FilaDescartada[] }

const ORDEN_MOTIVOS: readonly MotivoDescarte[] = ['correo', 'sin-nombre', 'repetida']
const filasTexto = (cuantas: number) => `${formatCount(cuantas)} ${cuantas === 1 ? 'fila' : 'filas'}`

// Cuántas filas no entran y por qué, en una línea: «2 con el correo inválido · 1 repetida».
function resumenDescartes(descartadas: readonly FilaDescartada[]): string {
  return ORDEN_MOTIVOS.flatMap((motivo) => {
    const cuantas = descartadas.filter((fila) => fila.motivo === motivo).length
    return cuantas === 0 ? [] : [`${formatCount(cuantas)} ${cuantas === 1 ? MOTIVOS_DESCARTE[motivo].uno : MOTIVOS_DESCARTE[motivo].varios}`]
  }).join(' · ')
}

const ETIQUETA_MOTIVO: Record<MotivoDescarte, string> = { correo: 'Correo inválido', 'sin-nombre': 'Sin nombre', repetida: 'Repetida' }

// Las filas que no se cargan, antes de cargar (IA-020): el aviso dice cuántas y por qué, y debajo va cada una con su número
// de fila en la planilla, para corregirla en el archivo. No se pueden marcar: no entran.
function FilasConProblemas({ descartadas }: { descartadas: readonly FilaDescartada[] }) {
  return (
    <div className="flex flex-col gap-3">
      <Alert variant="warning">
        <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />
        <AlertTitle>{`${filasTexto(descartadas.length)} del archivo no se ${descartadas.length === 1 ? 'cargará' : 'cargarán'}`}</AlertTitle>
        <AlertDescription>{`${resumenDescartes(descartadas)}.`}</AlertDescription>
      </Alert>
      <MarcoLista titulo="Filas con problemas" descripcion="Corrígelas en el archivo y vuelve a importarlo si quieres sumarlas.">
      <FramePanel className="py-1!">
        <FilasSeparadas>
          {descartadas.map((fila) => (
            <Item key={fila.fila} size="sm" className="gap-3 px-0!">
              <ItemContent>
                <ItemTitle>Fila {fila.fila}</ItemTitle>
                <ItemDescription className="truncate">{fila.detalle}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Badge variant="warning-light" size="xs">
                  {ETIQUETA_MOTIVO[fila.motivo]}
                </Badge>
              </ItemActions>
            </Item>
          ))}
        </FilasSeparadas>
      </FramePanel>
      </MarcoLista>
    </div>
  )
}

export function DrawerImportar({ open, onOpenChange, onCargar }: { open: boolean; onOpenChange: (open: boolean) => void; onCargar: (lote: LoteImportado) => void }) {
  const [analizando, setAnalizando] = useState<string | null>(null)
  const [revision, setRevision] = useState<Revision | null>(null)
  const [elegidas, setElegidas] = useState<ReadonlySet<string>>(() => new Set())
  const [filtro, setFiltro] = useState<'todas' | 'nuevas' | 'ubits'>('todas')
  // El archivo cuyo análisis falló: se guarda para reintentar sin volver a elegirlo (IA-026). Falla siempre al editar la
  // encuesta de prueba que falla (fallaEnQA); el id sale de la ruta del constructor.
  const [fallido, setFallido] = useState<File | null>(null)
  const { id } = useParams()
  // Cada lectura lleva su número: si se sale a mitad, lo que termine de leerse después se descarta y el panel reabre limpio.
  const turno = useRef(0)
  // Con un archivo elegido (leyéndose, leído o fallido), cerrar pregunta antes, como el resto de Encuestas.
  const [confirmarSalida, setConfirmarSalida] = useState(false)
  const archivoActual = analizando ?? revision?.archivo ?? fallido?.name ?? null

  const reiniciar = () => {
    turno.current += 1
    setFallido(null)
    setAnalizando(null)
    setRevision(null)
    setElegidas(new Set())
    setFiltro('todas')
  }

  const leer = async (archivo: File) => {
    const esta = ++turno.current
    setFallido(null)
    setAnalizando(archivo.name)
    // Se lee con las filas vacías en su sitio (la primera hoja): así el número de una fila con problemas es el de la planilla.
    const [lectura] = await Promise.allSettled([leerLibro(archivo).then((hojas) => hojas[0]?.filas ?? []), new Promise((listo) => window.setTimeout(listo, MS_ANALISIS))])
    if (esta !== turno.current) return
    setAnalizando(null)
    if (fallaEnQA(id)) {
      setFallido(archivo)
      return
    }
    if (lectura.status === 'rejected') {
      notify('No pudimos leer el archivo', `«${archivo.name}» parece estar corrupto o no ser una planilla válida.`)
      return
    }
    const { usuarios, demograficos, descartadas } = participantesDeFilas(lectura.value)
    if (usuarios.length === 0) {
      notify(
        'No encontramos usuarios en el archivo',
        descartadas.length > 0
          ? `Ninguna fila de «${archivo.name}» se puede cargar: ${resumenDescartes(descartadas)}.`
          : `«${archivo.name}» es válido, pero no tiene una columna «name» o «username» con datos.`,
      )
      return
    }
    const filas = resolveImportedRows(usuarios, COLLABORATORS)
    setRevision({ archivo: archivo.name, filas, demograficos, descartadas })
    // Todo llega marcado: se desmarca lo que no se quiera cargar.
    setElegidas(new Set(filas.map((fila) => claveImportado(fila.user))))
    setFiltro('todas')
  }

  const salirDelTodo = () => {
    setConfirmarSalida(false)
    onOpenChange(false)
    reiniciar()
  }

  const cerrar = (abierto: boolean) => {
    if (abierto) return onOpenChange(true)
    if (archivoActual) return setConfirmarSalida(true)
    salirDelTodo()
  }

  const cargar = () => {
    if (!revision) return
    const usuarios = revision.filas.map((fila) => fila.user).filter((usuario) => elegidas.has(claveImportado(usuario)))
    onCargar({ usuarios, demograficos: revision.demograficos, archivo: revision.archivo })
    salirDelTodo()
  }

  const nuevas = revision?.filas.filter((fila) => fila.person === null) ?? []
  const enUbits = revision?.filas.filter((fila) => fila.person !== null) ?? []
  const visibles = filtro === 'nuevas' ? nuevas : filtro === 'ubits' ? enUbits : (revision?.filas ?? [])
  const clavesVisibles = visibles.map((fila) => claveImportado(fila.user))
  const todasVisibles = clavesVisibles.length > 0 && clavesVisibles.every((clave) => elegidas.has(clave))

  const alternar = (clave: string) =>
    setElegidas((previas) => {
      const siguientes = new Set(previas)
      if (siguientes.has(clave)) siguientes.delete(clave)
      else siguientes.add(clave)
      return siguientes
    })
  const alternarVisibles = () =>
    setElegidas((previas) => {
      const siguientes = new Set(previas)
      clavesVisibles.forEach((clave) => (todasVisibles ? siguientes.delete(clave) : siguientes.add(clave)))
      return siguientes
    })

  return (
    <>
    <DrawerShell
      open={open}
      onOpenChange={cerrar}
      size="lg"
      ai
      title="Importar con IA"
      description="Participantes desde un archivo."
      footer={
        <>
          <Button variant="outline" className={PILL} onClick={() => cerrar(false)}>
            Cancelar
          </Button>
          <Button className={PILL} disabled={!revision || elegidas.size === 0} onClick={cargar}>
            {revision ? `Cargar ${personas(elegidas.size)}` : 'Cargar'}
          </Button>
        </>
      }
    >
      {analizando ? (
        <div className="flex flex-col items-center gap-4 py-12">
          <AiThinking label="Analizando el archivo: participantes y datos demográficos…" />
          <Progress value={null} className="w-64" aria-label="Analizando el archivo" />
          <Text as="span" size="sm" variant="muted">
            Leyendo «{analizando}» y revisando qué columnas sirven como datos demográficos.
          </Text>
        </div>
      ) : fallido ? (
        // Como las demás fallas de la IA (FallaIa): el vacío con «Reintentar», y el archivo sigue elegido.
        <FallaIa
          titulo="No pudimos analizar el archivo"
          descripcion={`La IA no respondió al leer «${fallido.name}». El archivo sigue elegido: puedes reintentar sin volver a subirlo.`}
          otra={{ texto: 'Elegir otro archivo', onClick: () => setFallido(null) }}
          onReintentar={() => void leer(fallido)}
        />
      ) : !revision ? (
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
          <EncabezadoPaso titulo="¿A quién quieres sumar?" descripcion="Sube la lista: la cruzamos con el directorio de UBITS y después eliges a quién cargar." />
        <ZonaArchivo
          descripcion="CSV o Excel con nombre o username · hasta 5 MB"
          extensiones={EXTENSIONES_PARTICIPANTES}
          maximoBytes={TAMANO_MAXIMO_PARTICIPANTES}
          onArchivo={(archivo) => void leer(archivo)}
          onRechazo={(rechazo) => notify(rechazo.titulo, rechazo.detalle)}
        />
          </div>
          {/* Qué columnas lee, como la guía de «Importar con IA» de secciones: una fila por columna. */}
          <MarcoLista titulo="Qué debe traer el archivo" descripcion="Una fila por persona, con estas columnas.">
            <FramePanel>
              <ListaDatos
                filas={[
                  { termino: 'Nombre o username', valor: 'Obligatorio' },
                  { termino: 'Correo', valor: 'Opcional' },
                  { termino: 'Área, sede u otras', valor: 'Datos demográficos' },
                ]}
              />
            </FramePanel>
          </MarcoLista>
        </section>
      ) : (
        <div className="flex flex-col gap-4">
          <AdjuntoCsv
            estado="done"
            className="w-full!"
            icono={File01Icon}
            vacio={{ titulo: '', descripcion: '' }}
            nombre={revision.archivo}
            descripcion={`${personas(revision.filas.length)} · ${formatCount(nuevas.length)} nuevas · ${formatCount(enUbits.length)} ya en UBITS${revision.descartadas.length > 0 ? ` · ${filasTexto(revision.descartadas.length)} con problemas` : ''}`}
            onElegir={() => undefined}
            onQuitar={reiniciar}
          />

          {revision.descartadas.length > 0 ? <FilasConProblemas descartadas={revision.descartadas} /> : null}

          {/* Lo encontrado en su marco, como «Cargar encuestas»: el recuento arriba, las columnas demográficas en su panel y
              la lista de personas con una línea entre cada una. */}
          <MarcoLista titulo="Personas del archivo" descripcion={<span aria-live="polite">{`${formatCount(elegidas.size)} de ${personas(revision.filas.length)} para cargar`}</span>}>
          {revision.demograficos.length > 0 ? (
            <FramePanel className="flex flex-wrap items-center gap-1.5">
              <Text as="span" size="sm" variant="muted" className="me-1">
                Datos demográficos
              </Text>
              {revision.demograficos.map((entrada) => (
                <Badge key={entrada.key} variant="outline">
                  {entrada.label}
                </Badge>
              ))}
            </FramePanel>
          ) : null}
          <FramePanel className="flex flex-col gap-1 pb-1!">
          <Tabs value={filtro} onValueChange={(valor) => setFiltro(valor as typeof filtro)}>
            <TabsList variant="line">
              <TabsTrigger value="todas" className="flex-none">
                Todas ({formatCount(revision.filas.length)})
              </TabsTrigger>
              <TabsTrigger value="nuevas" className="flex-none">
                Nuevas ({formatCount(nuevas.length)})
              </TabsTrigger>
              <TabsTrigger value="ubits" className="flex-none">
                Ya en UBITS ({formatCount(enUbits.length)})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {visibles.length === 0 ? (
            <Text as="p" size="sm" variant="muted" className="py-6 text-center">
              No hay personas en este grupo.
            </Text>
          ) : (
            <FilasSeparadas>
              <Item size="sm" className="gap-3 px-0!" render={<label />}>
                <Checkbox checked={todasVisibles} onCheckedChange={alternarVisibles} aria-label="Marcar todas las de esta lista" />
                <Text as="span" size="sm" variant="muted">
                  Marcar todas
                </Text>
              </Item>
              {visibles.map((fila, indice) => {
                const clave = claveImportado(fila.user)
                return (
                  <FilaImportada
                    key={`${clave}-${indice}`}
                    fila={fila}
                    className="px-0!"
                    control={<Checkbox checked={elegidas.has(clave)} onCheckedChange={() => alternar(clave)} aria-label={`Cargar a ${fila.user.name || fila.user.username}`} />}
                  />
                )
              })}
            </FilasSeparadas>
          )}
          </FramePanel>
          </MarcoLista>
        </div>
      )}
    </DrawerShell>
    <DialogoConfirmar
      abierto={confirmarSalida}
      onAbiertoChange={setConfirmarSalida}
      icono={Logout01Icon}
      titulo="¿Salir de la importación?"
      descripcion={`Se pierde lo que leímos de «${archivoActual ?? ''}» y no se carga a nadie como participante.`}
      cancelar="Seguir aquí"
      accion="Salir de la importación"
      onConfirmar={salirDelTodo}
    />
    </>
  )
}

/* ------------------------------------------------ lo cargado, en su contenedor */

export function ParticipantesCargados({ seleccion, onCambio }: { seleccion: ParticipantsSelection; onCambio: (cambio: Partial<ParticipantsSelection>) => void }) {
  const [actual, setActual] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  // Las filas marcadas para una acción masiva, por su clave. Sigue a las filas que existen: una que se quita no queda marcada.
  const [marcadas, setMarcadas] = useState<ReadonlySet<string>>(() => new Set())
  const filas = useMemo(() => resolveImportedRows(seleccion.importedUsers, COLLABORATORS), [seleccion.importedUsers])
  const visibles = pagina([...filas], actual, porPagina)

  const clavesVisibles = visibles.map((fila) => claveImportado(fila.user))
  const clavesTodas = filas.map((fila) => claveImportado(fila.user))
  const marcadasAhora = clavesTodas.filter((clave) => marcadas.has(clave))
  const enPagina = clavesVisibles.filter((clave) => marcadas.has(clave)).length
  const paginaCompleta = visibles.length > 0 && enPagina === visibles.length

  const marcar = (claves: readonly string[]) => setMarcadas((previas) => new Set([...previas, ...claves]))
  const desmarcar = (claves: readonly string[]) => setMarcadas((previas) => new Set([...previas].filter((clave) => !claves.includes(clave))))
  const alternar = (clave: string) => (marcadas.has(clave) ? desmarcar([clave]) : marcar([clave]))

  const quitar = (claves: ReadonlySet<string>) => {
    onCambio(quitarImportados(seleccion, claves, COLLABORATORS))
    setMarcadas(new Set())
    if (visibles.length === claves.size && actual > 1) setActual(actual - 1)
  }
  const quitarMarcadas = () => {
    quitar(new Set(marcadasAhora))
    notify(marcadasAhora.length === 1 ? 'Quitamos a 1 persona' : `Quitamos a ${personas(marcadasAhora.length)}`, 'Ya no responderán la encuesta por esta carga.')
  }

  return (
    <div className="flex flex-col gap-4">
      {seleccion.importedDemographics.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <Text as="span" size="sm" variant="muted">
            Datos demográficos que trajeron:
          </Text>
          {seleccion.importedDemographics.map((entrada) => (
            <Badge key={entrada.key} variant="outline" size="xs">
              {entrada.label}
            </Badge>
          ))}
        </div>
      ) : null}

      {/* La cabecera de la lista, como la de una tabla: casilla con su menú, el conteo y, a la derecha, las acciones de lo marcado
          (solo aparecen al marcar) o «Quitar a todas». */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Checkbox
            checked={paginaCompleta}
            indeterminate={enPagina > 0 && !paginaCompleta}
            onCheckedChange={() => (paginaCompleta ? desmarcar(clavesVisibles) : marcar(clavesVisibles))}
            aria-label="Seleccionar las personas de esta página"
          />
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" aria-label="Opciones de selección" />}>
              <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {/* Solo se ofrece lo que tiene efecto según lo marcado. */}
              <DropdownMenuGroup>
                {enPagina < visibles.length ? <DropdownMenuItem onClick={() => marcar(clavesVisibles)}>Seleccionar esta página</DropdownMenuItem> : null}
                {enPagina > 0 ? <DropdownMenuItem onClick={() => desmarcar(clavesVisibles)}>Desmarcar esta página ({formatCount(enPagina)})</DropdownMenuItem> : null}
              </DropdownMenuGroup>
              {filas.length > visibles.length ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    {marcadasAhora.length < filas.length ? <DropdownMenuItem onClick={() => marcar(clavesTodas)}>Seleccionar todo ({formatCount(filas.length)})</DropdownMenuItem> : null}
                    {marcadasAhora.length > 0 ? <DropdownMenuItem onClick={() => desmarcar(clavesTodas)}>Desmarcar todo ({formatCount(marcadasAhora.length)})</DropdownMenuItem> : null}
                  </DropdownMenuGroup>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
          <Text as="span" size="sm" variant="muted" className="ms-1" aria-live="polite">
            {marcadasAhora.length > 0 ? `${formatCount(marcadasAhora.length)} ${marcadasAhora.length === 1 ? 'seleccionada' : 'seleccionadas'} de ${personas(filas.length)}` : personas(filas.length)}
          </Text>
        </div>
        {marcadasAhora.length > 0 ? (
          <AccionesSeleccion
            acciones={[
              {
                id: 'quitar',
                etiqueta: marcadasAhora.length === 1 ? 'Quitar a la persona seleccionada' : 'Quitar a las personas seleccionadas',
                icono: <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />,
                destructiva: true,
                onClick: quitarMarcadas,
              },
            ]}
          />
        ) : (
          <Button variant="ghost" size="sm" onClick={() => quitar(new Set(clavesTodas))}>
            Quitar a todas
          </Button>
        )}
      </div>

      <ItemGroup className="gap-0! rounded-xl border">
        {visibles.map((fila, indice) => {
          const clave = claveImportado(fila.user)
          const nombre = fila.user.name || fila.person?.name || fila.user.username
          return (
            <div key={`${clave}-${indice}`}>
              {indice > 0 ? <ItemSeparator /> : null}
              <FilaImportada
                fila={fila}
                control={<Checkbox checked={marcadas.has(clave)} onCheckedChange={() => alternar(clave)} aria-label={`Seleccionar a ${nombre}`} />}
                accion={
                  <BotonIcono aria-label={`Quitar a ${nombre}`} className="text-destructive!" onClick={() => quitar(new Set([clave]))}>
                    <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
                  </BotonIcono>
                }
              />
            </div>
          )
        })}
      </ItemGroup>

      {filas.length > porPagina ? (
        <Paginacion
          id="cargados"
          actual={actual}
          total={filas.length}
          porPagina={porPagina}
          onCambiarPagina={setActual}
          onCambiarPorPagina={(valor) => {
            setPorPagina(valor)
            setActual(1)
          }}
        />
      ) : null}
    </div>
  )
}
