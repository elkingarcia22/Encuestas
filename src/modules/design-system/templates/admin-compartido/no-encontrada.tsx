import { useNavigate } from 'react-router'

import { PantallaDeError } from '../../estados/errores-sistema'
import { ERRORES } from '../../estados/errores-sistema-datos'
import { HOME_OPERATIVO } from './rutas'

// Una dirección que no existe dentro de un template: el error de sistema «No encontramos esta
// página» (HU-TRA-002), con «Volver al inicio» llevando al Home operativo.

export function Component() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-1 flex-col pt-2">
      <PantallaDeError error={ERRORES[0]} onAccion={() => navigate(HOME_OPERATIVO)} />
    </div>
  )
}

Component.displayName = 'TemplateAdminNoEncontrada'
