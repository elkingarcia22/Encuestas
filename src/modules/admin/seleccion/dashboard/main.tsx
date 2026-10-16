import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { useCarga } from '../propuestas/components/carga'
import { LecturasIA } from './lecturas'
import { HallazgosIA } from './hallazgos'
import { SIN_FILTROS, filtrarVacantes, resumir } from './datos'

// AI Insights de Selección (8 oct, VP de producto): reemplaza al Dashboard. Son insights, no dashboards (8 oct, Nicolás:
// «lo de arriba + algo más creativo que realmente se vea wow de AI Insights, recuerda son insights»). Una sola pieza,
// `lecturas.tsx`: una lectura grande a la vez, que pasa sola a la siguiente, con el dato que la respalda y el índice de
// todas (8 oct, tarde: «Lo que ve la IA hoy» y «Lo que encontró la IA» eran lo mismo y quedaron juntas).
// Pedirle dashboards a la IA y guardarlos queda para Suite AI Pro (sale en enero). La versión con «Pídele un dashboard»
// y «Tus dashboards» sigue en `insights.ts`, `tabla.tsx` y `llegadas.tsx`, sin usarse.

export function Component() {
  const cargando = useCarga()
  const general = resumir(filtrarVacantes(SIN_FILTROS), '90')

  return (
    <PageShell>
      <PageHeader
        breadcrumbs={[{ label: 'Inicio', path: '/admin' }, { label: 'Selección' }, { label: 'AI Insights' }]}
        title="AI Insights"
        description="Lo que la IA ve en tu selección y lo que encontró en tus datos. Se actualiza todos los días a las 7:00 a. m."
      />
      <PageContent>
        <LecturasIA resumen={general} cargando={cargando} />
        {/* Debajo, lo que encontró la IA y no cabe en una frase: a quién mirar, qué requisito filtra y dónde se espera. */}
        {cargando ? null : <HallazgosIA resumen={general} />}
      </PageContent>
    </PageShell>
  )
}

Component.displayName = 'AdminSeleccionDashboardPage'
