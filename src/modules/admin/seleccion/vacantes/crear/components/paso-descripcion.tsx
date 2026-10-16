import { useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon, DragDropVerticalIcon, FileUploadIcon, PlusSignIcon } from '@hugeicons/core-free-icons'
import {
  Button,
  Frame,
  FramePanel,
  Heading,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
  Sortable,
  SortableItem,
  SortableItemHandle,
  Text,
} from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import { plural } from '@/modules/design-system/patrones/formato'
import { LIMITE_TEXTO, seccionNueva, textoGenerado, type SeccionDescripcion } from './descripcion'

type Props = {
  nombreVacante: string
  secciones: SeccionDescripcion[]
  onSecciones: (secciones: SeccionDescripcion[]) => void
  onAbrirArchivo: () => void
  onGenerandoIa: (mensaje: string | null) => void
}

// Paso 2: el aviso que leerá el candidato, partido en secciones que se reordenan arrastrando.
// Cada una se puede escribir a mano o pedírsela a la IA.
export function PasoDescripcion({ nombreVacante, secciones, onSecciones, onAbrirArchivo, onGenerandoIa }: Props) {
  // Guarda qué sección se acaba de crear para poner el cursor en su título y dejarlo seleccionado.
  const reciente = useRef<string | null>(null)

  const cambiar = (id: string, cambio: Partial<SeccionDescripcion>) =>
    onSecciones(secciones.map((seccion) => (seccion.id === id ? { ...seccion, ...cambio } : seccion)))

  const quitar = (id: string) => onSecciones(secciones.filter((seccion) => seccion.id !== id))

  const mover = (id: string, salto: number) => {
    const desde = secciones.findIndex((seccion) => seccion.id === id)
    const hasta = desde + salto
    if (desde < 0 || hasta < 0 || hasta >= secciones.length) return
    const resto = secciones.filter((_seccion, indice) => indice !== desde)
    onSecciones([...resto.slice(0, hasta), secciones[desde], ...resto.slice(hasta)])
  }

  const agregar = () => {
    const nueva = seccionNueva()
    reciente.current = nueva.id
    onSecciones([...secciones, nueva])
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-baseline gap-2">
          <Heading as="h2" level={5}>
            Descripción {nombreVacante || 'de la vacante'}
          </Heading>
          <Text as="span" variant="muted" size="sm">
            {secciones.length} {plural(secciones.length, 'sección', 'secciones')}
          </Text>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" onClick={onAbrirArchivo}>
            <HugeiconsIcon icon={FileUploadIcon} size={18} aria-hidden="true" />
            Crear desde archivo
          </Button>
          <Button variant="outline" aria-label="Agregar una sección" onClick={agregar}>
            <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />
            Agregar sección
          </Button>
        </div>
      </div>

      <Sortable value={secciones} onValueChange={onSecciones} getItemValue={(seccion) => seccion.id} className="flex flex-col gap-4">
        {secciones.map((seccion) => (
          <SortableItem key={seccion.id} value={seccion.id}>
            <TarjetaSeccion
              seccion={seccion}
              nueva={reciente.current === seccion.id}
              onCambio={(cambio) => cambiar(seccion.id, cambio)}
              onQuitar={() => quitar(seccion.id)}
              onMover={(salto) => mover(seccion.id, salto)}
              onGenerandoIa={onGenerandoIa}
            />
          </SortableItem>
        ))}
      </Sortable>
    </div>
  )
}

function TarjetaSeccion({
  seccion,
  nueva,
  onCambio,
  onQuitar,
  onMover,
  onGenerandoIa,
}: {
  seccion: SeccionDescripcion
  nueva: boolean
  onCambio: (cambio: Partial<SeccionDescripcion>) => void
  onQuitar: () => void
  onMover: (salto: number) => void
  onGenerandoIa: (mensaje: string | null) => void
}) {
  const [generando, setGenerando] = useState(false)

  // La IA del playground no escribe de verdad: espera un momento y pone un texto de ejemplo,
  // lo justo para ver el estado de espera y cómo queda la sección llena.
  const generar = () => {
    setGenerando(true)
    onGenerandoIa('Generando sección con IA…')
    window.setTimeout(() => {
      onCambio({ texto: textoGenerado(seccion) })
      setGenerando(false)
      onGenerandoIa(null)
      notify(`Escribimos «${seccion.titulo}»`, 'Revísalo antes de publicar.', 'success')
    }, 1200)
  }

  return (
    <Frame>
      <FramePanel className="flex flex-col gap-3">
        {/* Con la ventana angosta los botones se van a la línea de abajo en vez de dejar el título
            en un campo de cuatro letras. */}
        <div className="flex flex-wrap items-center gap-2">
          {/* El asidero va sobre un botón y no sobre el `div` que pone la librería: así se llega a él con
              el tabulador y, con él enfocado, las flechas cambian la sección de sitio. Cuando la librería
              ya está arrastrando, las flechas son suyas y aquí no se toca nada. */}
          <SortableItemHandle
            onKeyDown={(evento) => {
              if (evento.key !== 'ArrowUp' && evento.key !== 'ArrowDown') return
              const arrastrando = evento.currentTarget.closest('[data-slot="sortable-item"]')?.getAttribute('data-dragging')
              if (arrastrando === 'true') return
              evento.preventDefault()
              onMover(evento.key === 'ArrowUp' ? -1 : 1)
            }}
            render={<BotonIcono aria-label={`Mover ${seccion.titulo}`} className="shrink-0 text-muted-foreground!" />}
          >
            <HugeiconsIcon icon={DragDropVerticalIcon} size={18} aria-hidden="true" />
          </SortableItemHandle>
          <div className="relative min-w-48 flex-1">
            <Input
              aria-label="Título de la sección"
              value={seccion.titulo}
              // Al crear una sección el título queda seleccionado: se escribe el nombre encima sin borrar antes.
              autoFocus={nueva}
              onFocus={(evento) => {
                if (nueva) evento.target.select()
              }}
              onChange={(evento) => onCambio({ titulo: evento.target.value })}
              className="w-full font-medium pr-[160px]"
            />
            <div className="absolute inset-y-0 right-1 flex items-center">
              <BotonIaSecundario
                size="sm"
                className="text-muted-foreground!"
                disabled={generando}
                onClick={generar}
              >
                {generando ? 'Creando…' : 'Crear con IA'}
              </BotonIaSecundario>
            </div>
          </div>
          <div className="ms-auto flex shrink-0 items-center">
            <BotonIcono aria-label={`Borrar ${seccion.titulo}`} className="text-destructive!" onClick={onQuitar}>
              <HugeiconsIcon icon={Delete02Icon} size={18} />
            </BotonIcono>
          </div>
        </div>

        <InputGroup>
          <InputGroupTextarea
            aria-label={`Texto de ${seccion.titulo}`}
            rows={6}
            maxLength={LIMITE_TEXTO}
            value={seccion.texto}
            placeholder="Escribe aquí o pídeselo a la IA"
            onChange={(evento) => onCambio({ texto: evento.target.value })}
          />
          <InputGroupAddon align="block-end">

            <InputGroupText className="ml-auto tabular-nums">
              {seccion.texto.length}/{LIMITE_TEXTO}
            </InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      </FramePanel>
    </Frame>
  )
}
