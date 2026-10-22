import { useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Logout01Icon } from '@hugeicons/core-free-icons'
import { Button } from '@ubits/flux-ui'
import { DialogoSalir } from '../estados/confirmaciones'

// Lo que hace falta para preguntar antes de salir con cambios (regla «salir-con-cambios», war room del 13-oct).
export type SalidaConCambios = {
  conCambios: boolean
  // Hay borrador: salir guarda lo que se lleva (y sale). Sin él, la bajada avisa que lo que se lleva se pierde.
  alGuardarYSalir?: () => void
  // Dónde se retoma el borrador, para la bajada: «Contenidos», «Tus videos recientes».
  retomarEn?: string
  // Para cambiar la bajada; sin ella se usa la de la pantalla modelo.
  mensaje?: ReactNode
}

// La ventana de salir de una creación o edición, una sola en todo el producto (war room del 13-oct: la de Aprendizaje ›
// Crear contenido). Icono de salir, «¿Salir de la creación?», una bajada y dos botones: «Seguir aquí» y el mismo texto
// del botón que la abrió. Sin tarjeta del registro y sin «Guardar y salir»: lo que tiene borrador se guarda solo al salir.
// El botón de salir va siempre en azul (war room del 15-oct, Carlos): salir de un flujo no elimina nada; el rojo queda
// para eliminar. Si sin borrador algo se pierde, lo dice la bajada, no el color.
// La usan BotonSalirCreacion y las salidas que no pasan por él (la barra lateral, «atrás» del navegador).
// Es DialogoSalir con la bajada armada según haya borrador o no: Nicolás (DialogoSalir) y Cristian (esta) hicieron la
// misma ventana el 13-oct y quedó una sola al unir los PR (16-oct).
export function VentanaSalir({
  abierto,
  onAbiertoChange,
  texto = 'Salir de la creación',
  borrador,
  retomarEn,
  mensaje,
  onSalir,
}: {
  abierto: boolean
  onAbiertoChange: (abierto: boolean) => void
  // El texto del botón que sale: «Salir de la creación», «Salir de la edición». El título es el mismo, en pregunta.
  texto?: string
  // ¿Lo que se lleva queda guardado al salir?
  borrador: boolean
  retomarEn?: string
  mensaje?: ReactNode
  onSalir: () => void
}) {
  const descripcion =
    mensaje ??
    (borrador
      ? `Lo que llevas queda guardado como borrador.${retomarEn ? ` Puedes retomarlo cuando quieras desde ${retomarEn}.` : ''}`
      : 'Lo que llevas se pierde: no queda guardado al salir.')
  return <DialogoSalir abierto={abierto} onAbiertoChange={onAbiertoChange} salida={texto} descripcion={descripcion} onSalir={onSalir} />
}

// La única salida de una creación o edición (regla «crear-en-pagina», 6-oct): contorno e icono de salir, sin flecha ni
// X, y dice a dónde lleva («Salir de la creación», «Salir de la edición», «Volver al plan»). Va en las acciones de
// PageHeader, a la derecha del título.
// Con `salida`, si hay cambios abre VentanaSalir; sin cambios, sale directo. Sin `salida`, quien la usa decide (para
// pantallas que ya preguntan por su cuenta).
// Nació en LMS Creator (crear-contenido/components/marco-inmersivo.tsx) y se mudó aquí el 8-oct porque la usan
// Tareas, las plantillas y el design system.
export function BotonSalirCreacion({
  texto = 'Salir de la creación',
  onClick,
  salida,
}: {
  texto?: string
  // Salir de verdad (navegar a la lista).
  onClick: () => void
  salida?: SalidaConCambios
}) {
  const [preguntando, setPreguntando] = useState(false)
  const guardar = salida?.alGuardarYSalir
  return (
    <>
      <Button variant="outline" onClick={() => (salida?.conCambios ? setPreguntando(true) : onClick())}>
        <HugeiconsIcon icon={Logout01Icon} size={16} aria-hidden="true" />
        {texto}
      </Button>
      {salida ? (
        <VentanaSalir
          abierto={preguntando}
          onAbiertoChange={setPreguntando}
          texto={texto}
          borrador={Boolean(guardar)}
          retomarEn={salida.retomarEn}
          mensaje={salida.mensaje}
          onSalir={() => {
            setPreguntando(false)
            if (guardar) guardar()
            else onClick()
          }}
        />
      ) : null}
    </>
  )
}
