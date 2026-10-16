import { Link } from 'react-router'
import { Card, CardContent, Text, cn } from '@ubits/flux-ui'
import { Hint } from '@/shared/components/Hint'
import { ImagenGlass } from '@/shared/components/ImagenGlass'
import { EtiquetaIA } from '@/modules/design-system/ia/etiqueta-ia'
import halo from '@/shared/components/tarjeta-ia.module.css'

// Quick actions del Inicio del admin (1 oct): seis tarjetas con la diagramación del selector de recursos de Crear
// contenido (la referencia de Charlie): ilustración Glass centrada, el nombre debajo y, si la acción usa IA, la etiqueta
// «IA» arriba a la derecha. Cada una lleva a su pantalla real. Título en español, «Acciones rápidas» (1 oct, Charlie).
// Hover (1 oct): la tarjeta sube 2px, toma un borde azul suave y sombra, y la ilustración crece un poco. Se probó un
// efecto tipo dock y se descartó (1 oct).

type Accion = {
  id: string
  titulo: string
  // El nombre del icono Glass; la imagen la pone ImagenGlass, la compartida (auditoría, decisión 21).
  glass: string
  ruta: string
  ia?: boolean
  // Fondo con el halo de la IA (los colores de marca difuminados desde las esquinas), suave.
  conHalo?: boolean
}

const ACCIONES: Accion[] = [
  { id: 'contenido', titulo: 'Crear contenido', glass: 'glass-play', ruta: '/admin/aprendizaje/lms-creator/crear-contenido', ia: true, conHalo: true },
  { id: 'vacante', titulo: 'Crear vacante', glass: 'glass-bag', ruta: '/admin/seleccion/vacantes/crear', ia: true },
  { id: 'encuesta', titulo: 'Crear encuesta', glass: 'glass-document', ruta: '/admin/desempeno-cultura/encuestas/crear', ia: true },
  { id: 'tarea', titulo: 'Asignar tarea', glass: 'glass-calendar', ruta: '/admin/tareas' },
  { id: 'usuarios', titulo: 'Gestionar usuarios', glass: 'glass-profile', ruta: '/design-system/templates/gestion-usuarios' },
  { id: 'anuncio', titulo: 'Lanzar un anuncio', glass: 'glass-volume', ruta: '/admin/avisos-internos' },
]

// `entrada`: animación de llegada de cada tarjeta (la clase y los retrasos los pone el Inicio).
export function AccionesRapidas({ entrada }: { entrada?: { clase: string; desde: number; paso: number } } = {}) {
  return (
    // Sin título a la vista (1 oct): van justo bajo el saludo y se explican solas. El nombre queda para el lector.
    <section aria-label="Acciones rápidas" className="flex flex-col gap-4">
      {/* Seis en una fila en escritorio, tres en tablet y dos en celular; todo centrado dentro de cada tarjeta. Cada
          tarjeta es un enlace: la tarjeta de la librería va dentro y el enlace lleva el foco y el nombre. */}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {ACCIONES.map((accion, i) => (
          <li
            key={accion.id}
            className={entrada?.clase}
            style={entrada ? { animationDelay: `${entrada.desde + i * entrada.paso}ms` } : undefined}
          >
            <Link
              to={accion.ruta}
              aria-label={accion.ia ? `${accion.titulo} (con IA)` : accion.titulo}
              className="group block h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {/* «Crear contenido» lleva el halo de la tarjeta de IA (1 oct, «fondo sutil con los colores de AI»), en su
                  versión suave: morado y rosa desde la esquina de arriba y azul desde la de abajo, sin teñir el texto. */}
              <Card
                size="sm"
                className={cn(
                  accion.conHalo && [halo.vars, halo.halo, halo.haloSuave, 'overflow-hidden'],
                  'relative h-full transition-[translate,box-shadow,border-color] duration-200 ease-out group-hover:-translate-y-0.5 group-hover:border-primary/30 group-hover:shadow-md! group-focus-visible:border-primary/30 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0',
                )}
              >
                {/* La etiqueta IA pegada a la esquina de la tarjeta (1 oct): 8px arriba y a la derecha, no el relleno del
                    contenido, que la dejaba muy abajo. */}
                {accion.ia ? (
                  <Hint label="Incluye asistencia con IA." side="top">
                    <EtiquetaIA className="absolute top-2 right-2" tabIndex={-1} aria-hidden="true">
                      IA
                    </EtiquetaIA>
                  </Hint>
                ) : null}
                {/* Encima del halo: el halo es un ::before con posición, así que el contenido va con su propia capa. */}
                <CardContent className="relative flex h-full flex-col items-center justify-center gap-2 py-3 text-center">
                  <span className="transition-transform duration-200 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100">
                    <ImagenGlass nombre={accion.glass} tamano={52} className="pointer-events-none select-none" />
                  </span>
                  <Text as="span" size="sm" weight="medium" className="text-balance">
                    {accion.titulo}
                  </Text>
                </CardContent>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
