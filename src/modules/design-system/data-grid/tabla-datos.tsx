import { useLayoutEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { createPortal } from 'react-dom'
import {
  DataGridList,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  FrameFooter,
  type DataGridListConfig,
  type DataGridListProps,
} from '@ubits/flux-ui'
import { ImagenGlass } from '@/shared/components/ImagenGlass'

import { PiePaginacion } from '@/modules/admin/seleccion/propuestas/components/paginacion'
import { SIN_ARRASTRE } from './casos/sin-arrastre'
import { useTextosDeLaLibreria } from './textos-libreria'
import './tabla-datos.css'

// La tabla del design system en español (war room del 28 sep, Carlos: «que no sea en inglés, sino en español»).
//
// Es DataGridList tal cual —marco gris, título, conteo, buscador, filtros y orden por columna— con un solo cambio: el
// pie. El de la librería dice «Rows per page» y «1 - 10 of 84» y no admite textos (ni `labels` lo cubre), así que no se
// le pasa `pagination` y en su lugar va el pie de paginación del proyecto, el de Selección («Filas por página»,
// «Viendo 1–10 de 84», «Anterior / Siguiente»), dentro del mismo marco: se monta en el pie del Frame que arma la tabla.
// Es una variante UBITS y se queda (Cristian, 7-oct: «debe quedar como lo tenemos modificado en el DS»): aunque la
// librería deje traducir su paginación, la cabecera de Vacantes y el borde único siguen siendo decisión del equipo.
//
// Es la única tabla del sistema (decisión 1 de la auditoría, 5-oct: MarcoTabla se retiró). Su cabecera es la de
// Vacantes (Selección), que Cristian eligió como la buena:
// - Arriba, en lo gris, solo el conteo a la izquierda («13 vacantes») y a la derecha el buscador y «Personalizar
//   columnas». Con `titulo`, el título va en lo gris sobre el conteo (16-oct, Nicolás: «no me les quites los títulos a
//   las tablas»); sin él, el título lo da la página.
// - Encabezados de columna de 40 px, con el asidero para mover cada columna y el borde para cambiarle el ancho.
// - Las filas que nombran algo llevan título y, debajo, una línea gris (Vacante + Área). Es la misma fila cuando hay
//   imagen: la miniatura a la izquierda y el título con su línea gris al lado (ver /design-system/data-grid).
//
// Y trae por defecto, de los bloques de ReUI (data-grid-base-2 y -5), lo que la librería no pone sola cuando la tabla
// va en su marco (29 sep, comparación con ReUI y con el Storybook):
// - `cardVariant: 'borderless'`: dentro del panel del marco la tabla armaba otra caja con borde; los dos bordes pegados
//   se leían como un trazo grueso. ReUI deja solo el del panel.
// - `frame.toolbar: 'header'`: con acciones por fila, la barra de «seleccionados» dejaba una franja vacía sobre la tabla.
// - `layout.pinnable: false`: sin «Fijar a la izquierda / derecha» en el menú de cada columna; ninguna tabla del
//   playground lo necesita y la librería lo trae en inglés (revisión de David, 30 sep).
// Cada tabla puede pedir lo contrario en su `config` (lo hace el configurador de /design-system/data-grid).
//
// Y dos arreglos a lo que la librería trae mal (30 sep): los textos fijos en inglés de sus menús
// (textos-libreria.ts) y la lupa encima del texto en el buscador de los filtros y el menú de columnas angosto
// (tabla-datos.css).

// El vacío por defecto de TablaDatos: la ilustración de buscar y una línea, sin botón (la tabla no sabe cómo limpiar).
function VacioTabla({ nombre }: { nombre: string }) {
  return (
    <Empty className="py-14">
      <EmptyHeader>
        <EmptyMedia variant="default">
          <ImagenGlass nombre="glass-search" />
        </EmptyMedia>
        <EmptyTitle>No hay {nombre} para mostrar</EmptyTitle>
        <EmptyDescription>Prueba con otras palabras o quita los filtros.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export type PaginacionTabla = {
  pagina: number
  setPagina: Dispatch<SetStateAction<number>>
  porPagina: number
  setPorPagina: Dispatch<SetStateAction<number>>
  // Cuántas filas hay en total después de buscar y filtrar (la tabla recibe solo las de la página).
  total: number
}

export function TablaDatos<T extends object>({
  config,
  paginacion,
  nombre,
  singular,
  titulo,
  id,
  pieSoloSiHaceFalta = false,
  ...props
}: DataGridListProps<T> & {
  config: Omit<DataGridListConfig<T>, 'pagination'>
  paginacion: PaginacionTabla
  // El título de la tabla, en lo gris encima del conteo («Tus vacantes» / «19 vacantes»).
  titulo?: string
  // Lo que se pagina, en plural: «planes», «personas».
  nombre: string
  // Y en singular, para el conteo de arriba cuando hay una sola fila: «1 plan», no «1 planes».
  singular?: string
  // Enlaza «Filas por página» con su selector cuando hay dos tablas en la misma pantalla.
  id: string
  // Para listas cortas dentro de un formulario (las asignaciones de un plan): si todo cabe en la página más chica, el
  // pie no aporta nada y se omite. Por defecto el pie va siempre, para que una tabla no cambie de alto al filtrar.
  pieSoloSiHaceFalta?: boolean
}) {
  useTextosDeLaLibreria()
  const envoltura = useRef<HTMLDivElement>(null)
  const [pie, setPie] = useState<HTMLElement | null>(null)

  // El pie va al final del Frame que arma la tabla. Si la tabla se vuelve a montar (cambia su `key`), el Frame es otro
  // y el pie se vuelve a colgar.
  useLayoutEffect(() => {
    const marco = envoltura.current?.querySelector<HTMLElement>('[data-slot="frame"]')
    if (!marco) return
    if (pie && marco.contains(pie)) return
    // Si ya hay uno (React monta dos veces en desarrollo), se reutiliza: nunca dos pies en la misma tabla.
    const existente = marco.querySelector<HTMLElement>(':scope > [data-slot="tabla-datos-pie"]')
    const nodo = existente ?? document.createElement('div')
    if (!existente) {
      nodo.dataset.slot = 'tabla-datos-pie'
      marco.appendChild(nodo)
    }
    setPie(nodo)
  })

  // Sin arrastre, la librería igual pinta el asidero si la columna no lo apaga ella misma (ver trampas_conocidas).
  // Con arrastre (lo normal desde el 5-oct), toda columna de datos lleva su asidero, como en Vacantes, aunque la pantalla
  // lo hubiera apagado cuando la tabla era compacta; la de acciones (sin dato detrás) se queda quieta.
  const reordenable = config.layout?.reorderable !== false
  const columnas = useMemo(
    () =>
      reordenable
        ? config.columns.map((columna) =>
            'accessorKey' in columna || 'accessorFn' in columna ? { ...columna, enableColumnOrdering: true } : columna,
          )
        : config.columns.map((columna) => ({ ...columna, ...SIN_ARRASTRE })),
    [config.columns, reordenable],
  )
  // Regla «tabla-cabe» (8-oct): con la barra lateral abierta el marco mide 1.104 px. Mientras se maqueta, la tabla avisa
  // en la consola si sus columnas suman más (auditoría del 13-oct: Avisos internos y Diagnóstico se salían sin que nadie
  // lo viera).
  if (import.meta.env.DEV) {
    const ancho = columnas.reduce((suma, columna) => suma + (typeof columna.size === 'number' ? columna.size : 0), 0)
    if (ancho > 1104) console.warn(`TablaDatos «${nombre}»: las columnas suman ${ancho} px y el marco mide 1.104 px. Reparte los anchos (regla tabla-cabe).`)
  }
  const conteo = `${paginacion.total.toLocaleString('es-CO')} ${paginacion.total === 1 && singular ? singular : nombre}`
  const configuracion = {
    ...config,
    columns: columnas,
    cardVariant: config.cardVariant ?? 'borderless',
    // Como Vacantes: siempre en su marco, con su título (si lo trae) y el conteo a la izquierda.
    frame: { toolbar: 'header' as const, ...config.frame, title: titulo, description: config.frame?.description ?? conteo },
    layout: { dense: false, reorderable: true, resizable: true, pinnable: false, ...config.layout },
    // «Buscar asignación», no «Buscar Asignación...»: el nombre del filtro va en minúscula dentro de la frase.
    labels: { filterSearchPlaceholder: (filtro: string) => `Buscar ${filtro.toLowerCase()}`, ...config.labels },
    // `globalTotal`: el conteo de arriba es el total y no las filas de esta página.
    globalTotal: config.globalTotal ?? paginacion.total,
    // Sin vacío propio, el del sistema con su ilustración glass (regla «vacios-con-glass»), no la lupa de línea de la
    // librería. Lo mejor sigue siendo pasar SinResultados con la búsqueda y «Limpiar», como Diagnóstico.
    emptyState: config.emptyState ?? { type: 'no-results' as const, customComponent: <VacioTabla nombre={nombre} /> },
  }

  const paginas = Math.max(1, Math.ceil(paginacion.total / paginacion.porPagina))
  const pagina = Math.min(paginacion.pagina, paginas)
  const estado = {
    ...paginacion,
    pagina,
    paginas,
    desde: paginacion.total ? (pagina - 1) * paginacion.porPagina + 1 : 0,
    hasta: Math.min(pagina * paginacion.porPagina, paginacion.total),
  }

  // La librería topa la zona de la tabla en 700 px (360 con cabecera fija), pero su área de desplazamiento no hereda el
  // tope y crece con las filas: con 20 o 50 por página lo de abajo se cortaba sin poder bajar (13-oct, Encuestas). Aquí
  // el área hereda el tope de su contenedor y se desplaza por dentro. Ficha: diferencias.json › data-grid-list-scroll.
  return (
    <div ref={envoltura} className="[&_[data-slot=data-grid-scroll-area]>[data-slot=scroll-area-viewport]]:max-h-[inherit]">
      <DataGridList {...props} config={configuracion} />
      {pie && paginacion.total > (pieSoloSiHaceFalta ? 10 : 0)
        ? createPortal(
            <FrameFooter className="px-0">
              <PiePaginacion estado={estado} nombre={nombre} id={id} />
            </FrameFooter>,
            pie,
          )
        : null}
    </div>
  )
}
