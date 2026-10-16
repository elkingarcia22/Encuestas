import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, InformationCircleIcon, MoreHorizontalIcon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  Text,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { AiThinking } from '@/shared/components/AiThinking'
import { Demo, EncabezadoPatron, PestanasDePatron, Reglas, SectionIntro, VerEnAccion, type Regla } from '../patrones/piezas'
import { Composer } from '@/modules/admin/suite-ai/shared/composer'
import { destino } from '../templates/admin-compartido/rutas'
import { AiCard } from '@/shared/components/AiCard'
import { BotonIa } from '@/shared/components/BotonIa'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import { notify } from '@/shared/components/notify'
import { ReopenAgentButton } from '../agente-contextual/components/agent-kit'
import { BarraEnVivo } from '../barra-lateral/components/barra-en-vivo'
import { IconoIA } from './icono-ia'
import { EtiquetaIA } from './etiqueta-ia'

// Suite AI › Piezas de IA: todo lo que en el producto dice «esto lo hace la IA». Nada existe todavía como
// componente de flux-ui: lo que ya está hecho se muestra en capturas del producto y lo que falta queda en
// Pendientes, para pedirlo a la librería. Los casos del agente viven en Agente contextual (Nicolás).

const PESTANAS = [
  { valor: 'botones', etiqueta: 'Botones' },
  { valor: 'superficies', etiqueta: 'Superficies' },
  { valor: 'estados', etiqueta: 'Estados' },
  { valor: 'vocabulario', etiqueta: 'Vocabulario' },
  { valor: 'pendientes', etiqueta: 'Pendientes' },
]

// Auditoría del 5 oct (decisión 10): un solo primario de IA (BotonIa, el degradado), el secundario de IA y «Orbit
// Flow». El terciario de IA y el de solo icono con el orbe eran propuestas y se retiraron: no se arman a mano.
const REGLAS_BOTONES: Regla[] = [
  { titulo: 'Siempre el último', detalle: 'Todo botón de IA va al final de su fila, a la derecha de todo, después del primario. «Orbit Flow» cierra la fila. El «⋯» va al otro extremo, el primero.' },
  { titulo: 'Uno por vista', detalle: 'La acción de IA principal lleva el degradado y es una sola. La segunda acción de IA va con contorno y el orbe.' },
  { titulo: 'En superficie de IA manda el de IA', detalle: 'Dentro de una tarjeta o panel de IA, el botón principal es el de IA, no el azul normal.' },
  { titulo: 'Pastilla solo aquí', detalle: 'El radio completo es la marca de la IA. En el resto del producto se usan las esquinas de la librería.' },
  { titulo: 'El orbe va al inicio', detalle: 'En el secundario y en «Orbit Flow», antes del texto. El primario no lleva icono: el degradado ya es la marca. Nada de estrellas ni chispas.' },
  { titulo: 'Sin borde', detalle: 'El degradado va solo. El borde en degradado y el brillo extra se descartaron para no sumar variantes.' },
]

const VOCABULARIO = [
  { ingles: 'Nudge', nuestro: 'Aviso sugerido', donde: 'La franja «Ya ejecuta acciones en Selección» sobre el cuadro de escritura.' },
  { ingles: 'Suggestions', nuestro: 'Sugerencias', donde: 'Las pastillas con temas propuestos antes de escribir («Plan de formación para Ventas»).' },
  { ingles: 'Autofill', nuestro: 'Completar por mí', donde: 'El agente llena un formulario y la persona revisa antes de guardar.' },
  { ingles: 'Chain actions', nuestro: 'Acciones encadenadas', donde: 'El agente propone varios pasos y se aprueban juntos (aprobación de Orbit).' },
  { ingles: 'Agent panel', nuestro: 'Orbit Flow', donde: 'El panel del borde derecho que acompaña la pantalla donde estás: el agente contextual. También es el nombre del botón que lo abre.' },
  { ingles: 'Streaming', nuestro: 'Escribiendo', donde: 'La respuesta aparece palabra por palabra, con el cursor parpadeando.' },
  { ingles: 'Thinking', nuestro: 'Razonando', donde: 'Antes de la respuesta: el orbe, el texto con brillo y los segundos que lleva.' },
]

const PENDIENTES: Regla[] = [
  { titulo: 'Variante de IA en la librería', detalle: 'Pedir el botón con degradado, en pastilla, para no depender de estilos propios del marco.' },
  { titulo: 'Orbe y burbuja animados', detalle: 'Hoy el orbe es una imagen. Carlos propone hacerlo con WebGL para que se mueva de verdad.' },
  { titulo: 'Terminología', detalle: 'Alinear los nombres con Shape of AI (shapeof.ai), la referencia que compartió Carlos.' },
  { titulo: 'La pestaña Orbit del design system', detalle: 'Hoy lleva al producto. Debería abrir estas piezas cuando estás en el design system.' },
  { titulo: 'Estado «razonando» en la librería', detalle: 'Ya hay una sola forma nuestra (orbe, texto con brillo y segundos). Falta pedírsela a la librería para no mantenerla aquí.' },
]

function Botones() {
  const abrirAgente = () => notify('En la pantalla real se abre Orbit Flow, el agente contextual', undefined, 'info')
  return (
    <div className="flex flex-col gap-6">
      <SectionIntro
        title="Jerarquía de IA"
        description="Tres botones y nada más: el primario con el degradado, el secundario con contorno y el orbe, y «Orbit Flow», que abre el agente. Los tres en pastilla."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Demo title="Primario de IA" description="Degradado sin borde, en pastilla y sin icono. Uno solo por vista: «Nueva conversación», en Orbit." centrado>
          <div className="flex justify-center py-4">
            <BotonIa>Nueva conversación</BotonIa>
          </div>
        </Demo>
        <Demo title="Secundario de IA" description="Con contorno, el orbe y en pastilla. La segunda acción de IA de una vista, junto al primario." centrado>
          <div className="flex justify-center py-4">
            <BotonIaSecundario nativeButton={false} render={<Link to={destino('contenidos')} />}>
              Crear con IA
            </BotonIaSecundario>
          </div>
        </Demo>
        <Demo title="Orbit Flow" description="El botón que abre el agente contextual. Se llama «Orbit Flow» y va siempre el último de su fila." centrado>
          <div className="flex justify-center py-4">
            <ReopenAgentButton onClick={abrirAgente} />
          </div>
        </Demo>
        <Demo title="Orbit Flow, solo el orbe" description="Cuando la cabecera ya viene muy cargada. El nombre sale al pasar el cursor." centrado>
          <div className="flex justify-center py-4">
            <ReopenAgentButton compact onClick={abrirAgente} />
          </div>
        </Demo>
      </div>
      <Demo title="Orden en la fila" description="«⋯» · terciario · secundario · primario · IA. Los de IA van al final y «Orbit Flow» cierra la fila.">
        <div className="flex flex-wrap items-center justify-end gap-2 py-2">
          <BotonIcono aria-label="Más acciones">
            <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
          </BotonIcono>
          <Button variant="ghost">Exportar</Button>
          <Button variant="outline">Vista previa</Button>
          <Button>Publicar</Button>
          <BotonIaSecundario>Revisar con IA</BotonIaSecundario>
          <ReopenAgentButton onClick={abrirAgente} />
        </div>
      </Demo>
      <Reglas titulo="Reglas" reglas={REGLAS_BOTONES} />
    </div>
  )
}

// El cuadro de escritura real del chat de Suite AI (antes era una captura). Se puede escribir; enviar lo limpia.
function CuadroDeEscritura() {
  const [texto, setTexto] = useState('')
  const [novedad, setNovedad] = useState(true)
  return (
    <Composer
      value={texto}
      onChange={setTexto}
      onSend={() => setTexto('')}
      onVoice={() => undefined}
      placeholder="Pregúntale al agente o pídele algo"
      news={novedad}
      onDismissNews={() => setNovedad(false)}
    />
  )
}

function Superficies() {
  return (
    <div className="flex flex-col gap-6">
      <SectionIntro
        title="Superficies"
        description="Dónde vive la IA dentro del producto. Todas comparten el degradado y el orbe; el resto de la pantalla no cambia."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Demo title="Tarjeta de IA" description="Invita a usar la IA desde una pantalla normal. En el Home, «Crear un curso».">
          <AiCard
            title="Crear un curso"
            description="Genera contenido de aprendizaje apoyado en AI en minutos."
            action="Crear ahora"
            render={<Link to={destino('contenidos')} />}
          />
        </Demo>
        <Demo title="Selector de espacio" description="Cambia entre el Workspace y Orbit. El orbe marca cuál es el de IA.">
          <BarraEnVivo id="suite-ai" alto="h-32" />
        </Demo>
      </div>
      <Demo
        title="El icono de IA"
        description="El orbe a 16 px marca lo que produjo la IA dentro de una pantalla normal: pestaña, título o ítem, antes del texto. Si la tarjeta entera es de IA, va solo en su título. Nada de estrellas ni chispas. Como insignia es siempre <EtiquetaIA />: gris, en pastilla y con el orbe ajustado a su tamaño."
      >
        <div className="flex flex-wrap items-center gap-4">
          <Text as="span" size="sm" weight="medium" className="flex items-center gap-2">
            <IconoIA />
            Compatibilidad de la hoja de vida
          </Text>
          <EtiquetaIA>Entrevista con IA</EtiquetaIA>
          <EtiquetaIA>Serena AI 88/100</EtiquetaIA>
          <EtiquetaIA size="xs">IA</EtiquetaIA>
          <Button variant="link" nativeButton={false} render={<Link to="/admin/seleccion/vacantes/analista-de-datos/candidatos/laura-mendez?pestana=cv" />}>
            Verlo en el expediente del candidato
            <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" data-icon="inline-end" />
          </Button>
        </div>
      </Demo>
      <Demo title="Cuadro de escritura" description="La entrada del chat: sugerencias arriba, aviso de novedades, adjuntar, voz y enviar.">
        <CuadroDeEscritura />
      </Demo>
      <Card size="sm">
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <Text variant="muted" size="sm">
            El panel del agente dentro de una pantalla tiene su propio configurador, con todas sus partes.
          </Text>
          <Button variant="outline" nativeButton={false} render={<Link to="/design-system/agente-contextual/configurador" />}>
            Abrir el configurador
            <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" data-icon="inline-end" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function Estados() {
  return (
    <div className="flex flex-col gap-6">
      <SectionIntro title="Estados" description="Qué ve la persona mientras la IA trabaja. «Razonando» es la misma pieza en el chat, en Orbit Flow y en el editor." />
      <div className="grid gap-4 md:grid-cols-3">
        <Demo title="Razonando" description="Mientras prepara la respuesta: el orbe respira, el texto brilla y al lado corren los segundos." centrado>
          <div className="flex flex-col items-center gap-2 py-6">
            <AiThinking />
            <Badge variant="secondary">Hecho por Nicolás</Badge>
          </div>
        </Demo>
        <Demo title="Escribiendo" description="La respuesta aparece palabra por palabra, con el cursor parpadeando al final." centrado>
          <div className="flex flex-col items-center gap-2 py-6">
            <Text as="span" variant="muted" size="sm">
              En el chat de Orbit
            </Text>
            <Badge variant="secondary">Hecho por Nicolás</Badge>
          </div>
        </Demo>
        <Demo title="Trabajando en segundo plano" description="El historial marca con un punto si la conversación está razonando, sin leer o leída." centrado>
          <div className="flex flex-col items-center gap-2 py-6">
            <Text as="span" variant="muted" size="sm">
              En la barra lateral de Orbit
            </Text>
            <Badge variant="secondary">Hecho por Nicolás</Badge>
          </div>
        </Demo>
      </div>
      <Alert variant="info">
        <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
        <AlertTitle>Una sola forma de esperar</AlertTitle>
        <AlertDescription>
          <p>
            «Razonando» es solo para cuando de verdad trabaja la IA. Una carga normal lleva el esqueleto de lo que va a
            aparecer, y la respuesta de una acción va en su propio botón (ver Componentes › Estados y avisos).
          </p>
        </AlertDescription>
      </Alert>
    </div>
  )
}

function Vocabulario() {
  return (
    <div className="flex flex-col gap-6">
      <SectionIntro
        title="Cómo llamamos a cada cosa"
        description="Los nombres que usa la industria para las interfaces con IA y cómo los decimos nosotros. Falta alinearlos con Shape of AI."
      />
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/5">En inglés</TableHead>
                <TableHead className="w-1/4">Como lo decimos</TableHead>
                <TableHead>Dónde se ve</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {VOCABULARIO.map((fila) => (
                <TableRow key={fila.ingles}>
                  <TableCell className="align-top whitespace-normal">
                    <Text as="span" variant="muted" size="sm">
                      {fila.ingles}
                    </Text>
                  </TableCell>
                  <TableCell className="align-top whitespace-normal">{fila.nuestro}</TableCell>
                  <TableCell className="align-top whitespace-normal">{fila.donde}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export function Component() {
  // Cada pestaña tiene su dirección (/design-system/ia/<pestaña>) para que el menú de Suite AI lleve a cada una.
  const { pestana } = useParams()
  const navigate = useNavigate()
  const activa = PESTANAS.find((item) => item.valor === pestana)?.valor ?? 'botones'
  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPatron
        titulo="Piezas de IA"
        antetitulo="Design system · Orbit"
        etiqueta={<Badge variant="info-light">En construcción</Badge>}
        acciones={
          <VerEnAccion pagina="ia" />
        }
      >
        Todo lo que en el producto dice «esto lo hace la IA»: botones, superficies, estados y cómo llamamos a cada cosa.
        Nada de esto existe todavía en la librería, así que lo que ya está hecho se muestra tal como quedó en el producto.
      </EncabezadoPatron>

      <Tabs value={activa} onValueChange={(valor) => navigate(`/design-system/ia/${valor}`)}>
        <PestanasDePatron items={PESTANAS} />
        <TabsContent value="botones" className="pt-6">
          <Botones />
        </TabsContent>
        <TabsContent value="superficies" className="pt-6">
          <Superficies />
        </TabsContent>
        <TabsContent value="estados" className="pt-6">
          <Estados />
        </TabsContent>
        <TabsContent value="vocabulario" className="pt-6">
          <Vocabulario />
        </TabsContent>
        <TabsContent value="pendientes" className="pt-6">
          <Reglas titulo="Por resolver" reglas={PENDIENTES} pendiente />
        </TabsContent>
      </Tabs>
    </div>
  )
}

Component.displayName = 'DesignSystemIaPage'
