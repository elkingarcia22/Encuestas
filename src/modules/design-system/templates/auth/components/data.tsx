import falabellaLogo from '@/modules/auth/Assets/Falabella.svg'
import sodimacLogo from '@/modules/auth/Assets/Sodimac.svg'
import suraLogo from '@/modules/auth/Assets/Sura.svg'
import totalplayLogo from '@/modules/auth/Assets/Totalplay.svg'

export type AuthAudience = 'admin' | 'colaborador'

export const AUTH18_AUDIENCES: { value: AuthAudience; label: string }[] = [
  { value: 'colaborador', label: 'Colaborador' },
  { value: 'admin', label: 'Administrador' },
]

export const AUTH18_AUDIENCE_PATHS: Record<AuthAudience, string> = {
  admin: '/admin',
  colaborador: '/portal-colaborador',
}

// Simula lo que tarda en cargar la plataforma tras «Iniciar sesión»: se ve el «Ingresando…» antes de entrar.
export const AUTH18_ESPERA_INGRESO_MS = 1200

export type Testimonial = {
  quote: string
  name: string
  role: string
  company: string
  avatar: string
  fallback: string
}

// Testimonio ficticio de referencia — la cita y la persona NO son reales.
// Antes de usar esta pantalla fuera del playground, reemplazar por una cita real y
// aprobada por Cencosud, o volver a un nombre de empresa genérico.
export const AUTH18_TESTIMONIAL: Testimonial = {
  quote: 'Potencia el talento y conecta tu estrategia en un solo lugar.',
  name: 'Marcela Ortiz',
  role: 'Directora RH',
  company: 'Cencosud',
  avatar: 'https://i.pravatar.cc/64?img=47',
  fallback: 'MO',
}

export type TrustBrand = {
  id: string
  name: string
  logo: string
}

export const AUTH18_TRUST_BRANDS: TrustBrand[] = [
  { id: 'falabella', name: 'Falabella', logo: falabellaLogo },
  { id: 'sodimac', name: 'Sodimac', logo: sodimacLogo },
  { id: 'sura', name: 'Sura', logo: suraLogo },
  { id: 'totalplay', name: 'Totalplay', logo: totalplayLogo },
]
