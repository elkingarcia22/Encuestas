import { useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { toast } from '@ubits/flux-ui'
import { notify, notifyAction } from '@/shared/components/notify'
import { CANDIDATURAS, VACANTES_UI, tituloEtapa, type Candidatura } from '../datos'
import { registroDeImportadas } from '../importacion'
import {
  QUIEN_MUEVE,
  consecuenciasDe,
  entrevistaDe,
  fallaAlMover,
  marcaDeTiempo,
  movimientosDe,
  nombreDeLista,
  personasTexto,
  pideDecision,
  registroDeMovimientos,
  type Movimiento,
} from '../movimientos'
import { fallaAlRechazar } from '../rechazos'
import { avisoDeError, noSeGuardo } from '../simular'
import { cambiarVacantes } from '../../exploraciones/uno/inicio/acciones'
import {
  SIN_FILTROS,
  anotarCorreo,
  buscaPorNombre,
  busquedasGuardadas,
  destinatarios,
  eliminar as eliminarDeLaBase,
  etiquetar as etiquetarEnLaBase,
  etiquetasDeLaBase,
  exportarCsv,
  filtrarBase,
  hayFiltros as hayFiltrosEn,
  ordenarBase,
  postular as postularEnLaBase,
  registroDePostuladas,
  unir as unirEnLaBase,
  useBusquedasGuardadas,
  usePersonasDeLaBase,
  vacantesAbiertas,
  vivas,
  type Busqueda,
  type FiltrosBase,
  type PersonaViva,
  type Situacion,
} from '../base'
import {
  DialogoCorreo,
  DialogoEliminar,
  DialogoEtiquetas,
  DialogoGuardarBusqueda,
  DialogoPostular,
  DialogoUnir,
  type DecisionPostular,
} from './dialogos-base'
import { DialogoMover, type Cambio, type DecisionMover, type PedidoMover } from './dialogo-mover'
import { DialogoRechazo, type DecisionRechazo } from './dialogo-rechazo'
import { useImportarABase } from './importar-base'
import { usePaginacion } from './paginacion'
import { detalleDe } from './use-proceso'

// La capa común de «Mis candidatos › Consultar base global de candidatos» (25 sep). Las tres exploraciones consultan la
// base a su manera —la 1 como bandeja, la 2 como tabla con segmentos, la 3 buscando para una vacante—, pero lo que se
// filtra, se cuenta y se le hace a la gente es lo mismo, así que vive aquí y cada página solo decide cómo se ve.
//
// Da tres cosas:
// 1. **La lista**: la base al día (con lo que se movió en las vacantes), filtrada, ordenada y paginada, y las cuentas de
//    cada segmento con los demás filtros puestos (lo que dice cada chip es lo que sale al tocarlo).
// 2. **Las acciones**: postular, etiquetas, escribirles, exportar, eliminar sus datos y unir fichas. Cada una abre su
//    ventana y termina en un aviso con «Deshacer». Rechazar a alguien en una vacante abre la misma ventana que en la
//    vacante, con los motivos de UBITS.
// 3. **Las ventanas** (`dialogos`), para pintarlas una sola vez en la página, con las de importar.

export type CuentasBase = Record<Situacion, number> & {
  duplicados: number
  // Entraron en los últimos 30 días.
  recientes: number
  // Esperan algo de quien recluta en alguna vacante («acción requerida»).
  esperan: number
  // Toda la base con los demás filtros puestos, sin mirar la situación.
  todas: number
}

type Ventana =
  | { tipo: 'postular'; personas: PersonaViva[]; vacanteId?: string }
  | { tipo: 'etiquetas' | 'correo' | 'eliminar'; personas: PersonaViva[] }
  | { tipo: 'unir'; principal: PersonaViva; otra: PersonaViva }
  | { tipo: 'guardar' }
  | { tipo: 'rechazar'; candidatura: Candidatura; lista: Candidatura[]; alRechazar?: () => void }
  | { tipo: 'mover'; pedido: PedidoMover }

const SIN_DECISION: Omit<DecisionMover, 'cambios'> = { comentario: '', ia: 'conservar', aviso: null, cerrarVacante: false }

export type BusquedaConCuenta = Busqueda & { cuantas: number }

const primerNombre = (persona: PersonaViva) => persona.nombre.split(' ')[0]
const quienes = (personas: PersonaViva[]) => (personas.length === 1 ? personas[0].nombre : personasTexto(personas.length))
const entreComillas = (lista: string[]) => nombreDeLista(lista.map((una) => `«${una}»`))

// Dos juegos de filtros son la misma búsqueda si dicen lo mismo, aunque sean objetos distintos.
const mismosFiltros = (a: FiltrosBase, b: FiltrosBase) =>
  (Object.keys(SIN_FILTROS) as (keyof FiltrosBase)[]).every((campo) =>
    Array.isArray(a[campo]) ? (a[campo] as string[]).join('|') === (b[campo] as string[]).join('|') : a[campo] === b[campo],
  )

export function useBase({
  ruta,
  inicial,
  onVerFicha,
  alTerminar,
  porPagina = 20,
}: {
  ruta: string
  // Con qué filtros se entra (un enlace desde otra pantalla: «Ver a quiénes» de una vacante, un atajo de las cifras).
  // Comparar con una vacante ordena por lo que más sirve, igual que al elegirla a mano.
  inicial?: Partial<FiltrosBase>
  // Abrir la ficha de alguien (desde el detalle de un lote o al terminar de agregar a mano).
  onVerFicha?: (personaId: string) => void
  // Después de una acción confirmada, con a quiénes se hizo: la página limpia su selección solo si fue sobre las
  // marcadas (MC-14).
  alTerminar?: (ids: string[]) => void
  // Filas por página al entrar.
  porPagina?: number
}) {
  const personas = usePersonasDeLaBase()
  const registro = useSyncExternalStore(registroDeMovimientos.suscribir, registroDeMovimientos.leer)
  const guardadas = useBusquedasGuardadas()
  const [filtros, setFiltros] = useState<FiltrosBase>(() => ({
    ...SIN_FILTROS,
    ...(inicial?.paraVacante ? { orden: 'ajuste' as const } : {}),
    ...inicial,
  }))
  const [loteFiltro, setLoteFiltroEstado] = useState<string | null>(null)
  const [ventana, setVentana] = useState<Ventana | null>(null)
  // Buscar el texto en todo aunque coincida con nombres (MC-13). Se apaga al cambiar lo que se busca.
  const [enTodo, setEnTodo] = useState(false)
  // Cada pedido de mover lleva su número: la ventana se monta de nuevo con cada uno.
  const pedidos = useRef(0)

  const paraVacante = useMemo(() => VACANTES_UI.find((vacante) => vacante.id === filtros.paraVacante) ?? null, [filtros.paraVacante])
  const todas = useMemo(() => vivas(personas, registro, paraVacante), [personas, registro, paraVacante])
  // Lo que se consulta: toda la base o, al venir de un lote, solo quienes entraron con él.
  const alcance = useMemo(() => (loteFiltro ? todas.filter((persona) => persona.loteId === loteFiltro) : todas), [todas, loteFiltro])
  const filtradas = useMemo(() => ordenarBase(filtrarBase(alcance, filtros, undefined, { enTodo }), filtros.orden, filtros.sentido), [alcance, filtros, enTodo])
  const porNombre = !enTodo && buscaPorNombre(alcance, filtros.texto)
  // Cuántas salen buscando en todo: lo que ofrece «Buscar también en cargos y lo que sabe hacer».
  const enTodoCuantas = useMemo(() => (porNombre ? filtrarBase(alcance, filtros, undefined, { enTodo: true }).length : 0), [porNombre, alcance, filtros])
  const paginacion = usePaginacion(filtradas, porPagina)

  // Cada chip cuenta con los demás filtros puestos: «Libres · 40» son las 40 que salen al tocarlo.
  const cuentas = useMemo<CuentasBase>(() => {
    const sinSituacion = filtrarBase(alcance, filtros, 'situacion', { enTodo })
    const de = (situacion: Situacion) => sinSituacion.filter((persona) => persona.situacion === situacion).length
    return {
      proceso: de('proceso'),
      libre: de('libre'),
      descartada: de('descartada'),
      contratada: de('contratada'),
      duplicados: sinSituacion.filter((persona) => persona.duplicadoDe).length,
      recientes: filtrarBase(alcance, filtros, 'recientes').filter((persona) => persona.dias <= 30).length,
      esperan: filtrarBase(alcance, filtros, 'esperan').filter((persona) => persona.espera).length,
      todas: sinSituacion.length,
    }
  }, [alcance, filtros, enTodo])

  const disponibles = useMemo(() => etiquetasDeLaBase(personas), [personas])
  // Sin ciudad no es una ciudad (MC-15).
  const ciudades = useMemo(() => [...new Set(personas.map((persona) => persona.ciudad).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')), [personas])
  const busquedas = useMemo<BusquedaConCuenta[]>(
    () => guardadas.map((busqueda) => ({ ...busqueda, cuantas: filtrarBase(todas, busqueda.filtros).length })),
    [guardadas, todas],
  )
  const busquedaActiva = busquedas.find((busqueda) => mismosFiltros(busqueda.filtros, filtros))?.id ?? null

  /* Filtrar ------------------------------------------------------------------------------------------------------ */

  // Cualquier cambio vuelve a la página 1: si no, se busca algo y la tabla sale vacía porque quedó en la página 4.
  const cambiar = (parcial: Partial<FiltrosBase>) => {
    if ('texto' in parcial) setEnTodo(false)
    setFiltros((antes) => {
      const siguiente = { ...antes, ...parcial }
      // Tocar la misma columna otra vez invierte el sentido; otra columna empieza en su sentido de siempre (MC-51).
      if (parcial.orden !== undefined && parcial.sentido === undefined) siguiente.sentido = parcial.orden === antes.orden ? (antes.sentido === 'normal' ? 'inverso' : 'normal') : 'normal'
      // Comparar con una vacante ordena por lo que más sirve; dejar de comparar devuelve el orden de siempre.
      if ('paraVacante' in parcial && parcial.orden === undefined) {
        if (parcial.paraVacante) siguiente.orden = 'ajuste'
        else if (antes.orden === 'ajuste') siguiente.orden = SIN_FILTROS.orden
      }
      return siguiente
    })
    paginacion.alFiltrar()
  }
  const quitar = (campo: keyof FiltrosBase) => cambiar({ [campo]: SIN_FILTROS[campo] } as Partial<FiltrosBase>)
  const limpiar = () => {
    setFiltros(SIN_FILTROS)
    setLoteFiltroEstado(null)
    paginacion.alFiltrar()
  }
  const setLoteFiltro = (loteId: string | null) => {
    setLoteFiltroEstado(loteId)
    paginacion.alFiltrar()
  }

  const importar = useImportarABase({
    ruta,
    onVerFicha: (personaId) => onVerFicha?.(personaId),
    // Ver a quienes entraron con un lote: la base sin filtros, solo ese lote.
    onVerLote: (loteId) => {
      setFiltros(SIN_FILTROS)
      setLoteFiltro(loteId)
    },
  })
  const loteVisto = importar.lotes.find((lote) => lote.id === loteFiltro) ?? null

  /* Búsquedas guardadas ---------------------------------------------------------------------------------------- */

  const aplicarBusqueda = (busqueda: Busqueda) => {
    setFiltros(busqueda.filtros)
    setLoteFiltro(null)
  }
  const guardarBusqueda = () => setVentana({ tipo: 'guardar' })
  const quitarBusqueda = (id: string) => {
    const busqueda = guardadas.find((una) => una.id === id)
    if (!busqueda) return
    if (noSeGuardo(`quitar-busqueda:${id}`, `No pudimos quitar «${busqueda.nombre}»`, () => quitarBusqueda(id))) return
    busquedasGuardadas.quitar(id)
    notifyAction(`Quitaste «${busqueda.nombre}»`, undefined, {
      label: 'Deshacer',
      onClick: () => busquedasGuardadas.guardar(busqueda.nombre, busqueda.filtros, busqueda.avisar),
    }, 'success')
  }
  const alternarAviso = (id: string) => {
    const busqueda = guardadas.find((una) => una.id === id)
    if (!busqueda) return
    if (noSeGuardo(`aviso-busqueda:${id}:${busqueda.avisar}`, 'No pudimos cambiar el aviso', () => alternarAviso(id))) return
    busquedasGuardadas.alternarAviso(id)
    if (busqueda.avisar) notify(`Ya no te avisamos por «${busqueda.nombre}»`, 'La búsqueda sigue guardada.', 'success')
    else notify(`Te avisamos cuando entre alguien para «${busqueda.nombre}»`, undefined, 'success')
  }

  /* Lo que se le hace a la gente ------------------------------------------------------------------------------- */

  const cerrar = () => setVentana(null)
  const terminar = (personas: { id: string }[] = []) => {
    setVentana(null)
    alTerminar?.(personas.map((persona) => persona.id))
  }

  // Si se está comparando con una vacante abierta, «Postular» ya la trae elegida.
  const postular = (elegidas: PersonaViva[], vacanteId?: string) =>
    setVentana({
      tipo: 'postular',
      personas: elegidas,
      vacanteId: vacanteId ?? (paraVacante && vacantesAbiertas().some((una) => una.id === paraVacante.id) ? paraVacante.id : undefined),
    })

  const confirmarPostular = (elegidas: PersonaViva[], decision: DecisionPostular) => {
    const { vacante, etapa, aviso, entran } = decision
    const quien = entran.length === 1 ? primerNombre(entran[0]) : personasTexto(entran.length)
    if (noSeGuardo(`postular:${vacante.id}:${entran.map((una) => una.id).join(',')}`, `No pudimos postular a ${quien}`, () => confirmarPostular(elegidas, decision), 'No entró nadie a la vacante.')) {
      cerrar()
      return
    }
    const deshacer = postularEnLaBase(entran, vacante, etapa)
    const una = entran.length === 1
    const conIA = Boolean(vacante.etapas.find((uno) => uno.id === etapa)?.ia)
    // A quien le escribe la IA no se le manda además el aviso a mano (lo mismo que al mover en la vacante).
    // Solo se anota el correo a quien de verdad le llega (MC-04): quien pidió no recibir correos o no tiene correo, no.
    const reciben = destinatarios(entran).reciben
    const deshacerAviso = aviso && !conIA && reciben.length ? anotarCorreo(reciben.map((persona) => persona.id), `Tu proceso en ${vacante.titulo}`) : null
    const sinInvitacion = conIA ? entran.length - reciben.length : 0
    const fuera = elegidas.length - entran.length
    terminar(elegidas)
    notifyAction(
      una ? `${primerNombre(entran[0])} entró a ${vacante.titulo}` : `${entran.length} personas entraron a ${vacante.titulo}`,
      // Una línea: lo que hay que hacer (llamar a quien no recibe la invitación) o lo que le llega; si no, dónde queda.
      `${
        sinInvitacion
          ? `${personasTexto(sinInvitacion)} no ${sinInvitacion === 1 ? 'recibe' : 'reciben'} la invitación: ${sinInvitacion === 1 ? 'llámala' : 'llámalas'}.`
          : conIA && reciben.length
            ? `${una ? 'Le' : 'Les'} llega la invitación a «${tituloEtapa(etapa)}».`
            : deshacerAviso
              ? `${una ? 'Le' : 'Les'} llega tu aviso.`
              : `${una ? 'Queda' : 'Quedan'} en ${tituloEtapa(etapa)}.`
      }${fuera ? ` ${personasTexto(fuera)} ya ${fuera === 1 ? 'estaba' : 'estaban'} ahí.` : ''}`,
      {
        label: 'Deshacer',
        onClick: () => {
          deshacer()
          deshacerAviso?.()
        },
      },
      'success',
    )
  }

  const etiquetar = (elegidas: PersonaViva[]) => setVentana({ tipo: 'etiquetas', personas: elegidas })
  const confirmarEtiquetas = (elegidas: PersonaViva[], poner: string[], sacar: string[]) => {
    if (noSeGuardo(`etiquetas:${elegidas.map((una) => una.id).join(',')}:${poner.join('|')}:${sacar.join('|')}`, `No pudimos etiquetar a ${quienes(elegidas)}`, () => confirmarEtiquetas(elegidas, poner, sacar))) {
      cerrar()
      return
    }
    const deshacer = etiquetarEnLaBase(
      elegidas.map((persona) => persona.id),
      poner,
      sacar,
    )
    terminar(elegidas)
    const [titulo, detalle] =
      poner.length && sacar.length
        ? [`Cambiaste las etiquetas de ${quienes(elegidas)}`, `Pusiste ${entreComillas(poner)} y quitaste ${entreComillas(sacar)}.`]
        : poner.length
          ? [`Etiquetaste a ${quienes(elegidas)}`, `Con ${entreComillas(poner)}.`]
          : [`Quitaste ${entreComillas(sacar)}`, `A ${quienes(elegidas)}.`]
    notifyAction(titulo, detalle, { label: 'Deshacer', onClick: deshacer }, 'success')
  }

  const escribir = (elegidas: PersonaViva[]) => setVentana({ tipo: 'correo', personas: elegidas })
  const confirmarCorreo = (elegidas: PersonaViva[], decision: { asunto: string; reciben: PersonaViva[] }) => {
    const { asunto, reciben } = decision
    if (noSeGuardo(`correo:${asunto}:${reciben.map((una) => una.id).join(',')}`, `No pudimos escribirle a ${quienes(reciben)}`, () => confirmarCorreo(elegidas, decision), 'No salió ningún correo.')) {
      cerrar()
      return
    }
    const deshacer = anotarCorreo(
      reciben.map((persona) => persona.id),
      asunto,
    )
    const { fuera, sinCorreo } = destinatarios(elegidas)
    terminar(elegidas)
    // Quien no tiene correo no cuenta como enviada (MC-21): se dice aparte.
    const quedaron = [
      fuera.length ? `${fuera.length} ${fuera.length === 1 ? 'pidió' : 'pidieron'} no recibir correos` : '',
      sinCorreo.length ? `${sinCorreo.length} no ${sinCorreo.length === 1 ? 'tiene' : 'tienen'} correo` : '',
    ].filter(Boolean)
    notifyAction(
      reciben.length === 1 ? `Le escribiste a ${reciben[0].nombre}` : `Les escribiste a ${reciben.length} personas`,
      quedaron.length ? `${quedaron.join(' y ')}: ${fuera.length + sinCorreo.length === 1 ? 'quedó' : 'quedaron'} fuera.` : 'Sale en unos segundos.',
      { label: 'Deshacer', onClick: deshacer },
      'success',
    )
  }

  const exportar = (elegidas: PersonaViva[]) => {
    exportarCsv(elegidas, registro, elegidas.length === 1 ? elegidas[0].nombre : `mis-candidatos-${elegidas.length}`)
    alTerminar?.(elegidas.map((persona) => persona.id))
    notify(
      elegidas.length === 1 ? `Exportaste los datos de ${elegidas[0].nombre}` : `Exportaste ${personasTexto(elegidas.length)}`,
      'El archivo CSV quedó en tus descargas.',
      'success',
    )
  }

  const eliminar = (elegidas: PersonaViva[]) => setVentana({ tipo: 'eliminar', personas: elegidas })
  const confirmarEliminar = (elegidas: PersonaViva[]) => {
    if (noSeGuardo(`eliminar:${elegidas.map((una) => una.id).join(',')}`, `No pudimos eliminar los datos de ${quienes(elegidas)}`, () => confirmarEliminar(elegidas), 'Siguen en tu base.')) {
      cerrar()
      return
    }
    const deshacer = eliminarDeLaBase(elegidas.map((persona) => persona.id))
    terminar(elegidas)
    notifyAction(`Eliminaste los datos de ${quienes(elegidas)}`, 'Se borran del todo al cerrar este aviso.', {
      label: 'Deshacer',
      onClick: deshacer,
    }, 'success')
  }

  // La misma persona dos veces: la ficha que se mira es la principal y la otra se suma a ella.
  const unir = (persona: PersonaViva) => {
    const otra = todas.find((una) => una.id === persona.duplicadoDe)
    if (otra) setVentana({ tipo: 'unir', principal: persona, otra })
  }
  const confirmarUnir = (principal: PersonaViva, otra: PersonaViva, elegido: Parameters<typeof unirEnLaBase>[2]) => {
    if (noSeGuardo(`unir:${principal.id}:${otra.id}`, 'No pudimos unir las dos fichas', () => confirmarUnir(principal, otra, elegido), 'Siguen las dos.')) {
      cerrar()
      return
    }
    const deshacer = unirEnLaBase(principal, otra, elegido)
    const alterno = elegido.correo === 'otra' ? principal.correo : otra.correo
    terminar([principal, otra])
    notifyAction(
      `Quedó una sola ficha de ${elegido.nombre === 'otra' ? otra.nombre : principal.nombre}`,
      `${alterno} queda como correo alterno.`,
      { label: 'Deshacer', onClick: deshacer },
      'success',
    )
  }

  /* Su proceso en una vacante («Ver su ajuste») ---------------------------------------------------------------- */

  // La candidatura viva de alguien en una vacante, en la etapa donde va hoy (con lo que se movió en la sesión).
  const candidaturaDe = (persona: PersonaViva, vacanteId: string): Candidatura | null => {
    const proceso = persona.vivos.find((uno) => uno.vacanteId === vacanteId && uno.estado === 'En proceso' && uno.candidaturaId)
    if (!proceso) return null
    const guardada = [...registroDeImportadas.todas(), ...registroDePostuladas.todas(), ...CANDIDATURAS].find((c) => c.id === proceso.candidaturaId)
    if (!guardada) return null
    const movida = proceso.etapaId && proceso.etapaId !== guardada.etapa
    return movida ? { ...guardada, etapa: proceso.etapaId!, dias: 0 } : guardada
  }

  // Moverla o rechazarla desde aquí es lo mismo que hacerlo en la vacante: queda en su registro y se ve en las dos.
  // Mover pasa por las mismas reglas que en la vacante (auditoría del 8-oct, H-799): con la vacante cerrada nadie se mueve;
  // lo simple se mueve en el acto, y lo que trae algo que decidir (se salta etapas, vuelve atrás, deja una entrevista de IA
  // sin terminar, vuelve a una que ya hizo o llega a la última) abre la ventana de «Mover a otra etapa».
  const mover = (candidatura: Candidatura, destino: string) => {
    // Como en la vacante: si no se guarda, sigue donde estaba y el aviso deja reintentar (`?simular=falla-mover`).
    if (fallaAlMover(candidatura.id)) {
      avisoDeError(`No pudimos mover a ${candidatura.candidato.nombre}`, `Sigue en ${tituloEtapa(candidatura.etapa)}: no se guardó el cambio.`, () => mover(candidatura, destino))
      return
    }
    const vacante = candidatura.vacante
    if (vacante.estado === 'Cerrada') {
      toast.add({
        type: 'warning',
        title: 'La vacante está cerrada',
        description: 'Nadie cambia de etapa mientras esté cerrada. Reábrela desde la vacante para seguir con el proceso.',
      })
      return
    }
    if (destino === candidatura.etapa) return
    if (pideDecision(consecuenciasDe(candidatura, destino, vacante.etapas, movimientosDe(candidatura.id)))) {
      pedidos.current += 1
      setVentana({ tipo: 'mover', pedido: { id: pedidos.current, candidaturas: [candidatura], destinos: { [candidatura.id]: destino } } })
      return
    }
    moverYa([{ candidatura, destino }])
  }
  // El cambio ya decidido: queda en el registro (con lo que se saltó, lo que se canceló y el correo) y el aviso trae «Deshacer».
  const moverYa = (cambios: Cambio[], decision: Omit<DecisionMover, 'cambios'> = SIN_DECISION) => {
    const cuando = marcaDeTiempo()
    const hechos = cambios.map((cambio) => ({
      ...cambio,
      pasa: consecuenciasDe(cambio.candidatura, cambio.destino, cambio.candidatura.vacante.etapas, movimientosDe(cambio.candidatura.id)),
    }))
    const nuevos: Movimiento[] = hechos.map(({ candidatura, destino, pasa }, indice) => {
      const ia = pasa.entra ? (pasa.entra.hecha === undefined ? 'invitada' : decision.ia === 'repetir' ? 'reinvitada' : 'conservada') : undefined
      const entrevista = pasa.deja?.entrevista
      return {
        id: `${candidatura.id}>${destino}@${cuando}-${indice}`,
        candidaturaId: candidatura.id,
        desde: candidatura.etapa,
        hacia: destino,
        cuando,
        dias: candidatura.dias,
        quien: QUIEN_MUEVE,
        comentario: decision.comentario.trim() || undefined,
        saltadas: pasa.saltadas.map((etapa) => etapa.id),
        ia,
        cancelada: pasa.deja
          ? {
              etapa: pasa.deja.etapa.id,
              ...(entrevista?.tipo === 'a-medias' ? { respondidas: entrevista.respondidas, total: entrevista.total } : {}),
            }
          : undefined,
        // A quien le escribe la IA no se le manda además el correo a mano.
        aviso: decision.aviso && ia !== 'invitada' && ia !== 'reinvitada' ? decision.aviso.plantilla : undefined,
      }
    })
    registroDeMovimientos.agregar(nuevos)
    const [primero] = hechos
    notifyAction(
      hechos.length === 1
        ? `${primero.candidatura.candidato.nombre} ${primero.pasa.atras ? 'volvió' : 'pasó'} a ${tituloEtapa(primero.destino)}`
        : `${hechos.length} personas cambiaron de etapa`,
      `${primero.candidatura.vacante.titulo}. ${detalleDe(nuevos)}`,
      { label: 'Deshacer', onClick: () => registroDeMovimientos.quitar(nuevos.map((movimiento) => movimiento.id)) },
      'success',
    )
  }
  const confirmarMover = (decision: DecisionMover) => {
    const { cambios, ...resto } = decision
    cerrar()
    if (cambios.length) moverYa(cambios, resto)
    if (decision.cerrarVacante && cambios.length) {
      const vacante = cambios[0].candidatura.vacante
      const llegan = cambios.filter(({ destino }) => destino === vacante.etapas[vacante.etapas.length - 1]?.id)
      cambiarVacantes([vacante], {
        estado: 'Cerrada',
        desenlace: `Cerrada hoy · ${llegan.length === 1 ? `se seleccionó a ${llegan[0].candidatura.candidato.nombre}` : `se seleccionaron ${llegan.length} personas`}`,
      })
      notify('La vacante quedó cerrada', 'Ya no recibe aplicaciones. Las personas que siguen en el proceso no reciben nada.', 'success')
    }
  }
  // Toda la gente de una vacante, para decir cuántas siguen en el proceso si se cierra.
  const dentroDe = (vacanteId: string) =>
    [...registroDeImportadas.todas(), ...registroDePostuladas.todas(), ...CANDIDATURAS].filter((c) => c.vacante.id === vacanteId)
  // Rechazarla abre la misma ventana que en la vacante: motivo (los de UBITS), correo, nota y sus otras vacantes.
  // `alRechazar` deja a la página volver a la ficha de la persona cuando se confirma, no antes.
  const rechazar = (candidatura: Candidatura, alRechazar?: () => void) => {
    const persona = todas.find((una) => una.vivos.some((proceso) => proceso.candidaturaId === candidatura.id))
    const suyas = persona ? persona.vivos.map((proceso) => candidaturaDe(persona, proceso.vacanteId)).filter((una) => una !== null) : []
    setVentana({ tipo: 'rechazar', candidatura, lista: suyas.length ? suyas : [candidatura], alRechazar })
  }
  const confirmarRechazo = (candidatura: Candidatura, decision: DecisionRechazo, alRechazar?: () => void) => {
    const retiro = decision.quien === 'candidato'
    if (fallaAlRechazar(candidatura.id) || fallaAlMover(candidatura.id)) {
      cerrar()
      avisoDeError(
        `No pudimos ${retiro ? 'registrar el retiro de' : 'rechazar a'} ${candidatura.candidato.nombre}`,
        'Sigue en el proceso y no salió ningún correo.',
        () => confirmarRechazo(candidatura, decision, alRechazar),
      )
      return
    }
    const salen = [candidatura, ...decision.tambienEn]
    const cuando = marcaDeTiempo()
    // El rastro, como en la vacante: el motivo, el correo y la entrevista con la IA que se canceló.
    const registros: Movimiento[] = salen.map((una, indice) => {
      const etapa = una.vacante.etapas.find((cual) => cual.id === una.etapa)
      const entrevista = etapa ? entrevistaDe(una, etapa, una.vacante.etapas, movimientosDe(una.id)) : null
      return {
        id: `${una.id}x${cuando}-${indice}`,
        tipo: retiro ? 'retiro' : 'rechazo',
        motivo: decision.motivo,
        candidaturaId: una.id,
        desde: una.etapa,
        hacia: una.etapa,
        cuando,
        dias: una.dias,
        quien: QUIEN_MUEVE,
        comentario: decision.nota || undefined,
        saltadas: [],
        cancelada:
          etapa && entrevista && entrevista.tipo !== 'hecha'
            ? { etapa: etapa.id, ...(entrevista.tipo === 'a-medias' ? { respondidas: entrevista.respondidas, total: entrevista.total } : {}) }
            : undefined,
        aviso: decision.correo?.plantilla,
      }
    })
    registroDeMovimientos.agregar(registros)
    cerrar()
    alRechazar?.()
    const nombre = candidatura.candidato.nombre
    const canceladas = registros.filter((movimiento) => movimiento.cancelada).length
    const detalle = `${decision.motivo} · ${decision.correo ? (retiro ? 'le llegó la confirmación' : 'le llegó el correo') : 'sin correo'}${canceladas ? ' · se canceló su entrevista' : ''}`
    notifyAction(
      `${retiro ? 'Registraste el retiro de' : 'Rechazaste a'} ${nombre} en ${nombreDeLista(salen.map((una) => una.vacante.titulo))}`,
      detalle,
      {
        // Deshacer la devuelve a su etapa. El correo, si salió, ya llegó: se dice.
        label: 'Deshacer',
        onClick: () => {
          registroDeMovimientos.quitar(registros.map((movimiento) => movimiento.id))
          if (decision.correo && !retiro)
            notify(
              salen.length > 1 ? `${nombre} vuelve a sus ${salen.length} vacantes` : `${nombre} vuelve a ${tituloEtapa(candidatura.etapa)}`,
              'Ya le llegó el rechazo: escríbele que sigue.',
              'success',
            )
        },
      },
      'success',
    )
  }

  /* Las ventanas ------------------------------------------------------------------------------------------------ */

  const alCambiar = (abierta: boolean) => {
    if (!abierta) cerrar()
  }
  const dialogos = (
    <>
      {ventana?.tipo === 'postular' ? (
        <DialogoPostular
          personas={ventana.personas}
          vacanteInicial={ventana.vacanteId}
          onOpenChange={alCambiar}
          onConfirmar={(decision) => confirmarPostular(ventana.personas, decision)}
        />
      ) : null}
      {ventana?.tipo === 'etiquetas' ? (
        <DialogoEtiquetas
          personas={ventana.personas}
          disponibles={disponibles}
          onOpenChange={alCambiar}
          onConfirmar={(poner, sacar) => confirmarEtiquetas(ventana.personas, poner, sacar)}
        />
      ) : null}
      {ventana?.tipo === 'correo' ? (
        <DialogoCorreo personas={ventana.personas} onOpenChange={alCambiar} onConfirmar={(decision) => confirmarCorreo(ventana.personas, decision)} />
      ) : null}
      {ventana?.tipo === 'eliminar' ? (
        <DialogoEliminar personas={ventana.personas} onOpenChange={alCambiar} onConfirmar={() => confirmarEliminar(ventana.personas)} />
      ) : null}
      {ventana?.tipo === 'unir' ? (
        <DialogoUnir
          principal={ventana.principal}
          otra={ventana.otra}
          onOpenChange={alCambiar}
          onConfirmar={(elegido) => confirmarUnir(ventana.principal, ventana.otra, elegido)}
        />
      ) : null}
      {ventana?.tipo === 'guardar' ? (
        <DialogoGuardarBusqueda
          filtros={filtros}
          cuantas={filtradas.length}
          onOpenChange={alCambiar}
          onConfirmar={function guardar(nombre, avisar) {
            cerrar()
            if (noSeGuardo(`guardar-busqueda:${nombre}`, `No pudimos guardar «${nombre}»`, () => guardar(nombre, avisar))) return
            busquedasGuardadas.guardar(nombre, filtros, avisar)
            notify(`Guardaste «${nombre}»`, avisar ? 'Te avisamos cuando entre alguien así.' : 'Está en «Búsquedas guardadas».', 'success')
          }}
        />
      ) : null}
      {ventana?.tipo === 'rechazar' ? (
        <DialogoRechazo
          abierto
          onOpenChange={alCambiar}
          pedido={{ id: 0, candidaturas: [ventana.candidatura] }}
          vacante={ventana.candidatura.vacante}
          lista={ventana.lista}
          onConfirmar={(decision) => confirmarRechazo(ventana.candidatura, decision, ventana.alRechazar)}
        />
      ) : null}
      {ventana?.tipo === 'mover' ? (
        <DialogoMover
          abierto
          onOpenChange={alCambiar}
          pedido={ventana.pedido}
          vacante={ventana.pedido.candidaturas[0].vacante}
          dentro={dentroDe(ventana.pedido.candidaturas[0].vacante.id)}
          onConfirmar={confirmarMover}
        />
      ) : null}
      {importar.dialogos}
    </>
  )

  return {
    ruta,
    // La lista
    todas,
    alcance,
    filtradas,
    paginacion,
    cuentas,
    paraVacante,
    // Los filtros
    filtros,
    cambiar,
    quitar,
    // Buscando por nombre (MC-13): y cuántas salen si se busca en todo.
    porNombre,
    enTodoCuantas,
    buscarEnTodo: () => setEnTodo(true),
    limpiar,
    hayFiltros: hayFiltrosEn(filtros) || loteFiltro !== null,
    loteFiltro,
    setLoteFiltro,
    loteVisto,
    disponibles,
    ciudades,
    // Búsquedas guardadas
    busquedas,
    busquedaActiva,
    aplicarBusqueda,
    guardarBusqueda,
    quitarBusqueda,
    alternarAviso,
    // Acciones: abren su ventana y terminan en un aviso con «Deshacer» (exportar descarga y avisa)
    postular,
    etiquetar,
    escribir,
    exportar,
    eliminar,
    unir,
    // Su proceso en una vacante
    candidaturaDe,
    mover,
    rechazar,
    // Importar a la base
    importar,
    // Todas las ventanas, para pintarlas una vez; y si hay una abierta (los atajos de la página esperan)
    dialogos,
    ocupado: ventana !== null || importar.ocupado,
    // Se cerró la ficha desde la que se pidió la ventana: se va con ella.
    cerrarVentanas: cerrar,
  }
}

export type Base = ReturnType<typeof useBase>
