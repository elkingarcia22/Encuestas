import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import { Badge, Frame,FrameDescription,FrameHeader,FramePanel,FrameTitle, Progress, Text } from '@ubits/flux-ui'
import {
  buscarPagina,
  confirmarRecurso,
  getBorrador,
  hashPagina,
  setBorrador,
  rutaAsistente,
  volverAAnadirPagina,
  type RoleplayConfig,
} from '../crear-contenido/components/borrador'
import { plural } from '@/modules/design-system/patrones/formato'
import { ChipGuardado, useGuardadoSimulado } from '@/shared/components/ChipGuardado'
import { guardarRoleplay } from '../crear-contenido/components/roleplay/biblioteca'
import { BotonSalirCreacion, MarcoInmersivo } from '../crear-contenido/components/marco-inmersivo'
import { BarraEditor } from '../crear-contenido/components/barras'
import { VistaRoleplay } from '../crear-contenido/components/roleplay/vista-roleplay'
import { PasosEditor } from '../crear-contenido/components/pasos-editor'
// Un solo campo de voz para el video y el roleplay (decisión 21 de la auditoría, 5-oct).
import { CampoVoz } from '../crear-contenido/components/video/selectores'
import { EJEMPLOS, LIMITES, PASOS, erroresDelPaso, pendientesRoleplay, roleplayVacio, validarRoleplay } from '../crear-contenido/components/roleplay/modelo'
import { CampoImagen, CampoModo, CampoObjetivos, CampoTexto, CamposConfiguracion } from '../agregar-roleplay-mvp/campos'

// Evaluador roleplay: el formulario donde se termina de armar la llamada, repartido en cuatro pasos.
//
// Es la fusión de los dos roleplays que hubo hasta el 5-oct: de aquel MVP se queda **el paso a paso**, y del MLP, el
// **setup con IA**, que ahora es el modal previo (`roleplay/modal-agregar-roleplay.tsx`). Así que a esta pantalla se
// puede llegar de tres formas, y en las tres es la misma: con la propuesta de la IA ya puesta, vacía porque el
// creador prefirió llenarla él, o con lo que ya tenía una página al editarla (Dave, 5-oct).

const ULTIMO = PASOS.length - 1

/** Lo que se espera sin escribir antes de guardar solo. Un poco más que el chip, para que no diga «Guardado» antes de serlo. */
const MS_AUTOGUARDADO = 1200

/** Si se vino a editar, la configuración de la página que se está editando. */
function configuracionAEditar(): RoleplayConfig | null {
  const b = getBorrador()
  return buscarPagina(b, b.intencion?.paginaId ?? null)?.pagina.recurso?.roleplay ?? null
}

/**
 * Lo que dejó el setup: la propuesta de la IA, o lo poco que se eligió antes de llenarlo a mano.
 *
 * Solo **lee**. Borrarlo aquí dentro no funciona: en desarrollo React llama dos veces al inicializador de `useState`,
 * así que la primera se lo llevaba y la segunda —la que se queda— encontraba el borrador vacío y el paso a paso
 * abría en blanco. Se limpia al montar, en un efecto.
 */
function loQueDejoElSetup() {
  return getBorrador().roleplayPropuesto ?? null
}

export function Component() {
  const navigate = useNavigate()
  const [inicial] = useState(configuracionAEditar)
  const [delSetup] = useState(loQueDejoElSetup)
  // Se consume una sola vez: si se recarga la pantalla, ya no hay propuesta que sembrar.
  useEffect(() => setBorrador({ roleplayPropuesto: null }), [])
  const [cfg, setCfg] = useState<RoleplayConfig>(() => inicial ?? delSetup?.cfg ?? roleplayVacio())
  // La página que se está editando, para volver a ella al salir (como Agregar asistencia). Se lee una sola vez.
  const [paginaId] = useState(() => {
    const b = getBorrador()
    return b.intencion?.paginaId ?? b.paginaActiva ?? null
  })
  const [paso, setPaso] = useState(0)
  // Pasos donde ya se intentó avanzar: solo ahí se pintan errores (marcar un campo que no se ha tocado es hostil).
  const [tocados, setTocados] = useState<Set<number>>(() => new Set())

  // ── Autoguardado ──
  //
  // La llamada se guarda sola en «Tus roleplays» mientras se arma, como el contenido en Crear contenido: si el creador
  // se sale a medias —o se le cae el navegador— lo encuentra ahí y lo retoma donde quedó, sin haber pulsado nada
  // (Dave, 7-oct). Por eso ya no hay botón «Guardar borrador»: lo que hacía, ahora pasa solo.
  const [estadoGuardado, avisarCambio] = useGuardadoSimulado()
  // El sitio de este roleplay en la biblioteca. Nace del borrador que se estaba retomando, si lo había, y se queda fijo
  // para que cada autoguardado pise el mismo y no deje una ristra de copias.
  const guardadoId = useRef(delSetup?.guardadoId)

  const cambiar = (cambio: Partial<RoleplayConfig>) => setCfg((previo) => ({ ...previo, ...cambio }))
  const errores = useMemo(() => validarRoleplay(cfg), [cfg])
  const pendientes = (i: number) => Object.keys(erroresDelPaso(errores, i)).length > 0
  const visibles = tocados.has(paso) ? erroresDelPaso(errores, paso) : {}
  const marcar = () => setTocados((previos) => new Set(previos).add(paso))

  // Guarda al parar de escribir, no en cada tecla. **Solo al crear**: editando una página que ya existe, el roleplay
  // vive en esa página y no tiene por qué aparecer como borrador suelto en la biblioteca.
  const hayAlgo = cfg.titulo.trim() || cfg.escenario.trim() || cfg.nombrePersonaje.trim()
  useEffect(() => {
    if (inicial || !hayAlgo) return
    avisarCambio()
    const id = window.setTimeout(() => {
      guardadoId.current = guardarRoleplay(cfg, 'borrador', guardadoId.current)
    }, MS_AUTOGUARDADO)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg])

  const titulo = inicial ? 'Editar evaluador roleplay' : 'Agregar evaluador roleplay'

  // Creando, se sale y se reabre el selector de «Añadir página»; no nace ninguna página. Editando, se vuelve **a la
  // página que se estaba editando**. Sale directo, sin preguntar (el jefe de Dave, 13-oct): la única ventana de salida
  // es la de Crear contenido.
  const volverALaPagina = () => navigate(paginaId ? `${rutaAsistente()}${hashPagina(paginaId)}` : rutaAsistente())
  const salir = () => (inicial ? volverALaPagina() : navigate(volverAAnadirPagina()))

  const guardar = () => {
    // Queda también en la biblioteca, para poder reusarlo en otra página sin volver a armarlo. El mismo sitio que
    // venía usando el autoguardado: así el borrador no queda al lado del que ya está listo.
    guardarRoleplay(cfg, 'listo', guardadoId.current)
    const id = confirmarRecurso({ tipo: 'roleplay', roleplay: cfg }, cfg.titulo)
    navigate(rutaAsistente() + hashPagina(id))
  }

  const siguiente = () => {
    marcar()
    if (pendientes(paso)) return
    if (paso < ULTIMO) setPaso(paso + 1)
    else if (!Object.keys(errores).length) guardar()
  }

  const atras = () => setPaso((p) => Math.max(0, p - 1))

  // Hacia atrás siempre; hacia adelante solo si el paso actual está completo (si no, se marcan sus errores).
  const irAlPaso = (destino: number) => {
    if (destino === paso) return
    if (destino < paso) {
      setPaso(destino)
      return
    }
    marcar()
    if (!pendientes(paso)) setPaso(destino)
  }

  // Lo que falta para poder guardar, para la tarjeta de la vista previa.
  const resumen = pendientesRoleplay(cfg, paso)

  return (
    <MarcoInmersivo
      lleno
      ancho="default"
      titulo={titulo}
      // Ya no hay dos roleplays que distinguir. Lo que sí vale decir es de dónde salió lo que está en pantalla.
      insignia={
        delSetup?.conIA ? (
          <Badge variant="secondary" radius="full" size="lg">
            Propuesto por IA
          </Badge>
        ) : undefined
      }
      // Una sola salida, sin flecha junto al título ni «Cancelar» en la barra (regla de creación, 6-oct). Creando es la
      // X en círculo de la cabecera, como en las demás experiencias inmersivas, y vuelve al selector de «Añadir página»
      // (el jefe de Dave, 14-oct); editando, «Salir de la edición» lleva a la página.
      cerrar={inicial ? undefined : { etiqueta: 'Volver a añadir página', onClick: salir }}
      acciones={inicial ? <BotonSalirCreacion texto="Salir de la edición" onClick={salir} /> : undefined}
      // La barra de los pasos de Crear contenido: el autoguardado a la izquierda (RN-04c, Dave, 7-oct) y, a la derecha,
      // qué falta, «Atrás» y el botón que avanza.
      barra={
        <BarraEditor
          inicio={inicial ? undefined : <ChipGuardado estado={estadoGuardado} />}
          mensaje={
            pendientes(paso)
              ? { texto: tocados.has(paso) ? 'Revisa los campos marcados para continuar.' : 'Completa los campos obligatorios de este paso.', problema: tocados.has(paso) }
              : null
          }
          onAtras={paso > 0 ? atras : undefined}
          principal={{
            texto: paso < ULTIMO ? 'Continuar' : 'Guardar roleplay',
            flecha: paso < ULTIMO,
            deshabilitado: pendientes(paso),
            onClick: siguiente,
          }}
        />
      }
    >
        {/* Los pasos abren el cuerpo de la experiencia, no la cabecera: así no llevan caja ni línea propia. */}
        <div className="pb-6">
          <PasosEditor
            actual={paso + 1}
            onPaso={(v) => irAlPaso(v - 1)}
            pasos={PASOS.map((p, i) => {
              const conError = i !== paso && tocados.has(i) && pendientes(i)
              const bloqueado = i > paso && PASOS.some((_, j) => j < i && pendientes(j))
              return { numero: i + 1, nombre: p.titulo, resumen: 'Completo', completo: i < paso && !conError, bloqueado, error: conError }
            })}
          />
        </div>
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Frame>
            <FrameHeader>
              <FrameTitle>{PASOS[paso].titulo}</FrameTitle>
              <FrameDescription>{PASOS[paso].ayuda}</FrameDescription>
            </FrameHeader>
            <FramePanel className="flex flex-col gap-6">

              {paso === 0 ? (
                <>
                  <CampoTexto
                    id="rp-titulo"
                    etiqueta="Título de la llamada"
                    ejemplo={EJEMPLOS.titulo}
                    valor={cfg.titulo}
                    onCambio={(v) => cambiar({ titulo: v })}
                    maximo={LIMITES.titulo}
                    error={visibles.titulo}
                  />
                  <CampoTexto
                    id="rp-escenario"
                    etiqueta="Escenario"
                    ejemplo={EJEMPLOS.escenario}
                    valor={cfg.escenario}
                    onCambio={(v) => cambiar({ escenario: v })}
                    maximo={LIMITES.escenario}
                    error={visibles.escenario}
                    filas={6}
                  />
                </>
              ) : null}

              {paso === 1 ? (
                <>
                  <div className="grid gap-6 lg:grid-cols-2">
                    <CampoTexto
                      id="rp-nombre"
                      etiqueta="Nombre del personaje"
                      ejemplo={EJEMPLOS.nombrePersonaje}
                      valor={cfg.nombrePersonaje}
                      onCambio={(v) => cambiar({ nombrePersonaje: v })}
                      maximo={LIMITES.nombrePersonaje}
                      error={visibles.nombrePersonaje}
                    />
                    <CampoTexto
                      id="rp-identidad"
                      etiqueta="Quién es"
                      ejemplo={EJEMPLOS.identidadPersonaje}
                      valor={cfg.identidadPersonaje}
                      onCambio={(v) => cambiar({ identidadPersonaje: v })}
                      maximo={LIMITES.identidadPersonaje}
                      error={visibles.identidadPersonaje}
                    />
                  </div>
                  <CampoImagen imagen={cfg.imagen} onCambio={(imagen) => cambiar({ imagen })} />
                  <CampoVoz valor={cfg.voz} onValor={(voz) => cambiar({ voz })} etiqueta="Voz del personaje" />
                  <CampoTexto
                    id="rp-personalidad"
                    etiqueta="Personalidad"
                    ejemplo={EJEMPLOS.personalidad}
                    valor={cfg.personalidad}
                    onCambio={(v) => cambiar({ personalidad: v })}
                    maximo={LIMITES.personalidad}
                    error={visibles.personalidad}
                    filas={4}
                  />
                  <CampoTexto
                    id="rp-bienvenida"
                    etiqueta="Mensaje de bienvenida"
                    ejemplo={EJEMPLOS.mensajeBienvenida}
                    valor={cfg.mensajeBienvenida}
                    onCambio={(v) => cambiar({ mensajeBienvenida: v })}
                    maximo={LIMITES.mensajeBienvenida}
                    error={visibles.mensajeBienvenida}
                    filas={3}
                  />
                </>
              ) : null}

              {paso === 2 ? (
                <>
                  <CampoTexto
                    id="rp-papel"
                    etiqueta="Papel del colaborador"
                    ejemplo={EJEMPLOS.papelColaborador}
                    valor={cfg.papelColaborador}
                    onCambio={(v) => cambiar({ papelColaborador: v })}
                    maximo={LIMITES.papelColaborador}
                    error={visibles.papelColaborador}
                    filas={3}
                  />
                  <CampoObjetivos cfg={cfg} onCambio={cambiar} error={visibles.objetivos} />
                </>
              ) : null}

              {paso === 3 ? (
                <>
                  <CampoModo cfg={cfg} onCambio={cambiar} />
                  <CamposConfiguracion cfg={cfg} onCambio={cambiar} error={visibles.objetivosParaAprobar} />
                </>
              ) : null}
            </FramePanel>
          </Frame>
          {/* El margen negativo con su relleno deja 4px de aire dentro del scroll: sin él, la caja recorta el
              anillo de la tarjeta en los tramos rectos y el borde solo se ve en las esquinas redondeadas. */}
          <div className="lg:sticky lg:top-6 lg:-m-1 lg:max-h-[calc(100vh-11rem)] lg:overflow-auto lg:p-1">
            <VistaRoleplay
              resumen
              config={cfg}
              pie={
                resumen.total && resumen.falta.length ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={Alert02Icon} size={16} className="shrink-0 text-warning" aria-hidden="true" />
                        <Text as="span" size="sm" weight="medium">
                          {plural(resumen.falta.length, 'Falta un dato', `Faltan ${resumen.falta.length} datos`)}
                        </Text>
                      </div>
                      <Text as="span" variant="muted" size="xs" className="tabular-nums">
                        {resumen.listos} de {resumen.total}
                      </Text>
                    </div>
                    <Progress value={(resumen.listos / resumen.total) * 100} aria-label={`${resumen.listos} de ${resumen.total} datos obligatorios`} />
                    <Text as="ul" variant="muted" size="sm" className="ml-6 list-disc">
                      {resumen.falta.map((campo) => (
                        <li key={campo}>{campo}</li>
                      ))}
                    </Text>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="shrink-0 text-success" aria-hidden="true" />
                    <Text as="span" size="sm">
                      Todo lo obligatorio está listo.
                    </Text>
                  </div>
                )
              }
            />
          </div>
        </div>
    </MarcoInmersivo>
  )
}

Component.displayName = 'LmsAgregarRoleplayPage'
