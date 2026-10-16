import { useSearchParams } from 'react-router'

// Cada pantalla del acceso es un «caso» con su propio enlace (/auth?caso=bloqueado): se comparte, se recarga y el
// atrás del navegador recorre los pasos. Bloqueo, «Sigue aprendiendo» y «Sin permisos» los decide el servidor en el
// producto real; aquí se abren desde el menú «Casos de uso».
export type AuthCaso =
  | 'login'
  | 'sin-permiso'
  | 'organizacion'
  | 'olvide-password'
  | 'revisa-correo'
  | 'bloqueado'
  | 'sigue-aprendiendo'

export const AUTH18_CASOS: { value: AuthCaso; label: string }[] = [
  { value: 'login', label: 'Inicio de sesión' },
  { value: 'sin-permiso', label: 'Sin permisos de administrador' },
  { value: 'organizacion', label: 'Ingresa con tu organización' },
  { value: 'olvide-password', label: '¿Olvidaste tu contraseña?' },
  { value: 'revisa-correo', label: '¡Revisa tu correo!' },
  { value: 'bloqueado', label: 'Cuenta bloqueada' },
  { value: 'sigue-aprendiendo', label: 'Sigue aprendiendo' },
]

function esCaso(valor: string | null): valor is AuthCaso {
  return AUTH18_CASOS.some((caso) => caso.value === valor)
}

export function useCasoAuth() {
  const [params, setParams] = useSearchParams()
  const valor = params.get('caso')
  const caso: AuthCaso = esCaso(valor) ? valor : 'login'
  const irA = (siguiente: AuthCaso) => setParams(siguiente === 'login' ? {} : { caso: siguiente })
  return [caso, irA] as const
}
