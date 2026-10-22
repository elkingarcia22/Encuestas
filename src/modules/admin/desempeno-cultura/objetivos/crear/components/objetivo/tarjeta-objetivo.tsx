import { useEffect, useRef, useState, type JSX } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Chemistry01Icon } from '@hugeicons/core-free-icons'
import { Alert, AlertDescription, Button, Frame, FrameHeader, FramePanel, Separator, Switch, cn } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { Hint } from '@/shared/components/Hint'
import { TOTAL_WEIGHT, keyActionsTotal, objectiveIssue, parseAmount, type Objective } from '../../../modelo/constructor/cicloBuilderTypes'
import { objectiveChildrenVocab, objectiveModelVocab, type ObjectiveModelId, type ObjectiveModelRules } from '../../../modelo/constructor/objectiveModel'
import type { ObjectiveScope } from '../../../modelo/constructor/objectiveBankTypes'
import { CabeceraTarjeta } from './cabecera-tarjeta'
import { MARGEN_BARRA, useMostrarAlAbrir } from '../mostrar-al-abrir'
import { CampoAcciones, type ModoAvance } from './campo-acciones'
import { CampoAlineacion, type ObjetivoDelCiclo } from './campo-alineacion'
import { CampoMedida } from './campo-medida'
import { CampoPeso, type ArreglosPeso } from './campo-peso'
import { CampoRango } from './campo-rango'
import { CampoTitulo } from './campo-titulo'
import { CampoValores } from './campo-valores'
import { PasoTarjeta } from './piezas'
import { Simulador } from './simulador'
import { useIaTarjeta } from './usar-ia-tarjeta'
import { PAUSA_PASO } from './usar-diferido'
import { usePasos } from './usar-pasos'

// La tarjeta de un objetivo, de la empresa o asignado (`ObjectiveCardCompact` del prototipo). Un Frame por tarjeta,
// como las secciones de encuestas: la cabecera siempre a la vista y, abierta, los pasos numerados que se van
// destapando a medida que se contesta el anterior (usar-pasos). Solo aparecen los pasos que aplican: los de la empresa
// no llevan peso ni acciones clave, y la alineación solo sale si hay a qué alinearse. Cada cambio se escribe en el
// ciclo al momento; los errores se pintan cuando ya se intentó avanzar (`conErrores`), y entonces al final de la
// tarjeta queda la caja roja con lo que falta.

export interface TarjetaObjetivoProps {
  objetivo: Objective
  /** 1-based, para «Objetivo 2» / «Objetivo de la empresa 2». */
  numero: number
  variante: 'empresa' | 'asignado'
  modelo: ObjectiveModelId | null
  reglas: ObjectiveModelRules
  abierta: boolean
  onAbiertaChange: (abierta: boolean) => void
  onCambio: (cambio: Partial<Objective>) => void
  onEliminar: () => void
  /** Validación encendida (tras intentar avanzar/guardar): pinta errores y la caja roja con la incidencia. */
  conErrores: boolean
  /** Objetivos a los que se puede alinear: los de la empresa y, en individuales, otros del mismo set. */
  alineables: { empresa: readonly Objective[]; ciclo?: readonly ObjetivoDelCiclo[] }
  alineacionRequerida: boolean
  /** Solo asignados: el cupo del set (100 o weightShare) y lo que ya pesan los demás objetivos del set. */
  cupo?: number
  pesoDeLosDemas?: number
  /** Solo asignados: los arreglos del peso que tocan a los demás objetivos del set (los pone la lista). */
  arreglosPeso?: ArreglosPeso
  /** Alcance del objetivo: empresa, grupo o individual (lo usaba «Guardar en el banco», que se quitó el 20-oct). */
  alcance: ObjectiveScope
  /** Contexto para la IA de la tarjeta (nombre del ciclo, etc.) si lo necesitas. */
  contextoIa?: { nombreCiclo: string }
  /** Propuesta de la IA todavía sin conservar: anillo de marca y la etiqueta «Propuesta de IA». */
  resaltada?: boolean
  /** Siempre abierta y sin plegar: la tarjeta es el detalle del objetivo elegido en la lista de la izquierda (la ventana
   *  de la asignación, 21-oct). Plegarla no tendría a dónde ir. */
  fija?: boolean
}

const textoAcciones = (reglas: ObjectiveModelRules, hijos: string) => {
  if (reglas.children === 'none') return { pregunta: `¿Qué ${hijos} quieres dejar anotadas?`, ayuda: 'Opcional. Es el plan para sostener la cifra; no cambia el avance.' }
  const pregunta = reglas.children === 'results' ? `¿Qué ${hijos} demuestran que llegaste?` : `¿Qué ${hijos} llevan a la meta?`
  if (!reglas.childrenRequired) return { pregunta, ayuda: 'Opcional. El trabajo que mueve la cifra; puede calcular el avance.' }
  return { pregunta, ayuda: `Obligatorio. ${reglas.children === 'results' ? 'Cada uno lleva su métrica y de ellos sale el avance.' : 'El trabajo que mueve la cifra.'}` }
}

export function TarjetaObjetivo({
  objetivo,
  numero,
  variante,
  modelo,
  reglas,
  abierta,
  onAbiertaChange,
  onCambio,
  onEliminar,
  conErrores,
  alineables,
  alineacionRequerida,
  cupo = TOTAL_WEIGHT,
  pesoDeLosDemas = 0,
  arreglosPeso,
  resaltada = false,
  fija = false,
}: TarjetaObjetivoProps): JSX.Element {
  const id = `objetivo-${objetivo.id}`
  const asignado = variante === 'asignado'
  const vocab = objectiveModelVocab(modelo, reglas)
  // En la ventana de la asignación (`fija`) siempre «Objetivo»: se está asignando objetivos, aunque el modelo los llame «Indicador».
  const etiqueta = `${fija ? 'Objetivo' : asignado ? vocab.objective : `${vocab.objective} de la empresa`} ${numero}`
  const empresa = alineables.empresa
  const ciclo = alineables.ciclo ?? []
  // Los de la empresa son el norte: no cuelgan de nada ni llevan lo que cuelga del objetivo.
  const requiereAlineacion = asignado && alineacionRequerida && empresa.length > 0
  const reglasTarjeta = asignado ? reglas : { ...reglas, children: 'none' as const }
  const incidencia = objectiveIssue(objetivo, { requireWeight: asignado, rules: reglasTarjeta, requireAlignment: requiereAlineacion })
  // Cerrar la tarjeta con algo pendiente cuenta como haberla revisado (Elkin, 21-oct): al volver a abrirla, lo que falta
  // sale en rojo como tras «Continuar» —cada campo con su borde y su «Completa este campo» (Field con FieldError), y la
  // caja roja al final—, sin esperar a intentar avanzar. Se apaga sola cuando el objetivo queda completo.
  const [revisada, setRevisada] = useState(false)
  const [abiertaAntes, setAbiertaAntes] = useState(abierta)
  if (abiertaAntes !== abierta) {
    setAbiertaAntes(abierta)
    if (!abierta && incidencia !== null) setRevisada(true)
  }
  const errores = conErrores || (revisada && incidencia !== null)
  const conError = errores && incidencia !== null

  const campo = useRef<HTMLInputElement>(null)
  const ia = useIaTarjeta(objetivo, onCambio, campo)
  const pasos = usePasos({
    objetivo,
    onCambio,
    ia,
    requierePeso: asignado,
    pesoLibre: cupo - pesoDeLosDemas,
    hayAlineables: empresa.length > 0 || ciclo.length > 0,
    conAcciones: asignado,
  })

  const [probando, setProbando] = useState(false)
  const [borrando, setBorrando] = useState(false)
  const [limites, mostrarLimites] = useMostrarAlAbrir()

  // Una tarjeta en blanco se abre para escribir en ella de una; si ya tiene título se abrió para revisarla.
  const tarjeta = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!abierta || objetivo.title.trim() !== '') return
    requestAnimationFrame(() => campo.current?.focus())
    // Solo al abrir: si dependiera del título, el foco saltaría en cada tecla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierta])

  // Al completar un paso, la vista baja al siguiente que falta (Elkin, 20-oct), como en la página del ciclo. Al abrir la
  // tarjeta no se mueve nada («apenas sale hace auto scroll»). Si se completó escribiendo (el título, la meta), espera a
  // que salga del campo para no mover la vista en medio de una palabra.
  const completos = [
    objetivo.title.trim() !== '',
    objetivo.measure !== null && (objetivo.measure === 'boolean' || objetivo.direction !== null),
    parseAmount(objetivo.targetValue ?? '') !== null,
    pasos.rangoContestado,
    objetivo.weight > 0,
    objetivo.alignedTo.length > 0,
  ]
  const hechos = completos.filter(Boolean).length
  const hechosAntes = useRef<number | null>(null)
  // Mientras la IA de la tarjeta llena los pasos en cascada, la vista no baja paso a paso (subía y bajaba a saltos,
  // Elkin 21-oct): se anota y, cuando termina, baja una sola vez.
  const bajarAlTerminar = useRef(false)
  useEffect(() => {
    if (!abierta) {
      hechosAntes.current = null
      bajarAlTerminar.current = false
      return
    }
    const antes = hechosAntes.current
    hechosAntes.current = hechos
    const avanzo = antes !== null && hechos > antes
    if (ia.ocupada) {
      if (avanzo) bajarAlTerminar.current = true
      return
    }
    // Al terminar la IA, espera a que los pasos que aparecen con retraso se pinten antes de medir a dónde bajar.
    const tras = bajarAlTerminar.current ? PAUSA_PASO : 90
    bajarAlTerminar.current = false
    if (!avanzo && tras === 90) return
    // El que falta sube arriba del panel: así la atención queda en él y no en lo que ya está listo. Con todo completo (la
    // IA de la tarjeta lo llena entero), baja hasta «Agregar objetivo», si la lista lo marca con `data-fin-objetivos`
    // (Elkin, 21-oct): antes se quedaba en el último paso y el botón no se veía.
    const bajar = () => {
      const falta = tarjeta.current?.querySelector('[data-paso-objetivo][data-completo="no"]')
      if (falta) return falta.scrollIntoView({ behavior: 'smooth', block: 'start' })
      tarjeta.current?.closest('[data-objetivos]')?.querySelector('[data-fin-objetivos]')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
    const activo = document.activeElement
    if (activo instanceof HTMLInputElement || activo instanceof HTMLTextAreaElement) {
      // Si al salir ya va a otro control (un desplegable, otro campo), eligió a dónde ir: mover la vista ahí dejaba la
      // lista del desplegable flotando fuera de su sitio (20-oct). Solo baja si sale del campo sin ir a otro lado.
      const alSalir = (evento: Event) => {
        if (!(evento as FocusEvent).relatedTarget) bajar()
      }
      activo.addEventListener('blur', alSalir, { once: true })
      return () => activo.removeEventListener('blur', alSalir)
    }
    const reloj = window.setTimeout(bajar, tras)
    return () => window.clearTimeout(reloj)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierta, hechos, ia.ocupada])

  const enBlanco = objetivo.title.trim() === '' && objetivo.measure === null
  const booleano = objetivo.measure === 'boolean'
  // Mientras no se elija la medida, los campos de cifras se pintan con la numérica (sin símbolo propio).
  const medidaVista = objetivo.measure !== null && objetivo.measure !== 'boolean' ? objetivo.measure : 'numeric'
  const hijos = objectiveChildrenVocab(modelo, reglas)
  const modoAvance: ModoAvance = reglas.children === 'results' ? 'siempre' : reglas.children === 'none' ? 'nunca' : 'eleccion'
  const copyAcciones = textoAcciones(reglas, (hijos.children ?? 'Acciones clave').toLowerCase())
  const mueveAvance = modoAvance === 'siempre' || (modoAvance === 'eleccion' && objetivo.keyActionsDriveProgress)

  let cuenta = 0
  const numeroPaso = () => ++cuenta
  const titulo = objetivo.title.trim()

  const cabecera = (
    <CabeceraTarjeta
              objetivo={objetivo}
              etiqueta={etiqueta}
              abierta={abierta}
              onAlternar={() => onAbiertaChange(!abierta)}
              plegable={!fija}
              incidencia={incidencia}
              conPeso={asignado}
              
              tituloInvalido={errores && titulo === ''}
              onTitulo={(title) => onCambio({ title })}
              onEliminar={onEliminar}
              confirmarEliminar={
                enBlanco
                  ? undefined
                  : {
                      abierto: borrando,
                      onAbierto: setBorrando,
                      titulo: titulo ? `¿Eliminar «${titulo}»?` : `¿Eliminar ${etiqueta.toLowerCase()}?`,
                      descripcion: 'Se eliminará con toda su configuración. Esta acción no se puede deshacer.',
                      onConfirmar: () => {
                        setBorrando(false)
                        onEliminar()
                      },
                    }
              }
            />
  )
  const pasosJsx = (
                <div className="flex flex-col divide-y px-5">
                  <PasoTarjeta numero={numeroPaso()} completo={completos[0]} conError={errores && !completos[0]} pregunta="¿Qué quieres lograr?" ayuda="Un resultado concreto, no una tarea.">
                    <CampoTitulo objetivo={objetivo} onCambio={onCambio} ia={ia} campo={campo} invalido={errores} />
                  </PasoTarjeta>

                  {pasos.medida ? (
                    <PasoTarjeta numero={numeroPaso()} completo={completos[1]} conError={errores && !completos[1]} pregunta="¿Cómo se mide y hacia dónde tiene que moverse?" ayuda="Qué se mide y hacia dónde se mueve.">
                      <CampoMedida objetivo={objetivo} onCambio={onCambio} conErrores={errores} />
                    </PasoTarjeta>
                  ) : null}

                  {pasos.valores ? (
                    <PasoTarjeta numero={numeroPaso()} completo={completos[2]} conError={errores && !completos[2]} pregunta="¿De dónde partes y a dónde quieres llegar?" ayuda="Con estos dos números se calcula el avance.">
                      <CampoValores objetivo={objetivo} medida={medidaVista} direccion={objetivo.direction ?? 'increase'} onCambio={onCambio} conErrores={errores} />
                    </PasoTarjeta>
                  ) : null}

                  {pasos.rango ? (
                    <PasoTarjeta 
                      numero={numeroPaso()} 
                      completo={completos[3]}
                      pregunta={
                        <div className="flex items-center gap-3">
                          <span>Límites del objetivo</span>
                          <Switch
                            checked={objetivo.rangeEnabled}
                            onCheckedChange={(activo) => {
                              pasos.elegirRango(activo)
                              if (activo) mostrarLimites()
                            }}
                            aria-label="Activar mínimos y máximos"
                          />
                        </div>
                      }
                      ayuda="Opcional. El avance es 0 % bajo el piso y no sube más del techo."
                    >
                      {objetivo.rangeEnabled ? (
                        <div ref={limites} className={MARGEN_BARRA}>
                          <CampoRango objetivo={objetivo} medida={medidaVista} direccion={objetivo.direction ?? 'increase'} onCambio={onCambio} />
                        </div>
                      ) : null}
                    </PasoTarjeta>
                  ) : null}

                  {pasos.peso ? (
                    <PasoTarjeta numero={numeroPaso()} completo={completos[4]} conError={(errores && !completos[4]) || pesoDeLosDemas + objetivo.weight > cupo} pregunta="¿Cuánto pesa este objetivo?" ayuda="El peso define su impacto en el ciclo.">
                      <CampoPeso id={id} peso={objetivo.weight} onCambio={(weight) => onCambio({ weight })} pesoDeLosDemas={pesoDeLosDemas} cupo={cupo} conErrores={errores} arreglos={arreglosPeso} />
                    </PasoTarjeta>
                  ) : null}

                  {pasos.alineacion ? (
                    <PasoTarjeta
                      numero={numeroPaso()}
                      completo={requiereAlineacion ? completos[5] : undefined}
                      conError={errores && requiereAlineacion && !completos[5]}
                      pregunta="¿A qué objetivo contribuye?"
                      ayuda={requiereAlineacion ? 'Este modelo exige colgarlo de un objetivo de la empresa.' : 'La alineación (opcional) muestra el aporte al objetivo general.'}
                    >
                      <CampoAlineacion
                        id={id}
                        valor={objetivo.alignedTo}
                        empresa={empresa}
                        ciclo={ciclo}
                        onCambio={(alignedTo) => onCambio({ alignedTo })}
                        requerida={requiereAlineacion}
                        invalida={errores && requiereAlineacion && objetivo.alignedTo.length === 0}
                      />
                    </PasoTarjeta>
                  ) : null}

                  {pasos.acciones ? (
                    <PasoTarjeta
                      numero={numeroPaso()}
                      pregunta={copyAcciones.pregunta}
                      ayuda={copyAcciones.ayuda}
                      extra={
                        objetivo.keyActions.length > 0 ? (
                          <Badge variant={mueveAvance && keyActionsTotal(objetivo.keyActions) !== TOTAL_WEIGHT ? 'secondary' : 'primary-light'} size="sm" className="tabular-nums">
                            {objetivo.keyActions.length} {(objetivo.keyActions.length === 1 ? hijos.child : hijos.children)?.toLowerCase()}
                          </Badge>
                        ) : undefined
                      }
                    >
                      <CampoAcciones objetivo={objetivo} onCambio={onCambio} vocab={hijos} modo={modoAvance} obligatorio={reglas.children !== 'none' && reglas.childrenRequired} conErrores={errores} />
                    </PasoTarjeta>
                  ) : null}

                  {pasos.prueba && objetivo.measure !== null ? (
                    <PasoTarjeta
                      numero={numeroPaso()}
                      pregunta="¿Cómo se va a calcular el avance?"
                      ayuda="Prueba un resultado para verificar el cumplimiento."
                      extra={
                        <Hint label="Comprueba qué cumplimiento daría un resultado de ejemplo.">
                          <Button variant="outline" size="sm" aria-expanded={probando} onClick={() => setProbando(!probando)}>
                            <HugeiconsIcon icon={Chemistry01Icon} aria-hidden="true" />
                            {probando ? 'Ocultar prueba' : 'Probar objetivo'}
                          </Button>
                        </Hint>
                      }
                    >
                      {probando ? (
                        <Simulador
                          id={id}
                          medida={objetivo.measure}
                          direccion={objetivo.direction ?? 'increase'}
                          inicio={booleano ? 0 : (pasos.salida?.value ?? 0)}
                          meta={booleano ? 1 : (parseAmount(objetivo.targetValue) ?? 1)}
                          minimo={objetivo.rangeEnabled ? parseAmount(objetivo.minValue) : null}
                          maximo={objetivo.rangeEnabled ? parseAmount(objetivo.maxValue) : null}
                        />
                      ) : null}
                    </PasoTarjeta>
                  ) : null}

                  {conError ? (
                    <div className="py-4">
                      <Alert variant="destructive">
                        <AlertDescription>
                          <p>{incidencia}</p>
                        </AlertDescription>
                      </Alert>
                    </div>
                  ) : null}
                </div>
  )

  // La tarjeta fija (el detalle de la ventana de la asignación) va como los contenedores de Participantes («Por grupos»): el
  // título sobre el gris del marco y, debajo, un solo panel blanco con los pasos, sin una caja más dentro.
  if (fija) {
    return (
      <div ref={tarjeta} className={cn('rounded-xl', resaltada && 'ring-2 ring-primary/40 ring-offset-2 ring-offset-background')}>
        <Frame id={id}>
          {/* «p-0!»: la cabecera ya trae su aire (px-5 py-4) y el del FrameHeader lo duplicaba; sin capa, la clase sola no le gana
              (diferencias.json › instalacion-estilos-sin-capa). */}
          <FrameHeader className="p-0!">{cabecera}</FrameHeader>
          <FramePanel className="[--frame-panel-px:0px] [--frame-panel-py:0px]">{pasosJsx}</FramePanel>
        </Frame>
      </div>
    )
  }

  return (
    <>
      <div ref={tarjeta} className={cn('rounded-xl', resaltada && 'ring-2 ring-primary/40 ring-offset-2 ring-offset-background')}>
        <Frame id={id}>
          <FramePanel className="[--frame-panel-px:0px] [--frame-panel-py:0px]">
            {cabecera}
            {abierta ? (
              <>
                <Separator />
                <div className="flex flex-col divide-y px-5">
                  <PasoTarjeta numero={numeroPaso()} completo={completos[0]} conError={errores && !completos[0]} pregunta="¿Qué quieres lograr?" ayuda="Un resultado concreto, no una tarea.">
                    <CampoTitulo objetivo={objetivo} onCambio={onCambio} ia={ia} campo={campo} invalido={errores} />
                  </PasoTarjeta>

                  {pasos.medida ? (
                    <PasoTarjeta numero={numeroPaso()} completo={completos[1]} conError={errores && !completos[1]} pregunta="¿Cómo se mide y hacia dónde tiene que moverse?" ayuda="Qué se mide y hacia dónde se mueve.">
                      <CampoMedida objetivo={objetivo} onCambio={onCambio} conErrores={errores} />
                    </PasoTarjeta>
                  ) : null}

                  {pasos.valores ? (
                    <PasoTarjeta numero={numeroPaso()} completo={completos[2]} conError={errores && !completos[2]} pregunta="¿De dónde partes y a dónde quieres llegar?" ayuda="Con estos dos números se calcula el avance.">
                      <CampoValores objetivo={objetivo} medida={medidaVista} direccion={objetivo.direction ?? 'increase'} onCambio={onCambio} conErrores={errores} />
                    </PasoTarjeta>
                  ) : null}

                  {pasos.rango ? (
                    <PasoTarjeta 
                      numero={numeroPaso()} 
                      completo={completos[3]}
                      pregunta={
                        <div className="flex items-center gap-3">
                          <span>Límites del objetivo</span>
                          <Switch
                            checked={objetivo.rangeEnabled}
                            onCheckedChange={(activo) => {
                              pasos.elegirRango(activo)
                              if (activo) mostrarLimites()
                            }}
                            aria-label="Activar mínimos y máximos"
                          />
                        </div>
                      }
                      ayuda="Opcional. El avance es 0 % bajo el piso y no sube más del techo."
                    >
                      {objetivo.rangeEnabled ? (
                        <div ref={limites} className={MARGEN_BARRA}>
                          <CampoRango objetivo={objetivo} medida={medidaVista} direccion={objetivo.direction ?? 'increase'} onCambio={onCambio} />
                        </div>
                      ) : null}
                    </PasoTarjeta>
                  ) : null}

                  {pasos.peso ? (
                    <PasoTarjeta numero={numeroPaso()} completo={completos[4]} conError={(errores && !completos[4]) || pesoDeLosDemas + objetivo.weight > cupo} pregunta="¿Cuánto pesa este objetivo?" ayuda="El peso define su impacto en el ciclo.">
                      <CampoPeso id={id} peso={objetivo.weight} onCambio={(weight) => onCambio({ weight })} pesoDeLosDemas={pesoDeLosDemas} cupo={cupo} conErrores={errores} arreglos={arreglosPeso} />
                    </PasoTarjeta>
                  ) : null}

                  {pasos.alineacion ? (
                    <PasoTarjeta
                      numero={numeroPaso()}
                      completo={requiereAlineacion ? completos[5] : undefined}
                      conError={errores && requiereAlineacion && !completos[5]}
                      pregunta="¿A qué objetivo contribuye?"
                      ayuda={requiereAlineacion ? 'Este modelo exige colgarlo de un objetivo de la empresa.' : 'La alineación (opcional) muestra el aporte al objetivo general.'}
                    >
                      <CampoAlineacion
                        id={id}
                        valor={objetivo.alignedTo}
                        empresa={empresa}
                        ciclo={ciclo}
                        onCambio={(alignedTo) => onCambio({ alignedTo })}
                        requerida={requiereAlineacion}
                        invalida={errores && requiereAlineacion && objetivo.alignedTo.length === 0}
                      />
                    </PasoTarjeta>
                  ) : null}

                  {pasos.acciones ? (
                    <PasoTarjeta
                      numero={numeroPaso()}
                      pregunta={copyAcciones.pregunta}
                      ayuda={copyAcciones.ayuda}
                      extra={
                        objetivo.keyActions.length > 0 ? (
                          <Badge variant={mueveAvance && keyActionsTotal(objetivo.keyActions) !== TOTAL_WEIGHT ? 'secondary' : 'primary-light'} size="sm" className="tabular-nums">
                            {objetivo.keyActions.length} {(objetivo.keyActions.length === 1 ? hijos.child : hijos.children)?.toLowerCase()}
                          </Badge>
                        ) : undefined
                      }
                    >
                      <CampoAcciones objetivo={objetivo} onCambio={onCambio} vocab={hijos} modo={modoAvance} obligatorio={reglas.children !== 'none' && reglas.childrenRequired} conErrores={errores} />
                    </PasoTarjeta>
                  ) : null}

                  {pasos.prueba && objetivo.measure !== null ? (
                    <PasoTarjeta
                      numero={numeroPaso()}
                      pregunta="¿Cómo se va a calcular el avance?"
                      ayuda="Prueba un resultado para verificar el cumplimiento."
                      extra={
                        <Hint label="Comprueba qué cumplimiento daría un resultado de ejemplo.">
                          <Button variant="outline" size="sm" aria-expanded={probando} onClick={() => setProbando(!probando)}>
                            <HugeiconsIcon icon={Chemistry01Icon} aria-hidden="true" />
                            {probando ? 'Ocultar prueba' : 'Probar objetivo'}
                          </Button>
                        </Hint>
                      }
                    >
                      {probando ? (
                        <Simulador
                          id={id}
                          medida={objetivo.measure}
                          direccion={objetivo.direction ?? 'increase'}
                          inicio={booleano ? 0 : (pasos.salida?.value ?? 0)}
                          meta={booleano ? 1 : (parseAmount(objetivo.targetValue) ?? 1)}
                          minimo={objetivo.rangeEnabled ? parseAmount(objetivo.minValue) : null}
                          maximo={objetivo.rangeEnabled ? parseAmount(objetivo.maxValue) : null}
                        />
                      ) : null}
                    </PasoTarjeta>
                  ) : null}

                  {conError ? (
                    <div className="py-4">
                      <Alert variant="destructive">
                        <AlertDescription>
                          <p>{incidencia}</p>
                        </AlertDescription>
                      </Alert>
                    </div>
                  ) : null}
                </div>
              </>
            ) : null}
          </FramePanel>
        </Frame>
      </div>

    </>
  )
}
