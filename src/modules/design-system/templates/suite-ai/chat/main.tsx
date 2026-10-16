import { useNavigate } from 'react-router'
import { Heading } from '@ubits/flux-ui'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import { Orb } from '@/shared/components/Orb'

import { Compositor } from '../components/compositor'
import { ATAJOS_CHAT, PERSONA } from '../components/data'
import { useSuite } from '../components/estado'

// Caso 01 del concepto: el chat nuevo de Suite AI. Saludo con la bolita de IA y el campo abajo,
// con atajos y la franja de novedad («Ya ejecuta acciones en Selección»).

export function Component() {
  const suite = useSuite()
  const navigate = useNavigate()

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-5 py-12 text-center">
        <Orb className="size-16" />
        <Heading as="h1" level={2}>
          ¿Qué necesitas resolver hoy, {PERSONA.primerNombre}?
        </Heading>
      </div>
      <div className="mx-auto w-full max-w-3xl">
        <Compositor
          valor={suite.borrador}
          onValor={suite.setBorrador}
          onEnviar={suite.enviarNuevo}
          atajos={ATAJOS_CHAT.map((atajo) => (
            <BotonIaSecundario
              key={atajo.etiqueta}
              size="sm"
              onClick={() => (atajo.ruta ? navigate(atajo.ruta) : suite.setBorrador(atajo.borrador ?? ''))}
            >
              {atajo.etiqueta}
            </BotonIaSecundario>
          ))}
          novedad={suite.franjaNuevo ? { onVer: () => suite.setPromo('cambio'), onCerrar: () => suite.setFranjaNuevo(false) } : undefined}
        />
      </div>
    </div>
  )
}

Component.displayName = 'DesignSystemTemplateSuiteAiChat'
