import { useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { InformationCircleIcon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  Heading,
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
  Progress,
  Separator,
  Text,
} from '@ubits/flux-ui'
import { PageShell } from '@/shared/components/PageShell'
import { FullscreenTemplate } from '@/modules/design-system/templates/fullscreen-template'

// Vista previa del correo «Recordatorio: planes de formación pendientes» (HU-progreso). Es lo que recibe cada persona
// del equipo cuando la líder confirma el recordatorio; se ve como página suelta, igual que el correo de certificados.
// Los datos son de ejemplo, como en el prototipo.

const DESTINATARIO = 'Ana Lucía Torres'
const LIDER = 'María Alejandra Sánchez Pardo'
const PLANES = [
  { nombre: 'Onboarding logística 2026', avance: 45, tipo: 'Plan de contenidos', vence: '30 jun 2026' },
  { nombre: 'Capacitación Seguridad 2027', avance: 0, tipo: 'Plan de competencias', vence: '15 ago 2026' },
]

export function Component() {
  const navigate = useNavigate()
  return (
    <FullscreenTemplate>
      <div className="h-full overflow-auto bg-muted/60 py-8">
        <PageShell width="narrow">
          <div className="flex flex-col gap-4">
            {/* Existe solo en el playground: en el producto el correo llega a la bandeja de cada persona. */}
            <Alert variant="info">
              <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
              <AlertTitle>Vista del prototipo</AlertTitle>
              <AlertDescription>
                Así se verá, más o menos, el correo que recibe cada persona del equipo con planes sin completar. En el producto no se abre nada al
                enviar el recordatorio: el correo le llega a su bandeja.
              </AlertDescription>
            </Alert>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Badge variant="secondary">Vista previa del correo</Badge>
              <Text as="span" size="sm" variant="muted">
                Recordatorio: planes de formación pendientes · De UBITS
              </Text>
            </div>

            <Card>
              <CardContent className="flex flex-col gap-6">
                <img src="/ubits-logo.svg" alt="UBITS" className="mx-auto h-7 w-auto" />
                <Separator />
                <div className="flex flex-col gap-3">
                  <Heading as="h1" level={4}>
                    ¡Hola, {DESTINATARIO}!
                  </Heading>
                  <Text variant="muted">{LIDER} te envió un recordatorio sobre tus planes de formación pendientes:</Text>
                </div>
                <ItemGroup className="flex flex-col gap-2">
                  {PLANES.map((p) => (
                    <Item key={p.nombre} variant="outline" className="flex-col items-stretch gap-3">
                      <ItemContent>
                        <ItemTitle>{p.nombre}</ItemTitle>
                        <ItemDescription>
                          {p.tipo} · Vence el {p.vence}
                        </ItemDescription>
                      </ItemContent>
                      <div className="flex items-center gap-3">
                        <Progress value={p.avance} aria-label={`Avance de ${p.nombre}`} className="flex-1" />
                        <Text as="span" size="sm" weight="semibold" className="tabular-nums">
                          {p.avance}%
                        </Text>
                      </div>
                    </Item>
                  ))}
                </ItemGroup>
                <Button size="lg" className="w-full" onClick={() => navigate('/portal-colaborador/aprendizaje/zona-de-estudio')}>
                  Ir a la plataforma
                </Button>
                <Separator />
                <Text size="xs" variant="muted" className="text-center">
                  Este correo fue enviado por {LIDER} a través de UBITS.
                </Text>
              </CardContent>
            </Card>
          </div>
        </PageShell>
      </div>
    </FullscreenTemplate>
  )
}

Component.displayName = 'PortalColaboradorProgresoCorreoRecordatorioPage'
