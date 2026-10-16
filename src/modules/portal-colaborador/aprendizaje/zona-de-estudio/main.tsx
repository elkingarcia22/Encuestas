import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Target02Icon } from '@hugeicons/core-free-icons'
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@ubits/flux-ui'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { demoVacia } from '@/shared/components/PrimeraVez'
import { planesZona, type TipoPlan } from './components/datos'
import { PestanaEventos } from './components/pestana-eventos'
import { PestanaCompetencias, PestanaContenidos, PestanaExclusivo, PestanaHistorial } from './components/pestanas'

// Aprendizaje › Zona de estudio del colaborador (HU-APR-003 y HU-APR-011). Lo asignado a la persona, separado del
// catálogo: sus planes de contenidos y de competencias, lo exclusivo para ella, los eventos y el historial con los
// certificados. Cada pestaña tiene dirección propia (#contenidos, #competencias…); ?planId= abre un plan concreto (así
// llega Progreso) y ?demo=sin-eventos muestra Eventos vacío.

const PESTANAS = [
  { id: 'contenidos', etiqueta: 'Plan de contenidos' },
  { id: 'competencias', etiqueta: 'Plan de competencias' },
  { id: 'exclusivo', etiqueta: 'Exclusivo para mí' },
  { id: 'eventos', etiqueta: 'Eventos' },
  { id: 'historial', etiqueta: 'Historial y certificados' },
] as const

type Pestana = (typeof PESTANAS)[number]['id']

const RUTA_PROGRESO = '/portal-colaborador/aprendizaje/progreso'

const leerPestana = (hash: string): Pestana => {
  const clave = hash.replace(/^#/, '').toLowerCase()
  return PESTANAS.some((p) => p.id === clave) ? (clave as Pestana) : 'contenidos'
}

export function Component() {
  const { hash, search } = useLocation()
  const navigate = useNavigate()
  const [consulta] = useSearchParams()
  const pestana = leerPestana(hash)
  // `?demo=vacio` enseña el estado de primera vez de la pestaña que esté abierta.
  const sinNada = demoVacia(consulta)

  // Los planes se leen una vez por visita: la base vive en la sesión del navegador y el agente de Progreso le suma.
  const planes = useMemo(
    () => ({
      contenidos: planesZona('contenidos'),
      competencias: planesZona('competencias'),
    }),
    [],
  )

  // El plan elegido en cada pestaña; ?planId= preselecciona el de la pestaña a la que llega.
  const planIdInicial = consulta.get('planId')
  const [elegido, setElegido] = useState<Record<TipoPlan, string>>(() => ({
    contenidos: pestana === 'contenidos' && planIdInicial ? planIdInicial : '',
    competencias: pestana === 'competencias' && planIdInicial ? planIdInicial : '',
  }))
  const planDe = (tipo: TipoPlan) => planes[tipo].find((p) => p.id === elegido[tipo]) ?? planes[tipo][0]

  useEffect(() => {
    // La vieja pestaña Progreso ahora es su propia página: se manda allá con la misma consulta.
    if (hash.toLowerCase() === '#progreso') navigate(`${RUTA_PROGRESO}${search}`, { replace: true })
    // Sin pestaña (o con una que no existe) la dirección queda en la primera.
    else if (hash.replace(/^#/, '').toLowerCase() !== pestana) navigate({ search, hash: pestana }, { replace: true })
  }, [hash, search, pestana, navigate])

  const cambiar = (valor: Pestana) => navigate({ search, hash: valor }, { replace: true })

  return (
    <PageShell>
      <Tabs value={pestana} onValueChange={(valor) => cambiar(valor as Pestana)}>
        <PageHeader
          title="Zona de estudio"
          // Progreso es la pantalla hermana (lo que llevas de estos planes): el atajo va junto al título, como en la
          // plantilla de Zona de estudio del design system.
          actions={
            <Button variant="outline" nativeButton={false} render={<Link to={RUTA_PROGRESO} />}>
              <HugeiconsIcon icon={Target02Icon} aria-hidden="true" />
              Ver mi progreso
            </Button>
          }
          tabs={
            <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none]">
              <TabsList variant="line">
                {PESTANAS.map((p) => (
                  <TabsTrigger key={p.id} value={p.id} className="flex-none">
                    {p.etiqueta}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          }
        />
        <PageContent>
          <TabsContent value="contenidos">
            <PestanaContenidos
              vacio={sinNada}
              planes={planes.contenidos}
              plan={planDe('contenidos')}
              onPlan={(id) => setElegido((e) => ({ ...e, contenidos: id }))}
            />
          </TabsContent>
          <TabsContent value="competencias">
            <PestanaCompetencias
              vacio={sinNada}
              planes={planes.competencias}
              plan={planDe('competencias')}
              onPlan={(id) => setElegido((e) => ({ ...e, competencias: id }))}
            />
          </TabsContent>
          <TabsContent value="exclusivo">
            <PestanaExclusivo vacio={sinNada} />
          </TabsContent>
          <TabsContent value="eventos">
            <PestanaEventos sinEventos={sinNada || consulta.get('demo') === 'sin-eventos'} />
          </TabsContent>
          <TabsContent value="historial">
            <PestanaHistorial vacio={sinNada} />
          </TabsContent>
        </PageContent>
      </Tabs>
    </PageShell>
  )
}

Component.displayName = 'PortalColaboradorAprendizajeZonaDeEstudioPage'
