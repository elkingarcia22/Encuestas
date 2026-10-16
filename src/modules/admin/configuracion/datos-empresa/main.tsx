import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { InformationCircleIcon } from '@hugeicons/core-free-icons'
import { Alert, AlertDescription, Badge, Progress, ProgressLabel, ProgressValue, Tabs, TabsList, TabsTrigger } from '@ubits/flux-ui'
import { FilaCifras } from '@/modules/design-system/metricas/cifras'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { DATOS_CURSOS_PROPIOS, DATOS_GENERALES, DATOS_SUSCRIPCION, EMPRESA, LICENCIAS, numero } from '../components/datos'
import { SeccionDatos } from '../components/lista-datos'

type Pestana = 'empresa' | 'suscripcion'

const PESTANAS: { value: Pestana; label: string }[] = [
  { value: 'empresa', label: 'Datos de la empresa' },
  { value: 'suscripcion', label: 'Suscripción' },
]

// Configuración › Datos de empresa (en la plataforma: /admin-hr/companies/:id). Todo es de solo lectura:
// lo cambia el gestor de cuenta de UBITS.
export function Component() {
  const [pestana, setPestana] = useState<Pestana>('empresa')

  return (
    <PageShell>
      <PageHeader
        title={EMPRESA.nombre}
        badge={<Badge variant="success-light">{EMPRESA.estado}</Badge>}
        description="Datos de tu empresa y de tu suscripción a UBITS."
        tabs={
          <Tabs value={pestana} onValueChange={(value) => setPestana(value as Pestana)}>
            <TabsList variant="line">
              {PESTANAS.map((item) => (
                <TabsTrigger key={item.value} value={item.value} className="flex-none px-3">
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        }
      />

      <PageContent>
        <Alert variant="info">
          <HugeiconsIcon icon={InformationCircleIcon} size={18} />
          <AlertDescription>
            <p>Para cambiar estos datos, escríbele a tu gestor de cuenta de UBITS.</p>
          </AlertDescription>
        </Alert>

        {pestana === 'empresa' ? (
          <div key="empresa" className="grid animate-in items-start gap-6 duration-200 fade-in lg:grid-cols-2">
            <SeccionDatos titulo="Datos de la empresa" datos={DATOS_GENERALES} />
            <SeccionDatos titulo="Datos cursos propios" datos={DATOS_CURSOS_PROPIOS} />
          </div>
        ) : (
          <div key="suscripcion" className="grid animate-in items-start gap-6 duration-200 fade-in lg:grid-cols-2">
            <SeccionDatos titulo="Datos suscripción" datos={DATOS_SUSCRIPCION} />
            <SeccionDatos titulo="Licencias" descripcion="Uso de las licencias de tu plan.">
              <Progress value={LICENCIAS.activas} max={LICENCIAS.total}>
                <ProgressLabel>Licencias activas</ProgressLabel>
                <ProgressValue className="ml-auto tabular-nums">
                  {() => `${numero(LICENCIAS.activas)} de ${numero(LICENCIAS.total)}`}
                </ProgressValue>
              </Progress>
              <FilaCifras
                columnas="sm:grid-cols-3"
                cifras={[
                  { etiqueta: 'Número de licencias', valor: numero(LICENCIAS.total) },
                  { etiqueta: 'Licencias activas', valor: numero(LICENCIAS.activas) },
                  { etiqueta: 'Licencias inactivas', valor: numero(LICENCIAS.inactivas) },
                ]}
              />
            </SeccionDatos>
          </div>
        )}
      </PageContent>
    </PageShell>
  )
}

Component.displayName = 'AdminDatosEmpresaPage'
