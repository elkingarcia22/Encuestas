import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Message01Icon, Settings02Icon, Target02Icon } from '@hugeicons/core-free-icons'
import {
  Button,
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
  Input,
  RadioGroup,
  RadioGroupItem,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
} from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import { AiThinking } from '@/shared/components/AiThinking'
import {
  DURACIONES,
  IDIOMAS_AGENTE,
  LIMITE_PROMPT,
  VOCES,
  dificultadesDe,
  sumaPuntos,
  type AjustesAgente,
  type TipoConfiguracion,
} from './etapas'
import { CampoNumero, CampoOpcion } from './piezas'
import { AvisoPropuestaIa, CampoTexto, DistribucionPuntos, FilaCriterio, SelectorVoz } from './piezas-ia'

// Plazo máximo para presentar la sesión, en días: el mismo tope que la entrevista con Serena.
const DIAS_MAX = 30

type Props = {
  abierto: boolean
  onAbiertoChange: (abierto: boolean) => void
  tipo: Extract<TipoConfiguracion, 'idiomas' | 'roleplay'>
  nombreVacante: string
  ajustes: AjustesAgente
  onGuardar: (ajustes: AjustesAgente) => void
  onGenerandoIa?: (mensaje: string | null) => void
  // Abierto desde «Configurar con IA» de la fila: lo que trae es la propuesta de la IA, todavía sin guardar.
  llenadoConIa?: boolean
}

// Panel de las etapas que lleva un agente de IA hablando con el candidato: la prueba de idiomas y
// el role play. Cambian el idioma, la dificultad y los criterios; el resto de la pantalla es igual,
// así que las dos usan este mismo panel.
export function PanelAgente({ abierto, onAbiertoChange, tipo, nombreVacante, ajustes, onGuardar, onGenerandoIa, llenadoConIa = false }: Props) {
  const [borrador, setBorrador] = useState(ajustes)
  const [generando, setGenerando] = useState(false)

  const esIdiomas = tipo === 'idiomas'
  const titulo = esIdiomas ? 'Prueba de idiomas con IA' : 'Role play con IA'
  const cambiar = (cambio: Partial<AjustesAgente>) => setBorrador((actual) => ({ ...actual, ...cambio }))

  // Escribe el personaje ahí mismo, sin abrir otra pantalla (29 sep, reunión con Elkin: el «Crear con IA» de antes
  // cambiaba el panel por un formulario aparte del que solo se salía con «Cancelar»). Mientras escribe, los campos
  // quedan quietos.
  const generar = () => {
    setGenerando(true)
    onGenerandoIa?.('Escribiendo el personaje con IA…')
    window.setTimeout(() => {
      cambiar({
        nombre: esIdiomas
          ? 'Evaluador de inglés conversacional'
          : `Cliente exigente para ${nombreVacante || 'la vacante'}`,
        descripcion: esIdiomas
          ? 'Conversa con el candidato sobre su día a día y su experiencia para medir su nivel real de inglés.'
          : 'Hace de cliente con dudas y objeciones para ver cómo el candidato lleva la conversación hasta el cierre.',
        prompt: esIdiomas
          ? 'Eres un evaluador de inglés. Conversa de forma natural con la persona candidata durante la sesión: preséntate, pregúntale por su experiencia y por una situación difícil que haya resuelto. Sube la dificultad si responde con soltura y baja el ritmo si se traba.'
          : 'Eres un cliente potencial interesado pero escéptico. Plantea dudas de precio y de tiempos de entrega, pide comparaciones con la competencia y no aceptes la primera respuesta.',
      })
      setGenerando(false)
      onGenerandoIa?.(null)
      notify('Escribimos el personaje del agente', 'Revísalo y ajústalo antes de guardar.', 'success')
    }, 1400)
  }

  const completo = borrador.nombre.trim().length > 0 && borrador.prompt.trim().length > 0

  // Se guarda aunque falte algo: lo que frena la vacante es «Publicar», que avisa qué completar.
  const guardar = () => {
    onGuardar(borrador)
    onAbiertoChange(false)
    if (completo) notify(`Guardamos «${borrador.nombre.trim()}»`, undefined, 'success')
    else notify(`Guardamos «${titulo}» sin terminar`, 'Le falta el nombre o el prompt.', 'warning')
  }

  const totalPesos = sumaPuntos(borrador.criterios.map((criterio) => criterio.peso))

  return (
    // Las pestañas van en la cabecera del panel y no dentro del cuerpo: así se quedan arriba al bajar (29 sep, reunión
    // con Elkin). Por eso `Tabs` envuelve al panel entero (`contents`: no ocupa lugar en la página).
    <Tabs defaultValue="personaje" className="contents">
    {/* El panel lateral del playground (DrawerShell), con el orbe: lo que se configura aquí es un agente de IA. */}
    <DrawerShell
      open={abierto}
      onOpenChange={onAbiertoChange}
      size="lg"
      ai
      title={titulo}
      description="Define el personaje que atiende al candidato y cómo se le pone nota."
      headerExtra={
        <div className="border-b px-5">
          <TabsList variant="line" className="w-full justify-start">
            <TabsTrigger value="personaje" className="flex-none">
              <HugeiconsIcon icon={Message01Icon} size={18} aria-hidden="true" />
              Personaje y prompt
            </TabsTrigger>
            <TabsTrigger value="sesion" className="flex-none">
              <HugeiconsIcon icon={Settings02Icon} size={18} aria-hidden="true" />
              Sesión y voz
            </TabsTrigger>
            <TabsTrigger value="evaluacion" className="flex-none">
              <HugeiconsIcon icon={Target02Icon} size={18} aria-hidden="true" />
              Evaluación
            </TabsTrigger>
          </TabsList>
        </div>
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onAbiertoChange(false)}>
            Cancelar
          </Button>
          <Button disabled={generando} onClick={guardar}>
            Guardar configuración
          </Button>
        </>
      }
    >
        {llenadoConIa ? <AvisoPropuestaIa nombreVacante={nombreVacante} /> : null}
        <div className="pt-1">
          <TabsContent value="personaje" className="flex flex-col gap-4">
            <div inert={generando} className="flex flex-col gap-4">
                <Field>
                  <FieldLabel htmlFor="agente-nombre">
                    Nombre del agente
                    <Text as="span" variant="destructive">
                      {' '}
                      *
                    </Text>
                  </FieldLabel>
                  <Input
                    id="agente-nombre"
                    value={borrador.nombre}
                    placeholder={esIdiomas ? 'Ej: Evaluador de inglés conversacional' : 'Ej: Entrenador de ventas B2B'}
                    onChange={(evento) => cambiar({ nombre: evento.target.value })}
                  />
                </Field>

                <CampoTexto
                  id="agente-descripcion"
                  etiqueta="Descripción"
                  limite={300}
                  filas={3}
                  valor={borrador.descripcion}
                  onCambio={(descripcion) => cambiar({ descripcion })}
                  placeholder="En una línea, qué hace este agente."
                />

                <CampoTexto
                  id="agente-prompt"
                  etiqueta="Prompt de la experiencia"
                  descripcion="Cuéntale a la IA qué escena monta y qué papel juega mientras habla con el candidato."
                  limite={LIMITE_PROMPT}
                  filas={8}
                  valor={borrador.prompt}
                  onCambio={(prompt) => cambiar({ prompt })}
                  placeholder={
                    esIdiomas
                      ? 'Describe la conversación que tendrá con el candidato…'
                      : 'Describe la escena y el papel que adopta la IA…'
                  }
                />

            </div>
            {/* El botón de IA va siempre al final de su fila; mientras escribe, en su lugar se ve que está en eso. */}
            <div className="flex min-h-9 items-center justify-end">
              {generando ? (
                <AiThinking label="Escribiendo el personaje…" />
              ) : (
                <BotonIaSecundario onClick={generar}>{completo ? 'Reescribir con IA' : 'Escribir con IA'}</BotonIaSecundario>
              )}
            </div>
          </TabsContent>

          <TabsContent value="sesion" className="flex flex-col gap-6">
            {esIdiomas ? (
              <FieldSet>
                <FieldLegend>Idioma de evaluación</FieldLegend>
                <FieldDescription>El idioma en el que el agente conversa y en el que califica.</FieldDescription>
                <RadioGroup
                  value={borrador.idioma}
                  onValueChange={(idioma) => cambiar({ idioma: idioma as string })}
                  className="grid gap-3 sm:grid-cols-3"
                >
                  {IDIOMAS_AGENTE.map((idioma) => {
                    const id = `agente-idioma-${idioma}`
                    return (
                      <FieldLabel key={idioma} htmlFor={id}>
                        <Field orientation="horizontal">
                          <FieldContent>
                            <FieldTitle>{idioma}</FieldTitle>
                          </FieldContent>
                          <RadioGroupItem value={idioma} id={id} />
                        </Field>
                      </FieldLabel>
                    )
                  })}
                </RadioGroup>
              </FieldSet>
            ) : null}

            <FieldSet>
              <FieldLegend>Nivel de dificultad</FieldLegend>
              <FieldDescription>
                {esIdiomas ? 'Qué tan exigente es la conversación.' : 'Qué tan difícil se lo pone el personaje.'}
              </FieldDescription>
              <RadioGroup
                value={borrador.dificultad}
                onValueChange={(dificultad) => cambiar({ dificultad: dificultad as string })}
                // En dos columnas solo si son pares: con tres, la última quedaría sola.
                className={dificultadesDe(tipo).length % 2 === 0 ? 'grid gap-3 sm:grid-cols-2' : 'grid gap-3'}
              >
                {dificultadesDe(tipo).map((nivel) => {
                  const id = `agente-dificultad-${nivel.valor}`
                  return (
                    <FieldLabel key={nivel.valor} htmlFor={id}>
                      <Field orientation="horizontal">
                        <FieldContent>
                          <FieldTitle>{nivel.valor}</FieldTitle>
                          <FieldDescription>{nivel.detalle}</FieldDescription>
                        </FieldContent>
                        <RadioGroupItem value={nivel.valor} id={id} />
                      </Field>
                    </FieldLabel>
                  )
                })}
              </RadioGroup>
            </FieldSet>

            <CampoOpcion
              id="agente-duracion"
              etiqueta="Duración de la sesión"
              descripcion="Cuánto dura la conversación con el agente."
              valor={borrador.duracion}
              opciones={DURACIONES}
              onCambio={(duracion) => cambiar({ duracion })}
            />

            <FieldSeparator />

            <SelectorVoz
              id="agente-voz"
              etiqueta="Voz del agente"
              descripcion="Es la voz que escuchará el candidato durante toda la sesión."
              voces={VOCES}
              valor={borrador.voz}
              onCambio={(voz) => cambiar({ voz })}
            />
          </TabsContent>

          <TabsContent value="evaluacion" className="flex flex-col gap-4">
            {/* El reparto se queda pegado arriba al bajar por los criterios, como en el panel de Serena. */}
            <div className="sticky -top-4 z-10 -mt-4 bg-popover pt-4">
              <DistribucionPuntos total={totalPesos} detalle={`${borrador.criterios.length} criterios`} />
            </div>

            <FieldSet>
              <FieldLegend>Cómo se reparte la nota</FieldLegend>
              <FieldDescription>Cuánto pesa cada criterio en la nota final. Entre todos suman 100%.</FieldDescription>
              <div className="flex flex-col gap-5">
                {borrador.criterios.map((criterio) => (
                  <FilaCriterio
                    key={criterio.id}
                    id={`criterio-${criterio.id}`}
                    nombre={criterio.nombre}
                    descripcion={criterio.descripcion}
                    peso={criterio.peso}
                    onPeso={(peso) =>
                      cambiar({
                        criterios: borrador.criterios.map((otro) =>
                          otro.id === criterio.id ? { ...otro, peso } : otro,
                        ),
                      })
                    }
                  />
                ))}
              </div>
            </FieldSet>

            <FieldSeparator />

            <FieldSet>
              <FieldLegend>Plazos y mínimo para pasar</FieldLegend>
              <div className="flex flex-col gap-5">
                <CampoNumero
                  id="agente-dias"
                  etiqueta="Días para presentar la sesión"
                  descripcion="Pasado este plazo, la invitación vence."
                  valor={Math.min(borrador.diasExpira, DIAS_MAX)}
                  onCambio={(diasExpira) => cambiar({ diasExpira })}
                  min={1}
                  max={DIAS_MAX}
                  unidad={borrador.diasExpira === 1 ? 'día' : 'días'}
                />
                <CampoNumero
                  id="agente-minimo"
                  etiqueta="Puntaje mínimo para continuar"
                  descripcion="Por debajo de este puntaje no pasa de etapa. El máximo es 100."
                  valor={borrador.puntajeMinimo}
                  onCambio={(puntajeMinimo) => cambiar({ puntajeMinimo })}
                  min={0}
                  max={100}
                  step={5}
                  unidad="pts"
                />
              </div>
            </FieldSet>
          </TabsContent>
        </div>
    </DrawerShell>
    </Tabs>
  )
}
