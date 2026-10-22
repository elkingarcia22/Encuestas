import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type MouseEvent, type ReactNode } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert02Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  CloudUploadIcon,
  Copy01Icon,
  File01Icon,
  FileImportIcon,
  FileRemoveIcon,
  FileZipIcon,
  LinkSquare02Icon,
  Mail01Icon,
  PauseIcon,
  PlayIcon,
  PlusSignIcon,
  Tick02Icon,
  Upload01Icon,
  UserCheck01Icon,
  UserRemove01Icon,
  WifiDisconnected01Icon,
  Xls01Icon,
} from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Attachment,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  Button,
  Checkbox,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldTitle,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Heading,
  IconTile,
  Input,
  Progress,
  ProgressLabel,
  ProgressValue,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Separator,
  Skeleton,
  Spinner,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
  Textarea,
  cn,
  useFileUpload,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { VentanaDeAccion } from '@/modules/design-system/drawers/components/drawer-anidado'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { ImagenGlass } from '@/shared/components/ImagenGlass'
import { notify, notifyAction } from '@/shared/components/notify'
import { publishProcess, type LiveProcess } from '@/shared/components/process-store'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { RECHAZADAS, cumplidosDe, primeraEtapaDe, tituloEtapa, type Candidatura, type Rechazada, type VacanteUI } from '../datos'
import { QUIEN_MUEVE, movimientosDe, nombreDeLista } from '../movimientos'
import {
  LIMITE_POR_LOTE,
  ORIGENES_LOTE,
  TEXTO_AUTORIZACION,
  TEXTO_AVISO_ENTRADA,
  almacenDeLotes,
  autorizacionDeDatos,
  claveDe,
  cuentasDe,
  elegidoDe,
  hojasDe,
  origenDeLote,
  origenSugerido,
  pesoEnTexto,
  registroDeImportadas,
  resumenCortoDeLote,
  textoDeLaHoja,
  textoHojas,
  textoPersonas,
  type ArchivoLote,
  type DatosLeidos,
  type Elegido,
  type EstadoArchivo,
  type LoteCvs,
} from '../importacion'
import { avisoDeError, noSeGuardo } from '../simular'
import { FiltroChip } from '@/modules/design-system/navegacion/filtro-chip'
import { usePersonasDeLaBase } from '../base'
import { AvisoVacanteCerrada } from './tablero-candidatos'
import { baseDeCandidatos } from '../base'
import { ListaDatos } from '../../vacantes/crear/components/piezas-resumen'
import { Esqueleto, LineaEsqueleto, useCarga } from '@/modules/design-system/estados/carga'
import type { Bloqueo } from './use-proceso'
import type { Persona } from '../personas'
import { AnimatePresence, motion } from 'motion/react'
import { Flotar, RESORTE, RESORTE_VIVO } from './animacion'
import { CURVA, FilaAnimada, entrada } from './movimiento'

// Importar hojas de vida, de punta a punta (24 sep, Nicolás: «deberíamos tener, si no hay, un empty state con el file
// uploader ahí, y si ya tiene algo que la opción sea diferente… esfuérzate»; completo el 25 sep: «hacer lo mismo con
// "Candidatos › Importación masiva de CVs" para las 3 exploraciones»). Las reglas están en `importacion.ts`.
//
// - La pestaña «CVs importados» vacía es la zona para soltar archivos, sin ventana previa. Con lotes, arriba queda una
//   franja para soltar más y debajo la tabla de lotes, que se llena en vivo mientras se leen.
// - «Importar CVs» de la cabecera abre la misma zona en una ventana. Antes de leer se ve lo elegido, de dónde viene,
//   a qué etapa entra (y qué pasa si no es la primera) y si se les escribe.
// - Leer corre fuera de la pantalla (`almacenDeLotes`): sigue al cambiar de pestaña o salir de la vacante, se ve en el
//   Centro de procesos y el aviso final trae de vuelta. Si se corta, se sigue desde donde quedó.
// - Al terminar, lo claro entra solo y ya comparado con los requisitos; lo dudoso espera con la hoja al lado; lo
//   repetido dice con quién y qué se puede hacer; lo que no se pudo leer dice por qué. Un lote se puede deshacer.
//
// Cada exploración le presta al lote su forma de mostrar a la gente (`onVerEntraron`, `onAbrirFicha`) y sus ventanas de
// rechazar y volver a considerar.

/* Los avisos del lote, estén o no en la pantalla ---------------------------------------------------------------- */

// Para volver a la vacante desde un aviso o el Centro de procesos cuando ya no se está en ella.
let navegar: ((url: string) => void) | null = null

type Destino = 'lote' | 'revisar' | 'entraron'

function irA(clave: string, lote: LoteCvs, destino: Destino) {
  const enlace = almacenDeLotes.enlaceDe(clave)
  if (enlace) {
    if (destino === 'revisar') enlace.revisar(lote.id)
    else if (destino === 'entraron' && enlace.verEntraron) enlace.verEntraron(lote.id)
    else enlace.ver(lote.id)
    return
  }
  if (lote.ruta && navegar) navegar(`${lote.ruta}?lote=${lote.id}&abrir=${destino}`)
}

// Cómo se ve un lote en el Centro de procesos: el avance mientras lee y, después, qué quedó pendiente con su acción.
// Textos cortos: el panel mide 320 px y lo largo se cortaba justo en lo importante. El título es el nombre del lote.
function procesoDe(clave: string, lote: LoteCvs): LiveProcess {
  const cuentas = cuentasDe(lote)
  const base = { id: lote.id, icon: FileImportIcon, title: lote.nombre }
  const vacante = almacenDeLotes.vacanteDe(clave)
  if (lote.estado === 'leyendo')
    return {
      ...base,
      meta: `Leyendo ${cuentas.leidos + 1} de ${cuentas.total} · ${vacante?.titulo ?? 'Mis candidatos'}`,
      progress: Math.round((cuentas.leidos / cuentas.total) * 100),
    }
  if (lote.estado === 'en-cola') return { ...base, meta: `En cola: empieza al terminar la parte ${(lote.parte?.n ?? 2) - 1}`, progress: 0 }
  if (lote.estado === 'detenido')
    return {
      ...base,
      meta: lote.interrumpido ? `Se cortó en ${cuentas.leidos} de ${cuentas.total}` : `Se detuvo en ${cuentas.leidos} de ${cuentas.total}`,
      cta: 'Seguir',
      onClick: () => almacenDeLotes.seguir(clave, lote.id),
    }
  if (lote.retirado)
    return { ...base, meta: `Sacaste a ${lote.retirado.salieron} de la vacante`, done: true, cta: 'Ver', onClick: () => irA(clave, lote, 'lote') }
  if (lote.cerradoAlLeer) return { ...base, meta: 'No entró nadie: la vacante se cerró', done: true, cta: 'Ver', onClick: () => irA(clave, lote, 'lote') }
  const meta = [
    cuentas.dudosos ? `${cuentas.dudosos} por confirmar` : `${cuentas.listos} ${cuentas.listos === 1 ? 'entró' : 'entraron'}`,
    cuentas.fallidos ? `${cuentas.fallidos} ${cuentas.fallidos === 1 ? 'falló' : 'fallaron'}` : null,
    cuentas.sinLeer ? `${cuentas.sinLeer} en pausa` : null,
  ]
    .filter(Boolean)
    .join(' · ')
  return cuentas.dudosos
    ? { ...base, meta, done: true, cta: 'Revisar', onClick: () => irA(clave, lote, 'revisar') }
    : { ...base, meta, done: true, cta: 'Ver', onClick: () => irA(clave, lote, cuentas.listos && vacante ? 'entraron' : 'lote') }
}

almacenDeLotes.configurarAvisos({
  publicar: (clave, lote) => publishProcess(procesoDe(clave, lote)),
  terminado: (clave, lote) => {
    // Con la vacante cerrada a mitad de la lectura ya salió «Nadie del lote entró»: un segundo aviso lo contradecía (VA-17).
    if (lote.cerradoAlLeer) return
    const cuentas = cuentasDe(lote)
    const vacante = almacenDeLotes.vacanteDe(clave)
    const titulo = `Terminó de leer «${lote.nombre}»`
    const texto = resumenCortoDeLote(lote)
    if (cuentas.dudosos) notifyAction(titulo, texto, { label: 'Revisar', onClick: () => irA(clave, lote, 'revisar') }, 'warning')
    else if (cuentas.listos && vacante)
      notifyAction(titulo, texto, { label: cuentas.listos === 1 ? 'Verla' : `Ver a las ${cuentas.listos}`, onClick: () => irA(clave, lote, 'entraron') }, 'success')
    else notifyAction(titulo, texto, { label: 'Ver el lote', onClick: () => irA(clave, lote, 'lote') }, cuentas.listos ? 'success' : 'info')
  },
  cortado: (clave, lote) => {
    const cuentas = cuentasDe(lote)
    avisoDeError(`Se cortó la lectura de «${lote.nombre}»`, `Lo leído está a salvo (${cuentas.leidos} de ${cuentas.total}).`, () => almacenDeLotes.seguir(clave, lote.id), 'Seguir leyendo')
  },
})

/* El estado ---------------------------------------------------------------------------------------------------- */

type Opciones = {
  // Sin vacante, las hojas de vida entran a la base global de «Mis candidatos».
  vacante?: VacanteUI
  // Quienes están hoy en la vacante y quienes se rechazaron: con ellos se reconocen los repetidos.
  activas?: Candidatura[]
  rechazadas?: Rechazada[]
  onEntraronEnLaBase?: (nuevas: Persona[]) => void
  // Al cerrar la ventana de elegir archivos (para quien la abre desde fuera).
  alCerrar?: () => void
  // Con la vacante cerrada no entran hojas de vida nuevas.
  bloqueo?: Bloqueo | null
  // Lo que hace cada exploración con la gente de un lote: mostrarla filtrada (y dónde: «el tablero», «el pipeline»…),
  // abrir su ficha, volver a considerarla. Y cómo llegar a la pestaña de lotes cuando se vuelve desde un aviso.
  onVerEntraron?: (loteId: string) => void
  dondeVerEntraron?: string
  onAbrirFicha?: (candidaturaId: string) => void
  onReconsiderar?: (candidaturaId: string) => void
  onIrALotes?: () => void
}

export type Importaciones = ReturnType<typeof useImportaciones>

export function useImportaciones(opciones: Opciones) {
  const { vacante, bloqueo } = opciones
  const clave = claveDe(vacante)
  const lotes = useSyncExternalStore(almacenDeLotes.suscribir, () => almacenDeLotes.de(vacante))
  // En «Mis candidatos», quién está hoy en la base (para deshacer un lote y abrir fichas).
  const personasBase = usePersonasDeLaBase()
  const [eligiendo, setEligiendo] = useState<Elegido[] | null>(null)
  const [revisando, setRevisando] = useState<{ loteId: string; archivoId?: string } | null>(null)
  const [viendo, setViendo] = useState<string | null>(null)
  const [sacando, setSacando] = useState<string | null>(null)
  // Un lote se ve en un solo panel. Antes «Ver a quiénes» abría un segundo panel encima con casi lo mismo (1 oct,
  // Nicolás: «se abre otro drawer, qué experiencia tan extraña, no se entiende nada»); ahora cada pantalla lleva a la
  // gente a su propia vista (`onVerEntraron`: el tablero de la 1, el pipeline de la 2, la cola de la 3).
  const verLote = (loteId: string) => setViendo(loteId)

  // Lo último que pasó la pantalla, para lo que el almacén pregunta fuera de un render.
  const opcionesRef = useRef(opciones)
  useEffect(() => {
    opcionesRef.current = opciones
  })

  // La pantalla se presenta al almacén: le presta quién está en la vacante y cómo abrir un lote sin salir de aquí.
  useEffect(
    () =>
      almacenDeLotes.enlazar(clave, {
        contexto: () => ({ activas: opcionesRef.current.activas ?? [], rechazadas: opcionesRef.current.rechazadas ?? [] }),
        ver: (loteId) => verLote(loteId),
        revisar: (loteId) => setRevisando({ loteId }),
        verEntraron: (loteId) => {
          if (opcionesRef.current.onVerEntraron) opcionesRef.current.onVerEntraron(loteId)
          else verLote(loteId)
        },
        entrarEnLaBase: (nuevas) => opcionesRef.current.onEntraronEnLaBase?.(nuevas),
      }),
    [clave],
  )

  // Para volver aquí desde un aviso cuando ya se salió: el aviso navega con «?lote=…&abrir=…».
  const navigate = useNavigate()
  const ruta = useLocation().pathname
  useEffect(() => {
    navegar = (url) => navigate(url)
  })
  const [parametros, setParametros] = useSearchParams()
  const pedido = parametros.get('lote')
  const abrirPedido = parametros.get('abrir')
  // Se atiende en el render (abre la ventana o lleva a la gente del lote) y la dirección se limpia después.
  const [pedidoAtendido, setPedidoAtendido] = useState<string | null>(null)
  if (pedido !== pedidoAtendido) {
    setPedidoAtendido(pedido)
    if (pedido && abrirPedido === 'revisar') setRevisando({ loteId: pedido })
    else if (pedido && abrirPedido === 'entraron' && opciones.onVerEntraron) opciones.onVerEntraron(pedido)
    else if (pedido) {
      opciones.onIrALotes?.()
      verLote(pedido)
    }
  }
  useEffect(() => {
    if (!pedido) return
    setParametros(
      (antes) => {
        const siguientes = new URLSearchParams(antes)
        siguientes.delete('lote')
        siguientes.delete('abrir')
        return siguientes
      },
      { replace: true },
    )
  }, [pedido, setParametros])

  // Cualquier camino que intente importar con la vacante cerrada (un botón viejo, soltar un archivo) termina aquí.
  const bloqueada = () => {
    if (!bloqueo) return false
    if (bloqueo.onReabrir) notifyAction(bloqueo.titulo, 'Reábrela para importar CVs.', { label: 'Reabrir la vacante', onClick: bloqueo.onReabrir }, 'warning')
    else notify(bloqueo.titulo, 'No puedes importar CVs aquí.', 'warning')
    return true
  }

  const abrir = (elegidos: Elegido[] = []) => {
    if (bloqueada()) return
    setEligiendo(elegidos)
  }

  const importar = (
    elegidos: Elegido[],
    decision: { nombre: string; etapa?: string; origen: string; referidoPor?: string; aviso?: string; etiquetas?: string[] },
  ) => {
    // Si no se suben (VA-50), no entra nada y el aviso deja volver a intentarlo con los mismos archivos.
    if (noSeGuardo(`importar:${decision.nombre}:${elegidos.length}`, `No pudimos subir ${textoHojas(elegidos.length)}`, () => importar(elegidos, decision), 'No se importó nada.')) {
      setEligiendo(null)
      return
    }
    const nuevos = almacenDeLotes.importar(vacante, elegidos, { ...decision, quien: QUIEN_MUEVE, ruta })
    if (!nuevos.length) return
    setEligiendo(null)
    opcionesRef.current.alCerrar?.()
    const total = nuevos.reduce((suma, lote) => suma + lote.archivos.length, 0)
    notify(
      nuevos.length > 1 ? `Leyendo ${textoHojas(total)} en ${nuevos.length} lotes` : `Leyendo ${textoHojas(total)}`,
      'Te aviso al terminar. Puedes seguir trabajando.', 'info',
    )
  }

  const loteRevisado = revisando ? lotes.find((lote) => lote.id === revisando.loteId) : undefined
  const loteVisto = viendo ? lotes.find((lote) => lote.id === viendo) : undefined
  const loteSacado = sacando ? lotes.find((lote) => lote.id === sacando) : undefined

  // Quién sale al sacar un lote: quien sigue en la etapa donde entró y no se movió. Quien ya avanzó o se rechazó, se
  // queda (y se dice por qué).
  const quienesSalen = (lote: LoteCvs) => {
    const activas = opciones.activas ?? []
    const rechazadas = opciones.rechazadas ?? []
    const entradas = lote.archivos.filter((archivo) => archivo.candidaturaId && !archivo.sacado)
    const salen: Candidatura[] = []
    const quedan: { candidatura: Candidatura; por: string }[] = []
    entradas.forEach((archivo) => {
      const activa = activas.find((c) => c.id === archivo.candidaturaId)
      const rechazada = rechazadas.find((r) => r.candidatura.id === archivo.candidaturaId)
      if (activa && activa.etapa === lote.etapa && !movimientosDe(activa.id).length) salen.push(activa)
      else if (activa) quedan.push({ candidatura: activa, por: `ya está en ${tituloEtapa(activa.etapa)}` })
      else if (rechazada) quedan.push({ candidatura: rechazada.candidatura, por: 'ya la rechazaste' })
    })
    return { salen, quedan }
  }

  // Revisar lo dudoso y sacar un lote se piden desde el detalle del lote: con él abierto van dentro, como drawer anidado;
  // si no (un aviso con «Revisar», la dirección con «?abrir=revisar»), en la ventana de siempre (8 oct).
  const delDetalle = (
    <>
      {loteRevisado ? (
        <RevisarDudosas
          key={`${loteRevisado.id}-${revisando?.archivoId ?? ''}`}
          lote={loteRevisado}
          vacante={vacante}
          activas={opciones.activas ?? []}
          archivoInicial={revisando?.archivoId}
          onConfirmar={(archivoId, datos) => almacenDeLotes.confirmar(clave, loteRevisado.id, archivoId, datos)}
          onDescartar={(archivoId) => almacenDeLotes.descartar(clave, loteRevisado.id, archivoId)}
          onMisma={(archivoId, candidatura) => almacenDeLotes.esLaMisma(clave, loteRevisado.id, archivoId, candidatura)}
          onCerrar={({ confirmados, descartados, mismas }) => {
            setRevisando(null)
            const entraron = almacenDeLotes.entregarConfirmados(clave, loteRevisado.id, confirmados)
            const donde = vacante && loteRevisado.etapa ? tituloEtapa(loteRevisado.etapa) : 'tu base'
            const otras = [
              descartados ? `${descartados === 1 ? '1 se descartó' : `${descartados} se descartaron`}` : null,
              mismas ? `${mismas === 1 ? '1 ya estaba' : `${mismas} ya estaban`} en la vacante` : null,
            ].filter(Boolean)
            if (entraron)
              notifyAction(
                `${textoPersonas(entraron)} ${entraron === 1 ? 'entró' : 'entraron'} a ${donde}`,
                otras.length ? `${otras.join(' · ')}.` : `De «${loteRevisado.nombre}».`,
                { label: 'Ver el lote', onClick: () => verLote(loteRevisado.id) }, 'success',
              )
            else if (otras.length) notify(`${otras.join(' · ')}.`, 'No entró nadie nuevo.', 'info')
          }}
        />
      ) : null}
      {loteSacado && vacante ? (
        (() => {
          const { salen, quedan } = quienesSalen(loteSacado)
          return (
            <SacarLote
              key={loteSacado.id}
              titulo={`Sacar de la vacante a quienes entraron con «${loteSacado.nombre}»`}
              // Qué les llegó al entrar (VA-31): el aviso y, si entraron a una etapa con IA, la invitación, que se cancela.
              sub={[
                `Salen de ${loteSacado.etapa ? tituloEtapa(loteSacado.etapa) : 'la vacante'} sin quedar como rechazadas y sin un correo nuevo.`,
                loteSacado.aviso ? 'Ya les había llegado el aviso de que su CV entró.' : '',
                vacante.etapas.find((etapa) => etapa.id === loteSacado.etapa)?.ia
                  ? `Su invitación a «${tituloEtapa(loteSacado.etapa ?? '')}» se cancela: el enlace deja de funcionar y no se cobra.`
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
              salen={salen.map((c) => ({
                id: c.id,
                ini: c.candidato.iniciales,
                nombre: c.candidato.nombre,
                meta: `${c.candidato.cargo} · cumple ${cumplidosDe(c.criterios)} de ${c.criterios.length}`,
              }))}
              quedan={quedan.map((uno) => ({ nombre: uno.candidatura.candidato.nombre, por: uno.por }))}
              onOpenChange={(abierto) => !abierto && setSacando(null)}
              onConfirmar={function sacar() {
                setSacando(null)
                if (noSeGuardo(`sacar:${loteSacado.id}`, 'No pudimos sacar a nadie', sacar, 'Siguen en la vacante.')) return
                const sacadas = almacenDeLotes.sacar(
                  clave,
                  loteSacado.id,
                  salen.map((c) => c.id),
                  quedan.length,
                )
                notifyAction(
                  `Sacaste a ${textoPersonas(sacadas.length)} de la vacante`,
                  quedan.length ? `${textoPersonas(quedan.length)} se ${quedan.length === 1 ? 'quedó' : 'quedaron'}: ya ${quedan.length === 1 ? 'avanzó' : 'avanzaron'}.` : 'No reciben correo.',
                  { label: 'Deshacer', onClick: () => almacenDeLotes.devolver(clave, loteSacado.id, sacadas) }, 'success',
                )
              }}
            />
          )
        })()
      ) : loteSacado ? (
        (() => {
          // En la base: sale quien entró con el lote y no está en ningún proceso.
          const suyas = new Set(loteSacado.archivos.filter((archivo) => archivo.personaBaseId && !archivo.sacado && archivo.estado === 'listo').map((archivo) => archivo.personaBaseId))
          const enLaBase = personasBase.filter((persona) => suyas.has(persona.id))
          const salen = enLaBase.filter((persona) => !persona.procesos.length)
          const quedan = enLaBase.filter((persona) => persona.procesos.length)
          return (
            <SacarLote
              key={loteSacado.id}
              titulo={`Quitar de tu base a quienes entraron con «${loteSacado.nombre}»`}
              sub="Salen de Mis candidatos con su ficha y su CV. No se les escribe."
              verbo="Quitar"
              salen={salen.map((persona) => ({ id: persona.id, ini: persona.iniciales, nombre: persona.nombre, meta: `${persona.cargo} · ${persona.ciudad}` }))}
              quedan={quedan.map((persona) => ({ nombre: persona.nombre, por: `ya está en ${persona.procesos[0].vacante}` }))}
              onOpenChange={(abierto) => !abierto && setSacando(null)}
              onConfirmar={function quitar() {
                setSacando(null)
                if (noSeGuardo(`quitar-lote:${loteSacado.id}`, 'No pudimos quitar a nadie', quitar, 'Siguen en tu base.')) return
                const resultado = almacenDeLotes.sacarDeLaBase(loteSacado.id)
                notifyAction(
                  `Quitaste a ${textoPersonas(resultado.salen.length)} de tu base`,
                  resultado.quedan.length ? `${textoPersonas(resultado.quedan.length)} se ${resultado.quedan.length === 1 ? 'quedó: está' : 'quedaron: están'} en un proceso.` : `Entraron con «${loteSacado.nombre}».`,
                  { label: 'Deshacer', onClick: resultado.deshacer }, 'success',
                )
              }}
            />
          )
        })()
      ) : null}
    </>
  )

  const dialogos = (
    <>
      <DialogoImportar
        abierto={eligiendo !== null}
        iniciales={eligiendo ?? []}
        vacante={vacante}
        onOpenChange={(abierto) => {
          if (abierto) return
          setEligiendo(null)
          opcionesRef.current.alCerrar?.()
        }}
        onImportar={importar}
      />
      <DetalleLote
        lote={loteVisto}
        vacante={vacante}
        activas={opciones.activas ?? []}
        rechazadas={opciones.rechazadas ?? []}
        onOpenChange={(abierto) => !abierto && setViendo(null)}
        onRevisar={(archivoId) => viendo && setRevisando({ loteId: viendo, archivoId })}
        onDetener={() => viendo && almacenDeLotes.detener(clave, viendo)}
        onSeguir={() => viendo && almacenDeLotes.seguir(clave, viendo)}
        onTerminarAsi={() => viendo && almacenDeLotes.terminarAsi(clave, viendo)}
        onReemplazar={(archivoId, archivo) => viendo && almacenDeLotes.reemplazar(clave, viendo, archivoId, archivo)}
        onActualizar={function actualizar(archivoId) {
          if (!viendo) return
          if (noSeGuardo(`actualizar-cv:${archivoId}`, 'No pudimos actualizar su CV', () => actualizar(archivoId), 'Sigue el CV de antes.')) return
          almacenDeLotes.actualizarHoja(clave, viendo, archivoId)
          notify('Actualizamos su CV', 'La versión anterior sigue en su ficha.', 'success')
        }}
        onActualizarDatos={function actualizarDatos(archivoId) {
          if (!viendo) return
          if (noSeGuardo(`actualizar-datos:${archivoId}`, 'No pudimos actualizar sus datos', () => actualizarDatos(archivoId), 'Siguen los de antes.')) return
          const deshacer = almacenDeLotes.actualizarDatos(clave, viendo, archivoId)
          const nombre = almacenDeLotes.de(vacante).find((uno) => uno.id === viendo)?.archivos.find((uno) => uno.id === archivoId)?.datos?.nombre
          if (deshacer)
            notifyAction(
              `Actualizaste los datos de ${nombre ?? 'la persona'}`,
              'Ahora tiene el cargo y la empresa del CV nuevo.',
              { label: 'Deshacer', onClick: deshacer },
              'success',
            )
        }}
        onSacar={() => viendo && setSacando(viendo)}
        // Solo si la pantalla tiene otra vista para mostrarlos (el pipeline de la 2, la cola de la 3, la base): en la 1
        // quienes entraron ya están en este mismo panel, con su ficha a un clic.
        onVerEntraron={
          opciones.onVerEntraron
            ? () => {
                const id = viendo
                setViendo(null)
                if (id) opcionesRef.current.onVerEntraron?.(id)
              }
            : undefined
        }
        onAbrirFicha={
          opciones.onAbrirFicha
            ? (candidaturaId) => {
                setViendo(null)
                opcionesRef.current.onAbrirFicha?.(candidaturaId)
              }
            : undefined
        }
        dondeVerEntraron={opciones.dondeVerEntraron}
        ventanas={loteVisto ? delDetalle : null}
        onReconsiderar={
          opciones.onReconsiderar
            ? (archivo) => {
                if (!archivo.repetido?.candidaturaId) return
                setViendo(null)
                opcionesRef.current.onReconsiderar?.(archivo.repetido.candidaturaId)
              }
            : undefined
        }
      />
      {loteVisto ? null : delDetalle}
    </>
  )

  return {
    lotes,
    abrir,
    ver: (loteId: string) => verLote(loteId),
    revisar: (loteId: string) => setRevisando({ loteId }),
    detener: (loteId: string) => almacenDeLotes.detener(clave, loteId),
    seguir: (loteId: string) => almacenDeLotes.seguir(clave, loteId),
    verEntraron: opciones.onVerEntraron,
    bloqueo,
    dialogos,
    // Mientras hay una ventana abierta, los atajos de la pantalla no deben dispararse.
    ocupado: eligiendo !== null || revisando !== null || viendo !== null || sacando !== null,
  }
}

/* La zona para soltar ------------------------------------------------------------------------------------------ */

const ACEPTA = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.heic,.webp,.zip,application/pdf,application/zip,application/x-zip-compressed'

// El selector de archivos de la librería (`useFileUpload`). No filtra ni limita: lo que no sirve se muestra en la
// lista con el motivo en español (`elegidoDe`), en lugar de los avisos en inglés del gancho. Tras entregar lo soltado
// se vacía, para que el mismo archivo se pueda volver a elegir si se quitó de la lista.
export function useElegirArchivos(onArchivos: (archivos: File[]) => void) {
  const [{ isDragging }, acciones] = useFileUpload({
    multiple: true,
    onFilesAdded: (nuevos) => {
      onArchivos(nuevos.flatMap(({ file }) => (file instanceof File ? [file] : [])))
      acciones.clearFiles()
    },
  })
  return { encima: isDragging, ...acciones }
}

// La zona para subir de la librería, tal como el patrón «Progress file upload» del Storybook de flux-ui (Components ›
// File Upload; 25 sep, Nicolás: «¿sí utilizaste el file upload de flux ui?»). El componente todavía no viene en el
// paquete, solo su gancho: aquí se arma igual que en el Storybook, con las piezas publicadas. Cuando salga, se cambia.
//
// Grande en el estado vacío; como franja (el patrón «Basic drag and drop») cuando ya hay lotes. Por defecto recibe
// hojas de vida; para otra cosa (una hoja de cálculo) se le pasa qué acepta y cómo decirlo.
export function ZonaParaSoltar({
  grande,
  titulo,
  descripcion,
  detalle,
  onArchivos,
  acepta = ACEPTA,
  soltando = 'Suéltalos para empezar',
  boton = 'Elegir archivos',
}: {
  grande?: boolean
  titulo: string
  descripcion?: string
  detalle: string
  onArchivos: (archivos: File[]) => void
  acepta?: string
  // Lo que dice mientras se arrastra encima.
  soltando?: string
  boton?: string
}) {
  const { encima, handleDragEnter, handleDragLeave, handleDragOver, handleDrop, openFileDialog, getInputProps } =
    useElegirArchivos(onArchivos)
  const soltable = {
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDragOver: handleDragOver,
    onDrop: handleDrop,
  }
  const borde = cn(
    'rounded-lg border border-dashed transition-colors',
    encima ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50',
  )
  const campo = <Input {...getInputProps({ accept: acepta })} className="hidden" aria-hidden tabIndex={-1} />

  if (!grande)
    return (
      <div className={cn(borde, 'flex items-center gap-3 p-4')} {...soltable}>
        {campo}
        {/* En contorno y no relleno como en el Storybook: debajo, cada lote ya trae su botón principal. */}
        <Button variant="outline" size="sm" className="shrink-0" onClick={openFileDialog}>
          <HugeiconsIcon icon={PlusSignIcon} size={16} />
          Agregar CVs
        </Button>
        <span className="flex min-w-0 flex-col">
          <Text as="span" size="sm" variant="muted" className="truncate">
            {encima ? soltando : titulo}
          </Text>
          <Text as="span" size="xs" variant="muted" className="truncate">
            {detalle}
          </Text>
        </span>
      </div>
    )

  return (
    <div className={cn(borde, 'flex min-h-80 flex-col items-center justify-center gap-4 p-8 text-center')} {...soltable}>
      {campo}
      {/* La ilustración glass de subir, no un icono de línea: es el estado vacío de la ventana (regla de Cristian, 9-oct).
          Flota mientras espera; con archivos encima se levanta y se inclina, como si fuera a recibirlos. */}
      <Flotar>
        <motion.span
          className="inline-flex"
          animate={encima ? { y: -10, scale: 1.14, rotate: -6 } : { y: 0, scale: 1, rotate: 0 }}
          transition={RESORTE_VIVO}
        >
          <ImagenGlass nombre="glass-arrow-up-square" />
        </motion.span>
      </Flotar>
      <span className="flex flex-col items-center gap-2">
        {/* «Suelta aquí…» cambia a «Suéltalos…» con un fundido, sin saltar. */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={encima ? 'soltando' : 'titulo'} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.16 }}>
            <Heading as="h3" level={5}>
              {encima ? soltando : titulo}
            </Heading>
          </motion.span>
        </AnimatePresence>
        {descripcion ? (
          <Text as="p" size="sm" variant="muted">
            {descripcion}
          </Text>
        ) : null}
        <Text as="p" size="xs" variant="muted">
          {detalle}
        </Text>
      </span>
      <Button onClick={openFileDialog}>
        <HugeiconsIcon icon={Upload01Icon} size={16} />
        {boton}
      </Button>
    </div>
  )
}

/* La autorización de datos ------------------------------------------------------------------------------------- */

export const useAutorizacion = () => useSyncExternalStore(autorizacionDeDatos.suscribir, autorizacionDeDatos.leer)

export function DialogoAutorizacion({ abierto, onOpenChange }: { abierto: boolean; onOpenChange: (abierto: boolean) => void }) {
  return (
    <VentanaDeAccion
      open={abierto}
      onOpenChange={onOpenChange}
      title="Autorización para tratar datos personales"
      sub="Lo que declaras al subir CVs al módulo de reclutamiento."
      footer={<Button onClick={() => onOpenChange(false)}>Entendido</Button>}
    >
      <div className="flex flex-col gap-3">
        {TEXTO_AUTORIZACION.map((parrafo) => (
          <Text key={parrafo.slice(0, 20)} as="p" size="sm" className="leading-relaxed text-pretty">
            {parrafo}
          </Text>
        ))}
      </div>
    </VentanaDeAccion>
  )
}

// La línea que dice quién aceptó y cuándo, con el texto a mano.
export function AutorizacionAceptada() {
  const autorizacion = useAutorizacion()
  const [leyendo, setLeyendo] = useState(false)
  return (
    <>
      <Text as="p" variant="muted" size="xs" className="flex flex-wrap items-center gap-x-1">
        {autorizacion
          ? `Autorización de datos aceptada por ${autorizacion.quien} el ${autorizacion.fecha}.`
          : 'Antes de leerlas se confirma que tienes la autorización de datos de estas personas.'}
        <Button variant="link" size="sm" className="h-auto! p-0! text-xs!" onClick={() => setLeyendo(true)}>
          Leer la autorización
        </Button>
      </Text>
      <DialogoAutorizacion abierto={leyendo} onOpenChange={setLeyendo} />
    </>
  )
}

/* Elegir y revisar antes de leer ------------------------------------------------------------------------------- */

function descripcionDe(elegido: Elegido) {
  if (elegido.problema) return `No entra: ${elegido.problema[0].toLowerCase()}${elegido.problema.slice(1)}`
  if (elegido.tipo === 'zip') {
    const pdfs = elegido.contenido?.pdfs.length ?? 0
    const ignorados = elegido.contenido?.ignorados ?? []
    return `ZIP · ${pesoEnTexto(elegido.peso)} · ${pdfs === 1 ? '1 PDF adentro' : `${pdfs} PDF adentro`}${ignorados.length ? ` · ignora ${ignorados.join(' y ')}` : ''}`
  }
  // Word y fotos se leen como una hoja de vida más (VA-29); se dice qué son.
  const formato = /\.docx?$/i.test(elegido.nombre) ? 'Word' : /\.(jpe?g|png|heic|webp)$/i.test(elegido.nombre) ? 'Foto' : 'PDF'
  return `${formato} · ${pesoEnTexto(elegido.peso)}`
}

// Qué pasa al entrar a la etapa elegida: la primera compara con los requisitos; otra se salta las de antes; una de IA
// les escribe.
function alEntrarA(vacante: VacanteUI, etapa: string) {
  const indice = vacante.etapas.findIndex((una) => una.id === etapa)
  const destino = vacante.etapas[indice]
  const saltadas = vacante.etapas.slice(0, Math.max(indice, 0)).map((una) => una.titulo)
  const requisitos = vacante.requisitos.length
  const partes: string[] = []
  if (saltadas.length) partes.push(`Se saltan ${nombreDeLista(saltadas)}: nadie las filtra antes.`)
  partes.push(`La IA compara cada una con ${requisitos === 1 ? 'el requisito' : `los ${requisitos} requisitos`} al leerla.`)
  return { texto: partes.join(' '), ia: destino?.ia ? destino.titulo : null, salta: saltadas.length > 0 }
}

function DialogoImportar({
  abierto,
  iniciales,
  vacante,
  onOpenChange,
  onImportar,
}: {
  abierto: boolean
  iniciales: Elegido[]
  vacante?: VacanteUI
  onOpenChange: (abierto: boolean) => void
  onImportar: (elegidos: Elegido[], decision: { nombre: string; etapa?: string; origen: string; referidoPor?: string; aviso?: string; etiquetas?: string[] }) => void
}) {
  const [elegidos, setElegidos] = useState<Elegido[]>(iniciales)
  const [nombre, setNombre] = useState('')
  const [etapa, setEtapa] = useState(vacante ? primeraEtapaDe(vacante.etapas) : '')
  const [origen, setOrigen] = useState<string | null>(null)
  const [referidoPor, setReferidoPor] = useState('')
  const [avisar, setAvisar] = useState(false)
  const [aviso, setAviso] = useState(TEXTO_AVISO_ENTRADA)
  const [acepto, setAcepto] = useState(false)
  const [leyendoTexto, setLeyendoTexto] = useState(false)
  const autorizacion = useAutorizacion()

  // Cada vez que se abre, con lo que se soltó (o vacía) y en la primera etapa (se ajusta en el render).
  const [abiertoAntes, setAbiertoAntes] = useState(abierto)
  const [inicialesAntes, setInicialesAntes] = useState(iniciales)
  if (abierto !== abiertoAntes || iniciales !== inicialesAntes) {
    setAbiertoAntes(abierto)
    setInicialesAntes(iniciales)
    if (abierto) {
      setElegidos(iniciales)
      if (abierto !== abiertoAntes) {
        setNombre('')
        setEtapa(vacante ? primeraEtapaDe(vacante.etapas) : '')
        setOrigen(null)
        setReferidoPor('')
        setAvisar(false)
        setAviso(TEXTO_AVISO_ENTRADA)
        setAcepto(false)
      }
    }
  }

  const sumar = (archivos: File[]) =>
    setElegidos((antes) => archivos.reduce((lista, archivo) => [...lista, elegidoDe(archivo.name, archivo.size, lista, archivo)], antes))
  // Con la lista a la vista se pueden soltar más archivos encima o sumarlos con «Agregar más».
  const mas = useElegirArchivos(sumar)

  const validos = elegidos.filter((elegido) => !elegido.problema)
  const fuera = elegidos.length - validos.length
  const hojas = hojasDe(elegidos)
  const zips = validos.filter((elegido) => elegido.tipo === 'zip').length
  const pdfs = validos.length - zips
  const partes = Math.ceil(hojas / LIMITE_POR_LOTE)
  const autorizado = Boolean(autorizacion) || acepto
  const nombreSugerido =
    validos.length === 1 && validos[0].tipo === 'zip'
      ? validos[0].nombre
      : `CVs del ${new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}`
  // De dónde vienen: lo que se elija o, mientras no, lo que dice el nombre de los archivos.
  const origenElegido = origen ?? origenSugerido(validos.map((elegido) => elegido.nombre))
  const entrada = vacante && etapa ? alEntrarA(vacante, etapa) : null

  const leer = () => {
    if (!autorizacion) autorizacionDeDatos.aceptar(QUIEN_MUEVE)
    onImportar(elegidos, {
      nombre: nombre.trim() || nombreSugerido,
      etapa: etapa || undefined,
      origen: origenElegido,
      referidoPor: origenElegido === 'referido' ? referidoPor.trim() || undefined : undefined,
      aviso: avisar && aviso.trim() ? aviso.trim() : undefined,
    })
  }

  const destino = vacante ? `a ${vacante.titulo}` : 'a tu base de candidatos'

  return (
    <>
      <VentanaDeAccion
        open={abierto}
        onOpenChange={onOpenChange}
        size="wide"
        title={elegidos.length ? `Importar CVs ${destino}` : 'Importar CVs'}
        sub={
          elegidos.length
            ? 'Revisa lo que se va a leer. Lo que la IA lea con seguridad entra solo; lo dudoso te espera con la hoja al lado.'
            : vacante
              ? `Entran ${destino}. CVs sueltos (PDF, Word o foto) o un ZIP con ellos.`
              : 'Entran a tu base de candidatos, sin ir todavía a ninguna vacante. CVs sueltos (PDF, Word o foto) o un ZIP con ellos.'
        }
        note={elegidos.length && autorizacion ? 'Se leen en segundo plano: puedes cerrar esto y seguir trabajando.' : undefined}
        footer={
          <>
            {/* La autorización, al lado del botón que la necesita: se acepta una vez y queda anotada. */}
            {elegidos.length && !autorizacion ? (
              <Field orientation="horizontal" className="mr-2 w-auto! items-start! gap-2!">
                <Checkbox id="autorizacion-datos" checked={acepto} onCheckedChange={(valor) => setAcepto(valor === true)} className="mt-0.5" />
                <FieldLabel htmlFor="autorizacion-datos" className="block! text-sm font-normal! text-pretty">
                  Tengo la autorización de datos de estas personas.{' '}
                  <Button variant="link" size="sm" className="h-auto! p-0!" onClick={() => setLeyendoTexto(true)}>
                    Leerla
                  </Button>
                </FieldLabel>
              </Field>
            ) : null}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button disabled={!hojas || !autorizado || (avisar && !aviso.trim())} onClick={leer}>
              <HugeiconsIcon icon={FileImportIcon} size={16} />
              {!hojas ? 'Leer CVs' : partes > 1 ? `Leer ${hojas} en ${partes} lotes` : `Leer ${textoHojas(hojas)}`}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {elegidos.length ? (
            <div
              className="flex flex-col gap-4"
              onDragEnter={mas.handleDragEnter}
              onDragLeave={mas.handleDragLeave}
              onDragOver={mas.handleDragOver}
              onDrop={mas.handleDrop}
            >
              <div className="flex items-start justify-between gap-3">
                <Text as="p" size="sm" className="text-pretty">
                  {hojas
                    ? `Se van a leer ${textoHojas(hojas)}${
                        zips ? ` (${[`${zips} ZIP`, pdfs ? `${pdfs} ${pdfs === 1 ? 'CV suelto' : 'CVs sueltos'}` : ''].filter(Boolean).join(' y ')})` : ''
                      }.`
                    : 'Ninguno de estos archivos se puede leer.'}
                  {fuera ? ` ${fuera === 1 ? '1 archivo queda fuera' : `${fuera} archivos quedan fuera`}.` : ''}
                </Text>
                <Input {...mas.getInputProps({ accept: ACEPTA })} className="hidden" aria-hidden tabIndex={-1} />
                <Button variant="outline" size="sm" className="shrink-0" onClick={mas.openFileDialog}>
                  <HugeiconsIcon icon={CloudUploadIcon} size={16} />
                  Agregar más
                </Button>
              </div>

              <AttachmentGroup className="max-h-[13rem] flex-col! items-stretch! gap-1.5 overflow-x-hidden! overflow-y-auto!">
                {/* Los archivos entran uno tras otro; el que se quita se encoge y los demás suben. */}
                <AnimatePresence initial={true}>
                {[...validos, ...elegidos.filter((elegido) => elegido.problema)].map((elegido, puesto) => (
                  <motion.div
                    key={elegido.id}
                    layout="position"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                    transition={{ duration: 0.3, delay: Math.min(puesto, 10) * 0.035, ease: CURVA, layout: RESORTE }}
                  >
                  <Attachment state={elegido.problema ? 'error' : 'done'} size="sm" className="w-full! min-w-0!">
                    <AttachmentMedia>
                      <HugeiconsIcon icon={elegido.tipo === 'zip' ? FileZipIcon : elegido.problema ? FileRemoveIcon : File01Icon} size={16} />
                    </AttachmentMedia>
                    <AttachmentContent>
                      <AttachmentTitle>{elegido.nombre}</AttachmentTitle>
                      <AttachmentDescription>{descripcionDe(elegido)}</AttachmentDescription>
                    </AttachmentContent>
                    <AttachmentActions>
                      <BotonIcono aria-label={`Quitar ${elegido.nombre}`} onClick={() => setElegidos((antes) => antes.filter((otro) => otro.id !== elegido.id))}>
                        <HugeiconsIcon icon={Cancel01Icon} size={14} />
                      </BotonIcono>
                    </AttachmentActions>
                  </Attachment>
                  </motion.div>
                ))}
                </AnimatePresence>
              </AttachmentGroup>

              {/* Más de 200: no se obliga a quitar nada; se parte en lotes que se leen uno detrás de otro. */}
              {partes > 1 ? (
                <Alert variant="info">
                  <HugeiconsIcon icon={FileImportIcon} size={16} />
                  <AlertTitle>
                    Son {hojas}: se leen en {partes} lotes de hasta {LIMITE_POR_LOTE}
                  </AlertTitle>
                  <AlertDescription>El segundo empieza cuando termine el primero. Si prefieres otro orden, quita algún ZIP e impórtalo aparte.</AlertDescription>
                </Alert>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Nombre del lote</FieldLabel>
                  <Input value={nombre} onChange={(evento) => setNombre(evento.target.value)} placeholder={nombreSugerido} />
                  <FieldDescription>{vacante ? 'Así lo encuentras después en «CVs importados».' : 'Así lo encuentras después en «Importaciones».'}</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel>De dónde vienen</FieldLabel>
                  <Select value={origenElegido} onValueChange={(valor) => setOrigen(valor as string)}>
                    <SelectTrigger aria-label="De dónde vienen los CVs">
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
                  <FieldDescription>Queda como el origen de cada persona.</FieldDescription>
                </Field>
                {origenElegido === 'referido' ? (
                  <Field>
                    <FieldLabel>
                      Quién los refirió{' '}
                      <Text as="span" variant="muted" size="sm" weight="normal">
                        (opcional)
                      </Text>
                    </FieldLabel>
                    <Input value={referidoPor} onChange={(evento) => setReferidoPor(evento.target.value)} placeholder="Por ejemplo: Juan Pérez, de Ventas" />
                  </Field>
                ) : null}
                {/* Sin etiquetas para el lote (13 oct, PM: a las personas no se les ponen etiquetas). */}
                {vacante ? (
                  <Field>
                    <FieldLabel>Entran a</FieldLabel>
                    <Select value={etapa} onValueChange={(valor) => setEtapa(valor as string)}>
                      <SelectTrigger aria-label="Etapa a la que entran">
                        <SelectValue>{(valor: string) => tituloEtapa(valor)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Etapas de esta vacante</SelectLabel>
                          {vacante.etapas.map((una, indice) => (
                            <SelectItem key={una.id} value={una.id}>
                              <Text as="span" variant="muted" className="tabular-nums">
                                {indice + 1}
                              </Text>
                              <span className="min-w-0 flex-1 truncate">{una.titulo}</span>
                              {una.ia ? <IconoIA /> : null}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {entrada ? <FieldDescription>{entrada.texto}</FieldDescription> : null}
                  </Field>
                ) : null}
              </div>

              {/* Entrar a una etapa de IA manda la invitación a la entrevista: se dice antes, como al mover. */}
              {entrada?.ia ? (
                <Alert variant="info">
                  <HugeiconsIcon icon={Mail01Icon} size={16} />
                  <AlertTitle className="flex items-center gap-1.5">
                    <IconoIA />
                    {entrada.ia} les escribe al entrar
                  </AlertTitle>
                  <AlertDescription>
                    Cada persona que entre recibe la invitación a su entrevista con la IA. A quien se descarte o no se pueda leer, no le llega.
                  </AlertDescription>
                </Alert>
              ) : null}

              <Separator />

              <div className="flex flex-col gap-3">
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>Avisarles que su CV entró</FieldTitle>
                    <FieldDescription>
                      {avisar
                        ? 'Les llega a quienes entren, cuando entren. A quien se descarte o no se pueda leer, no.'
                        : 'Apagado: nadie recibe correo por entrar.'}
                    </FieldDescription>
                  </FieldContent>
                  <Switch checked={avisar} onCheckedChange={setAvisar} aria-label="Avisarles que su CV entró" />
                </Field>
                {avisar ? (
                  <Field>
                    <FieldLabel>Mensaje</FieldLabel>
                    <Textarea value={aviso} onChange={(evento) => setAviso(evento.target.value)} rows={3} />
                    <FieldDescription>
                      {'{nombre}'} y {'{vacante}'} se cambian por sus datos.
                    </FieldDescription>
                  </Field>
                ) : null}
              </div>

              {autorizacion ? <AutorizacionAceptada /> : null}
            </div>
          ) : (
            <>
              <ZonaParaSoltar
                grande
                titulo="Suelta aquí los CVs"
                descripcion="Arrástralos desde una carpeta de tu equipo o elígelos con el botón"
                detalle={`PDF, Word, foto o ZIP · hasta 10 MB cada uno · se leen de a ${LIMITE_POR_LOTE} por lote`}
                onArchivos={sumar}
              />
            </>
          )}
        </div>
      </VentanaDeAccion>
      <DialogoAutorizacion abierto={leyendoTexto} onOpenChange={setLeyendoTexto} />
    </>
  )
}

/* La pestaña «CVs importados» ---------------------------------------------------------------------------------- */

// Qué pasa con las hojas de vida, en tres líneas: para el estado vacío.
function ComoFunciona({ vacante }: { vacante?: VacanteUI }) {
  const etapa = vacante ? tituloEtapa(primeraEtapaDe(vacante.etapas)) : 'tu base'
  const pasos = [
    {
      icono: CheckmarkCircle02Icon,
      texto: vacante
        ? `Lo que la IA lee con seguridad entra solo a ${etapa}, ya comparado con los requisitos y sin correo a nadie.`
        : `Lo que la IA lee con seguridad entra solo a ${etapa}, sin correo a nadie.`,
    },
    { icono: UserCheck01Icon, texto: 'Lo dudoso te espera con el CV al lado para que confirmes un dato.' },
    { icono: Copy01Icon, texto: 'Quien ya estaba no se duplica: entra con la ficha que ya tiene, o te dice dónde está.' },
  ]
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {pasos.map((paso) => (
        <div key={paso.texto} className="flex items-start gap-2.5">
          <IconTile variant="soft" size="sm" className="shrink-0">
            <HugeiconsIcon icon={paso.icono} size={16} />
          </IconTile>
          <Text as="p" variant="muted" size="sm" className="text-pretty">
            {paso.texto}
          </Text>
        </div>
      ))}
    </div>
  )
}

export function EstadoLote({ lote }: { lote: LoteCvs }) {
  const cuentas = cuentasDe(lote)
  if (lote.estado === 'leyendo')
    return (
      <Progress value={Math.round((cuentas.leidos / cuentas.total) * 100)} aria-label={`Avance de ${lote.nombre}`} className="w-full">
        <ProgressLabel className="flex items-center gap-1.5 font-normal!">
          <Spinner />
          Leyendo {cuentas.leidos + 1} de {cuentas.total}…
        </ProgressLabel>
        <ProgressValue />
      </Progress>
    )
  if (lote.estado === 'en-cola')
    return (
      <Progress value={0} aria-label={`Avance de ${lote.nombre}`} className="w-full">
        <ProgressLabel className="font-normal!">En cola: empieza al terminar la parte {(lote.parte?.n ?? 2) - 1}</ProgressLabel>
      </Progress>
    )
  const entraron = cuentas.listos
  return (
    <span className="flex flex-col gap-2">
      {lote.estado === 'detenido' ? (
        <Progress value={Math.round((cuentas.leidos / cuentas.total) * 100)} aria-label={`Avance de ${lote.nombre}`} className="w-full">
          <ProgressLabel className={cn('flex items-center gap-1.5 font-normal!', lote.interrumpido && 'text-destructive')}>
            {lote.interrumpido ? <HugeiconsIcon icon={WifiDisconnected01Icon} size={14} aria-hidden /> : null}
            {lote.interrumpido ? 'Se cortó la conexión en' : 'Se detuvo en'} {cuentas.leidos} de {cuentas.total}
          </ProgressLabel>
        </Progress>
      ) : (
        <Progress value={Math.round((entraron / cuentas.total) * 100)} aria-label={`${entraron} de ${cuentas.total} entraron`} className="w-full" />
      )}
      <span className="flex flex-wrap gap-1.5">
        {lote.retirado ? (
          <Badge variant="outline" className="tabular-nums">
            <HugeiconsIcon icon={UserRemove01Icon} size={12} aria-hidden />
            {/* Sin etapa, el lote es de la base: de ahí se quita, no se saca de una vacante. */}
            {lote.etapa ? 'Sacaste' : 'Quitaste'} a {lote.retirado.salieron}
          </Badge>
        ) : entraron ? (
          <Badge variant="success-light" className="tabular-nums">
            {entraron} {entraron === 1 ? 'entró' : 'entraron'}
          </Badge>
        ) : null}
        {cuentas.dudosos ? (
          <Badge variant="warning-light" className="tabular-nums">
            {cuentas.dudosos} por confirmar
          </Badge>
        ) : null}
        {cuentas.repetidos ? (
          <Badge variant="outline" className="tabular-nums">
            {cuentas.repetidos} ya {cuentas.repetidos === 1 ? 'estaba' : 'estaban'}
          </Badge>
        ) : null}
        {cuentas.fallidos ? (
          <Badge variant="destructive-outline" className="tabular-nums">
            {cuentas.fallidos} {lote.tipo === 'hoja-de-calculo' ? (cuentas.fallidos === 1 ? 'quedó fuera' : 'quedaron fuera') : 'sin leer'}
          </Badge>
        ) : null}
        {cuentas.sinLeer ? (
          <Badge variant="outline" className="tabular-nums">
            {cuentas.sinLeer} en pausa
          </Badge>
        ) : null}
        {cuentas.descartados ? (
          <Badge variant="outline" className="tabular-nums">
            {cuentas.descartados} {cuentas.descartados === 1 ? 'descartada' : 'descartadas'}
          </Badge>
        ) : null}
      </span>
    </span>
  )
}

// «Referidos de Juan Pérez · a Evaluación CV»
const lineaDeLote = (lote: LoteCvs, vacante?: VacanteUI) =>
  [
    `${origenDeLote(lote.origen).persona === 'Referido' ? 'Referidos' : origenDeLote(lote.origen).persona}${lote.referidoPor ? ` de ${lote.referidoPor}` : ''}`,
    lote.etapa && vacante ? `a ${tituloEtapa(lote.etapa)}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

export function PestanaCvs({ importaciones, vacante }: { importaciones: Importaciones; vacante?: VacanteUI }) {
  const { lotes, bloqueo } = importaciones
  // Los lotes cargan al abrir la pestaña (no cada vez que uno avanza: eso ya lo dice su fila). Lo fijo —el título, la
  // zona para soltar y los títulos de la tabla— se queda; las cuentas y las filas van en gris.
  const cargando = useCarga()
  const hojas = lotes.reduce((suma, lote) => suma + lote.archivos.length, 0)
  const pendientes = lotes.reduce((suma, lote) => suma + cuentasDe(lote).dudosos, 0)
  const recibir = (archivos: File[]) =>
    importaciones.abrir(archivos.reduce<Elegido[]>((lista, archivo) => [...lista, elegidoDe(archivo.name, archivo.size, lista, archivo)], []))
  const parar = (evento: MouseEvent) => evento.stopPropagation()
  // Cerrada, no entran hojas de vida nuevas: el aviso trae el botón para reabrirla y la zona para soltar no está.
  const cerrada = vacante && bloqueo ? <AvisoVacanteCerrada vacante={vacante} onReabrir={bloqueo.onReabrir} /> : null

  // Como toda sección, en su marco gris con el título y la bajada en el gris (regla de Cristian); antes era una tarjeta
  // blanca con el título adentro.
  if (!lotes.length)
    return (
      <Frame>
        <FrameHeader>
          <FrameTitle>{bloqueo ? 'No se importó ningún CV' : 'Importa los CVs que te llegaron por fuera'}</FrameTitle>
          <FrameDescription>
            {bloqueo
              ? 'Con la vacante cerrada no entran CVs nuevos. Al reabrirla, así funciona:'
              : 'Referidos, ferias de empleo, correos: la IA los lee, los compara con los requisitos y los deja en la vacante.'}
          </FrameDescription>
        </FrameHeader>
        <FramePanel className="flex flex-col gap-6">
          {cerrada}
          {bloqueo ? null : (
            <ZonaParaSoltar
              grande
              titulo="Suelta aquí los CVs"
              descripcion="Arrástralos desde una carpeta de tu equipo o elígelos con el botón"
              detalle={`PDF, Word, foto o ZIP · hasta 10 MB cada uno · se leen de a ${LIMITE_POR_LOTE} por lote`}
              onArchivos={recibir}
            />
          )}
          <Separator />
          <ComoFunciona vacante={vacante} />
        </FramePanel>
      </Frame>
    )

  return (
    <Frame>
      <FrameHeader>
        <FrameTitle>CVs importados</FrameTitle>
        {cargando ? (
          // El anuncio de la carga va aquí, en la cuenta; las filas grises de la tabla quedan ocultas para el lector.
          <Esqueleto etiqueta="Cargando los lotes">
            <LineaEsqueleto ancho="w-96 max-w-full" />
          </Esqueleto>
        ) : (
          <FrameDescription>
            {hojas} {hojas === 1 ? 'archivo' : 'archivos'} en {lotes.length} {lotes.length === 1 ? 'lote' : 'lotes'}.{' '}
            {pendientes ? `${pendientes} ${pendientes === 1 ? 'espera' : 'esperan'} que confirmes un dato.` : 'No hay nada pendiente.'}
          </FrameDescription>
        )}
      </FrameHeader>
      {/* Sin la franja «O suelta aquí más CVs» (15 oct, Nicolás: «demasiada información»): repetía «Importar CVs», que
          está arriba en la cabecera de la vacante. */}
      <FramePanel className="overflow-hidden [--frame-panel-px:0px] [--frame-panel-py:0px]">
      {cerrada}

      {/* 29 sep, reunión con Elkin: esta pestaña es el registro de lo que se cargó —cuándo, qué archivo, cómo quedó la
          carga y cuántos CVs traía—, sin el análisis de la IA: lo que la IA concluyó de cada persona se ve en
          el tablero y en su ficha. Desde cada carga se ve a quiénes entraron y se abre su ficha; tocar la fila abre el
          detalle de cada archivo.
          La primera y la última columna con el mismo margen de 20px que el título de arriba: la tabla de la librería
          pone 8px en todas las celdas y le gana a `pl-5` sin el «!». */}
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            {/* «Archivo» sin ancho: se queda con lo que sobra y se corta él, no la última columna. */}
            <TableHead className="w-[136px] pl-5!">Fecha</TableHead>
            <TableHead>Archivo</TableHead>
            <TableHead className="w-[200px]">Estado</TableHead>
            <TableHead className="w-[116px]">CVs</TableHead>
            <TableHead className="w-[112px]">Subido por</TableHead>
            <TableHead className="w-[156px] pr-5!" aria-label="Acciones" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {cargando ? lotes.map((lote) => <FilaLoteCargando key={lote.id} />) : null}
          {cargando ? null : lotes.map((lote, puesto) => {
            const cuentas = cuentasDe(lote)
            const entraron = lote.archivos.filter((archivo) => archivo.candidaturaId && !archivo.sacado).length
            return (
              <FilaAnimada key={lote.id} {...entrada(puesto)} className="cursor-pointer" onClick={() => importaciones.ver(lote.id)}>
                <TableCell className="py-3 pl-5!">
                  <Text as="span" size="sm" className="truncate">
                    {lote.fecha}
                  </Text>
                </TableCell>
                <TableCell>
                  <span className="flex min-w-0 items-center gap-3">
                    <IconTile variant="soft" size="sm" className="shrink-0">
                      <HugeiconsIcon icon={FileImportIcon} size={16} />
                    </IconTile>
                    <span className="flex min-w-0 flex-col">
                      <Text as="span" weight="medium" className="truncate">
                        {lote.nombre}
                      </Text>
                      <Text as="span" variant="muted" size="sm" className="truncate">
                        {lineaDeLote(lote, vacante)}
                      </Text>
                    </span>
                  </span>
                </TableCell>
                <TableCell>
                  <EstadoCarga lote={lote} />
                </TableCell>
                <TableCell>
                  <span className="flex min-w-0 flex-col">
                    <Text as="span" weight="medium" className="tabular-nums">
                      {cuentas.total}
                    </Text>
                    {/* Quienes entraron se ven desde aquí, aunque falte confirmar a alguien del mismo lote. */}
                    {lote.estado === 'terminado' && entraron ? (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto! w-fit p-0! tabular-nums"
                        onClick={(evento) => {
                          evento.stopPropagation()
                          if (importaciones.verEntraron) importaciones.verEntraron(lote.id)
                          else importaciones.ver(lote.id)
                        }}
                      >
                        {entraron === 1 ? '1 entró' : `${entraron} entraron`}
                      </Button>
                    ) : lote.estado === 'terminado' ? (
                      <Text as="span" variant="muted" size="sm">
                        Nadie entró
                      </Text>
                    ) : null}
                  </span>
                </TableCell>
                <TableCell>
                  <Text as="span" size="sm" className="truncate">
                    {lote.quien === QUIEN_MUEVE ? 'Tú' : lote.quien}
                  </Text>
                </TableCell>
                <TableCell className="pr-5!" onClick={parar}>
                  {lote.estado === 'leyendo' ? (
                    <Button variant="outline" size="sm" onClick={() => importaciones.detener(lote.id)}>
                      <HugeiconsIcon icon={PauseIcon} size={14} />
                      Detener
                    </Button>
                  ) : lote.estado === 'en-cola' ? (
                    <Text as="span" variant="muted" size="sm">
                      Espera su turno
                    </Text>
                  ) : lote.estado === 'detenido' ? (
                    <Button variant={lote.interrumpido ? 'default' : 'outline'} size="sm" onClick={() => importaciones.seguir(lote.id)}>
                      <HugeiconsIcon icon={PlayIcon} size={14} />
                      Seguir cargando
                    </Button>
                  ) : cuentas.dudosos ? (
                    <Button size="sm" onClick={() => importaciones.revisar(lote.id)}>
                      Confirmar {cuentas.dudosos}
                    </Button>
                  ) : entraron ? (
                    <Button variant="outline" size="sm" onClick={() => (importaciones.verEntraron ? importaciones.verEntraron(lote.id) : importaciones.ver(lote.id))}>
                      Ver a quiénes
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => importaciones.ver(lote.id)}>
                      Ver el detalle
                    </Button>
                  )}
                </TableCell>
              </FilaAnimada>
            )
          })}
        </TableBody>
      </Table>
      </FramePanel>
    </Frame>
  )
}

// El estado de una carga, en una palabra: cargando (con cuántas van), en cola, detenida, con errores, falta confirmar
// algo o cargada. Lo que pasó con cada archivo está en el detalle del lote.
function EstadoCarga({ lote }: { lote: LoteCvs }) {
  const cuentas = cuentasDe(lote)
  if (lote.estado === 'leyendo')
    return (
      <span role="status" className="flex min-w-0 items-center gap-1.5">
        <Spinner />
        <Text as="span" size="sm" className="truncate tabular-nums">
          Cargando {Math.min(cuentas.leidos + 1, cuentas.total)} de {cuentas.total}
        </Text>
      </span>
    )
  if (lote.estado === 'en-cola')
    return (
      <Badge variant="secondary">
        En cola
      </Badge>
    )
  if (lote.estado === 'detenido')
    return (
      <span className="flex min-w-0 flex-col items-start gap-1">
        <Badge variant={lote.interrumpido ? 'destructive-outline' : 'outline'}>
          {lote.interrumpido ? <HugeiconsIcon icon={WifiDisconnected01Icon} size={12} aria-hidden /> : null}
          {lote.interrumpido ? 'Se cortó la conexión' : 'Detenida'}
        </Badge>
        <Text as="span" variant="muted" size="xs" className="tabular-nums">
          Iba en {cuentas.leidos} de {cuentas.total}
        </Text>
      </span>
    )
  if (lote.retirado)
    return (
      <span className="flex min-w-0 flex-col items-start gap-1">
        <Badge variant="outline">
          Deshecha
        </Badge>
        <Text as="span" variant="muted" size="xs" className="tabular-nums">
          {lote.etapa ? 'Sacaste' : 'Quitaste'} a {lote.retirado.salieron}
        </Text>
      </span>
    )
  // Terminada: primero lo que pide algo de ti (confirmar un dato), después lo que no se pudo cargar.
  const noLeidos = cuentas.fallidos
    ? `${cuentas.fallidos} ${lote.tipo === 'hoja-de-calculo' ? (cuentas.fallidos === 1 ? 'quedó fuera' : 'quedaron fuera') : cuentas.fallidos === 1 ? 'no se pudo leer' : 'no se pudieron leer'}`
    : null
  if (cuentas.dudosos || cuentas.fallidos)
    return (
      <span className="flex min-w-0 flex-col items-start gap-1">
        <Badge variant={cuentas.dudosos ? 'warning-light' : 'destructive-outline'}>
          {cuentas.dudosos ? 'Falta confirmar' : 'Con errores'}
        </Badge>
        {/* La celda de la tabla no parte el texto por sí sola: aquí sí, para que no se monte sobre la columna de al lado. */}
        <Text as="span" variant="muted" size="xs" className="whitespace-normal tabular-nums">
          {[cuentas.dudosos ? `${cuentas.dudosos} con un dato dudoso` : null, noLeidos].filter(Boolean).join(' · ')}
        </Text>
      </span>
    )
  return (
    <Badge variant="success-light">
      <HugeiconsIcon icon={Tick02Icon} size={12} aria-hidden />
      Cargado
    </Badge>
  )
}

// La fila de un lote mientras carga: el mismo alto (icono y dos líneas), las mismas seis columnas y el botón de la
// derecha.
function FilaLoteCargando() {
  return (
    <TableRow aria-hidden="true" className="hover:bg-transparent">
      <TableCell className="py-3 pl-5!">
        <LineaEsqueleto ancho="w-3/4" />
      </TableCell>
      <TableCell>
        <span className="flex min-w-0 items-center gap-3">
          <Skeleton className="size-8 shrink-0 rounded-lg" />
          <span className="flex min-w-0 flex-1 flex-col">
            <LineaEsqueleto className="h-6" ancho="w-4/5" />
            <LineaEsqueleto ancho="w-3/5" />
          </span>
        </span>
      </TableCell>
      <TableCell>
        <Skeleton className="h-5.5 w-24" />
      </TableCell>
      <TableCell>
        <span className="flex flex-col">
          <LineaEsqueleto className="h-6" ancho="w-8" />
          <LineaEsqueleto ancho="w-2/3" />
        </span>
      </TableCell>
      <TableCell>
        <LineaEsqueleto ancho="w-2/3" />
      </TableCell>
      <TableCell className="pr-5!">
        <Skeleton className="h-8 w-28 rounded-full" />
      </TableCell>
    </TableRow>
  )
}

/* El detalle de un lote ---------------------------------------------------------------------------------------- */

type Filtro = 'todas' | 'entraron' | 'dudosas' | 'repetidas' | 'fallidas' | 'otras'

// «inglés», «portugués» o «inglés y portugués», según las que vinieron (VA-46).
const listaIdiomas = (archivos: ArchivoLote[]) => [...new Set(archivos.map((archivo) => archivo.idioma?.toLowerCase()).filter(Boolean))].join(' y ')

const FILTRO_DE: Record<EstadoArchivo, Filtro> = {
  listo: 'entraron',
  dudoso: 'dudosas',
  repetido: 'repetidas',
  error: 'fallidas',
  descartado: 'otras',
  'sin-leer': 'otras',
  espera: 'otras',
  leyendo: 'otras',
}

type Variante = 'secondary' | 'success-light' | 'warning-light' | 'destructive-outline' | 'outline'

// En la base, `enLaBase` dice si quien entró sigue ahí (se pudo eliminar o unir con otra ficha).
function badgeDe(archivo: ArchivoLote, contexto: { hoja?: boolean; base?: boolean; enLaBase?: boolean } = {}): { texto: string; variante: Variante } {
  switch (archivo.estado) {
    case 'espera':
      return { texto: 'En cola', variante: 'secondary' }
    case 'leyendo':
      return { texto: 'Leyendo…', variante: 'secondary' }
    case 'listo':
      if (archivo.sacado) return { texto: contexto.base ? 'La quitaste' : 'La sacaste', variante: 'outline' }
      return contexto.base && contexto.enLaBase === false ? { texto: 'Ya no está', variante: 'outline' } : { texto: 'Entró', variante: 'success-light' }
    case 'dudoso':
      return { texto: 'Por confirmar', variante: 'warning-light' }
    case 'repetido':
      return archivo.repetido?.donde === 'rechazada'
        ? { texto: 'Se había rechazado', variante: 'outline' }
        : archivo.repetido?.donde === 'lote'
          ? { texto: contexto.hoja ? 'Repetida en el archivo' : 'Repetida en el lote', variante: 'outline' }
          : { texto: 'Ya estaba', variante: 'outline' }
    case 'error':
      return { texto: contexto.hoja ? 'Quedó fuera' : 'No se pudo leer', variante: 'destructive-outline' }
    case 'descartado':
      return { texto: 'Descartada', variante: 'outline' }
    default:
      return { texto: 'En pausa', variante: 'outline' }
  }
}

// En una vacante, el lote es el registro de la carga (29 sep, reunión con Elkin: «como un log de lo que usted cargó…
// sin lo de la IA»; 1 oct, Nicolás: «¿por qué estamos mostrando los candidatos acá?… para eso está la vista de
// kanban»): cuántas venían y qué pasó con ellas en cifras, y solo los archivos que no entraron, con lo que se puede
// hacer con cada uno. Quienes entraron se ven en el tablero de la vacante, filtrado por el lote («Ver a quiénes»), con
// lo que la IA concluyó de cada una en su tarjeta y su ficha. En la base («Mis candidatos») sigue la lista completa.
function DetalleLote({
  lote,
  vacante,
  activas,
  rechazadas,
  onOpenChange,
  onRevisar,
  onDetener,
  onSeguir,
  onTerminarAsi,
  onReemplazar,
  onActualizar,
  onActualizarDatos,
  onSacar,
  onVerEntraron,
  dondeVerEntraron,
  onAbrirFicha,
  onReconsiderar,
  ventanas,
}: {
  lote?: LoteCvs
  vacante?: VacanteUI
  activas: Candidatura[]
  rechazadas: Rechazada[]
  onOpenChange: (abierto: boolean) => void
  onRevisar: (archivoId?: string) => void
  onDetener: () => void
  onSeguir: () => void
  onTerminarAsi: () => void
  onReemplazar: (archivoId: string, archivo: File) => void
  onActualizar: (archivoId: string) => void
  // Quien entró con su ficha de siempre: cambiar sus datos por los de la hoja nueva (VA-47).
  onActualizarDatos?: (archivoId: string) => void
  onSacar: () => void
  onVerEntraron?: () => void
  // Dónde se ve a quienes entraron (el tablero, el pipeline…), para el botón que lleva allá.
  dondeVerEntraron?: string
  onAbrirFicha?: (candidaturaId: string) => void
  onReconsiderar?: (archivo: ArchivoLote) => void
  // Revisar lo dudoso o sacar el lote, pedidos desde aquí: se abren dentro, como drawer anidado (8 oct).
  ventanas?: ReactNode
}) {
  const registro = Boolean(vacante)
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const campo = useRef<HTMLInputElement>(null)
  const [reemplazando, setReemplazando] = useState<string | null>(null)
  // Sin vacante, el lote es de la base: quién entró se mira en la base de hoy (se pudo eliminar o unir con otra ficha).
  const personasBase = usePersonasDeLaBase()
  const idsBase = useMemo(() => new Set(personasBase.map((persona) => persona.id)), [personasBase])
  const sigueEnLaBase = (archivo: ArchivoLote) => Boolean(archivo.personaBaseId && idsBase.has(archivo.personaBaseId))
  // Una hoja de cálculo no se lee: sus filas entran o quedan fuera, y lo que falla se corrige en el archivo.
  const esHoja = lote?.tipo === 'hoja-de-calculo'

  // Al abrir otro lote, se ven todas.
  const [loteAntes, setLoteAntes] = useState(lote?.id)
  if (loteAntes !== lote?.id) {
    setLoteAntes(lote?.id)
    setFiltro('todas')
  }

  const cuentas = lote ? cuentasDe(lote) : undefined
  const de = (uno: Filtro) => lote?.archivos.filter((archivo) => FILTRO_DE[archivo.estado] === uno).length ?? 0
  const filtros: { valor: Filtro; texto: string; cuenta: number }[] = [
    { valor: 'entraron', texto: 'Entraron', cuenta: de('entraron') },
    { valor: 'dudosas', texto: 'Por confirmar', cuenta: de('dudosas') },
    { valor: 'repetidas', texto: 'Ya estaban', cuenta: de('repetidas') },
    { valor: 'fallidas', texto: esHoja ? 'Quedaron fuera' : 'No se pudieron leer', cuenta: de('fallidas') },
    { valor: 'otras', texto: 'Otras', cuenta: de('otras') },
  ]
  // En el registro, solo lo que no entró; en la base, todo, con sus filtros.
  const visibles =
    lote?.archivos.filter((archivo) => (registro ? archivo.estado !== 'listo' : filtro === 'todas' || FILTRO_DE[archivo.estado] === filtro)) ?? []
  // Con un solo tipo de resultado no hay nada que filtrar: los chips no salen.
  const conChips = !registro && (filtros.filter((uno) => uno.cuenta).length > 1 || filtro !== 'todas')
  const donde = vacante && lote?.etapa ? tituloEtapa(lote.etapa) : 'tu base'
  // Las que vinieron en otro idioma y se leyeron (VA-46).
  const enOtroIdioma = lote?.archivos.filter((archivo) => archivo.idioma && archivo.estado !== 'error') ?? []
  // Quien entró con su ficha de siempre y trae una hoja con otro cargo o empresa (VA-47).
  const conNovedad = vacante ? (lote?.archivos.filter((archivo) => archivo.novedad && archivo.estado === 'listo' && !archivo.sacado) ?? []) : []
  // La carga en cifras: es lo primero que se lee en el registro.
  const resumen = cuentas
    ? [
        { termino: esHoja ? 'Filas en el archivo' : 'CVs en la carga', valor: String(cuentas.total) },
        { termino: `Entraron a ${donde}`, valor: String(cuentas.listos) },
        ...(cuentas.dudosos ? [{ termino: 'Falta confirmar un dato', valor: String(cuentas.dudosos) }] : []),
        ...(cuentas.repetidos ? [{ termino: 'Ya estaban', valor: String(cuentas.repetidos) }] : []),
        ...(cuentas.fallidos ? [{ termino: esHoja ? 'Quedaron fuera' : 'No se pudieron leer', valor: String(cuentas.fallidos) }] : []),
        ...(cuentas.descartados ? [{ termino: 'Descartadas', valor: String(cuentas.descartados) }] : []),
        // Se leen igual; cuántas vinieron en inglés o portugués (VA-46). Su ficha dice en cuál.
        ...(enOtroIdioma.length ? [{ termino: `En ${listaIdiomas(enOtroIdioma)}`, valor: String(enOtroIdioma.length) }] : []),
        ...(cuentas.sinLeer && lote?.estado !== 'leyendo' ? [{ termino: 'Sin leer', valor: String(cuentas.sinLeer) }] : []),
      ]
    : []

  // Quien entró y dónde está hoy: sigue donde entró, ya avanzó o se rechazó.
  const hoy = (candidaturaId?: string) => {
    if (!candidaturaId) return null
    const activa = activas.find((c) => c.id === candidaturaId)
    if (activa) return { activa, rechazada: null }
    const rechazada = rechazadas.find((r) => r.candidatura.id === candidaturaId)
    return rechazada ? { activa: null, rechazada } : null
  }
  // En la vacante, quien sigue activo; en la base, quien entró y sigue en ella.
  const siguenDentro =
    lote?.archivos.filter((archivo) =>
      vacante
        ? archivo.candidaturaId && !archivo.sacado && hoy(archivo.candidaturaId)?.activa
        : archivo.estado === 'listo' && !archivo.sacado && sigueEnLaBase(archivo),
    ).length ?? 0

  // Cómo se la reconoció cuando el nombre venía escrito distinto (VA-28).
  const reconocida = (repetido: NonNullable<ArchivoLote['repetido']>) =>
    repetido.por && repetido.comoVenia ? ` (la reconocimos por su ${repetido.por}; en la hoja dice «${repetido.comoVenia}»)` : ''

  function queLePaso(archivo: ArchivoLote) {
    switch (archivo.estado) {
      case 'listo': {
        if (!vacante) {
          if (archivo.sacado) return 'La quitaste de la base al deshacer el lote'
          if (archivo.personaBaseId && !sigueEnLaBase(archivo)) return 'Ya no está en tu base (se eliminó o se unió con otra ficha)'
          return archivo.confirmado ? 'La confirmaste y entró a tu base' : 'Entró a tu base'
        }
        if (archivo.sacado) return 'Entró y la sacaste al deshacer el lote'
        const ahora = hoy(archivo.candidaturaId)
        const cumple = archivo.criterios?.length ? ` · cumple ${cumplidosDe(archivo.criterios)} de ${archivo.criterios.length}` : ''
        if (ahora?.rechazada) return `Entró a ${donde}; después la rechazaste`
        if (ahora?.activa && ahora.activa.etapa !== lote?.etapa) return `Entró a ${donde}; hoy está en ${tituloEtapa(ahora.activa.etapa)}`
        if (archivo.confirmado) return `La confirmaste y entró a ${donde}${cumple}`
        return archivo.personaId ? `Ya estaba en tu base: entró a ${donde} con su ficha de siempre${cumple}` : `Entró a ${donde}${cumple}`
      }
      case 'dudoso':
        return archivo.duda?.motivo ?? 'Necesita que confirmes un dato'
      case 'repetido': {
        const repetido = archivo.repetido
        if (repetido?.donde === 'vacante')
          return `Ya está en ${repetido.etapa ? tituloEtapa(repetido.etapa) : 'esta vacante'}${reconocida(repetido)}: no se duplicó${repetido.actualizada ? ' y se actualizó su CV' : ''}`
        if (repetido?.donde === 'rechazada')
          return hoy(repetido.candidaturaId)?.activa
            ? `Se había rechazado; la volviste a considerar y está en ${tituloEtapa(hoy(repetido.candidaturaId)?.activa?.etapa ?? '')}`
            : `La rechazaste en ${repetido.etapa ? tituloEtapa(repetido.etapa) : 'esta vacante'}${repetido.motivo ? ` («${repetido.motivo}»)` : ''}${reconocida(repetido)}`
        if (repetido?.otroLote) return `Viene también en otro lote que se leía al mismo tiempo (${repetido.otroLote}): entra una vez`
        if (repetido?.donde === 'lote')
          return esHoja
            ? `Venía dos veces en el archivo (también en ${repetido.archivo}): entró la primera`
            : `Venía dos veces en el lote (también como ${repetido.archivo}): entró una`
        if (repetido?.actualizada) return 'Ya estaba en tu base: se actualizaron sus datos'
        return esHoja ? 'Ya estaba en tu base: se dejó como estaba' : 'Ya estaba en tu base: no se duplicó'
      }
      case 'error':
        if (esHoja) return `Quedó fuera: ${(archivo.fallo ?? 'le falta un dato').toLowerCase()}`
        return archivo.fallo ?? 'No se pudo leer'
      case 'descartado':
        return 'La descartaste: no entró a ningún lado'
      case 'sin-leer':
        return 'No se leyó: el lote se detuvo antes'
      case 'leyendo':
        return 'La IA la está leyendo y comparando con los requisitos'
      default:
        return 'Esperando su turno'
    }
  }

  const origen = lote ? origenDeLote(lote.origen) : undefined
  // El nombre de la persona cuando se conoce; en una hoja de cálculo, también en las filas que quedaron fuera.
  const conNombre = (archivo: ArchivoLote) =>
    Boolean(archivo.datos) && (archivo.estado !== 'error' || (esHoja && archivo.datos?.nombre !== archivo.nombre))

  return (
    <DrawerShell
      open={Boolean(lote)}
      onOpenChange={onOpenChange}
      size="lg"
      kicker={esHoja ? 'Importación de una hoja de cálculo' : 'Lote de CVs'}
      title={lote?.nombre ?? ''}
      description={
        lote
          ? [
              // Sin el código interno del lote (L-4822): a quien lo mira no le dice nada.
              `${origen?.texto}${lote.referidoPor ? ` (${lote.referidoPor})` : ''}`,
              `${lote.quien === QUIEN_MUEVE ? 'Tú' : lote.quien}, ${lote.fecha.toLowerCase()}`,
              vacante && lote.etapa ? `entran a ${tituloEtapa(lote.etapa)}` : null,
            ]
              .filter(Boolean)
              .join(' · ')
          : undefined
      }
      icon={esHoja ? Xls01Icon : FileImportIcon}
      headerExtra={
        lote && (lote.estado !== 'terminado' || conChips) ? (
          <div className="flex flex-col gap-3 border-b px-5 py-3">
            {lote.estado !== 'terminado' ? <EstadoLote lote={lote} /> : null}
            {/* Chips de filtro, como en el resto de la exploración: sin ninguno puesto se ven todas; el puesto lleva su «x». */}
            {conChips ? (
            <div role="group" aria-label="Qué archivos ver" className="flex flex-wrap items-center gap-2">
              {filtros
                .filter((uno) => uno.cuenta)
                .map((uno) => (
                  <FiltroChip
                    key={uno.valor}
                    size="sm"
                    activo={filtro === uno.valor}
                    onCambiar={(activo) => setFiltro(activo ? uno.valor : 'todas')}
                    texto={uno.texto}
                    cuenta={uno.cuenta}
                    ayuda={`Ver solo: ${uno.texto.toLowerCase()}`}
                  />
                ))}
            </div>
            ) : null}
          </div>
        ) : null
      }
      footer={
        lote ? (
          <>
            {lote.estado === 'terminado' && !lote.retirado && siguenDentro ? (
              <Button variant="ghost" className="mr-auto" onClick={onSacar}>
                <HugeiconsIcon icon={UserRemove01Icon} size={16} />
                {vacante ? 'Sacar a quienes entraron' : 'Quitar de la base a quienes entraron'}
              </Button>
            ) : null}
            {lote.estado === 'leyendo' ? (
              <Button variant="outline" onClick={onDetener}>
                <HugeiconsIcon icon={PauseIcon} size={16} />
                Detener
              </Button>
            ) : null}
            {lote.estado === 'detenido' ? (
              <>
                <Button variant="outline" onClick={onTerminarAsi}>
                  Terminar con lo leído
                </Button>
                <Button onClick={onSeguir}>
                  <HugeiconsIcon icon={PlayIcon} size={16} />
                  Seguir leyendo
                </Button>
              </>
            ) : null}
            {lote.estado === 'terminado' && cuentas?.sinLeer ? (
              <Button variant="outline" onClick={onSeguir}>
                <HugeiconsIcon icon={PlayIcon} size={16} />
                Leer {cuentas.sinLeer === 1 ? 'la que quedó en pausa' : `las ${cuentas.sinLeer} en pausa`}
              </Button>
            ) : null}
            {/* Lleva a la vista de la pantalla filtrada por este lote (el tablero, el pipeline, la cola, la base): el texto
                dice adónde. En el registro va siempre que haya gente, aunque falte confirmar a alguien: es donde se la ve. */}
            {lote.estado === 'terminado' && siguenDentro && onVerEntraron && (registro || !cuentas?.dudosos) ? (
              <Button variant={cuentas?.dudosos ? 'outline' : 'default'} onClick={onVerEntraron}>
                {`${siguenDentro === 1 ? 'Verla' : `Ver a las ${siguenDentro}`} en ${dondeVerEntraron ?? (vacante ? 'la vacante' : 'tu base')}`}
              </Button>
            ) : null}
            {lote.estado === 'terminado' && cuentas?.dudosos ? (
              <Button onClick={() => onRevisar()}>
                Revisar {cuentas.dudosos} {cuentas.dudosos === 1 ? 'dudosa' : 'dudosas'}
              </Button>
            ) : null}
          </>
        ) : null
      }
    >
      <Input
        ref={campo}
        type="file"
        accept={ACEPTA}
        className="hidden"
        onChange={(evento) => {
          const archivo = evento.target.files?.[0]
          evento.target.value = ''
          if (archivo && reemplazando) onReemplazar(reemplazando, archivo)
          setReemplazando(null)
        }}
      />
      <div className="mb-4 flex flex-col gap-3 empty:hidden">
        {lote?.interrumpido && lote.estado === 'detenido' ? (
          <Alert variant="destructive">
            <HugeiconsIcon icon={WifiDisconnected01Icon} size={16} />
            <AlertTitle>Se cortó la conexión</AlertTitle>
            <AlertDescription>
              Lo leído está a salvo ({cuentas?.leidos} de {cuentas?.total}). «Seguir leyendo» continúa desde la siguiente.
            </AlertDescription>
          </Alert>
        ) : null}

        {/* La carga en cifras, en el registro de la vacante. Sin lo que la IA concluyó de cada persona: eso está en su
            tarjeta del tablero y en su ficha. */}
        {registro && lote?.estado === 'terminado' ? <ListaDatos filas={resumen} /> : null}

        {lote?.retirado && !vacante ? (
          <Alert>
            <HugeiconsIcon icon={UserRemove01Icon} size={16} />
            <AlertTitle>Quitaste de tu base a {textoPersonas(lote.retirado.salieron)} de este lote</AlertTitle>
            <AlertDescription>
              Salieron de Mis candidatos con su ficha y su CV.
              {lote.retirado.quedaron ? ` ${textoPersonas(lote.retirado.quedaron)} se ${lote.retirado.quedaron === 1 ? 'quedó' : 'quedaron'} porque ya ${lote.retirado.quedaron === 1 ? 'está' : 'están'} en un proceso.` : ''}
            </AlertDescription>
          </Alert>
        ) : lote?.retirado ? (
          <Alert>
            <HugeiconsIcon icon={UserRemove01Icon} size={16} />
            <AlertTitle>
              Sacaste de la vacante a {textoPersonas(lote.retirado.salieron)} de este lote
            </AlertTitle>
            <AlertDescription>
              No recibieron correo ni quedan como rechazadas.
              {lote.retirado.quedaron ? ` ${textoPersonas(lote.retirado.quedaron)} se ${lote.retirado.quedaron === 1 ? 'quedó' : 'quedaron'} porque ya ${lote.retirado.quedaron === 1 ? 'la habías' : 'las habías'} movido o rechazado.` : ''}
            </AlertDescription>
          </Alert>
        ) : null}

        {cuentas?.fallidos && lote?.estado === 'terminado' && esHoja ? (
          <Alert variant="warning">
            <HugeiconsIcon icon={Alert02Icon} size={16} />
            <AlertTitle>{cuentas.fallidos === 1 ? '1 fila quedó fuera' : `${cuentas.fallidos} filas quedaron fuera`}</AlertTitle>
            <AlertDescription>
              Les falta el nombre, el contacto o el correo está mal escrito. Corrígelas en el archivo y vuelve a importarlo.
            </AlertDescription>
          </Alert>
        ) : cuentas?.fallidos && lote?.estado === 'terminado' && !registro ? (
          // En el registro no: la fila de cada una ya dice por qué y trae «Subir otra versión».
          <Alert variant="warning">
            <HugeiconsIcon icon={Alert02Icon} size={16} />
            <AlertTitle>
              {cuentas.fallidos === 1 ? '1 CV no se pudo leer' : `${cuentas.fallidos} CVs no se pudieron leer`}
            </AlertTitle>
            <AlertDescription>
              Casi siempre es porque la hoja está escaneada como imagen o tiene contraseña. Pídele a la persona un PDF con texto y súbelo en su lugar.
            </AlertDescription>
          </Alert>
        ) : null}
      </div>

      {/* Entraron con su ficha de siempre, pero la hoja nueva dice otro cargo o empresa: se ofrece actualizarla (VA-47). */}
      {conNovedad.length && lote?.estado === 'terminado' ? (
        <div className="mb-5 flex flex-col">
          <Heading as="h3" level={6} className="mb-1">
            Entraron con datos de antes
          </Heading>
          <Text as="p" variant="muted" size="sm" className="mb-3">
            Ya estaban en tu base y entraron con su ficha de siempre. Su CV nuevo dice otra cosa.
          </Text>
          <AttachmentGroup className="flex-col! items-stretch! gap-1.5 overflow-visible!">
            {conNovedad.map((archivo) => {
              const novedad = archivo.novedad!
              const activa = hoy(archivo.candidaturaId)?.activa
              return (
                <Attachment key={archivo.id} size="sm" state="done" className="w-full! min-w-0!">
                  <AttachmentMedia>
                    <HugeiconsIcon icon={File01Icon} size={16} />
                  </AttachmentMedia>
                  <AttachmentContent>
                    <AttachmentTitle>{archivo.datos?.nombre}</AttachmentTitle>
                    <AttachmentDescription className="whitespace-normal">
                      {novedad.aplicada
                        ? `Actualizaste sus datos con la hoja nueva: ${novedad.cargo} en ${novedad.empresa}`
                        : `Su ficha dice ${archivo.datos?.cargo} en ${archivo.datos?.empresa}; la hoja nueva, ${novedad.cargo} en ${novedad.empresa}`}
                    </AttachmentDescription>
                  </AttachmentContent>
                  <AttachmentActions className="gap-2">
                    {!novedad.aplicada && activa && onActualizarDatos ? (
                      <Button variant="outline" size="xs" onClick={() => onActualizarDatos(archivo.id)}>
                        Actualizar sus datos
                      </Button>
                    ) : null}
                    {activa && onAbrirFicha ? (
                      <Button variant="ghost" size="xs" onClick={() => onAbrirFicha(activa.id)}>
                        Ver ficha
                      </Button>
                    ) : null}
                  </AttachmentActions>
                </Attachment>
              )
            })}
          </AttachmentGroup>
        </div>
      ) : null}
      {registro && lote?.estado === 'terminado' && visibles.length ? (
        <Heading as="h3" level={6} className="mb-3">
          Lo que no entró
        </Heading>
      ) : null}
      <AttachmentGroup className="flex-col! items-stretch! gap-1.5 overflow-visible!">
        {visibles.map((archivo) => {
          const badge = badgeDe(archivo, { hoja: esHoja, base: !vacante, enLaBase: sigueEnLaBase(archivo) })
          const ahora = hoy(archivo.candidaturaId ?? archivo.repetido?.candidaturaId)
          const ficha = ahora?.activa ?? ahora?.rechazada?.candidatura
          return (
            <Attachment
              key={archivo.id}
              size="sm"
              state={archivo.estado === 'error' ? 'error' : archivo.estado === 'leyendo' ? 'processing' : 'done'}
              className="w-full! min-w-0!"
            >
              <AttachmentMedia>
                {archivo.estado === 'leyendo' ? <Spinner /> : <HugeiconsIcon icon={archivo.estado === 'error' ? FileRemoveIcon : File01Icon} size={16} />}
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>{conNombre(archivo) ? archivo.datos?.nombre : archivo.nombre}</AttachmentTitle>
                <AttachmentDescription className="whitespace-normal">
                  {conNombre(archivo) ? `${archivo.nombre} · ` : ''}
                  {queLePaso(archivo)}
                  {archivo.idioma ? ` · En ${archivo.idioma.toLowerCase()}` : ''}
                </AttachmentDescription>
              </AttachmentContent>
              <AttachmentActions className="gap-2">
                <Badge variant={badge.variante}>
                  {badge.texto}
                </Badge>
                {archivo.estado === 'dudoso' && lote?.estado === 'terminado' ? (
                  <Button variant="outline" size="xs" onClick={() => onRevisar(archivo.id)}>
                    Revisar
                  </Button>
                ) : null}
                {archivo.estado === 'error' && !esHoja ? (
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => {
                      setReemplazando(archivo.id)
                      campo.current?.click()
                    }}
                  >
                    Subir otra versión
                  </Button>
                ) : null}
                {archivo.repetido?.donde === 'vacante' && ahora?.activa && !archivo.repetido.actualizada ? (
                  <Button variant="outline" size="xs" onClick={() => onActualizar(archivo.id)}>
                    Actualizar su CV
                  </Button>
                ) : null}
                {archivo.repetido?.donde === 'rechazada' && ahora?.rechazada && onReconsiderar ? (
                  <Button variant="outline" size="xs" onClick={() => onReconsiderar(archivo)}>
                    Volver a considerar
                  </Button>
                ) : null}
                {/* En el registro de la vacante no se abren fichas: a la gente se la ve en el tablero. */}
                {!registro && ficha && onAbrirFicha && !archivo.sacado && (archivo.estado === 'listo' || archivo.repetido?.donde === 'vacante') ? (
                  <Button variant="ghost" size="xs" onClick={() => onAbrirFicha(ficha.id)}>
                    Ver ficha
                  </Button>
                ) : null}
                {/* En la base, la ficha de quien entró o de quien se le actualizaron los datos, si sigue en ella. */}
                {!vacante && onAbrirFicha && archivo.personaBaseId && !archivo.sacado && sigueEnLaBase(archivo) ? (
                  <Button variant="ghost" size="xs" onClick={() => archivo.personaBaseId && onAbrirFicha(archivo.personaBaseId)}>
                    Ver ficha
                  </Button>
                ) : null}
              </AttachmentActions>
            </Attachment>
          )
        })}
      </AttachmentGroup>
      {ventanas}
    </DrawerShell>
  )
}

/* Sacar a quienes entraron --------------------------------------------------------------------------------------- */

// Un lote equivocado (otra vacante, archivos que no eran) se deshace: sale quien sigue donde entró. Quien ya se movió o
// se rechazó (o, en la base, quien ya está en un proceso) se queda, y se dice antes de confirmar.
type Saliente = { id: string; ini: string; nombre: string; meta: string }

function SacarLote({
  titulo,
  sub,
  salen,
  quedan,
  verbo = 'Sacar',
  onOpenChange,
  onConfirmar,
}: {
  titulo: string
  sub: string
  // «Sacar» de una vacante; «Quitar» de la base.
  verbo?: string
  salen: Saliente[]
  quedan: { nombre: string; por: string }[]
  onOpenChange: (abierto: boolean) => void
  onConfirmar: () => void
}) {
  return (
    <VentanaDeAccion
      open
      onOpenChange={onOpenChange}
      title={titulo}
      sub={sub}
      items={salen.slice(0, 6).map((uno) => ({ ini: uno.ini, title: uno.nombre, meta: uno.meta }))}
      note="Se puede deshacer desde el aviso."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" disabled={!salen.length} onClick={onConfirmar}>
            {salen.length === 1 ? `${verbo} a 1 persona` : `${verbo} a ${salen.length} personas`}
          </Button>
        </>
      }
    >
      {salen.length > 6 ? (
        <Text as="p" variant="muted" size="sm">
          Y {textoPersonas(salen.length - 6)} más.
        </Text>
      ) : null}
      {quedan.length ? (
        <Alert>
          <HugeiconsIcon icon={Alert02Icon} size={16} />
          <AlertTitle>
            {quedan.length === 1 ? 'Se queda 1 persona' : `Se quedan ${quedan.length} personas`} que ya tocaste
          </AlertTitle>
          <AlertDescription>{quedan.map((uno) => `${uno.nombre} (${uno.por})`).join(' · ')}.</AlertDescription>
        </Alert>
      ) : null}
    </VentanaDeAccion>
  )
}

/* Revisar lo dudoso -------------------------------------------------------------------------------------------- */

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function RevisarDudosas({
  lote,
  vacante,
  activas,
  archivoInicial,
  onConfirmar,
  onDescartar,
  onMisma,
  onCerrar,
}: {
  lote: LoteCvs
  vacante?: VacanteUI
  activas: Candidatura[]
  archivoInicial?: string
  onConfirmar: (archivoId: string, datos: DatosLeidos) => void
  onDescartar: (archivoId: string) => void
  onMisma: (archivoId: string, candidatura: Candidatura) => void
  onCerrar: (resultado: { confirmados: string[]; descartados: number; mismas: number }) => void
}) {
  // La lista se fija al abrir: al confirmar, el archivo deja de ser dudoso, pero la cuenta «2 de 3» se mantiene.
  const [lista] = useState(() => {
    const dudosas = lote.archivos.filter((archivo) => archivo.estado === 'dudoso')
    const inicio = archivoInicial ? dudosas.findIndex((archivo) => archivo.id === archivoInicial) : 0
    return inicio > 0 ? [...dudosas.slice(inicio), ...dudosas.slice(0, inicio)] : dudosas
  })
  const [indice, setIndice] = useState(0)
  const [resultado, setResultado] = useState({ confirmados: [] as string[], descartados: 0, mismas: 0 })
  const actual = lista[indice]
  const [datos, setDatos] = useState<DatosLeidos | undefined>(actual?.datos)

  const avanzar = (siguiente: typeof resultado) => {
    setResultado(siguiente)
    if (indice + 1 < lista.length) {
      setIndice(indice + 1)
      setDatos(lista[indice + 1].datos)
    } else onCerrar(siguiente)
  }

  if (!actual || !datos) return null
  const correoMal = !CORREO_VALIDO.test(datos.correo)
  const nombreMal = datos.nombre.trim().split(/\s+/).length < 2
  // Vacío no es un error todavía: se pide con una ayuda. Solo lo que se escribió mal va en rojo.
  const correoInvalido = correoMal && Boolean(datos.correo)
  // Sin correo pero con celular entra igual: los pasos le llegan por WhatsApp o SMS (VA-30, el operario que deja solo su celular).
  const celularBueno = (datos.celular ?? '').replace(/\D/g, '').length >= 10
  const soloCelular = !datos.correo.trim() && celularBueno
  const esDocumento = actual.duda?.campo === 'documento'
  // Se llama igual que alguien que ya está, con otro correo y celular (VA-28): ¿la misma persona u otra?
  const parecida = actual.duda?.campo === 'persona' ? activas.find((c) => c.id === actual.duda?.candidaturaId) : undefined
  const cambiar = (campo: keyof DatosLeidos, valor: string) => setDatos({ ...datos, [campo]: valor })
  const destino = vacante && lote.etapa ? tituloEtapa(lote.etapa) : 'tu base'
  // El correo que se escribió es de alguien que ya está en la vacante: es la misma persona, no se duplica.
  const yaEsta = !correoMal ? activas.find((c) => c.candidato.correo.toLowerCase() === datos.correo.trim().toLowerCase()) : undefined
  // Si no está activa aquí, el mismo correo puede ser de alguien rechazado en esta vacante o de alguien de la base (VA-19).
  const correoBuscado = datos.correo.trim().toLowerCase()
  const rechazadaAqui =
    !correoMal && !yaEsta && activas[0]
      ? RECHAZADAS.find((r) => r.candidatura.vacante.id === activas[0].vacante.id && r.candidatura.candidato.correo.toLowerCase() === correoBuscado)
      : undefined
  const enLaBase = !correoMal && !yaEsta && !rechazadaAqui && correoBuscado ? baseDeCandidatos.deCorreo(correoBuscado) : undefined

  return (
    <VentanaDeAccion
      open
      onOpenChange={(abierto) => !abierto && onCerrar(resultado)}
      size="wide"
      // Abierta desde el detalle del lote, el CV y sus datos lado a lado no caben en el ancho del panel.
      anchoEnPanel
      title={`Revisar ${textoHojas(lista.length)}`}
      sub={`De «${lote.nombre}». Lo que la IA leyó con seguridad ya entró; esto es lo único que necesita tu ojo.`}
      note={`${indice + 1} de ${lista.length}`}
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => {
              onDescartar(actual.id)
              avanzar({ ...resultado, descartados: resultado.descartados + 1 })
            }}
          >
            Descartar
          </Button>
          {parecida && !yaEsta ? (
            <Button
              variant="outline"
              onClick={() => {
                onMisma(actual.id, parecida)
                avanzar({ ...resultado, mismas: resultado.mismas + 1 })
              }}
            >
              Es la misma: no duplicar
            </Button>
          ) : null}
          {yaEsta ? (
            <Button
              onClick={() => {
                onMisma(actual.id, yaEsta)
                avanzar({ ...resultado, mismas: resultado.mismas + 1 })
              }}
            >
              Es {yaEsta.candidato.nombre}: no duplicar
            </Button>
          ) : (
            <Button
              disabled={!esDocumento && (correoInvalido || (correoMal && !celularBueno) || nombreMal)}
              onClick={() => {
                onConfirmar(actual.id, datos)
                avanzar({ ...resultado, confirmados: [...resultado.confirmados, actual.id] })
              }}
            >
              {esDocumento ? 'Sí es un CV' : parecida ? 'Es otra persona' : 'Confirmar'}
              {indice + 1 < lista.length ? ' y seguir' : ` y ${vacante ? `pasar a ${destino}` : 'terminar'}`}
            </Button>
          )}
        </>
      }
    >
      <div className="grid min-h-0 gap-5 md:grid-cols-2">
        <div className="flex min-h-0 flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <Text as="div" size="sm" weight="medium" className="truncate">
              {actual.nombre}
            </Text>
            {actual.archivo ? (
              <Button
                variant="link"
                size="sm"
                className="h-auto! shrink-0 p-0!"
                onClick={() => window.open(URL.createObjectURL(actual.archivo!), '_blank', 'noopener')}
              >
                <HugeiconsIcon icon={LinkSquare02Icon} size={14} />
                Abrir el PDF
              </Button>
            ) : null}
          </div>
          <Frame variant="ghost" spacing="sm" className="min-h-0 p-0">
            <FramePanel className="max-h-[22rem] overflow-auto">
              <Text as="p" size="xs" className="leading-relaxed whitespace-pre-wrap">
                {textoDeLaHoja({ ...actual, datos: actual.datos })}
              </Text>
            </FramePanel>
          </Frame>
          {actual.deZip ? (
            <Text as="p" variant="muted" size="xs">
              Venía dentro de {actual.deZip}.
            </Text>
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          <Alert variant="warning">
            <AlertTitle className="flex items-center gap-1.5">
              <IconoIA />
              La IA no está segura
            </AlertTitle>
            <AlertDescription>{actual.duda?.motivo}</AlertDescription>
          </Alert>

          {parecida ? (
            <Frame variant="ghost" spacing="sm">
              <FramePanel className="flex flex-col gap-3">
                <div className="flex flex-col gap-0.5">
                  <Text as="p" size="xs" variant="muted">
                    La que ya está, en {tituloEtapa(parecida.etapa)}
                  </Text>
                  <Text as="p" size="sm" weight="medium">
                    {parecida.candidato.nombre}
                  </Text>
                  <Text as="p" size="sm" variant="muted">
                    {[parecida.candidato.correo, parecida.candidato.celular, parecida.candidato.ciudad].filter(Boolean).join(' · ')}
                  </Text>
                  <Text as="p" size="sm" variant="muted">
                    {parecida.candidato.cargo} en {parecida.candidato.empresa}
                  </Text>
                </div>
                <Separator />
                <div className="flex flex-col gap-0.5">
                  <Text as="p" size="xs" variant="muted">
                    Este CV
                  </Text>
                  <Text as="p" size="sm" weight="medium">
                    {actual.datos?.nombre}
                  </Text>
                  <Text as="p" size="sm" variant="muted">
                    {[actual.datos?.correo, actual.datos?.celular, actual.datos?.ciudad].filter(Boolean).join(' · ')}
                  </Text>
                  <Text as="p" size="sm" variant="muted">
                    {actual.datos?.cargo} en {actual.datos?.empresa}
                  </Text>
                </div>
              </FramePanel>
            </Frame>
          ) : null}

          {esDocumento ? (
            <Text as="p" size="sm" className="text-pretty">
              Si es solo una carta, descártala: la persona seguramente mandó su CV en otro archivo del lote. Si sí es un CV,
              confírmala y entra a {destino} como {datos.nombre}.
            </Text>
          ) : (
            <>
              <Field data-invalid={nombreMal || undefined}>
                <FieldLabel>
                  Nombre
                  <Badge variant={actual.duda?.campo === 'nombre' || parecida ? 'warning-light' : 'success-light'}>
                    {actual.duda?.campo === 'nombre' ? 'Dudoso' : parecida ? 'Igual a otra' : 'Seguro'}
                  </Badge>
                </FieldLabel>
                <Input value={datos.nombre} onChange={(evento) => cambiar('nombre', evento.target.value)} aria-invalid={nombreMal || undefined} />
                {nombreMal ? <FieldError>Escribe nombre y apellido.</FieldError> : null}
              </Field>
              <Field data-invalid={correoInvalido || undefined}>
                <FieldLabel>
                  Correo
                  <Badge variant={actual.duda?.campo === 'correo' ? 'warning-light' : 'success-light'}>
                    {actual.duda?.campo === 'correo' ? 'Dudoso' : 'Seguro'}
                  </Badge>
                </FieldLabel>
                <Input
                  value={datos.correo}
                  onChange={(evento) => cambiar('correo', evento.target.value)}
                  placeholder="No viene en el CV"
                  aria-invalid={correoInvalido || undefined}
                />
                {correoInvalido ? <FieldError>Ese correo no parece válido.</FieldError> : null}
                {!datos.correo ? (
                  <FieldDescription>
                    {celularBueno ? 'Si no lo tiene, entra con su celular.' : 'Escríbelo, o su celular, para poder confirmarla: es por donde le llegan los avisos del proceso.'}
                  </FieldDescription>
                ) : null}
                {actual.duda?.alternativa && datos.correo !== actual.duda.alternativa ? (
                  <Button variant="outline" size="sm" className="w-fit" onClick={() => cambiar('correo', actual.duda!.alternativa!)}>
                    Usar {actual.duda.alternativa}
                  </Button>
                ) : null}
              </Field>
              {yaEsta ? (
                <Alert variant="info">
                  <HugeiconsIcon icon={Copy01Icon} size={16} />
                  <AlertTitle>Ese correo es de {yaEsta.candidato.nombre}</AlertTitle>
                  <AlertDescription>
                    Ya está en esta vacante, en {tituloEtapa(yaEsta.etapa)}. Si es la misma persona no se duplica; si no, corrige el correo.
                  </AlertDescription>
                </Alert>
              ) : rechazadaAqui ? (
                <Alert variant="info">
                  <HugeiconsIcon icon={Copy01Icon} size={16} />
                  <AlertTitle>Ese correo es de {rechazadaAqui.candidatura.candidato.nombre}, rechazada aquí</AlertTitle>
                  <AlertDescription>
                    Se quedó en {tituloEtapa(rechazadaAqui.candidatura.etapa)} por «{rechazadaAqui.motivo}». Si es la misma persona, vuélvela a
                    considerar desde su ficha en lugar de sumarla otra vez.
                  </AlertDescription>
                </Alert>
              ) : enLaBase ? (
                <Alert variant="info">
                  <HugeiconsIcon icon={Copy01Icon} size={16} />
                  <AlertTitle>Ese correo es de {enLaBase.nombre}, que ya está en tu base</AlertTitle>
                  <AlertDescription>Al confirmar entra con su ficha de siempre: no se crea otra persona.</AlertDescription>
                </Alert>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Celular</FieldLabel>
                  <Input value={datos.celular} onChange={(evento) => cambiar('celular', evento.target.value)} />
                  {soloCelular ? <FieldDescription>Sin correo: los pasos del proceso le llegan por WhatsApp o SMS a este número.</FieldDescription> : null}
                </Field>
                <Field>
                  <FieldLabel>Ciudad</FieldLabel>
                  <Input value={datos.ciudad} onChange={(evento) => cambiar('ciudad', evento.target.value)} />
                </Field>
              </div>
              <Field>
                <FieldLabel>Cargo actual</FieldLabel>
                <Input value={`${datos.cargo} · ${datos.empresa}`} readOnly />
                <FieldDescription>Lo demás del CV (experiencia, estudios) queda en su ficha.</FieldDescription>
              </Field>
            </>
          )}
        </div>
      </div>
    </VentanaDeAccion>
  )
}

/* Para quien solo necesita la ventana ------------------------------------------------------------------------- */

// «Mis candidatos» y la propuesta del tablero la abren con un botón propio y no tienen pestaña de lotes: aquí la
// ventana se abre desde fuera y el resto del recorrido (leer, avisar, revisar lo dudoso) es el mismo.
export function ImportarCvs({
  abierto,
  onOpenChange,
  vacante,
  onListo,
  onListoEnLaBase,
}: {
  abierto: boolean
  onOpenChange: (abierto: boolean) => void
  vacante?: VacanteUI
  onListo?: (nuevas: Candidatura[]) => void
  onListoEnLaBase?: (nuevas: Persona[]) => void
}) {
  const importaciones = useImportaciones({ vacante, onEntraronEnLaBase: onListoEnLaBase, alCerrar: () => onOpenChange(false) })
  // Sin `useProceso` alrededor: quien entra a la vacante se entrega a quien abrió la ventana.
  const onListoRef = useRef(onListo)
  useEffect(() => {
    onListoRef.current = onListo
  })
  useEffect(
    () =>
      registroDeImportadas.escuchar((evento) => {
        if (evento.tipo !== 'entraron' || !vacante) return
        const suyas = evento.candidaturas.filter((c) => c.vacante.id === vacante.id)
        if (suyas.length) onListoRef.current?.(suyas)
      }),
    [vacante],
  )
  const [abiertoAntes, setAbiertoAntes] = useState(false)
  if (abierto !== abiertoAntes) {
    setAbiertoAntes(abierto)
    if (abierto) importaciones.abrir()
  }
  return importaciones.dialogos
}
