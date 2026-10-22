import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon, InformationCircleIcon } from '@hugeicons/core-free-icons'
import { Button, cn } from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { PageActionBar, PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { WS } from '../../drawers/components/drawer-styles'
import { DialogoConfirmar, RegistroConfirmar } from '../../estados/confirmaciones'
import { CaseFrame } from '../components/case-frame'
import { INITIAL, SECTIONS, type SectionId, type Settings } from './components/data'
import { SectionPanel } from './components/sections'

// Patrón · Configuración: menú vertical dentro de la página y barra de guardado cuando hay cambios.
// El menú usa botones: las pestañas verticales de flux-ui ignoran la orientación y dibujan la línea abajo.
export function Component() {
  const [section, setSection] = useState<SectionId>('general')
  const [saved, setSaved] = useState<Settings>(INITIAL)
  const [values, setValues] = useState<Settings>(INITIAL)
  const [descartando, setDescartando] = useState(false)

  const changedKeys = (Object.keys(values) as (keyof Settings)[]).filter((key) => values[key] !== saved[key])
  const changed = changedKeys.length
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setValues((current) => ({ ...current, [key]: value }))
  const current = SECTIONS.find((item) => item.value === section) ?? SECTIONS[0]

  return (
    <CaseFrame title="Configuración" hint="Secciones largas con menú interno y barra para guardar cambios">
      <PageShell>
        <PageHeader
          breadcrumbs={[{ label: 'Inicio', path: '/admin' }, { label: 'Configuración' }, { label: 'Empresa' }]}
          title="Configuración de la empresa"
          description="Datos, marca, accesos e integraciones de Meta Colombia en UBITS. Los cambios aplican para todos los colaboradores."
        />

        <PageContent>
          <div className="flex items-start gap-10 max-md:flex-col">
            <nav data-region="Menú interno" aria-label="Secciones de la configuración" className="flex w-full shrink-0 flex-col gap-0.5 md:sticky md:top-0 md:w-56">
              {SECTIONS.map((item) => {
                const active = item.value === section
                const dirty = item.keys.some((key) => changedKeys.includes(key))
                return (
                  <Button
                    key={item.value}
                    variant={active ? 'secondary' : 'ghost'}
                    aria-current={active ? 'page' : undefined}
                    className={cn('h-9 w-full justify-start gap-2 px-3', WS, !active && 'text-muted-foreground!')}
                    onClick={() => setSection(item.value)}
                  >
                    <HugeiconsIcon icon={item.icon} size={17} />
                    {item.label}
                    {dirty ? (
                      <>
                        <span aria-hidden="true" className="ml-auto size-1.5 rounded-full bg-primary" />
                        <span className="sr-only">, con cambios sin guardar</span>
                      </>
                    ) : null}
                  </Button>
                )
              })}
            </nav>

            <div key={current.value} className="flex min-w-0 flex-1 animate-in flex-col gap-6 duration-200 fade-in">
              <SectionPanel section={current.value} values={values} set={set} />
            </div>
          </div>

          {/* Siempre montado: así el aviso de cambios se anuncia al aparecer la barra (y al cambiar el número). */}
          <span role="status" className="sr-only">
            {changed ? `Tienes ${changed} ${changed === 1 ? 'cambio' : 'cambios'} sin guardar` : ''}
          </span>
          {changed ? (
            <PageActionBar className="bottom-4 animate-in duration-300 fade-in slide-in-from-bottom-2">
              <HugeiconsIcon icon={InformationCircleIcon} size={18} className="text-primary" />
              <span className="text-sm">
                Tienes {changed} {changed === 1 ? 'cambio' : 'cambios'} sin guardar
              </span>
              <div className="ml-auto flex gap-2">
                {/* Descartar tira lo escrito: pregunta antes, «Seguir editando» · «Descartar» (13-oct). */}
                <Button variant="ghost" className={WS} onClick={() => setDescartando(true)}>
                  Descartar
                </Button>
                <Button
                  className={WS}
                  onClick={() => {
                    setSaved(values)
                    notify('Cambios guardados', undefined, 'success')
                  }}
                >
                  Guardar cambios
                </Button>
              </div>
            </PageActionBar>
          ) : null}
        </PageContent>

        <DialogoConfirmar
          abierto={descartando}
          onAbiertoChange={setDescartando}
          icono={Delete02Icon}
          titulo="¿Descartar los cambios?"
          descripcion="Los datos vuelven a como estaban al abrir la página. Lo que escribiste se pierde."
          cancelar="Seguir editando"
          accion="Descartar"
          destructiva
          onConfirmar={() => {
            setDescartando(false)
            setValues(saved)
            notify('Cambios descartados', undefined, 'info')
          }}
        >
          <RegistroConfirmar nombre="Configuración de la empresa" detalle={`${changed} ${changed === 1 ? 'cambio' : 'cambios'} sin guardar`} estado="Sin guardar" />
        </DialogoConfirmar>
      </PageShell>
    </CaseFrame>
  )
}

Component.displayName = 'NavigationSettingsPage'
