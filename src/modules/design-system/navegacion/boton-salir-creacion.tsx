import { HugeiconsIcon } from '@hugeicons/react'
import { Logout01Icon } from '@hugeicons/core-free-icons'
import { Button } from '@ubits/flux-ui'

// La única salida de una creación o edición (regla «crear-en-pagina», 6-oct): contorno e icono de salir, sin flecha ni
// X, y dice a dónde lleva («Salir de la creación», «Salir de la edición», «Volver a añadir página»). Va en las acciones
// de PageHeader, a la derecha del título; si hay cambios, quien la usa pregunta antes con DialogoConfirmar.
// Nació en LMS Creator (crear-contenido/components/marco-inmersivo.tsx) y se mudó aquí el 8-oct porque la usan
// Tareas, las plantillas y el design system.
export function BotonSalirCreacion({ texto = 'Salir de la creación', onClick }: { texto?: string; onClick: () => void }) {
  return (
    <Button variant="outline" onClick={onClick}>
      <HugeiconsIcon icon={Logout01Icon} size={16} aria-hidden="true" />
      {texto}
    </Button>
  )
}
