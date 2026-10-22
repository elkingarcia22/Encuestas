import { useNavigate, useParams, useSearchParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Download04Icon, InformationCircleIcon } from '@hugeicons/core-free-icons'
import { Alert, AlertDescription, AlertTitle, Button, Card, CardContent, Heading, Separator, Text } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { descargarCsv } from '@/modules/admin/desempeno-cultura/encuestas/modelo/descargas/csv'
import { PageShell } from '@/shared/components/PageShell'
import { FullscreenTemplate } from '@/modules/design-system/templates/fullscreen-template'
import { esModo } from '../descarga/components/correo'
import { descripcionFiltro, fechaLarga, formularioDeEjemplo, USUARIO } from '../descarga/components/logica'

// Vista previa del correo «¡Tus certificados están listos!» (HU-LMS-007, RN-04 y RN-05). Hay uno por modo; cambia la
// frase de qué se generó. Se ve como página suelta, igual que un correo abierto, con el FullscreenTemplate del equipo.

const aFecha = (iso: string | null) => (iso ? new Date(`${iso}T00:00:00`) : undefined)

const QUE_SE_GENERO = {
  global: () => 'todos los certificados emitidos',
  contenido: (nombre: string) => `todos los certificados emitidos para el contenido «${nombre}»`,
  colaborador: (nombre: string) => `todos los certificados emitidos para el colaborador ${nombre}`,
}

export function Component() {
  const { modo: parametro } = useParams()
  const [consulta] = useSearchParams()
  const navigate = useNavigate()
  const modo = esModo(parametro) ? parametro : 'global'

  // Sin datos (alguien abrió la dirección a secas) se muestra el ejemplo del primer semestre.
  const desde = fechaLarga(aFecha(consulta.get('desde')) ?? new Date('2026-01-01T00:00:00'))
  const hasta = fechaLarga(aFecha(consulta.get('hasta')) ?? new Date('2026-06-30T00:00:00'))
  const ejemplo = formularioDeEjemplo(modo)
  const nombre = consulta.get('nombre') ?? descripcionFiltro(ejemplo) ?? ''
  const para = consulta.get('para') ?? USUARIO.username

  return (
    <FullscreenTemplate>
      <div className="h-full overflow-auto bg-muted/60 py-8">
        <PageShell width="narrow">
          <div className="flex flex-col gap-4">
            {/* Esta pantalla existe solo en el playground: en el producto nada se abre al pedir la descarga; el correo llega
                a la bandeja del administrador cuando el archivo está listo. */}
            <Alert variant="info">
              <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
              <AlertTitle>Vista del prototipo</AlertTitle>
              <AlertDescription>
                Así se verá, más o menos, el correo que recibe el administrador cuando su descarga está lista. En el
                producto no se abre nada al pedir la descarga: el correo le llega a su bandeja en unos minutos.
              </AlertDescription>
            </Alert>
            {/* Lo que se vería en la bandeja de entrada antes de abrirlo. */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Badge variant="secondary">Vista previa del correo</Badge>
              <Text as="span" size="sm" variant="muted">
                Para {para} · De UBITS LMS Creator
              </Text>
            </div>

            <Card>
              <CardContent className="flex flex-col gap-6">
                <img src="/ubits-logo.svg" alt="UBITS" className="mx-auto h-7 w-auto" />
                <Separator />
                {/* La ilustración trae el título del correo; el h1 va oculto para el lector de pantalla. */}
                <Heading as="h1" level={4} className="sr-only">
                  ¡Tus certificados están listos!
                </Heading>
                <img src="/images/correos/certificados-listos.png" alt="" className="w-full rounded-lg" />
                <div className="flex flex-col gap-4">
                  <Text variant="muted">Tu solicitud fue procesada con éxito.</Text>
                  <Text variant="muted">
                    Hemos generado un archivo con {QUE_SE_GENERO[modo](nombre)} entre el{' '}
                    <Text as="span" weight="semibold" className="text-foreground">
                      {desde}
                    </Text>{' '}
                    y el{' '}
                    <Text as="span" weight="semibold" className="text-foreground">
                      {hasta}
                    </Text>
                    .
                  </Text>
                  <Text variant="muted">Puedes descargarlos en el siguiente enlace:</Text>
                </div>
                <Button size="lg" className="w-full" onClick={() => descargarCsv('certificados-solicitados', [['Solicitud', 'Detalle'], ['Qué se generó', QUE_SE_GENERO[modo](nombre)], ['Desde', desde], ['Hasta', hasta], ['Para', para]])}>
                  <HugeiconsIcon icon={Download04Icon} data-icon="inline-start" aria-hidden="true" />
                  Descargar certificados
                </Button>
                <Text variant="muted">
                  Importante:{' '}
                  <Text as="span" weight="semibold" className="text-foreground">
                    este enlace estará disponible por 2 días
                  </Text>
                  . Después de ese tiempo, será necesario volver a generar la solicitud desde la plataforma.
                </Text>
                <Text variant="muted">Gracias por usar UBITS.</Text>
                <Separator />
                <div className="flex flex-col items-center gap-1 text-center">
                  <Text size="xs" variant="muted">
                    Este correo fue enviado por UBITS LMS Creator.
                  </Text>
                  <Button variant="link" size="sm" onClick={() => navigate('/admin/aprendizaje/certificados/descarga')}>
                    Ir a la plataforma
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </PageShell>
      </div>
    </FullscreenTemplate>
  )
}

Component.displayName = 'AdminAprendizajeCertificadosCorreoPage'
