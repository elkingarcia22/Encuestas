import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { InformationCircleIcon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Heading,
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
  Separator,
  Text,
} from '@ubits/flux-ui'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { ModalAgregarVideo } from '../crear-contenido/components/video/modal-agregar-video'
import type { DisposicionAvatar } from '../crear-contenido/components/video/panel-avatar'

// ── Lab: qué hacer con el modal «Agregar video» ──────────────────────────────────────────────────────────────────
//
// Es un lab, no una pantalla del producto: se borra en cuanto Carlos elija. Lo que hay que resolver son dos quejas
// suyas, y conviene no mezclarlas:
//
//   1. **El ancho.** A pantalla completa le parecía absurdo —medio modal en blanco— y a 576 px le parece muy chico.
//      Entre esos dos hay un tamaño oficial que no estábamos usando: 768 px. Las cinco propuestas lo llevan, así que
//      el ancho no es lo que se está votando aquí: ya está decidido y solo hay que verlo.
//   2. **El alto de «Video Avatar IA».** Esa es la pregunta de verdad, y es donde las cinco se diferencian.
//
// Medido en la versión de hoy, a 576 px de ancho y con una ventana de 786 px de alto:
//
//   | Subir video | Enlace de video | Video con IA | **Video Avatar IA** |
//   | 336 px      | 351 px          | 469 px       | **754 px**          |
//
// O sea que esa pestaña ocupa casi toda la pantalla, hay que bajar con scroll para llegar al botón, y al cambiar de
// pestaña el modal da un salto de más del doble.

type Propuesta = {
  id: string
  letra: string
  nombre: string
  idea: string
  // El ancho de la ventana del sistema (ActionDialog): «wide», 736 px, el tamaño de en medio.
  ancho: 'default' | 'wide'
  // Obligatorio a propósito, aunque el modal tenga uno por defecto: si se omite, la propuesta hereda en silencio el
  // reparto de la que está implementada y dos tarjetas enseñan lo mismo. Ya pasó con la A (Dave, 2-oct).
  disposicion: DisposicionAvatar
  altoModal?: boolean
  /** Lo que mide «Video Avatar IA» con esta propuesta, medido en pantalla. De partida eran 1.122 px. */
  medido: number
  /** La que se implementó: abrir «Agregar video» en LMS Creator ya se ve así. */
  elegida?: boolean
  aFavor: string[]
  enContra: string[]
}

const PROPUESTAS: Propuesta[] = [
  {
    id: 'ancho',
    letra: 'A',
    nombre: 'Ensancharlo y fijarle el alto',
    idea: 'El tamaño oficial de en medio (768 px) y el modal siempre de 550 px de alto. Las secciones siguen una debajo de otra y lo que no quepa hace scroll dentro.',
    ancho: 'wide',
    disposicion: 'una-columna',
    altoModal: true,
    medido: 758,
    aFavor: [
      'No hay reparto nuevo que probar: es el formulario de siempre, apretado y más ancho.',
      'El modal mide lo mismo en las cuatro pestañas y en cualquier monitor: deja de dar saltos al cambiar de pestaña.',
      'En una pantalla corta se encoge solo, porque el tope de 100svh del panel sigue mandando: no hay forma de que el pie quede fuera.',
      'El botón de generar queda siempre a la vista, pegado abajo.',
    ],
    enContra: [
      'El formulario sigue midiendo 758 px, así que en Avatar IA hay que bajar con scroll.',
      'En las dos pestañas cortas («Subir video» mide 336 px) sobra espacio en blanco.',
    ],
  },
  {
    id: 'dos-columnas',
    letra: 'B',
    nombre: 'Dos columnas en Avatar IA',
    idea: 'A la izquierda quién habla —presentador, voz y logo—; a la derecha lo que dice. El ancho nuevo da justo para dos columnas.',
    ancho: 'wide',
    disposicion: 'dos-columnas',
    medido: 511,
    aFavor: [
      'Cabe entera sin scroll: es la única en la que se ve todo el formulario de una.',
      'Separa las dos decisiones que de verdad son distintas: el presentador y el guion.',
      'Es el mismo reparto del setup de «Video con IA», así que no es un patrón nuevo.',
    ],
    enContra: [
      'En pantallas angostas vuelve a una columna y queda como está hoy.',
      'En 340 px el selector de voz queda apretado y corta el país: «Voz femenina Colom…». Se arregla, pero hay que hacerlo.',
    ],
  },
  {
    id: 'acordeon',
    letra: 'C',
    nombre: 'Secciones plegables, con vista previa al lado',
    idea: 'Presentador, Voz, Guion y Logo plegados, abriendo uno a la vez, y al lado el resumen de lo que llevas elegido: la cara, la voz, el guion y el logo.',
    ancho: 'wide',
    disposicion: 'acordeon',
    medido: 533,
    elegida: true,
    aFavor: [
      'El modal queda bajito siempre, por mucho que crezca el formulario por dentro.',
      'La vista previa tapa el agujero del acordeón: aunque una sección esté cerrada, sigues viendo a quién elegiste.',
      'Es el mismo par «formulario + Vista previa» de Crear contenido y Crear assessment.',
    ],
    enContra: [
      'Para cambiar algo hay que abrir su sección: el resumen dice qué elegiste, no deja editarlo ahí.',
      'Un formulario de cuatro campos quizá no necesita que lo plieguen.',
    ],
  },
]

export function Component() {
  const [abierta, setAbierta] = useState<Propuesta | null>(null)
  useEffect(() => {
    document.title = 'Lab · Modal Agregar video · Playground UX'
  }, [])

  return (
    <PageShell width="default">
      <PageHeader
        kicker="Lab · se borra al decidir"
        title="Modal «Agregar video»"
        description="La C es la que quedó implementada; las otras dos siguen aquí para poder comparar."
      />

      <PageContent>
        <Alert variant="info">
          <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
          <AlertTitle>Dos cosas van en las cuatro, y no se votan</AlertTitle>
          <AlertDescription>
            <p>
              <strong>El ancho.</strong> Entre la pantalla completa (absurda) y los 576 px de antes (muy chico) hay un
              tamaño oficial que no estábamos usando: 768 px.
            </p>
            <p>
              <strong>El formulario apretado.</strong> Las cabeceras de sección iban en 16px semibold cuando un label
              de formulario nuestro es de 14px, cada sección estaba separada por una línea, «Voz» repetía el nombre
              del campo que tenía debajo, y las fotos de los presentadores crecían con el ancho hasta 125 px —al
              ensanchar el modal, esa rejilla se hacía <em>más</em> alta—. Arreglar eso solo quitó 364 px.
            </p>
            <p>Lo que cambia de una propuesta a otra es cómo se reparte lo que queda.</p>
          </AlertDescription>
        </Alert>

        <Frame>
          <FrameHeader>
            <FrameTitle>El problema, medido</FrameTitle>
            <FrameDescription>Alto del modal en cada pestaña, hoy, con una ventana de 786 px.</FrameDescription>
          </FrameHeader>
          <FramePanel className="flex flex-col gap-2">
            {[
              { tab: 'Subir video', px: 336 },
              { tab: 'Enlace de video', px: 351 },
              { tab: 'Video con IA', px: 469 },
              { tab: 'Video Avatar IA', px: 754 },
            ].map((x) => (
              <div key={x.tab} className="flex items-center gap-3">
                <Text as="span" size="sm" className="w-36 shrink-0">
                  {x.tab}
                </Text>
                {/* La barra es la proporción real, para que se vea el salto y no haya que creerme el número. */}
                <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className={x.px > 700 ? 'h-full rounded-full bg-warning' : 'h-full rounded-full bg-primary'} style={{ width: `${(x.px / 786) * 100}%` }} />
                </div>
                <Text as="span" size="sm" variant="muted" className="w-20 shrink-0 text-right tabular-nums">
                  {x.px} px
                </Text>
              </div>
            ))}
            <Separator />
            <Text as="p" size="sm" variant="muted">
              La ventana mide 786 px. Esa última barra es el modal tapando la pantalla entera. Solo con apretar el
              formulario —sin cambiar el reparto— esa pestaña ya baja de 1.122 px de contenido a 758.
            </Text>
          </FramePanel>
        </Frame>

        <div className="flex flex-col gap-4">
          {PROPUESTAS.map((p) => (
            <Frame key={p.id}>
              <FrameHeader>
                <FrameTitle className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" size="xs">
                    {p.letra}
                  </Badge>
                  {p.nombre}
                  {p.elegida ? (
                    <Badge variant="success-light" size="xs">
                      Implementada
                    </Badge>
                  ) : null}
                </FrameTitle>
                <FrameDescription>{p.idea}</FrameDescription>
              </FrameHeader>
              <FramePanel className="flex flex-col gap-4">
                {/* El dato duro de cada propuesta, medido en pantalla y no estimado: cuánto mide «Video Avatar IA». */}
                <Item variant={p.medido < 800 ? 'muted' : 'outline'} size="sm">
                  <ItemContent>
                    <ItemTitle className="whitespace-normal">
                      {p.medido >= 750 ? (
                        <>
                          «Video Avatar IA» queda en <strong>{p.medido.toLocaleString('es-CO')} px</strong>
                          {p.id === 'parejo' ? ' de contenido, dentro de una caja con scroll: el reparto no cambia' : ' de contenido: todo lo que baja viene de apretar el formulario, no del reparto'}
                        </>
                      ) : (
                        <>
                          «Video Avatar IA» pasa de 1.122 px a <strong>{p.medido.toLocaleString('es-CO')} px</strong> ({Math.round((1 - p.medido / 1122) * 100)} % menos)
                        </>
                      )}
                    </ItemTitle>
                  </ItemContent>
                </Item>
                <div className="grid gap-4 md:grid-cols-2">
                  <Lista titulo="A favor" items={p.aFavor} tono="bueno" />
                  <Lista titulo="En contra" items={p.enContra} tono="malo" />
                </div>
                <div className="flex">
                  <Button onClick={() => setAbierta(p)}>Abrir esta</Button>
                </div>
              </FramePanel>
            </Frame>
          ))}
        </div>
      </PageContent>

      {abierta ? (
        <ModalAgregarVideo
          key={abierta.id}
          abierto
          onCerrar={() => setAbierta(null)}
          onListo={() => setAbierta(null)}
          ancho={abierta.ancho}
          disposicion={abierta.disposicion}
          altoModal={abierta.altoModal}
        />
      ) : null}
    </PageShell>
  )
}

function Lista({ titulo, items, tono }: { titulo: string; items: string[]; tono: 'bueno' | 'malo' }) {
  return (
    <div className="flex flex-col gap-2">
      <Heading as="h3" level={6}>
        {titulo}
      </Heading>
      {items.map((x) => (
        <Item key={x} variant="muted" size="sm">
          <ItemContent>
            <ItemTitle className="whitespace-normal font-normal!">{x}</ItemTitle>
            {tono === 'malo' ? <ItemDescription className="sr-only">En contra</ItemDescription> : null}
          </ItemContent>
        </Item>
      ))}
    </div>
  )
}

Component.displayName = 'AdminLmsLabModalVideoPage'
