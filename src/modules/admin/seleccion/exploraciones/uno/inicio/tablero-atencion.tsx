import { useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from 'react'
import { useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { PlusSignIcon } from '@hugeicons/core-free-icons'
import { Button, EmptyContent, Field, FieldLabel, Label, RadioGroup, RadioGroupItem } from '@ubits/flux-ui'
import { VentanaDeAccion } from '@/modules/design-system/drawers/components/drawer-anidado'
import { notify, notifyAction } from '@/shared/components/notify'
import { etapaDe, tituloEtapa, type Candidatura, type VacanteUI } from '../../../propuestas/datos'
import { fallaAlMover, registroDeMovimientos } from '../../../propuestas/movimientos'
import { baseDeCandidatos, vivas, type PersonaViva, type PlantillaBase } from '../../../propuestas/base'
import { costoDeEtapa, creditos } from '../../../propuestas/creditos'
import { almacenDeLotes } from '../../../propuestas/importacion'
import { pasoPendiente } from '../../../propuestas/publicar'
import { DialogoCorreo } from '../../../propuestas/components/dialogos-base'
import { ErrorDeCarga, useCargaConError } from '@/modules/design-system/estados/carga'
import { cambiarVacantes, escribirDesdeInicio, moverDesdeInicio, reenviarInvitacion, rechazarCerradas, vacantesDeLaSesion } from './acciones'
import { asuntosDe, cumplenEn, DIAS_POSPONE, GRUPOS_VACANTES, NOMBRES_VACANTES, type Asunto, type Elemento, type Grupo, type PlantillaAsunto } from './atencion'
import { claveAsi, claveDe, estadoInicio, useEstadoInicio } from './estado'
import { TableroAtencion as TableroAtencionComun } from '@/modules/design-system/metricas/tablero-atencion'
import { PanelAtencion, type Manejadores } from './panel-asunto'
import { avisoDeError, noSeGuardo } from '../../../propuestas/simular'

// «Lo que necesita tu atención», lo primero del inicio (29 sep, reunión con Elkin). La forma del tablero (marco, columnas,
// recogido y expandido) la comparte con Créditos desde el 5 oct (`propuestas/components/tablero-atencion.tsx`); aquí
// viven los asuntos de Vacantes y lo que se hace con cada uno. Cada asunto se abre en el panel lateral y ahí se resuelve;
// lo resuelto sale del tablero y queda en «Resuelto hoy» del panel, con quién lo hizo y su «Deshacer» (IN-31, IN-41).
//
// 7 oct: lo que se hace aquí llega a la vacante (IN-16): reenviar reinicia el plazo, escribirle o rechazar queda en el
// rastro de su ficha. El correo sale con la plantilla del asunto (IN-02) y solo se marca a quien sí lo recibió (IN-14).
// Al resolver, el panel se queda en el asunto con la marca hasta que se vuelve a la lista (IN-15).

// Las plantillas del proceso, las mismas de la barra de varias de la vacante.
const PLANTILLAS: Record<PlantillaAsunto, PlantillaBase> = {
  sigue: {
    id: 'sigue',
    titulo: 'Actualización del proceso',
    asunto: 'Tu proceso en {vacante} sigue en curso',
    texto: 'Hola {nombre}, te escribimos para contarte que tu proceso en {vacante} sigue avanzando. Te avisaremos apenas tengamos novedades.',
  },
  actualizacion: {
    id: 'actualizacion',
    titulo: 'Actualización del proceso',
    asunto: 'Novedades de tu proceso en {vacante}',
    texto: 'Hola {nombre}, te escribimos para contarte en qué va tu proceso en {vacante}. Te avisaremos apenas tengamos novedades.',
  },
  documentos: {
    id: 'documentos',
    titulo: 'Solicitud de documentos',
    asunto: 'Documentos para tu proceso en {vacante}',
    texto: 'Hola {nombre}, para seguir con tu proceso en {vacante} necesitamos tu certificado laboral y tu documento de identidad. Puedes responder este correo con los archivos.',
  },
  cierre: {
    id: 'cierre',
    titulo: 'Cierre de la vacante',
    asunto: 'Cerramos la vacante de {vacante}',
    texto: 'Hola {nombre}, gracias por tu tiempo. La vacante de {vacante} se cerró y no seguiremos con el proceso. Guardamos tus datos para próximas oportunidades.',
  },
}

const MOTIVOS = ['No aplica a esta persona o vacante', 'Ya lo hice por fuera', 'No es buen momento', 'Otro motivo']

export function TableroAtencion({ ruta, onCrear }: { ruta: string; onCrear: () => void }) {
  const navigate = useNavigate()
  const registro = useSyncExternalStore(registroDeMovimientos.suscribir, registroDeMovimientos.leer)
  const estado = useEstadoInicio()
  // Los lotes importados cambian solos (se leen, se confirman): se vuelve a dibujar cuando cambian (IN-13).
  const [versionLotes, tocarLotes] = useReducer((n: number) => n + 1, 0)
  useEffect(() => almacenDeLotes.suscribir(tocarLotes), [])
  const carga = useCargaConError('tablero-inicio')
  const [expandido, setExpandido] = useState(false)
  const [panel, setPanel] = useState<{ abierto: boolean; grupo: Grupo; asuntoId: string | null }>({ abierto: false, grupo: 'critico', asuntoId: null })
  const [correo, setCorreo] = useState<{ asunto: Asunto; elementos: Elemento[]; personas: PersonaViva[] } | null>(null)
  const [porDescartar, setPorDescartar] = useState<Asunto | null>(null)
  const [motivo, setMotivo] = useState('')

  const asuntos = useMemo(
    // Depende de `estado` entero: su `version` sube cuando el inicio cambia una vacante (las listas compartidas no avisan).
    () => asuntosDe({ registro, hechos: estado.hechos, descartadas: estado.descartadas }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [registro, estado, versionLotes],
  )
  const pendientes = asuntos.filter((asunto) => asunto.pendientes > 0)
  const delGrupo = (grupo: Grupo) => pendientes.filter((asunto) => asunto.grupo === grupo)
  // El asunto abierto se recuerda aunque deje de existir al resolverlo del todo: se ve con su marca hasta volver (IN-15).
  // Lo mismo con cada fila: una vacante devuelta al portal deja de ser «fuera del portal» y saldría de la lista; se queda
  // en su lugar con la marca «En el portal» mientras el panel siga en ese asunto.
  const visto = useRef<Asunto | null>(null)
  const actual = panel.asuntoId ? (asuntos.find((asunto) => asunto.id === panel.asuntoId) ?? null) : null
  const previo = actual && visto.current?.id === actual.id ? visto.current : null
  const encontrado =
    actual && previo
      ? {
          ...actual,
          elementos: [
            ...previo.elementos.flatMap((elemento) => {
              const sigue = actual.elementos.find((otro) => otro.id === elemento.id)
              if (sigue) return [sigue]
              const clave = claveDe(actual.id, elemento.id)
              return estado.hechos.has(clave) || estado.hechos.has(claveAsi(clave)) ? [elemento] : []
            }),
            ...actual.elementos.filter((elemento) => !previo.elementos.some((otro) => otro.id === elemento.id)),
          ],
        }
      : actual
  if (encontrado) visto.current = encontrado
  const abiertoAsunto = panel.asuntoId ? (encontrado ?? (visto.current?.id === panel.asuntoId ? { ...visto.current, pendientes: 0 } : null)) : null

  /* Lo que se hace desde el tablero o el panel -------------------------------------------------------------------- */

  const abrirPersona = (elemento: Elemento) => {
    if (!elemento.persona) return
    navigate(`${ruta}/${elemento.vacante.id}?persona=${encodeURIComponent(elemento.persona.id)}`)
  }
  const abrirVacante = (vacante: VacanteUI, extra = '') => navigate(`${ruta}/${vacante.id}${extra}`)
  const editarVacante = (vacante: VacanteUI, paso?: number) => navigate(`${ruta}/${vacante.id}/editar`, { state: { volverA: ruta, ...(paso ? { paso } : {}) } })
  const nombres = (elementos: Elemento[]) => (elementos.length === 1 ? elementos[0].titulo : `${elementos.length} ${elementos[0].persona ? 'personas' : 'vacantes'}`)
  const marcar = (asunto: Asunto, elementos: Elemento[], que: string, deshacer?: () => void) =>
    estadoInicio.marcar(
      elementos.map((elemento) => claveDe(asunto.id, elemento.id)),
      que,
      deshacer,
      asunto.grupo,
    )

  // Escribirle a una o varias personas con la ventana de correo de la base, con la plantilla del asunto.
  const escribir = (asunto: Asunto, elementos: Elemento[]) => {
    const ids = new Set(elementos.flatMap((elemento) => (elemento.persona ? [elemento.persona.personaId] : [])))
    const personas = vivas(baseDeCandidatos.leer(), registroDeMovimientos.leer(), null).filter((persona) => ids.has(persona.id))
    if (!personas.length) {
      notify('No encontramos su correo', 'Escríbele desde su ficha en la vacante.', 'warning')
      return
    }
    setCorreo({ asunto, elementos, personas })
  }

  const hacer = (asunto: Asunto, elementos: Elemento[]) => {
    const accion = asunto.fila?.accion
    const candidaturas = elementos.flatMap((elemento) => (elemento.persona ? [elemento.persona] : []))
    if (accion === 'escribir') return escribir(asunto, elementos)
    if (accion === 'abrir') {
      // Abrir la hoja de vida o la prueba desde aquí la deja como revisada, aunque la persona siga en su etapa (IN-27).
      marcar(asunto, elementos, `Revisaste a ${nombres(elementos)}`)
      return abrirPersona(elementos[0])
    }
    if (accion === 'terminar') return editarVacante(elementos[0].vacante, pasoPendiente(elementos[0].vacante))
    if (accion === 'revisar-lote') {
      marcar(asunto, elementos, `Abriste el lote ${elementos[0].titulo}`)
      return abrirVacante(elementos[0].vacante, `?lote=${encodeURIComponent(elementos[0].id)}&abrir=revisar`)
    }
    if (accion === 'revisado') {
      const deshacer = marcar(asunto, elementos, `Marcaste como revisada ${nombres(elementos)}`)
      notifyAction('Lo marcamos como revisado', 'Sale del tablero.', { label: 'Deshacer', onClick: deshacer }, 'success')
      return
    }
    // Lo que toca a personas o vacantes puede no guardarse: el aviso lo dice y «Reintentar» hace lo mismo (VA-50).
    const fallo = (que: string) => noSeGuardo(`${accion}:${asunto.id}:${elementos.map((elemento) => elemento.id).join(',')}`, `No pudimos ${que}`, () => hacer(asunto, elementos))
    if (accion === 'reenviar') {
      if (fallo('reenviar la invitación')) return
      const deshacer = marcar(asunto, elementos, `Reenviaste la invitación a ${nombres(elementos)}`, reenviarInvitacion(candidaturas))
      notifyAction(
        elementos.length === 1 ? `Reenviamos la invitación a ${elementos[0].titulo}` : `Reenviamos la invitación a ${elementos.length} personas`,
        'Tienen siete días más para presentarla.',
        { label: 'Deshacer', onClick: deshacer },
        'success',
      )
      return
    }
    if (accion === 'rechazar') {
      if (fallo(elementos.length === 1 ? `rechazar a ${elementos[0].titulo}` : `rechazar a ${elementos.length} personas`)) return
      const deshacer = marcar(asunto, elementos, `Rechazaste y avisaste a ${nombres(elementos)}`, rechazarCerradas(candidaturas))
      notifyAction(
        elementos.length === 1 ? `Rechazamos a ${elementos[0].titulo}` : `Rechazamos a ${elementos.length} personas`,
        'Motivo: se cerró la vacante. Les llega el correo de cierre.',
        { label: 'Deshacer', onClick: deshacer },
        'success',
      )
      return
    }
    if (accion === 'devolver') {
      if (fallo('devolverlas al portal')) return
      const vacantes = elementos.map((elemento) => elemento.vacante)
      const deshacer = marcar(asunto, elementos, `Devolviste al portal ${nombres(elementos)}`, cambiarVacantes(vacantes, { oculta: false }))
      notifyAction(
        vacantes.length === 1 ? `«${vacantes[0].titulo}» está de vuelta en el portal` : `${vacantes.length} vacantes de vuelta en el portal`,
        'Ya reciben aplicaciones.',
        { label: 'Deshacer', onClick: deshacer },
        'success',
      )
    }
  }

  // La segunda acción de la fila: abrir, o dejarla así a propósito (IN-28).
  const otra = (asunto: Asunto, elemento: Elemento) => {
    if (asunto.otra?.accion === 'abrir') return abrirPersona(elemento)
    if (asunto.otra?.accion === 'abrir-vacante') return abrirVacante(elemento.vacante)
    const clave = claveDe(asunto.id, elemento.id)
    const deshacer = estadoInicio.marcar([clave, claveAsi(clave)], `Dejaste así ${elemento.titulo}`, undefined, asunto.grupo)
    notifyAction(`«${elemento.titulo}» se queda así`, 'Sale del tablero.', { label: 'Deshacer', onClick: deshacer }, 'success')
  }

  const pie = (asunto: Asunto, que: 'abrir' | 'editar' | 'revisado' | 'enlace') => {
    if (que === 'enlace' && asunto.enlace) return navigate(asunto.enlace.ruta)
    const vacante = asunto.vacante
    if (que === 'revisado') {
      const deshacer = estadoInicio.marcar([asunto.id], `Marcaste como revisado «${asunto.titulo}»`, undefined, asunto.grupo)
      notifyAction('Lo marcamos como revisado', 'Sale del tablero.', { label: 'Deshacer', onClick: deshacer }, 'success')
      return
    }
    if (!vacante) return
    if (que === 'abrir') abrirVacante(vacante)
    else editarVacante(vacante)
  }

  // Pasar a alguien de etapa: puede fallar (`?simular=falla-mover`, IN-51) y, si la etapa es de IA, cuesta créditos (IN-17).
  const pasar = (asunto: Asunto, persona: Candidatura, hacia: string) => {
    if (fallaAlMover(persona.id)) {
      avisoDeError(`No pudimos pasar a ${persona.candidato.nombre}`, 'Sigue en su etapa: no se guardó el cambio.', () => pasar(asunto, persona, hacia))
      return
    }
    const ia = etapaDe(persona.vacante.etapas, hacia)?.ia
    const costo = ia ? costoDeEtapa(hacia, 1) : null
    if (costo && !costo.alcanza) {
      notify(
        `No alcanzan los créditos de ${costo.agente.nombre}`,
        `Cuesta ${creditos(costo.total)} y le quedan ${creditos(costo.libre)}. Asígnale más en Créditos.`,
        'warning',
      )
      return
    }
    const deshacer = estadoInicio.marcar([asunto.id], `Pasaste a ${persona.candidato.nombre} a «${tituloEtapa(hacia)}»`, moverDesdeInicio(persona, hacia), 'ia')
    notifyAction(
      `${persona.candidato.nombre} pasó a «${tituloEtapa(hacia)}»`,
      ia ? `Le llega la invitación${costo ? ` · ${creditos(costo.total)} créditos reservados` : ''}.` : 'Nadie recibe correo.',
      { label: 'Deshacer', onClick: deshacer },
      'success',
    )
  }

  // La primera lectura de la IA: empieza, se ve en curso en la fila de la vacante y avisa al terminar o si falla (IN-32).
  const leer = (asunto: Asunto, vacante: VacanteUI, cuantos: number) => {
    estadoInicio.marcar([asunto.id], `Le pediste a la IA leer los ${cuantos} CVs de ${vacante.titulo}`, undefined, 'ia')
    estadoInicio.leerConIA({ vacanteId: vacante.id, vacante: vacante.titulo, cuantos }, cumplenEn(vacante, 'cv'), (final) => {
      if (final.estado === 'lista') {
        notifyAction(
          `La IA terminó de leer ${vacante.titulo}`,
          `${final.cumplen} de ${cuantos} cumplen todos los requisitos.`,
          { label: 'Ver', onClick: () => abrirVacante(vacante) },
          'success',
        )
      } else {
        avisoDeError(`La IA no pudo leer ${vacante.titulo}`, 'Se cortó la lectura. No se cobró nada.', () => leer(asunto, vacante, cuantos))
      }
    })
    notify(`La IA está leyendo ${cuantos} CVs`, 'Te aviso al terminar.', 'info')
  }

  const aplicar = (asunto: Asunto) => {
    const sugerencia = asunto.sugerencia
    if (!sugerencia) return
    if (sugerencia.tipo === 'escribir') return escribir(asunto, asunto.elementos)
    if (sugerencia.tipo === 'mover') return pasar(asunto, sugerencia.persona, sugerencia.hacia)
    leer(asunto, sugerencia.vacante, sugerencia.cuantos)
  }

  // Descartar pregunta por qué (opcional): así la IA deja de proponer lo que no sirve (IN-52).
  const descartar = (asunto: Asunto) => {
    setMotivo('')
    setPorDescartar(asunto)
  }
  const confirmarDescarte = () => {
    if (!porDescartar) return
    if (noSeGuardo(`descartar:${porDescartar.id}`, 'No pudimos descartar la sugerencia', confirmarDescarte)) return setPorDescartar(null)
    const deshacer = estadoInicio.descartar(porDescartar.id, porDescartar.titulo, motivo || undefined)
    if (panel.asuntoId === porDescartar.id) setPanel((actual) => ({ ...actual, asuntoId: null }))
    notifyAction('Descartamos la sugerencia', 'No te la vuelvo a proponer.', { label: 'Deshacer', onClick: deshacer }, 'success')
    setPorDescartar(null)
  }

  const manejadores: Manejadores = { hacer, otra, abrir: abrirPersona, pie, aplicar, descartar, hechos: estado.hechos }

  const abrirAsunto = (asunto: Asunto) => setPanel({ abierto: true, grupo: asunto.grupo, asuntoId: asunto.id })
  const abrirGrupo = (grupo: Grupo) => setPanel({ abierto: true, grupo, asuntoId: null })
  const sinVacantes = vacantesDeLaSesion().length === 0

  return (
    <section aria-labelledby="atencion-titulo">
      <TableroAtencionComun
        pendientes={pendientes}
        cargando={carga.cargando}
        expandido={expandido}
        onExpandido={setExpandido}
        onAbrir={abrirAsunto}
        onVerGrupo={abrirGrupo}
        grupos={GRUPOS_VACANTES}
        nombres={NOMBRES_VACANTES}
        error={carga.falla ? <ErrorDeCarga que="lo que necesita tu atención" onReintentar={carga.reintentar} /> : undefined}
        // El primer uso no se celebra: todavía no hay nada que atender (IN-24).
        vacio={
          sinVacantes
            ? {
                titulo: 'Empieza con tu primera vacante',
                descripcion: 'Cuando publiques una, aquí aparece lo que esté esperando una acción tuya: quién espera, qué vence y qué conviene revisar.',
                contenido: (
                  <EmptyContent className="flex-row justify-center">
                    <Button onClick={onCrear}>
                      <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />
                      Crear vacante
                    </Button>
                  </EmptyContent>
                ),
              }
            : undefined
        }
      />

      <PanelAtencion
        abierto={panel.abierto}
        onAbierto={(abierto) => setPanel((actual) => ({ ...actual, abierto, asuntoId: abierto ? actual.asuntoId : null }))}
        grupo={panel.grupo}
        asuntos={delGrupo(panel.grupo)}
        asunto={abiertoAsunto}
        onAsunto={(asunto) => setPanel((actual) => ({ ...actual, asuntoId: asunto?.id ?? null }))}
        manejadores={manejadores}
        // Escribir y descartar se piden desde el panel: se abren dentro de él (8 oct).
        ventanas={
          <>
            {correo ? (
              <DialogoCorreo
                personas={correo.personas}
                plantillas={[PLANTILLAS[correo.asunto.plantilla ?? 'actualizacion'], PLANTILLAS.actualizacion, PLANTILLAS.documentos].filter((una, i, todas) => todas.findIndex((otra) => otra.id === una.id) === i)}
                vacante={new Set(correo.elementos.map((elemento) => elemento.vacante.titulo)).size === 1 ? correo.elementos[0].vacante.titulo : undefined}
                onOpenChange={(abierto) => !abierto && setCorreo(null)}
                onConfirmar={function enviar(decision) {
                  const { asunto, reciben } = decision
                  if (noSeGuardo(`correo:${correo.asunto.id}:${reciben.map((persona) => persona.id).join(',')}`, 'No pudimos enviar el correo', () => enviar(decision), 'No salió ningún correo.')) return setCorreo(null)
                  // Solo quien lo recibió queda como «Le escribiste»; quien pidió no recibir correos sigue pendiente (IN-14).
                  const ids = new Set(reciben.map((persona) => persona.id))
                  const recibieron = correo.elementos.filter((elemento) => elemento.persona && ids.has(elemento.persona.personaId))
                  const candidaturas = recibieron.flatMap((elemento) => (elemento.persona ? [elemento.persona] : []))
                  const deshacer = marcar(correo.asunto, recibieron, `Le escribiste a ${nombres(recibieron.length ? recibieron : correo.elementos)}`, escribirDesdeInicio(candidaturas, asunto))
                  const fuera = correo.elementos.length - recibieron.length
                  setCorreo(null)
                  notifyAction(
                    reciben.length === 1 ? `Le escribimos a ${reciben[0].nombre}` : `Les escribimos a ${reciben.length} personas`,
                    fuera ? `${fuera} no ${fuera === 1 ? 'lo recibe: sigue pendiente' : 'lo reciben: siguen pendientes'}.` : `Si nadie las revisa, vuelven aquí en ${DIAS_POSPONE} días.`,
                    { label: 'Deshacer', onClick: deshacer },
                    'success',
                  )
                }}
              />
            ) : null}

            <VentanaDeAccion
              open={porDescartar !== null}
              onOpenChange={(abierto) => !abierto && setPorDescartar(null)}
              title="¿Por qué la descartas?"
              sub="Es opcional. Con el motivo, la IA deja de proponer lo que no te sirve."
              confirmLabel="Descartar"
              onConfirm={confirmarDescarte}
            >
              <Field>
                <FieldLabel id="motivo-descarte" className="sr-only">
                  Motivo
                </FieldLabel>
                <RadioGroup aria-labelledby="motivo-descarte" value={motivo} onValueChange={(valor) => setMotivo(String(valor))} className="grid gap-2">
                  {MOTIVOS.map((uno) => (
                    <Label key={uno} className="flex items-center gap-2.5 text-sm font-normal">
                      <RadioGroupItem value={uno} />
                      {uno}
                    </Label>
                  ))}
                </RadioGroup>
              </Field>
            </VentanaDeAccion>
          </>
        }
      />
    </section>
  )
}
