import { useState } from 'react'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from '@ubits/flux-ui'
import { claseDe, repartirPesos, sumaPesos, type Borrador, type ItemPeso, type Visibilidad } from './borrador'
import { ANCLA_AJUSTES, DialogoPublicar, PanelNavegacion, PanelPesos, PanelVisibilidad } from './ajustes'

// Paso 4 · Ajustes: quién lo verá, cuánto cuenta cada evaluación y cómo se recorre. Tres conjuntos, cada uno en su marco
// como en el paso 1 —Visibilidad, Pesos de evaluación (solo si hay evaluaciones) y Tipo de navegación—: el título y la
// bajada sobre el fondo gris, y las opciones dentro del panel blanco.
//
// Visibilidad (como playground-react): elegir Público, Privado u Oculto pide confirmarlo en el momento («Publicar
// contenido» / «Ocultar contenido»). Cancelar deja la que estaba; confirmar la aplica y «Borrador» queda deshabilitado:
// ya no se vuelve a borrador. Al crear, el contenido sale con esa visibilidad.

type Props = {
  borrador: Borrador
  items: ItemPeso[]
  pesos: Record<string, number>
  /** Demo `#ajustes-pesos-empty`: la sección de pesos vacía aunque haya evaluaciones. */
  pesosVacio: boolean
  /** Abre la selección de colaboradores al entrar: lo pide `#ajustes-colaboradores`. */
  abrirSeleccion?: boolean
  onCambio: (cambio: Partial<Borrador> | ((b: Borrador) => Partial<Borrador>)) => void
}

export function PasoAjustes({ borrador, items, pesos, pesosVacio, abrirSeleccion, onCambio }: Props) {
  const clase = claseDe(borrador)
  const ruta = clase === 'ruta'
  const visibles = items.filter((i) => !i.oculta)
  const suma = sumaPesos(items, pesos)
  const pesosMal = !pesosVacio && visibles.length >= 2 && suma !== 100
  const [pendiente, setPendiente] = useState<Visibilidad | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <Frame id={ANCLA_AJUSTES.visibilidad} className="scroll-mt-6">
        <FrameHeader>
          <FrameTitle>Visibilidad</FrameTitle>
          <FrameDescription>
            {ruta ? 'Quién la encuentra cuando la publiques. Puedes cambiarlo después.' : 'Quién lo encuentra cuando lo publiques. Puedes cambiarlo después.'}
          </FrameDescription>
        </FrameHeader>
        <FramePanel>
          <PanelVisibilidad
            clase={clase}
            visibilidad={borrador.visibilidad}
            bloquearBorrador={borrador.visibilidad !== 'borrador'}
            onVisibilidad={(visibilidad) => {
              if (visibilidad === borrador.visibilidad || visibilidad === 'borrador') return
              setPendiente(visibilidad)
            }}
            colaboradores={borrador.colaboradores}
            abrirSeleccion={abrirSeleccion}
            onColaboradores={(colaboradores) => onCambio({ colaboradores })}
          />
          <DialogoPublicar
            // Privado usa el texto de Público («tus colaboradores»): todavía no ha elegido a quiénes.
            visibilidad={pendiente === 'oculto' ? 'oculto' : 'publico'}
            abierto={pendiente !== null}
            clase={clase}
            onAbiertoChange={(abierto) => !abierto && setPendiente(null)}
            onConfirmar={() => {
              if (pendiente) onCambio({ visibilidad: pendiente })
              setPendiente(null)
            }}
          />
        </FramePanel>
      </Frame>

      {items.length || pesosVacio ? (
        <Frame id={ANCLA_AJUSTES.pesos} className="scroll-mt-6">
          {/* «Repartir automáticamente» va con el título, no entre los campos: es lo que se hace con toda la sección. */}
          <FrameHeader className="flex flex-row items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col">
              <FrameTitle>Pesos de evaluación</FrameTitle>
              <FrameDescription>Cuánto cuenta cada evaluación en la nota final. Deben sumar 100 %.</FrameDescription>
            </div>
            {!pesosVacio && visibles.length >= 2 ? (
              <Button variant="outline" size="sm" className="shrink-0" onClick={() => onCambio({ pesos: repartirPesos(items) })}>
                Repartir automáticamente
              </Button>
            ) : null}
          </FrameHeader>
          <FramePanel className="flex flex-col gap-4">
            <PanelPesos
              items={items}
              pesos={pesos}
              pesosVacio={pesosVacio}
              onPeso={(id, valor) => onCambio((b) => ({ pesos: { ...b.pesos, [id]: valor } }))}
            />
            {pesosMal ? (
              <Alert variant="warning">
                <AlertTitle>La suma de los pesos de evaluación debe ser 100 %</AlertTitle>
                <AlertDescription>
                  <p>Llevas {suma.toLocaleString('es-CO')} %. Ajusta los porcentajes o usa «Repartir automáticamente».</p>
                </AlertDescription>
              </Alert>
            ) : null}
          </FramePanel>
        </Frame>
      ) : null}

      <Frame id={ANCLA_AJUSTES.navegacion} className="scroll-mt-6">
        <FrameHeader>
          <FrameTitle>Tipo de navegación</FrameTitle>
          <FrameDescription>
            {ruta ? 'En qué orden recorren los contenidos de la ruta tus colaboradores.' : 'Cómo recorren las páginas tus colaboradores.'}
          </FrameDescription>
        </FrameHeader>
        <FramePanel>
          <PanelNavegacion clase={clase} navegacion={borrador.navegacion} onNavegacion={(navegacion) => onCambio({ navegacion })} />
        </FramePanel>
      </Frame>
    </div>
  )
}
