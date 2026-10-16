import { useState } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Call02Icon,
  Copy01Icon,
  Delete02Icon,
  DragDropVerticalIcon,
  Message01Icon,
  PencilEdit02Icon,
  PlusSignIcon,
  Settings02Icon,
  Target02Icon,
  Video01Icon,
} from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  Card,
  CardContent,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
  IconTile,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  RadioGroup,
  RadioGroupItem,
  Sortable,
  SortableItem,
  SortableItemHandle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import { CampoNumero } from './piezas'
import { BotonIcono } from '@/shared/components/BotonIcono'
import {
  LIMITE_OBJETIVO,
  LIMITE_PREGUNTA,
  LIMITE_PUNTOS,
  VOCES_SERENA,
  preguntaNueva,
  sumaPuntos,
  type AjustesEntrevista,
  type Pregunta,
} from './etapas'
import { AvisoPropuestaIa, CampoTexto, DistribucionPuntos, GeneradorIa, SelectorVoz } from './piezas-ia'

// Plazo máximo para presentar la entrevista, en días.
const DIAS_MAX = 30

const MODALIDADES_ENTREVISTA: {
  valor: AjustesEntrevista['modalidad']
  titulo: string
  detalle: string
  icono: IconSvgElement
}[] = [
  { valor: 'telefonica', titulo: 'Telefónica', detalle: 'Solo voz, sin cámara.', icono: Call02Icon },
  { valor: 'virtual', titulo: 'Virtual', detalle: 'Con cámara, como una videollamada.', icono: Video01Icon },
]

const EJEMPLOS: Array<Omit<Pregunta, 'id'>> = [
  {
    objetivo: 'Ver cómo aprende algo nuevo y se adapta cuando el trabajo cambia de rumbo.',
    texto:
      'Cuéntame de una vez en que tuviste que aprender rápido una herramienta o un proceso nuevo. ¿Cómo lo hiciste?',
    puntos: 20,
  },
  {
    objetivo: 'Entender cómo prioriza y hace seguimiento cuando tiene varias cosas encima.',
    texto:
      'Cuando manejas varias tareas a la vez, ¿cómo decides qué atender primero y cómo te aseguras de que todo avance?',
    puntos: 20,
  },
  {
    objetivo: 'Conocer qué le interesa del cargo y qué cree que puede aportar.',
    texto: '¿Qué te motiva de esta oportunidad y qué crees que puedes aportar desde el primer mes?',
    puntos: 20,
  },
  {
    objetivo: 'Medir cómo se comunica y coordina con otras personas del equipo.',
    texto: 'Descríbeme una ocasión en la que tuviste que ponerte de acuerdo con alguien para sacar algo adelante.',
    puntos: 20,
  },
  {
    objetivo: 'Ver qué tan autónomo es cuando nadie está encima del trabajo.',
    texto: 'Cuéntame de un momento en que trabajaste con poca supervisión. ¿Cómo te aseguraste de cumplir?',
    puntos: 20,
  },
  {
    objetivo: 'Ver cómo maneja un desacuerdo con alguien del equipo.',
    texto: 'Cuéntame de una vez en que no estuviste de acuerdo con un compañero. ¿Qué hiciste y cómo terminó?',
    puntos: 20,
  },
  {
    objetivo: 'Entender cómo reacciona ante un error propio.',
    texto: 'Háblame de un error que hayas cometido en el trabajo. ¿Cómo lo detectaste y qué hiciste después?',
    puntos: 20,
  },
  {
    objetivo: 'Conocer cómo organiza su semana cuando tiene entregas con fecha.',
    texto: '¿Cómo planeas tu semana cuando tienes varias entregas con fecha fija?',
    puntos: 20,
  },
  {
    objetivo: 'Medir su orientación a resultados con un ejemplo concreto.',
    texto: 'Cuéntame de un logro del que te sientas orgulloso. ¿Qué parte fue tuya y cómo mediste el resultado?',
    puntos: 20,
  },
  {
    objetivo: 'Ver cómo pide ayuda y cuándo decide escalar un problema.',
    texto: 'Cuando te bloqueas con algo, ¿en qué momento pides ayuda y a quién acudes?',
    puntos: 20,
  },
  {
    objetivo: 'Entender cómo recibe y usa la retroalimentación.',
    texto: 'Cuéntame de una retroalimentación difícil que hayas recibido. ¿Qué cambiaste a partir de ella?',
    puntos: 20,
  },
  {
    objetivo: 'Conocer cómo explica algo complejo a alguien que no es del área.',
    texto: 'Explícame algo de tu trabajo como se lo contarías a alguien que no sabe nada del tema.',
    puntos: 20,
  },
  {
    objetivo: 'Ver su iniciativa para mejorar un proceso sin que se lo pidan.',
    texto: '¿Alguna vez propusiste mejorar la forma de hacer algo en tu equipo? ¿Qué pasó con esa idea?',
    puntos: 20,
  },
  {
    objetivo: 'Medir cómo trabaja bajo presión y con poco tiempo.',
    texto: 'Cuéntame de una situación con muy poco tiempo para entregar. ¿Cómo la sacaste adelante?',
    puntos: 20,
  },
  {
    objetivo: 'Saber qué espera del equipo y del líder en su próximo trabajo.',
    texto: '¿Cómo es el equipo y el líder con los que mejor trabajas?',
    puntos: 20,
  },
]

type Props = {
  abierto: boolean
  onAbiertoChange: (abierto: boolean) => void
  ajustes: AjustesEntrevista
  onGuardar: (ajustes: AjustesEntrevista) => void
  onGenerandoIa?: (mensaje: string | null) => void
  // Abierto desde «Configurar con IA» de la fila: las preguntas son la propuesta de la IA, todavía sin guardar.
  llenadoConIa?: boolean
  nombreVacante?: string
}

// Panel de la entrevista con Serena AI: las preguntas que hace y cómo se presenta ante el candidato.
export function PanelEntrevista({ abierto, onAbiertoChange, ajustes, onGuardar, onGenerandoIa, llenadoConIa = false, nombreVacante = '' }: Props) {
  const [borrador, setBorrador] = useState(ajustes)
  const [editando, setEditando] = useState<Pregunta | null>(null)
  const [generando, setGenerando] = useState(false)
  const [cuantas, setCuantas] = useState(5)

  const cambiar = (cambio: Partial<AjustesEntrevista>) => setBorrador((actual) => ({ ...actual, ...cambio }))
  const { preguntas } = borrador

  const ponerPreguntas = (nuevas: Pregunta[]) => cambiar({ preguntas: nuevas })

  const guardarPregunta = (pregunta: Pregunta) => {
    const existe = preguntas.some((otra) => otra.id === pregunta.id)
    ponerPreguntas(
      existe ? preguntas.map((otra) => (otra.id === pregunta.id ? pregunta : otra)) : [...preguntas, pregunta],
    )
    setEditando(null)
  }

  const duplicar = (pregunta: Pregunta) => ponerPreguntas([...preguntas, { ...pregunta, id: preguntaNueva().id }])

  const creando = generando || editando !== null
  const total = sumaPuntos(preguntas.map((pregunta) => pregunta.puntos))
  const puntosLibres = Math.max(0, LIMITE_PUNTOS - total)
  const hayPreguntas = preguntas.length > 0
  // Las nuevas no repiten las que ya están y, entre todas, no pasan del máximo de preguntas.
  const disponibles = EJEMPLOS.filter((ejemplo) => !preguntas.some((pregunta) => pregunta.texto === ejemplo.texto))
  const maxNuevas = Math.min(disponibles.length, EJEMPLOS.length - preguntas.length)
  const cantidadNuevas = Math.max(1, Math.min(cuantas, maxNuevas))

  // La IA del playground no escribe de verdad: toma preguntas de ejemplo, las suma a las que ya hay y les reparte
  // solo los puntos que quedan libres.
  const generar = (contexto: string) => {
    setGenerando(false)
    const cantidad = Math.min(cantidadNuevas, maxNuevas)
    const puntos = Math.floor(puntosLibres / cantidad)
    const nuevas = disponibles.slice(0, cantidad).map((ejemplo, indice) => ({
      ...preguntaNueva(),
      ...ejemplo,
      puntos: indice === 0 ? puntosLibres - puntos * (cantidad - 1) : puntos,
    }))
    ponerPreguntas([...preguntas, ...nuevas])
    const titulo = hayPreguntas
      ? `Sumamos ${cantidad} ${cantidad === 1 ? 'pregunta' : 'preguntas'} a las que ya tenías`
      : `Escribimos ${cantidad} ${cantidad === 1 ? 'pregunta' : 'preguntas'}`
    const detalle =
      hayPreguntas && puntosLibres === 0
        ? 'Ya tenías los 100 pts repartidos: las nuevas entran con 0 pts. Ajusta los puntajes antes de guardar.'
        : contexto
          ? 'Las ajustamos al contexto que diste. Revísalas antes de guardar.'
          : 'Revísalas y cámbialas a tu manera de preguntar.'
    notify(titulo, detalle, 'success')
  }

  // Se guarda aunque falte algo: lo que frena la vacante es «Publicar», que avisa qué completar.
  const guardar = () => {
    onGuardar(borrador)
    onAbiertoChange(false)
    if (borrador.preguntas.length === 0) notify('Guardamos la entrevista sin preguntas', 'Agrégalas antes de publicar la vacante.', 'warning')
    else notify('Guardamos la entrevista con Serena AI', undefined, 'success')
  }

  return (
    // Las pestañas van en la cabecera del panel y no dentro del cuerpo: así se quedan arriba al bajar por las preguntas
    // (29 sep, reunión con Elkin). Por eso `Tabs` envuelve al panel entero (`contents`: no ocupa lugar en la página).
    <Tabs defaultValue="preguntas" className="contents">
    {/* El panel lateral del playground (DrawerShell), con el orbe: Serena es un agente de IA. */}
    <DrawerShell
      open={abierto}
      onOpenChange={onAbiertoChange}
      size="lg"
      ai
      title="Entrevista con Serena AI"
      description="Las preguntas que hace Serena y cómo habla con el candidato."
      headerExtra={
        creando ? undefined : (
          <div className="border-b px-5">
            <TabsList variant="line" className="w-full justify-start">
              <TabsTrigger value="preguntas" className="flex-none">
                <HugeiconsIcon icon={Message01Icon} size={18} aria-hidden="true" />
                Preguntas
              </TabsTrigger>
              <TabsTrigger value="formato" className="flex-none">
                <HugeiconsIcon icon={Settings02Icon} size={18} aria-hidden="true" />
                Formato y voz
              </TabsTrigger>
            </TabsList>
          </div>
        )
      }
      // Mientras se crea una pregunta (a mano o con IA) el pie se oculta: la acción es la del editor o el generador.
      footer={
        creando ? undefined : (
          <>
            <Button variant="outline" onClick={() => onAbiertoChange(false)}>
              Cancelar
            </Button>
            <Button onClick={guardar}>
              Guardar configuración
            </Button>
          </>
        )
      }
    >
        {llenadoConIa && !creando ? <AvisoPropuestaIa nombreVacante={nombreVacante} /> : null}
        <div className="pt-1">
          <TabsContent value="preguntas" className="flex flex-col gap-4">
            {/* El reparto va siempre primero y se queda pegado arriba al bajar por la lista o al editar
                una pregunta: así se ve cuántos puntos quedan mientras se ajusta cada una. */}
            {preguntas.length > 0 ? (
              <div className="sticky -top-4 z-10 -mt-4 bg-popover pt-4">
                <DistribucionPuntos
                  total={total}
                  detalle={`${preguntas.length} ${preguntas.length === 1 ? 'pregunta' : 'preguntas'}`}
                />
              </div>
            ) : null}
            {generando ? (
              <GeneradorIa
                titulo={hayPreguntas ? 'Crear más preguntas con IA' : 'Escribir las preguntas con IA'}
                descripcion={
                  hayPreguntas
                    ? `Se suman a las ${preguntas.length} que ya tienes, sin repetirlas. Quedan ${puntosLibres} de ${LIMITE_PUNTOS} pts libres y la IA reparte solo esos entre las nuevas.`
                    : 'La IA propone preguntas con su objetivo y su puntaje a partir de la vacante.'
                }
                placeholder="Ej: empresa en crecimiento, trabajo híbrido, foco en servicio…"
                extra={
                  <CampoNumero
                    id="entrevista-cantidad"
                    etiqueta={hayPreguntas ? 'Cuántas preguntas nuevas' : 'Cuántas preguntas'}
                    descripcion={
                      hayPreguntas
                        ? `De 1 a ${maxNuevas}; entre todas no pasan de ${EJEMPLOS.length} preguntas.`
                        : `De 1 a ${EJEMPLOS.length}; los puntos se reparten entre todas.`
                    }
                    valor={cantidadNuevas}
                    onCambio={setCuantas}
                    min={1}
                    max={Math.max(1, maxNuevas)}
                    disabled={maxNuevas <= 1}
                    unidad={cantidadNuevas === 1 ? 'pregunta' : 'preguntas'}
                  />
                }
                volverA="las preguntas"
                onGenerar={generar}
                onCerrar={() => setGenerando(false)}
                onGenerandoIa={onGenerandoIa}
              />
            ) : null}

            {/* La clave reinicia el editor al pasar de una pregunta a otra: si no, se quedaría con el texto de la anterior. */}
            {editando ? (
              <EditorPregunta
                key={editando.id}
                pregunta={editando}
                onGuardar={guardarPregunta}
                onCancelar={() => setEditando(null)}
              />
            ) : null}

            {preguntas.length === 0 && !editando && !generando ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <HugeiconsIcon icon={Message01Icon} aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle>Todavía no hay preguntas</EmptyTitle>
                  <EmptyDescription>
                    Escríbelas tú o deja que la IA las proponga a partir de la vacante.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent className="flex-row justify-center">
                  <Button variant="outline" onClick={() => setEditando(preguntaNueva())}>
                    <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />
                    Escribir una pregunta
                  </Button>
                  <BotonIaSecundario onClick={() => setGenerando(true)}>Crear con IA</BotonIaSecundario>
                </EmptyContent>
              </Empty>
            ) : null}

            {/* Mientras se crea o edita una pregunta (a mano o con IA) solo se ve el editor o el generador, con el
                reparto arriba: la lista vuelve al guardar o cancelar. */}
            {preguntas.length > 0 && !creando ? (
              <>
                <Sortable
                  value={preguntas}
                  onValueChange={ponerPreguntas}
                  getItemValue={(pregunta) => pregunta.id}
                  className="flex flex-col gap-3"
                >
                  {preguntas.map((pregunta, indice) => (
                    <SortableItem key={pregunta.id} value={pregunta.id}>
                      <TarjetaPregunta
                        pregunta={pregunta}
                        numero={indice + 1}
                        onEditar={() => setEditando(pregunta)}
                        onDuplicar={() => duplicar(pregunta)}
                        onQuitar={() => ponerPreguntas(preguntas.filter((otra) => otra.id !== pregunta.id))}
                      />
                    </SortableItem>
                  ))}
                </Sortable>
                <div className="flex flex-wrap justify-end gap-2">
                    <Button variant="outline" onClick={() => setEditando(preguntaNueva())}>
                      <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />
                      Agregar pregunta
                    </Button>
                    {/* El botón de IA va siempre al final de su fila. */}
                    <BotonIaSecundario disabled={maxNuevas === 0} onClick={() => setGenerando(true)}>
                      Crear con IA
                    </BotonIaSecundario>
                  </div>
              </>
            ) : null}
          </TabsContent>

          <TabsContent value="formato" className="flex flex-col gap-6">
            <FieldSet>
              <FieldLegend>Tipo de entrevista</FieldLegend>
              <FieldDescription>Cómo se encuentra Serena con el candidato.</FieldDescription>
              <RadioGroup
                value={borrador.modalidad}
                onValueChange={(modalidad) => cambiar({ modalidad: modalidad as AjustesEntrevista['modalidad'] })}
                className="grid gap-3 sm:grid-cols-2"
              >
                {MODALIDADES_ENTREVISTA.map((opcion) => (
                  <FieldLabel key={opcion.valor} htmlFor={`entrevista-${opcion.valor}`}>
                    <Field orientation="horizontal">
                      <IconTile variant="soft" size="sm" className="shrink-0">
                        <HugeiconsIcon icon={opcion.icono} aria-hidden="true" />
                      </IconTile>
                      <FieldContent>
                        <FieldTitle>{opcion.titulo}</FieldTitle>
                        <FieldDescription>{opcion.detalle}</FieldDescription>
                      </FieldContent>
                      <RadioGroupItem value={opcion.valor} id={`entrevista-${opcion.valor}`} />
                    </Field>
                  </FieldLabel>
                ))}
              </RadioGroup>
            </FieldSet>

            <SelectorVoz
              id="entrevista-voz"
              etiqueta="Voz de Serena"
              descripcion="El acento con el que Serena habla con los candidatos de esta vacante."
              voces={VOCES_SERENA}
              valor={borrador.voz}
              onCambio={(voz) => cambiar({ voz })}
            />

            <FieldSeparator />

            <FieldSet>
              <FieldLegend>Plazos y mínimo para pasar</FieldLegend>
              <div className="flex flex-col gap-5">
                <CampoNumero
                  id="entrevista-dias"
                  etiqueta="Días para presentar la entrevista"
                  descripcion="Pasado este plazo, la invitación vence."
                  valor={borrador.diasExpira}
                  onCambio={(diasExpira) => cambiar({ diasExpira })}
                  min={1}
                  max={DIAS_MAX}
                  unidad={borrador.diasExpira === 1 ? 'día' : 'días'}
                />
                <CampoNumero
                  id="entrevista-minimo"
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

function TarjetaPregunta({
  pregunta,
  numero,
  onEditar,
  onDuplicar,
  onQuitar,
}: {
  pregunta: Pregunta
  numero: number
  onEditar: () => void
  onDuplicar: () => void
  onQuitar: () => void
}) {
  return (
    <Item variant="outline" className="items-start">
      <SortableItemHandle
        render={<BotonIcono aria-label={`Mover la pregunta ${numero}`} className="shrink-0 text-muted-foreground!" />}
      >
        <HugeiconsIcon icon={DragDropVerticalIcon} size={18} aria-hidden="true" />
      </SortableItemHandle>
      <ItemContent className="gap-3">
        <ItemTitle>
          <Badge variant="secondary" radius="full" className="tabular-nums">
            {numero}
          </Badge>
          {pregunta.texto}
        </ItemTitle>
        {/* Lo que Serena mira para poner nota: no lo ve el candidato. */}
        <Item variant="muted" size="sm">
          <ItemMedia variant="icon">
            <HugeiconsIcon icon={Target02Icon} aria-hidden="true" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Qué quiere ver Serena</ItemTitle>
            <ItemDescription>{pregunta.objetivo}</ItemDescription>
          </ItemContent>
        </Item>
      </ItemContent>
      <ItemActions className="flex-col items-end">
        <Badge variant="info-light" className="tabular-nums">
          {pregunta.puntos} pts
        </Badge>
        <div className="flex items-center">
          <BotonIcono aria-label={`Editar la pregunta ${numero}`} onClick={onEditar}>
            <HugeiconsIcon icon={PencilEdit02Icon} size={18} />
          </BotonIcono>
          <BotonIcono aria-label={`Duplicar la pregunta ${numero}`} onClick={onDuplicar}>
            <HugeiconsIcon icon={Copy01Icon} size={18} />
          </BotonIcono>
          <BotonIcono aria-label={`Quitar la pregunta ${numero}`} className="text-destructive!" onClick={onQuitar}>
            <HugeiconsIcon icon={Delete02Icon} size={18} />
          </BotonIcono>
        </div>
      </ItemActions>
    </Item>
  )
}

function EditorPregunta({
  pregunta,
  onGuardar,
  onCancelar,
}: {
  pregunta: Pregunta
  onGuardar: (pregunta: Pregunta) => void
  onCancelar: () => void
}) {
  const [borrador, setBorrador] = useState(pregunta)

  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-4">
        <CampoTexto
          id="pregunta-objetivo"
          etiqueta="Qué quieres que mire Serena"
          descripcion="No lo ve el candidato: es la instrucción con la que Serena le pone nota a la respuesta."
          limite={LIMITE_OBJETIVO}
          filas={3}
          valor={borrador.objetivo}
          onCambio={(objetivo) => setBorrador({ ...borrador, objetivo })}
          placeholder="Ej: ver cómo resuelve problemas técnicos complejos"
        />
        <CampoTexto
          id="pregunta-texto"
          etiqueta="La pregunta"
          limite={LIMITE_PREGUNTA}
          filas={3}
          valor={borrador.texto}
          onCambio={(texto) => setBorrador({ ...borrador, texto })}
          placeholder="Escríbela tal cual se la va a hacer al candidato"
        />
        <Field>
          <div className="flex w-full items-start gap-4">
            <div className="flex-1 space-y-1">
              <FieldLabel htmlFor="pregunta-puntos">Cuánto vale</FieldLabel>
              <FieldDescription>Entre todas las preguntas no pueden pasarse de 100 puntos.</FieldDescription>
            </div>
            <div className="w-[120px] shrink-0">
              <InputGroup>
                <InputGroupInput
                  id="pregunta-puntos"
                  type="number"
                  min={0}
                  max={100}
                  value={borrador.puntos}
                  onChange={(e) => setBorrador({ ...borrador, puntos: Number(e.target.value) || 0 })}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>pts</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </div>
          </div>
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancelar}>
            Cancelar
          </Button>
          <Button disabled={!borrador.objetivo.trim() || !borrador.texto.trim()} onClick={() => onGuardar(borrador)}>
            Guardar pregunta
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
