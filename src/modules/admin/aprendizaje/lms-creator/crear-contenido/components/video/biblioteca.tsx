import { useEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { Button, Heading, Spinner, Text } from '@ubits/flux-ui'
import { BotonIa } from '@/shared/components/BotonIa'
import { TarjetaContenido } from '@/shared/components/TarjetaContenido'
import { BIBLIOTECA_COMPLETA, BIBLIOTECA_RECIENTES, TANDA_BIBLIOTECA, numero, type ItemBiblioteca } from './datos'
import { PestanaVideo } from './piezas'
import type { VideoReciente } from '../borrador'
import { plural } from '@/modules/design-system/patrones/formato'

// Tab «Video con IA» del modal: la invitación a crear un video por escenas y «Tus videos recientes», con su vista
// completa «Tus videos» (carga de a 20 al bajar). Los que el usuario creó en esta sesión van delante de los de ejemplo.

export function aItems(propios: VideoReciente[]): ItemBiblioteca[] {
  return propios.map((v) => ({ id: v.id, titulo: v.titulo, miniatura: v.miniatura, estado: v.estado, src: v.src, propio: true }))
}

// La tarjeta de contenido del catálogo (`shared/components/TarjetaContenido`), la misma de la cuadrícula de
// Contenidos, con solo tres de sus campos: la insignia sobre la imagen, la imagen y el título. Todo lo demás
// —proveedor, competencia, ficha técnica, avance— es opcional en la pieza, así que no hace falta tocarla: basta
// con no pasárselo.
function TarjetaVideo({ item, onElegir }: { item: ItemBiblioteca; onElegir: (item: ItemBiblioteca) => void }) {
  const borrador = item.estado === 'editando'
  return (
    <TarjetaContenido
      titulo={item.titulo}
      imagen={item.miniatura}
      visibilidad={borrador ? 'Borrador' : 'Video'}
      visibilidadColor={borrador ? 'info-light' : 'success-light'}
      onClick={() => onElegir(item)}
    />
  )
}

// La rejilla mide su propio ancho (`@container`), no el de la ventana. Vive dentro de un modal de 768 px: con
// quiebres de pantalla, con el navegador maximizado metía tres columnas en el ancho del modal y las tarjetas
// quedaban apretadas, mientras que al angostar la ventana el modal se encogía y la rejilla ni se enteraba.
// Los escalones son tokens del contenedor, no píxeles sueltos: `@sm` son 384 y `@lg`, 512. Con el modal en su medida
// (576) la rejilla queda en 528, así que todavía caben las tres tarjetas en fila.
function Grilla({ items, onElegir }: { items: ItemBiblioteca[]; onElegir: (item: ItemBiblioteca) => void }) {
  return (
    <div className="@container">
      <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2 @lg:grid-cols-3 [&>*]:min-w-0">
        {items.map((item) => (
          <TarjetaVideo key={item.id} item={item} onElegir={onElegir} />
        ))}
      </div>
    </div>
  )
}

type PanelProps = {
  propios: VideoReciente[]
  onCrear: () => void
  onVerTodos: () => void
  onElegir: (item: ItemBiblioteca) => void
}

export function PanelVideoConIA({ propios, onCrear, onVerTodos, onElegir }: PanelProps) {
  const recientes = [...aItems(propios), ...BIBLIOTECA_RECIENTES].slice(0, 3)
  return (
    <PestanaVideo antes="Convierte una idea en un " clave="video editable por escenas" despues="">
      <div className="flex justify-center">
        <BotonIa onClick={onCrear}>Crear video con IA</BotonIa>
      </div>
      <section className="flex flex-col gap-3" aria-labelledby="videos-recientes">
        <div className="flex items-center justify-between gap-3">
          <Heading as="h4" level={6} id="videos-recientes">
            Tus videos recientes
          </Heading>
          <Button variant="ghost" size="xs" onClick={onVerTodos}>
            Ver todos
            <HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" aria-hidden="true" />
          </Button>
        </div>
        <Grilla items={recientes} onElegir={onElegir} />
      </section>
    </PestanaVideo>
  )
}

/** «Tus videos»: toda la biblioteca, de a 20 tarjetas al acercarse al final. */
export function PanelTodos({ propios, onElegir }: { propios: VideoReciente[]; onElegir: (item: ItemBiblioteca) => void }) {
  const todos = [...aItems(propios), ...BIBLIOTECA_COMPLETA]
  const [visibles, setVisibles] = useState(TANDA_BIBLIOTECA)
  const [cargando, setCargando] = useState(false)
  const centinela = useRef<HTMLDivElement>(null)
  const hayMas = visibles < todos.length

  useEffect(() => {
    const nodo = centinela.current
    if (!nodo || !hayMas) return
    const observador = new IntersectionObserver(
      (entradas) => {
        if (!entradas[0]?.isIntersecting || cargando) return
        setCargando(true)
        window.setTimeout(() => {
          setVisibles((v) => v + TANDA_BIBLIOTECA)
          setCargando(false)
        }, 400)
      },
      { rootMargin: '320px' },
    )
    observador.observe(nodo)
    return () => observador.disconnect()
  }, [hayMas, cargando])

  return (
    <div className="mx-auto flex w-full min-w-0 flex-col gap-4 overflow-x-clip pt-2">
      <Text size="sm" variant="muted">
        {numero(todos.length)} {plural(todos.length, 'video', 'videos')} en tu biblioteca
      </Text>
      <Grilla items={todos.slice(0, visibles)} onElegir={onElegir} />
      {hayMas ? (
        <div ref={centinela} className="flex justify-center py-4">
          {cargando ? <Spinner className="size-5" aria-label="Cargando más videos" /> : null}
        </div>
      ) : null}
    </div>
  )
}
