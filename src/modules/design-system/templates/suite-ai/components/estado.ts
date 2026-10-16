import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from '@ubits/flux-ui'

import {
  ACTIVIDAD_INICIAL,
  ATAJOS_CHAT,
  AUDIENCIAS_CONTENIDO,
  AUDIENCIAS_PLAN,
  BORRADOR_AVISO,
  CANDIDATOS,
  COMPETENCIAS,
  CONTENIDO,
  CONVERSACIONES,
  ESPACIOS,
  EXTRAS,
  FECHAS_PLAN,
  LECCIONES,
  NOMBRES,
  NOTIFICACIONES,
  ORGANIZACIONES,
  PASOS_INICIALES,
  PLAN_INICIAL,
  PREGUNTA_VOZ,
  PROPUESTAS,
  SIN_CORREO,
  VACANTES_SELECCION,
  respuestaDe,
  ruta,
  type FilaPlan,
  type Leccion,
  type Mensaje,
  type Notificacion,
  type VacanteSeleccion,
} from './data'

// Estado compartido del template «Suite AI»: lo usan las pantallas (rutas hijas), el menú lateral,
// el encabezado y los paneles acoplados. Vive en el layout para que los flujos (publicar el aviso,
// asignar el plan, aplicar una propuesta) se mantengan al moverse entre pantallas, como en el
// prototipo de Nicolás.

// «marca» reemplaza las iniciales del avatar (p. ej. el número de una lección).
export type Persona = { nombre: string; detalle: string; marca?: string }

// Un solo modal para confirmaciones y listas, igual que en el concepto.
export type Modal = {
  titulo: string
  descripcion: string
  nota?: string
  personas?: Persona[]
  texto?: string
  cancelar: string
  confirmar?: string
  alConfirmar?: () => void
}

export type Promo = 'novedades' | 'cambio' | null
export type PanelEncabezado = 'procesos' | 'notificaciones' | null
export type EstadoPlan = 'borrador' | 'asignando' | 'asignado'
export type PanelEditor = 'abierto' | 'minimizado' | 'cerrado'
export type Extra = keyof typeof EXTRAS

const personas = (nombres: string[], detalle: (indice: number) => string): Persona[] =>
  nombres.map((nombre, indice) => ({ nombre, detalle: detalle(indice) }))

let secuencia = 0
const nuevoId = () => `m${++secuencia}`

export function useEstadoSuite() {
  const navigate = useNavigate()
  const esperas = useRef<number[]>([])
  const despues = (fn: () => void, ms: number) => {
    esperas.current.push(window.setTimeout(fn, ms))
  }
  useEffect(() => {
    const pendientes = esperas.current
    return () => pendientes.forEach((id) => window.clearTimeout(id))
  }, [])

  /* ---------------------------------------------------------- marco */

  const [organizacion, setOrganizacion] = useState(ORGANIZACIONES[0])
  const [espacio, setEspacio] = useState(ESPACIOS[0])
  const [modal, setModal] = useState<Modal | null>(null)
  const [promo, setPromo] = useState<Promo>(null)
  const [panel, setPanel] = useState<PanelEncabezado>(null)
  const [buscador, setBuscador] = useState({ abierto: false, consulta: '', vez: 0 })
  const [invitacion, setInvitacion] = useState(true)
  const [franjaNuevo, setFranjaNuevo] = useState(true)
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>(NOTIFICACIONES)

  // La importación de usuarios avanza sola mientras el prototipo está abierto.
  const [avance, setAvance] = useState(78)
  useEffect(() => {
    const reloj = window.setInterval(() => setAvance((a) => (a < 99 ? a + 1 : a)), 5000)
    return () => window.clearInterval(reloj)
  }, [])

  const elegirOrganizacion = (nombre: string) => {
    setOrganizacion(nombre)
    toast.add({ title: `Ahora trabajas sobre ${nombre}` })
  }
  const elegirEspacio = (nombre: string) => {
    setEspacio(nombre)
    toast.add({ title: nombre === 'Colaborador' ? 'Espacio de colaborador · permisos reducidos' : 'Espacio de administración' })
  }

  // Estable: el atajo ⌘K del layout lo escucha una sola vez.
  const abrirBuscador = useCallback((consulta = '') => setBuscador((b) => ({ abierto: true, consulta, vez: b.vez + 1 })), [])
  const cerrarBuscador = () => setBuscador((b) => ({ ...b, abierto: false }))

  const marcarLeidas = () => {
    setNotificaciones((lista) => lista.map((n) => ({ ...n, nueva: false })))
    toast.add({ title: 'Notificaciones marcadas como leídas' })
  }
  const abrirNotificacion = (notificacion: Notificacion) => {
    setNotificaciones((lista) => lista.map((n) => (n.id === notificacion.id ? { ...n, nueva: false } : n)))
    if (notificacion.destino === 'procesos') return setPanel('procesos')
    setPanel(null)
    if (notificacion.destino === 'vacantes') return navigate(ruta('vacantes'))
    navigate(ruta(`chat/${notificacion.destino}`))
  }

  const probarEnSeleccion = () => {
    setPromo(null)
    navigate(ruta('vacantes'))
    toast.add({ title: 'Selección · el agente ya puede actuar aquí' })
  }

  const verProcesos = () =>
    setModal({
      titulo: 'Procesos en curso',
      descripcion: 'Siguen corriendo aunque cierres el chat',
      personas: [
        { nombre: 'Importación de usuarios', detalle: `${avance}% · 300 filas` },
        { nombre: 'Reporte mensual', detalle: 'En espera · inicia 22:00' },
      ],
      nota: '2 procesos',
      cancelar: 'Cerrar',
    })

  /* ---------------------------------------------------------- chats */

  const [chats, setChats] = useState<Record<string, Mensaje[]>>({ ...CONVERSACIONES, evaluaciones: [], vacaciones: [] })
  const [tituloLibre, setTituloLibre] = useState<string | null>(null)
  const [pensando, setPensando] = useState<string | null>(null)
  const [borrador, setBorrador] = useState('')

  const agregar = (chat: string, mensaje: Omit<Mensaje, 'id'>) =>
    setChats((todos) => ({ ...todos, [chat]: [...(todos[chat] ?? []), { ...mensaje, id: nuevoId() }] }))

  const responder = (chat: string, texto: string, ms = 900) => {
    setPensando(chat)
    despues(() => {
      agregar(chat, { autor: 'agente', texto })
      setPensando(null)
    }, ms)
  }

  const preguntar = (chat: string, texto: string) => {
    agregar(chat, { autor: 'persona', texto })
    responder(chat, respuestaDe(texto, organizacion))
  }

  // Un chat nuevo nace con su primera pregunta y queda arriba en el historial de hoy.
  const empezarChat = (titulo: string, pregunta: string, respuesta: string) => {
    setTituloLibre(titulo)
    setChats((todos) => ({ ...todos, libre: [{ id: nuevoId(), autor: 'persona', texto: pregunta }] }))
    setBorrador('')
    navigate(ruta('chat/libre'))
    responder('libre', respuesta)
  }

  const enviarNuevo = (texto: string) => {
    const limpio = texto.trim()
    if (!limpio) return toast.add({ title: 'Escribe una tarea o una pregunta' })
    // El pedido del atajo «Plan de formación para Ventas» es justo el del caso 02: se abre ahí.
    if (limpio === ATAJOS_CHAT[0].borrador) {
      setBorrador('')
      return navigate(ruta('chat/evaluaciones'))
    }
    empezarChat(limpio.length > 34 ? `${limpio.slice(0, 34)}…` : limpio, limpio, respuestaDe(limpio, organizacion))
  }

  const nuevoChat = () => {
    setBorrador('')
    navigate(ruta('chat'))
  }

  /* ------------------------------------------------------------ voz */

  const terminarVoz = () =>
    empezarChat(
      'Participación de Ventas Bogotá',
      PREGUNTA_VOZ,
      'Ventas Bogotá está en 58% de participación, nueve puntos por debajo del promedio. La caída está en el turno de la tarde: 46% frente a 71% de la mañana.',
    )

  const prepararAviso = () =>
    empezarChat(
      'Aviso para el turno tarde',
      'Prepara un aviso para el turno tarde de Ventas Bogotá.',
      'Listo el borrador: recuerda el cierre del ciclo el 18 de septiembre y ofrece dos franjas de 20 minutos dentro del turno. Nada sale hasta que lo apruebes.',
    )

  const escribirEnVez = () => {
    setBorrador(PREGUNTA_VOZ)
    navigate(ruta('chat'))
    toast.add({ title: 'Pasé la voz al texto' })
  }

  /* ------------------------------------------ propuesta editable (02) */

  const [plan, setPlan] = useState({
    titulo: PLAN_INICIAL.titulo,
    filas: PLAN_INICIAL.filas,
    audiencia: AUDIENCIAS_PLAN[0],
    fechas: FECHAS_PLAN[0],
    estado: 'borrador' as EstadoPlan,
  })
  const [recordatorio, setRecordatorio] = useState(false)
  const [contexto, setContexto] = useState(true)

  const cambiarPlan = (cambios: Partial<typeof plan>) => setPlan((p) => ({ ...p, ...cambios }))
  const ordenarFilas = (filas: FilaPlan[]) => cambiarPlan({ filas })
  const quitarFila = (id: string) => {
    setPlan((p) => ({ ...p, filas: p.filas.filter((f) => f.id !== id) }))
    toast.add({ title: 'Contenido quitado del plan' })
  }
  const quitarContexto = () => {
    setContexto(false)
    toast.add({ title: 'El agente ya no responde sobre el plan' })
  }

  const verParticipantes = () =>
    setModal({
      titulo: '24 evaluaciones vencidas',
      descripcion: 'Ventas · periodo 1–10 sep',
      personas: personas(NOMBRES.slice(0, 10), (i) => (i % 3 === 0 ? 'Sin líder asignado' : `Vencida hace ${2 + i} días`)),
      nota: 'Se muestran 10 de 24',
      cancelar: 'Cerrar',
    })

  const enviarRecordatorio = () => {
    if (recordatorio) return toast.add({ title: 'El recordatorio ya salió' })
    setModal({
      titulo: 'Enviar recordatorio a 24 personas',
      descripcion: 'El correo sale ahora y no se puede deshacer. Los líderes quedan en copia.',
      nota: 'Se envía una sola vez',
      cancelar: 'Cancelar',
      confirmar: 'Enviar recordatorio',
      alConfirmar: () => {
        setRecordatorio(true)
        toast.add({ title: 'Recordatorio enviado a 24 personas' })
        responder('evaluaciones', 'Recordatorio enviado. Vuelvo a medir la terminación mañana a las 9:00 y te aviso si no se mueve.')
      },
    })
  }

  const revisarAudiencia = () =>
    setModal({
      titulo: plan.audiencia,
      descripcion: 'Personas que recibirían el plan de formación',
      personas: personas(NOMBRES, () => 'Líder · Ventas'),
      nota: '14 de 14 con correo válido',
      cancelar: 'Cerrar',
    })

  const asignarPlan = () => {
    if (plan.estado === 'asignado') return navigate(ruta('chat/vacaciones'))
    setModal({
      titulo: `Asignar el plan a ${plan.audiencia}`,
      descripcion:
        'Se notifica por correo a cada persona y el plan aparece en su ruta de aprendizaje. Puedes retirarlo después, pero el correo ya habrá salido.',
      nota: 'Queda registrado en el historial',
      cancelar: 'Revisar de nuevo',
      confirmar: 'Asignar plan',
      alConfirmar: () => {
        cambiarPlan({ estado: 'asignando' })
        despues(() => {
          cambiarPlan({ estado: 'asignado' })
          toast.add({ title: `Plan asignado a ${plan.audiencia}` })
          responder(
            'evaluaciones',
            'Plan asignado y notificado. Creé un proceso de seguimiento: te aviso cuando la mitad del grupo termine la primera lección.',
          )
        }, 1400)
      },
    })
  }

  /* ------------------------------------------------------ aprobación (05) */

  const [pasos, setPasos] = useState(PASOS_INICIALES)
  const [actividad, setActividad] = useState(ACTIVIDAD_INICIAL)
  const [publicado, setPublicado] = useState(false)

  const verBorrador = () =>
    setModal({
      titulo: 'Borrador del aviso',
      descripcion: 'Redactado con la política v3 · sede Bogotá',
      texto: BORRADOR_AVISO,
      nota: 'Puedes editarlo antes de publicar',
      cancelar: 'Cerrar',
      confirmar: 'Usar este borrador',
      alConfirmar: () => toast.add({ title: 'Borrador confirmado' }),
    })

  const verSinCorreo = () =>
    setModal({
      titulo: '3 personas sin correo válido',
      descripcion: 'No reciben el aviso por correo; sí lo ven en la plataforma',
      personas: SIN_CORREO,
      nota: 'Puedes corregirlo en Usuarios',
      cancelar: 'Cerrar',
    })

  const revisarAudienciaAviso = () =>
    setModal({
      titulo: '312 colaboradores · sede Bogotá',
      descripcion: 'Audiencia autorizada para el aviso',
      personas: personas(NOMBRES.slice(0, 12), () => 'Sede Bogotá'),
      nota: 'Se muestran 12 de 312',
      cancelar: 'Cerrar',
    })

  const publicarAviso = () => {
    if (publicado) return toast.add({ title: 'El aviso ya está publicado' })
    setModal({
      titulo: 'Publicar y notificar a 312 personas',
      descripcion: 'El correo sale al publicar y no se puede deshacer. Después se asigna el curso automáticamente.',
      nota: '3 de 312 sin correo válido',
      cancelar: 'Cancelar',
      confirmar: 'Publicar y continuar',
      alConfirmar: () => {
        setPublicado(true)
        setPasos((lista) =>
          lista.map((paso, i) =>
            i === 2
              ? { ...paso, estado: 'hecho', detalle: 'Publicado 9:43 · correo enviado' }
              : i === 3
                ? { ...paso, estado: 'ahora', detalle: 'Asignando…' }
                : paso,
          ),
        )
        setActividad((lista) => [
          ...lista.slice(0, 2),
          { titulo: 'Publicó el aviso', detalle: 'Correo enviado a 309 personas · 3 sin correo', hora: '9:43 · 2,1 s', estado: 'hecho' },
          { titulo: 'Asignando el curso', detalle: 'Política de vacaciones · 312 personas', estado: 'ahora' },
        ])
        toast.add({ title: 'Aviso publicado · correo enviado' })
        despues(() => {
          setPasos((lista) => lista.map((paso, i) => (i === 3 ? { ...paso, estado: 'hecho', detalle: '312 asignaciones creadas' } : paso)))
          setActividad((lista) => [
            ...lista.slice(0, 3),
            { titulo: 'Asignó el curso', detalle: '312 asignaciones creadas · vence el 15 oct', hora: '9:43 · 4,8 s', estado: 'hecho' },
          ])
          toast.add({ title: 'Curso asignado a 312 personas' })
          responder(
            'vacaciones',
            'Todo quedó ejecutado: aviso publicado y curso asignado con vencimiento el 15 de octubre. Te aviso si la terminación baja del 60%.',
          )
        }, 2200)
      },
    })
  }

  /* -------------------------------------------------- editor + agente (03) */

  const [editor, setEditor] = useState({
    nombre: CONTENIDO.nombre,
    descripcion: CONTENIDO.descripcion,
    competencias: COMPETENCIAS,
    lecciones: LECCIONES,
    audiencias: AUDIENCIAS_CONTENIDO,
    publicado: false,
    propuesta: 0,
    aplicado: false,
    extras: [] as Extra[],
    mensajes: [] as Mensaje[],
    tono: 'claro',
    panel: 'abierto' as PanelEditor,
  })
  const cambiarEditor = (cambios: Partial<typeof editor>) => setEditor((e) => ({ ...e, ...cambios }))

  const acciones = {
    quitarCompetencia: (nombre: string) => setEditor((e) => ({ ...e, competencias: e.competencias.filter((c) => c !== nombre) })),
    agregarCompetencia: (nombre: string) => setEditor((e) => ({ ...e, competencias: [...e.competencias, nombre] })),
    agregarLeccion: () => {
      setEditor((e) => ({ ...e, lecciones: [...e.lecciones, { id: nuevoId(), titulo: 'Lección nueva', detalle: 'Sin contenido' } as Leccion] }))
      toast.add({ title: 'Lección agregada al final' })
    },
    quitarLeccion: (id: string) => {
      setEditor((e) => ({ ...e, lecciones: e.lecciones.filter((l) => l.id !== id) }))
      toast.add({ title: 'Lección quitada' })
    },
    alternarAudiencia: (titulo: string) =>
      setEditor((e) => ({ ...e, audiencias: e.audiencias.map((a) => (a.titulo === titulo ? { ...a, activa: !a.activa } : a)) })),
    otraVersion: () => setEditor((e) => ({ ...e, propuesta: (e.propuesta + 1) % PROPUESTAS.length, aplicado: false })),
    aplicarPropuesta: () => {
      setEditor((e) => ({ ...e, descripcion: PROPUESTAS[e.propuesta], aplicado: true }))
      toast.add({ title: 'Descripción actualizada · nada más cambió' })
    },
    deshacer: () => {
      cambiarEditor({ descripcion: CONTENIDO.descripcion, aplicado: false })
      toast.add({ title: 'Cambio deshecho' })
    },
    agregarExtra: (extra: Extra) => setEditor((e) => ({ ...e, extras: [...e.extras, extra] })),
    pedirCambio: (texto: string) => {
      const limpio = texto.trim()
      if (!limpio) return toast.add({ title: 'Pide un cambio sobre el campo' })
      setEditor((e) => ({ ...e, mensajes: [...e.mensajes, { id: nuevoId(), autor: 'persona', texto: limpio }] }))
      despues(() => {
        setEditor((e) => ({
          ...e,
          mensajes: [
            ...e.mensajes,
            { id: nuevoId(), autor: 'agente', texto: `Ajusté la propuesta con tono ${e.tono}. Revísala arriba y aplícala cuando quieras.` },
          ],
        }))
      }, 900)
    },
    elegirTono: (tono: string) => {
      cambiarEditor({ tono })
      toast.add({ title: `Tono: ${tono}` })
    },
    panelEditor: (estado: PanelEditor) => {
      cambiarEditor({ panel: estado })
      if (estado === 'cerrado') toast.add({ title: 'Agente cerrado · se puede reabrir' })
    },
    sugerencia: () => {
      cambiarEditor({ panel: 'abierto' })
      toast.add({ title: 'Sugerencia lista en el panel del agente' })
    },
    previsualizar: () =>
      setModal({
        titulo: editor.nombre,
        descripcion: `Vista previa · ${editor.lecciones.length} lecciones`,
        texto: editor.descripcion,
        personas: editor.lecciones.map((l, i) => ({ nombre: l.titulo, detalle: l.detalle, marca: String(i + 1) })),
        nota: 'Así lo ve un operario',
        cancelar: 'Cerrar',
      }),
    publicarContenido: () => {
      if (editor.publicado) return toast.add({ title: 'Ya está publicado' })
      setModal({
        titulo: `Publicar «${editor.nombre}»`,
        descripcion: 'Queda visible para las audiencias activas y se puede asignar. No se envían correos todavía.',
        nota: `${editor.lecciones.length} lecciones · ${editor.competencias.length} competencias`,
        cancelar: 'Cancelar',
        confirmar: 'Publicar',
        alConfirmar: () => {
          cambiarEditor({ publicado: true })
          toast.add({ title: 'Contenido publicado · visible para 128 personas' })
        },
      })
    },
  }

  /* ------------------------------------------------------------ vacantes */

  const [vacantes, setVacantes] = useState<VacanteSeleccion[]>(VACANTES_SELECCION)
  const crearVacante = (cargo: string, responsable: string) => {
    const nombre = cargo.trim() || 'Vacante sin nombre'
    setVacantes((lista) => [{ cargo: nombre, etapa: 'Borrador', responsable: responsable.trim() || 'Laura M.', abierta: true }, ...lista])
    toast.add({ title: `Vacante creada: ${nombre}` })
  }
  const abrirVacante = (vacante: VacanteSeleccion) =>
    setModal({
      titulo: vacante.cargo,
      descripcion: `${vacante.etapa} · responsable ${vacante.responsable}`,
      personas: CANDIDATOS,
      nota: '12 candidatos en total',
      cancelar: 'Cerrar',
    })

  return {
    // marco
    organizacion,
    elegirOrganizacion,
    espacio,
    elegirEspacio,
    modal,
    setModal,
    promo,
    setPromo,
    probarEnSeleccion,
    panel,
    setPanel,
    buscador,
    abrirBuscador,
    cerrarBuscador,
    invitacion,
    setInvitacion,
    franjaNuevo,
    setFranjaNuevo,
    notificaciones,
    marcarLeidas,
    abrirNotificacion,
    avance,
    verProcesos,
    // chats
    chats,
    tituloLibre,
    pensando,
    borrador,
    setBorrador,
    preguntar,
    empezarChat,
    enviarNuevo,
    nuevoChat,
    // voz
    terminarVoz,
    prepararAviso,
    escribirEnVez,
    // propuesta
    plan,
    cambiarPlan,
    ordenarFilas,
    quitarFila,
    recordatorio,
    enviarRecordatorio,
    verParticipantes,
    revisarAudiencia,
    asignarPlan,
    contexto,
    quitarContexto,
    // aprobación
    pasos,
    actividad,
    publicado,
    verBorrador,
    verSinCorreo,
    revisarAudienciaAviso,
    publicarAviso,
    // editor
    editor,
    cambiarEditor,
    ...acciones,
    // vacantes
    vacantes,
    crearVacante,
    abrirVacante,
  }
}

export type Suite = ReturnType<typeof useEstadoSuite>

export const SuiteContexto = createContext<Suite | null>(null)

export function useSuite() {
  const suite = useContext(SuiteContexto)
  if (!suite) throw new Error('useSuite va dentro del layout de Orbit')
  return suite
}
