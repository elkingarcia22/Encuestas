import { useState } from 'react'
import { BlockedAccountPanel } from './blocked-account-panel'
import { useCasoAuth } from './casos'
import { CheckEmailPanel } from './check-email-panel'
import { ForgotPasswordForm } from './forgot-password-form'
import { KeepLearningPanel } from './keep-learning-panel'
import { LoginForm } from './login-form'
import { OrganizationForm } from './organization-form'

// Los pasos cambian en la misma página, como en login.ubitslearning.com, pero cada uno queda en el enlace
// (?caso=…): el correo escrito se conserva entre pasos porque este componente no se desmonta.
export function SignInPanel() {
  const [caso, irA] = useCasoAuth()
  // Al volver al login desde otro paso, el foco vuelve al primer campo y no se pierde en la página.
  const [volvioAlLogin, setVolvioAlLogin] = useState(false)
  const [identificador, setIdentificador] = useState('')
  const [destino, setDestino] = useState('')

  function irAlLogin() {
    setVolvioAlLogin(true)
    irA('login')
  }

  switch (caso) {
    case 'organizacion':
      return <OrganizationForm onBackToLogin={irAlLogin} />
    case 'olvide-password':
      return (
        <ForgotPasswordForm
          identificador={identificador}
          onBack={irAlLogin}
          onSubmitted={(enviadoA) => {
            setIdentificador(enviadoA)
            setDestino(enviadoA)
            irA('revisa-correo')
          }}
        />
      )
    case 'revisa-correo':
      return (
        <CheckEmailPanel destino={destino} onBackToLogin={irAlLogin} onChangeEmail={() => irA('olvide-password')} />
      )
    case 'bloqueado':
      return <BlockedAccountPanel onBackToLogin={irAlLogin} />
    case 'sigue-aprendiendo':
      return <KeepLearningPanel onBackToLogin={irAlLogin} onOrganizationLogin={() => irA('organizacion')} />
    default:
      return (
        <LoginForm
          // La clave reinicia el formulario al pasar entre «Inicio de sesión» y «Sin permisos de administrador».
          key={caso}
          audienciaInicial={caso === 'sin-permiso' ? 'admin' : 'colaborador'}
          sinPermisoInicial={caso === 'sin-permiso'}
          identificador={identificador}
          autoFocus={volvioAlLogin}
          onIdentificadorChange={setIdentificador}
          onForgotPassword={() => irA('olvide-password')}
          onOrganizationLogin={() => irA('organizacion')}
        />
      )
  }
}
