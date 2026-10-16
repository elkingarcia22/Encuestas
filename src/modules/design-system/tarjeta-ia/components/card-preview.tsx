import { AiCard } from '@/shared/components/AiCard'
import { PageShell } from '@/shared/components/PageShell'
import { SlotArea } from '../../components/anatomy/anatomy-kit'
import { PantallaReal } from '../../components/anatomy/pantalla-real'
import { InicioOperativo } from '../../templates/home-operativo/components/inicio-operativo'
import { PART, type CardConfig, type CardSample } from './card-config'

// Vista previa de la tarjeta de invitación a la IA. No es una réplica: usa el mismo componente que el Inicio
// (`AiCard`) y solo le pasa el nombre de cada parte, así que no puede quedarse desfasada.
// `real`: «Probar en pantalla». La tarjeta configurada va en su sitio de verdad —Quick actions del Inicio real— dentro
// del marco real del Workspace, en vez de sola junto a un slot.
export function CardPreview({ config, sample, real = false }: { config: CardConfig; sample: CardSample; real?: boolean }) {
  if (real) {
    return (
      <PantallaReal ruta="/admin">
        <PageShell className="gap-10">
          <InicioOperativo
            enlace={() => '/admin'}
            tarjetaIa={
              <AiCard
                title={sample.title}
                description={config.description ? sample.description : undefined}
                action={config.action ? sample.action : undefined}
                onAction={() => undefined}
                orb={config.orb}
                badge={config.badge ? sample.badge : undefined}
                halo={config.halo}
                compact={config.compact}
                inFrame
                className="flex-1"
              />
            }
          />
        </PageShell>
      </PantallaReal>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* La tarjeta nunca va sola: vive dentro de una pantalla, junto a lo demás. El slot recuerda ese contexto. */}
      <div className="grid gap-4 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <AiCard
          title={sample.title}
          description={config.description ? sample.description : undefined}
          action={config.action ? sample.action : undefined}
          orb={config.orb}
          badge={config.badge ? sample.badge : undefined}
          halo={config.halo}
          compact={config.compact}
          regions={{
            card: PART.card,
            orb: config.orb ? PART.orb : undefined,
            badge: config.badge ? PART.badge : undefined,
            title: PART.title,
            description: config.description && !config.compact ? PART.description : undefined,
            action: config.action ? PART.action : undefined,
          }}
        />
        <SlotArea name="Resto de la pantalla" hint="Lo que ya había: métricas, atajos, listas. La tarjeta se suma, no manda." className="min-h-52" />
      </div>
    </div>
  )
}
