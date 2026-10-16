import { useEffect, useRef, useState, type JSX } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Chemistry01Icon, Delete02Icon } from '@hugeicons/core-free-icons'
import { Alert, AlertDescription, Badge, Button, Frame, FramePanel, Separator, Switch, cn } from '@ubits/flux-ui'
import { Hint } from '@/shared/components/Hint'
import { DialogoConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { TOTAL_WEIGHT, keyActionsTotal, objectiveIssue, parseAmount, type Objective } from '../../../modelo/constructor/cicloBuilderTypes'
import { objectiveChildrenVocab, objectiveModelVocab, type ObjectiveModelId, type ObjectiveModelRules } from '../../../modelo/constructor/objectiveModel'
import type { ObjectiveScope } from '../../../modelo/constructor/objectiveBankTypes'
import { GuardarEnBanco } from '../banco/guardar-en-banco'
import { CabeceraTarjeta } from './cabecera-tarjeta'
import { CampoAcciones, type ModoAvance } from './campo-acciones'
import { CampoAlineacion } from './campo-alineacion'
import { CampoMedida } from './campo-medida'
import { CampoPeso } from './campo-peso'
import { CampoRango } from './campo-rango'
import { CampoTitulo } from './campo-titulo'
import { CampoValores } from './campo-valores'
import { PasoTarjeta } from './piezas'
import { Simulador } from './simulador'
import { useIaTarjeta } from './usar-ia-tarjeta'
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
  alineables: { empresa: readonly Objective[]; ciclo?: readonly Objective[] }
  alineacionRequerida: boolean
  /** Solo asignados: el cupo del set (100 o weightShare) y lo que ya pesan los demás objetivos del set. */
  cupo?: number
  pesoDeLosDemas?: number
  /** Alcance del banco para «Guardar en el banco». */
  alcance: ObjectiveScope
  /** Contexto para la IA de la tarjeta (nombre del ciclo, etc.) si lo necesitas. */
  contextoIa?: { nombreCiclo: string }
  /** Propuesta de la IA todavía sin conservar: anillo de marca y la etiqueta «Propuesta de IA». */
  resaltada?: boolean
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
  alcance,
  resaltada = false,
}: TarjetaObjetivoProps): JSX.Element {
  const id = `objetivo-${objetivo.id}`
  const asignado = variante === 'asignado'
  const vocab = objectiveModelVocab(modelo, reglas)
  const etiqueta = `${asignado ? vocab.objective : `${vocab.objective} de la empresa`} ${numero}`
  const empresa = alineables.empresa
  const ciclo = alineables.ciclo ?? []
  // Los de la empresa son el norte: no cuelgan de nada ni llevan lo que cuelga del objetivo.
  const requiereAlineacion = asignado && alineacionRequerida && empresa.length > 0
  const reglasTarjeta = asignado ? reglas : { ...reglas, children: 'none' as const }
  const incidencia = objectiveIssue(objetivo, { requireWeight: asignado, rules: reglasTarjeta, requireAlignment: requiereAlineacion })
  const conError = conErrores && incidencia !== null

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
  const [guardando, setGuardando] = useState(false)
  const [borrando, setBorrando] = useState(false)

  // Una tarjeta en blanco se abre para escribir en ella de una; si ya tiene título se abrió para revisarla.
  const tarjeta = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!abierta || objetivo.title.trim() !== '') return
    requestAnimationFrame(() => campo.current?.focus())
    // Solo al abrir: si dependiera del título, el foco saltaría en cada tecla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierta])

  // Cada paso nuevo que aparece queda a la vista.
  const visibles = [pasos.medida, pasos.valores, pasos.rango, pasos.peso, pasos.alineacion, pasos.acciones, pasos.prueba].filter(Boolean).length
  useEffect(() => {
    if (!abierta) return
    const reloj = window.setTimeout(() => {
      const todos = tarjeta.current?.querySelectorAll('[data-paso-objetivo]')
      todos?.[todos.length - 1]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 90)
    return () => window.clearTimeout(reloj)
  }, [abierta, visibles, probando])

  const enBlanco = objetivo.title.trim() === '' && objetivo.measure === null
  const booleano = objetivo.measure === 'boolean'
  // Mientras no se elija la medida, los campos de cifras se pintan con la numérica (sin símbolo propio).
  const medidaVista = objetivo.measure !== null && objetivo.measure !== 'boolean' ? objetivo.measure : 'numeric'
  const puedeGuardar = objetivo.title.trim() !== '' && objetivo.measure !== null && (booleano || objetivo.direction !== null)
  const hijos = objectiveChildrenVocab(modelo, reglas)
  const modoAvance: ModoAvance = reglas.children === 'results' ? 'siempre' : reglas.children === 'none' ? 'nunca' : 'eleccion'
  const copyAcciones = textoAcciones(reglas, (hijos.children ?? 'Acciones clave').toLowerCase())
  const mueveAvance = modoAvance === 'siempre' || (modoAvance === 'eleccion' && objetivo.keyActionsDriveProgress)

  let cuenta = 0
  const numeroPaso = () => ++cuenta
  const titulo = objetivo.title.trim()

  return (
    <>
      <div ref={tarjeta} className={cn('rounded-xl', resaltada && 'ring-2 ring-primary/40 ring-offset-2 ring-offset-background')}>
        <Frame id={id}>
          <FramePanel className="[--frame-panel-px:0px] [--frame-panel-py:0px]">
            <CabeceraTarjeta
              objetivo={objetivo}
              etiqueta={etiqueta}
              abierta={abierta}
              onAlternar={() => onAbiertaChange(!abierta)}
              
              incidencia={incidencia}
              conPeso={asignado}
              
              tituloInvalido={conErrores && titulo === ''}
              onTitulo={(title) => onCambio({ title })}
              puedeGuardar={puedeGuardar}
              onGuardar={() => setGuardando(true)}
              onEliminar={() => (enBlanco ? onEliminar() : setBorrando(true))}
            />
            {abierta ? (
              <>
                <Separator />
                <div className="flex flex-col divide-y px-5">
                  <PasoTarjeta numero={numeroPaso()} pregunta="¿Qué quieres lograr?" ayuda="Un resultado concreto, no una tarea.">
                    <CampoTitulo objetivo={objetivo} onCambio={onCambio} ia={ia} campo={campo} invalido={conErrores} />
                  </PasoTarjeta>

                  {pasos.medida ? (
                    <PasoTarjeta numero={numeroPaso()} pregunta="¿Cómo se mide y hacia dónde tiene que moverse?" ayuda="Qué se mide y hacia dónde se mueve.">
                      <CampoMedida objetivo={objetivo} onCambio={onCambio} conErrores={conErrores} />
                    </PasoTarjeta>
                  ) : null}

                  {pasos.valores ? (
                    <PasoTarjeta numero={numeroPaso()} pregunta="¿De dónde partes y a dónde quieres llegar?" ayuda="Con estos dos números se calcula el avance.">
                      <CampoValores objetivo={objetivo} medida={medidaVista} direccion={objetivo.direction ?? 'increase'} onCambio={onCambio} conErrores={conErrores} />
                    </PasoTarjeta>
                  ) : null}

                  {pasos.rango ? (
                    <PasoTarjeta 
                      numero={numeroPaso()} 
                      pregunta={
                        <div className="flex items-center gap-3">
                          <span>Límites del objetivo</span>
                          <Switch checked={objetivo.rangeEnabled} onCheckedChange={pasos.elegirRango} aria-label="Activar mínimos y máximos" />
                        </div>
                      }
                      ayuda="Opcional. El avance es 0 % bajo el piso y no sube más del techo."
                    >
                      {objetivo.rangeEnabled ? (
                        <CampoRango objetivo={objetivo} medida={medidaVista} direccion={objetivo.direction ?? 'increase'} onCambio={onCambio} />
                      ) : null}
                    </PasoTarjeta>
                  ) : null}

                  {pasos.peso ? (
                    <PasoTarjeta numero={numeroPaso()} pregunta="¿Cuánto pesa este objetivo?" ayuda="El peso define su impacto en el ciclo.">
                      <CampoPeso id={id} peso={objetivo.weight} onCambio={(weight) => onCambio({ weight })} pesoDeLosDemas={pesoDeLosDemas} cupo={cupo} conErrores={conErrores} />
                    </PasoTarjeta>
                  ) : null}

                  {pasos.alineacion ? (
                    <PasoTarjeta
                      numero={numeroPaso()}
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
                        invalida={conErrores && requiereAlineacion && objetivo.alignedTo === null}
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
                      <CampoAcciones objetivo={objetivo} onCambio={onCambio} vocab={hijos} modo={modoAvance} conErrores={conErrores} />
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

      {puedeGuardar ? <GuardarEnBanco objetivo={objetivo} alcance={alcance} abierto={guardando} onAbiertoChange={setGuardando} /> : null}

      <DialogoConfirmar
        abierto={borrando}
        onAbiertoChange={setBorrando}
        icono={Delete02Icon}
        destructiva
        titulo={titulo ? `¿Eliminar «${titulo}»?` : `¿Eliminar ${etiqueta.toLowerCase()}?`}
        descripcion={titulo ? `Se eliminará "${titulo}" y toda su configuración. Esta acción no se puede deshacer.` : 'Se eliminará este objetivo y toda su configuración. Esta acción no se puede deshacer.'}
        accion="Eliminar"
        onConfirmar={() => {
          setBorrando(false)
          onEliminar()
        }}
      />
    </>
  )
}
