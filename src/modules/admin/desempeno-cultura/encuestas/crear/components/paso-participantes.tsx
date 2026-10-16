import { useState, type ReactNode } from 'react'
import { Accordion, Badge, Frame, FrameDescription, FrameHeader, FrameTitle, Switch, Text } from '@ubits/flux-ui'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import { COLLABORATOR_COUNT, type Collaborator } from '../../modelo/collaborators'
import { formatCount, participantCountForMode, participantsGroupBreakdown, segmentCounts, totalParticipantCount } from '../../modelo/participants'
import { quitadosConRespuestas } from '../../modelo/respuestas-previas'
import type { ParticipantsSelection } from '../../modelo/surveyBuilderTypes'
import { DialogoRespuestas, type DestinoRespuestas } from './participantes/dialogo-respuestas'
import { ListaDeGrupos, ListaDePersonas } from './participantes/directorio'
import { notify } from '@/shared/components/notify'
import { COLLABORATORS } from '../../modelo/collaborators'
import { sumarImportados } from '../../modelo/importarParticipantes'
import { DrawerImportar, ParticipantesCargados, type LoteImportado } from './participantes/importar'
import { Sincronizar } from './participantes/sincronizar'
import { ContenedorDesplegable } from './participantes/contenedor-desplegable'

// Paso 2 · Participantes: a quién se le pregunta. Va antes que el contenido a propósito: decidir a
// quién se le pregunta cambia qué vale la pena preguntar.
//
// «Toda la empresa» y el archivo importado con IA llevan interruptor; «Por grupos» y «Por persona» son acordeones normales
// que solo muestran u ocultan su lista. «Toda la empresa» va sola (solo pregunta si sincronizar con la empresa): al
// encenderla se vacían los demás (y vuelven al apagarla); todo lo elegido se suma sin repetir a nadie. Las versiones
// anteriores están en participantes-v1/ a -v6/. «Importar con IA» va arriba del paso, a la derecha. Un grupo elegido entra completo, salvo las personas que se dejen
// fuera: el grupo sigue elegido, su fila dice cuántas faltan y quiénes son, y el panel «Así va la encuesta» las cuenta.

type Fuente = 'grupos' | 'personas' | 'archivo'

const personas = (cuantas: number) => `${formatCount(cuantas)} ${cuantas === 1 ? 'persona' : 'personas'}`

const SIN_ARCHIVO: Partial<ParticipantsSelection> = {
  importedFileName: null,
  importedUsers: [],
  importedCount: 0,
  importedNewCount: 0,
  importedDemographics: [],
  importedFailed: false,
}

// Un contenedor: cabecera con título, detalle, conteo e interruptor; debajo, su lista si está encendido.
function Contenedor({
  id,
  titulo,
  detalle,
  conteo,
  activo,
  onActivo,
  children,
}: {
  id: string
  titulo: string
  detalle: string
  conteo?: string
  activo: boolean
  onActivo: (activo: boolean) => void
  children?: ReactNode
}) {
  return (
    <Frame>
      <FrameHeader className="flex-row! items-center! justify-between! gap-3!">
        <div className="flex min-w-0 flex-col gap-1">
          <FrameTitle id={`${id}-titulo`}>{titulo}</FrameTitle>
          <FrameDescription>{detalle}</FrameDescription>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {conteo ? (
            <Badge variant="outline" size="sm" className="tabular-nums">
              {conteo}
            </Badge>
          ) : null}
          <Switch id={`${id}`} checked={activo} onCheckedChange={onActivo} aria-labelledby={`${id}-titulo`} />
        </div>
      </FrameHeader>
      {/* Sin caja blanca adentro: el contenido va sobre el gris del marco, con el mismo margen que el título. */}
      {activo && children ? <div className="flex flex-col gap-2 px-(--frame-panel-header-px) pb-(--frame-panel-header-py)">{children}</div> : null}
    </Frame>
  )
}

export function PasoParticipantes({ seleccion, onCambio, respondieron = null, sugeridos, minimoPorGrupo = null }: { seleccion: ParticipantsSelection; onCambio: (cambio: Partial<ParticipantsSelection>) => void; respondieron?: ReadonlySet<string> | null; sugeridos?: ReadonlySet<"grupos" | "personas">; /** Encuesta anónima: el mínimo de respuestas para que un grupo vea sus resultados (PAR-019). */ minimoPorGrupo?: number | null }) {
  const todaLaEmpresa = seleccion.mode === 'company'
  const total = totalParticipantCount(seleccion)
  const [importando, setImportando] = useState(false)

  // Editando una encuesta que ya corre: quitar a alguien que ya respondió pide decidir qué pasa con sus respuestas antes
  // de aplicar nada. Toda salida de gente pasa por `pedir`; si cancelan, no cambia ni la selección ni los contenedores.
  const [pendiente, setPendiente] = useState<{ afectados: readonly Collaborator[]; ejecutar: (extra: Partial<ParticipantsSelection>) => void } | null>(null)
  const pedir = (cambio: Partial<ParticipantsSelection>, ejecutar: (extra: Partial<ParticipantsSelection>) => void) => {
    const afectados = respondieron ? quitadosConRespuestas(seleccion, { ...seleccion, ...cambio }, respondieron) : []
    if (afectados.length === 0) return ejecutar({})
    setPendiente({ afectados, ejecutar })
  }
  const pedirCambio = (cambio: Partial<ParticipantsSelection>) => pedir(cambio, (extra) => onCambio({ ...cambio, ...extra }))
  const resolver = (destino: DestinoRespuestas) => {
    if (!pendiente) return
    const ids = new Set(pendiente.afectados.map((persona) => persona.id))
    const previos = seleccion.discardedAnswerIds ?? []
    pendiente.ejecutar({ discardedAnswerIds: destino === 'descartar' ? [...new Set([...previos, ...ids])] : previos.filter((id) => !ids.has(id)) })
    setPendiente(null)
  }

  const { groups, outsideCount, excludedCount, importedCount } = participantsGroupBreakdown(todaLaEmpresa ? { ...seleccion, mode: 'groups' } : seleccion)
  const personasDeGrupos = participantCountForMode('groups', seleccion)
  const conArchivo = seleccion.importedUsers.length > 0
  const gruposPosibles = segmentCounts(seleccion.groupSegmentBy).size

  // Qué contenedores están encendidos. Solo cuenta lo de los encendidos: al apagar uno, lo suyo sale de la
  // encuesta y se guarda aparte (`guardados`) para devolverlo si se vuelve a encender en esta visita. Nada se
  // enciende solo: al apagar toda la empresa, todo queda apagado hasta que se encienda algo.
  const [encendidos, setEncendidos] = useState<ReadonlySet<Fuente>>(() => {
    if (todaLaEmpresa) return new Set()
    return new Set<Fuente>(conArchivo ? ['archivo'] : [])
  })
  // Los acordeones «Por grupos» y «Por persona» se abren de uno en uno; arranca abierto el que ya trae algo elegido (o el sugerido).
  const [abiertas, setAbiertas] = useState<string[]>(() => {
    if (todaLaEmpresa) return []
    const conAlgo = [...(seleccion.selectedGroups.length ? ['grupos'] : []), ...(seleccion.selectedIds.length ? ['personas'] : [])]
    return (conAlgo.length ? conAlgo : [...(sugeridos ?? [])]).slice(0, 1)
  })
  const [guardados, setGuardados] = useState<Partial<Record<Fuente, Partial<ParticipantsSelection>>>>({})
  const encendido = (fuente: Fuente) => !todaLaEmpresa && encendidos.has(fuente)

  const loDe = (fuente: Fuente): Partial<ParticipantsSelection> =>
    fuente === 'grupos'
      ? { groupSegmentBy: seleccion.groupSegmentBy, selectedGroups: seleccion.selectedGroups }
      : fuente === 'personas'
        ? { selectedIds: seleccion.selectedIds }
        : {
            importedFileName: seleccion.importedFileName,
            importedUsers: seleccion.importedUsers,
            importedCount: seleccion.importedCount,
            importedNewCount: seleccion.importedNewCount,
            importedDemographics: seleccion.importedDemographics,
            importedFailed: seleccion.importedFailed,
          }
  const tieneAlgo = (fuente: Fuente) => (fuente === 'grupos' ? groups.length > 0 : fuente === 'personas' ? seleccion.selectedIds.length > 0 : conArchivo)
  const vacio = (fuente: Fuente): Partial<ParticipantsSelection> => (fuente === 'grupos' ? { selectedGroups: [] } : fuente === 'personas' ? { selectedIds: [] } : SIN_ARCHIVO)

  // Guarda aparte lo de las fuentes indicadas y lo saca de la encuesta.
  const vaciado = (fuentes: Fuente[]) => Object.assign({}, ...fuentes.map(vacio)) as Partial<ParticipantsSelection>
  const guardarAparte = (fuentes: Fuente[]) => {
    const conAlgo = fuentes.filter(tieneAlgo)
    if (conAlgo.length) setGuardados((previos) => ({ ...previos, ...Object.fromEntries(conAlgo.map((fuente) => [fuente, loDe(fuente)])) }))
  }
  const guardarYVaciar = (fuentes: Fuente[]) => {
    guardarAparte(fuentes)
    return vaciado(fuentes)
  }

  const cambiarEmpresa = (activo: boolean) => {
    if (activo) {
      onCambio({ mode: 'company', ...guardarYVaciar(['grupos', 'personas', 'archivo']) })
      setEncendidos(new Set())
    } else {
      pedir({ mode: 'groups' }, (extra) => onCambio({ mode: 'groups', ...recuperarGuardado(), ...extra }))
    }
  }

  // Lo que estaba elegido en grupos y personas antes de encender toda la empresa vuelve al apagarla (o al elegir algo ahí).
  const recuperarGuardado = (): Partial<ParticipantsSelection> => {
    const recuperado = { ...guardados.grupos, ...guardados.personas }
    if (guardados.grupos || guardados.personas) setGuardados((previos) => ({ ...previos, grupos: undefined, personas: undefined }))
    return recuperado
  }
  // Elegir algo en un acordeón con toda la empresa encendida la apaga; lo elegido en la lista manda sobre lo guardado.
  const cambioDeLista = (cambio: Partial<ParticipantsSelection>) => pedirCambio(todaLaEmpresa ? { mode: 'groups', ...recuperarGuardado(), ...cambio } : cambio)

  const alternar = (fuente: Fuente, activo: boolean) => {
    if (!activo) {
      const cambio = vaciado([fuente])
      pedir(cambio, (extra) => {
        setEncendidos((previos) => new Set([...previos].filter((otra) => otra !== fuente)))
        guardarAparte([fuente])
        onCambio({ ...cambio, ...extra })
      })
      return
    }
    setEncendidos((previos) => new Set([...previos, fuente]))
    const recuperado = guardados[fuente]
    if (recuperado) setGuardados((previos) => ({ ...previos, [fuente]: undefined }))
    onCambio({ ...(todaLaEmpresa ? { mode: 'groups' as const } : {}), ...(recuperado ?? {}) })
    if (fuente === 'archivo' && !recuperado && !conArchivo) setImportando(true)
  }

  // «Cargar» en el panel: lo elegido se suma a «Participantes cargados» sin repetir a nadie (y a lo que estuviera
  // guardado si ese contenedor estaba apagado). El contenedor queda encendido; si estaba toda la empresa, se apaga.
  const cargarLote = (lote: LoteImportado) => {
    const base: ParticipantsSelection = guardados.archivo && !encendido('archivo') ? { ...seleccion, ...guardados.archivo } : seleccion
    const { cambio, agregados } = sumarImportados(base, lote, COLLABORATORS)
    setGuardados((previos) => ({ ...previos, archivo: undefined }))
    setEncendidos((previos) => new Set([...previos, 'archivo']))
    onCambio({ ...cambio, ...(todaLaEmpresa ? { mode: 'groups' as const } : {}) })
    notify(
      agregados > 0 ? `Cargamos ${personas(agregados)} de «${lote.archivo}»` : `«${lote.archivo}» no sumó a nadie nuevo`,
      agregados < lote.usuarios.length ? (lote.usuarios.length - agregados === 1 ? '1 persona ya estaba cargada.' : `${personas(lote.usuarios.length - agregados)} ya estaban cargadas.`) : undefined,
    )
  }

  const desglose = [
    groups.length ? `${personas(personasDeGrupos)} de ${groups.length} ${groups.length === 1 ? 'grupo' : 'grupos'}${excludedCount ? ` (sin ${formatCount(excludedCount)} ${excludedCount === 1 ? 'excluida' : 'excluidas'})` : ''}` : '',
    outsideCount ? `${personas(outsideCount)} ${outsideCount === 1 ? 'elegida' : 'elegidas'} una a una` : '',
    importedCount ? `${personas(importedCount)} del archivo` : '',
  ].filter(Boolean)

  // Cómo se describe un contenedor apagado: si toda la empresa lo apaga y si tiene algo guardado para volver.
  const detalle = (fuente: Fuente, normal: string) => {
    if (encendido(fuente)) return normal
    const vuelve = guardados[fuente] ? ' Al encenderlo recuperas lo que tenías.' : ''
    return todaLaEmpresa ? `Apagado mientras la encuesta vaya a toda la empresa.${vuelve}` : `${normal}${vuelve}`
  }
  const conteoGuardado = (fuente: Fuente) => {
    const g = guardados[fuente]
    if (!g) return undefined
    if (fuente === 'grupos') {
      const n = g.selectedGroups?.length ?? 0
      return `${n} ${n === 1 ? 'grupo guardado' : 'grupos guardados'}`
    }
    if (fuente === 'personas') {
      const n = g.selectedIds?.length ?? 0
      return `${formatCount(n)} ${n === 1 ? 'persona guardada' : 'personas guardadas'}`
    }
    return 'Archivo guardado'
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Arriba del todo: a la izquierda el aviso de qué pasa al cargar un archivo (siempre visible; cambia según haya toda la empresa
          encendida o no) y, a la derecha de todo, el botón de IA para traer gente desde un archivo. */}
      <div className="flex items-center justify-between gap-3">
        <Text as="p" size="sm" variant="muted">
          {todaLaEmpresa
            ? '¿Ya tienes la lista en un archivo? Al cargarla se apaga toda la empresa y se suma lo que elijas.'
            : '¿Ya tienes la lista en un archivo? Al cargarla se suma a lo que elijas, sin repetir a nadie.'}
        </Text>
        <BotonIaSecundario className="shrink-0" onClick={() => setImportando(true)}>
          Importar con IA
        </BotonIaSecundario>
      </div>

      {/* Sin título ni conteo propios: el paso ya lo nombra y el total vive en «Así va la encuesta». */}
      <Contenedor
        id="participantes-empresa"
        titulo="Toda la empresa"
        detalle={`Las ${formatCount(COLLABORATOR_COUNT)} personas que hoy están en la plataforma. No hay que elegir nada más.`}
        activo={todaLaEmpresa}
        onActivo={cambiarEmpresa}
      >
        {/* Lo único que se decide aquí: si la encuesta sigue a la empresa mientras está abierta. */}
        <Sincronizar
          id="empresa"
          alcance="la empresa"
          activo={seleccion.companyAutoInclude}
          cuentaQuienSale={seleccion.companyCountLeavers}
          onActivo={(activo) => onCambio({ companyAutoInclude: activo })}
          onCuentaQuienSale={(cuenta) => onCambio({ companyCountLeavers: cuenta })}
        />
      </Contenedor>

      <Accordion value={abiertas} onValueChange={(valor) => setAbiertas(valor as string[])} className="gap-4">
        <ContenedorDesplegable
          id="grupos"
          titulo="Por grupos"
          detalle="Áreas, líderes u otros grupos. Un grupo entra completo, salvo a quien dejes fuera."
          conteo={todaLaEmpresa ? undefined : groups.length ? `${groups.length}/${gruposPosibles} · ${personas(personasDeGrupos)}` : `0/${gruposPosibles} elegidos`}
        >
          <ListaDeGrupos seleccion={seleccion} onCambio={cambioDeLista} minimo={minimoPorGrupo} />
        </ContenedorDesplegable>

        <ContenedorDesplegable
          id="personas"
          titulo="Por persona"
          detalle="Busca y marca a quien quieras, una a una. Quien entró por un grupo ya sale marcado."
          conteo={todaLaEmpresa ? undefined : outsideCount ? `${personas(outsideCount)} ${outsideCount === 1 ? 'elegida' : 'elegidas'}` : 'Ninguna elegida'}
        >
          <ListaDePersonas seleccion={seleccion} onCambio={cambioDeLista} />
        </ContenedorDesplegable>
      </Accordion>

      {/* El archivo no tiene contenedor propio hasta que trae gente: antes es solo el botón del pie. */}
      {conArchivo || guardados.archivo ? (
        <Contenedor
          id="participantes-archivo"
          titulo="Participantes cargados"
          detalle={detalle('archivo', `Desde ${seleccion.importedFileName ?? 'un archivo'}. Quita a quien no deba responder.`)}
          conteo={encendido('archivo') ? personas(importedCount) : conteoGuardado('archivo')}
          activo={encendido('archivo')}
          onActivo={(activo) => alternar('archivo', activo)}
        >
          <ParticipantesCargados seleccion={seleccion} onCambio={pedirCambio} />
        </Contenedor>
      ) : null}

      {/* El pie: cómo se suma todo, cuando ya hay una forma de elegir encendida. */}
      {todaLaEmpresa ? null : (
        <Text as="p" size="sm" variant="muted" aria-live="polite">
          {total === 0
            ? 'Todavía no hay nadie: enciende una forma de elegir o importa un archivo.'
            : `Suman ${personas(total)}: ${desglose.join(', ')}${desglose.length > 1 ? ', sin repetir a nadie' : ''}.`}
        </Text>
      )}

      <DrawerImportar open={importando} onOpenChange={setImportando} onCargar={cargarLote} />
      <DialogoRespuestas key={pendiente?.afectados.map((persona) => persona.id).join(',')} afectados={pendiente?.afectados ?? null} onConfirmar={resolver} onCancelar={() => setPendiente(null)} />
    </div>
  )
}
