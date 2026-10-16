import { HugeiconsIcon } from '@hugeicons/react'
import { ExclamationMarkIcon, Tick02Icon } from '@hugeicons/core-free-icons'
import { Card, StepperDescription, StepperIndicator, StepperItem, StepperNav, StepperSeparator, StepperTitle, StepperTrigger } from '@ubits/flux-ui'
import { plural } from '@/modules/design-system/patrones/formato'
import { pendienteEtapa } from './etapas'
import { PASOS, type VacanteNueva } from './formulario'
import { avanceInformacion } from './secciones-informacion'

// Los pasos en una tarjeta, como los del LMS Creator (1 oct, Nicolás: «mejor dejarlo como este que hicimos para
// contenido»): número (o ✓ si está listo), nombre y una línea con cómo va. Va dentro del `Stepper` de la creación, que
// sigue decidiendo a qué paso se puede saltar: los de después del primero se abren cuando la información está completa.

type EstadoPaso = { hecho: boolean; linea: string }

function estadoDe(numero: number, vacante: VacanteNueva): EstadoPaso {
  if (numero === 1) {
    const { falta } = avanceInformacion(vacante)
    return { hecho: falta.length === 0, linea: falta.length ? plural(falta.length, 'Falta 1 dato', `Faltan ${falta.length} datos`) : 'Listo' }
  }
  if (numero === 2) {
    const sinEscribir = vacante.secciones.filter((seccion) => !seccion.texto.trim()).length
    return {
      hecho: sinEscribir === 0,
      linea: sinEscribir ? plural(sinEscribir, 'Falta escribir una sección', `Faltan escribir ${sinEscribir} secciones`) : 'Listo',
    }
  }
  if (vacante.etapas.length === 0) return { hecho: false, linea: 'Sin etapas todavía' }
  const porConfigurar = vacante.etapas.filter((etapa) => pendienteEtapa(etapa) !== null).length
  return {
    hecho: porConfigurar === 0,
    linea: porConfigurar ? plural(porConfigurar, 'Falta configurar una etapa', `Faltan configurar ${porConfigurar} etapas`) : 'Listo para publicar',
  }
}

export function PasosEnTarjeta({ vacante, paso, desbloqueado }: { vacante: VacanteNueva; paso: number; desbloqueado: number }) {
  return (
    <Card className="px-5! py-4!">
      <StepperNav>
        {PASOS.map((item, indice) => {
          const esActual = item.numero === paso
          const bloqueado = item.numero > desbloqueado
          const estado = estadoDe(item.numero, vacante)
          const linea = esActual ? 'Aquí estás' : bloqueado ? 'Se abre al completar el paso 1' : estado.linea
          // La librería pinta como hechos todos los pasos anteriores al actual. Si a uno le falta algo, su círculo lleva
          // un «!» en vez del ✓: el color dice «ya pasaste», el «!» dice «te quedó algo». Los dos a 14 px: a su tamaño normal
          // llenaban el círculo (1 oct, Nicolás: «esos dos iconos se ven súper raros»).
          const pendienteAtras = item.numero < paso && !estado.hecho
          const listo = estado.hecho && !esActual && !bloqueado
          return (
            <StepperItem key={item.numero} step={item.numero} completed={listo} disabled={bloqueado} className="min-w-0 flex-1">
              <StepperTrigger
                className="min-w-0 items-start gap-3 text-left"
                tabIndex={bloqueado ? -1 : 0}
                aria-label={`Paso ${item.numero}: ${item.titulo}. ${linea}`}
              >
                <StepperIndicator>
                  {pendienteAtras ? (
                    <HugeiconsIcon icon={ExclamationMarkIcon} size={14} strokeWidth={2.5} aria-hidden="true" />
                  ) : listo ? (
                    <HugeiconsIcon icon={Tick02Icon} size={14} strokeWidth={2.5} aria-hidden="true" />
                  ) : (
                    item.numero
                  )}
                </StepperIndicator>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <StepperTitle>{item.titulo}</StepperTitle>
                  <StepperDescription className="line-clamp-2">{linea}</StepperDescription>
                </span>
              </StepperTrigger>
              {indice < PASOS.length - 1 ? <StepperSeparator className="mx-3" /> : null}
            </StepperItem>
          )
        })}
      </StepperNav>
    </Card>
  )
}
