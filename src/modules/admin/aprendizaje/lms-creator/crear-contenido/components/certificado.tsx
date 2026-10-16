import { Card, Heading, Separator, Text, cn } from '@ubits/flux-ui'
import { nombreCategoria } from '@/shared/bd'
import { type Borrador } from './borrador'
import { DEMO_TITULO } from './demo'

// El certificado del contenido: sus plantillas y la hoja que recibe el colaborador al terminar. Es la misma vista previa
// del paso «Certificado» del asistente anterior; ahora se ve en «Fin del contenido» y se configura desde el chip de la
// ficha (una sola fuente de verdad: `borrador.certificado`).

type Firma = { nombre: string; cargo: string; imagen: string }

const FIRMAS: Record<'patricia' | 'carmen', Firma> = {
  patricia: { nombre: 'Patricia Elena Bermúdez Ríos', cargo: 'Gerente General', imagen: '/images/lms-creator/certificados/firma-patricia.webp' },
  carmen: { nombre: 'Carmen Rosa Díaz Herrera', cargo: 'Líder de Recursos Humanos', imagen: '/images/lms-creator/certificados/firma-carmen.webp' },
}

export const PLANTILLAS = [
  { id: 'tpl-doble-firma', nombre: 'Cursos empresariales con doble firma', tiempo: true, documento: false, firmas: [FIRMAS.patricia, FIRMAS.carmen] },
  { id: 'tpl-estandar', nombre: 'Certificado estándar Meta Colombia', tiempo: true, documento: true, firmas: [FIRMAS.patricia] },
  { id: 'tpl-onboarding', nombre: 'Onboarding colaboradores', tiempo: false, documento: false, firmas: [FIRMAS.carmen] },
]

export const plantillaDe = (id: string) => PLANTILLAS.find((p) => p.id === id) ?? PLANTILLAS[0]

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

function duracion(b: Borrador) {
  const n = Number(b.portada.tiempo.replace(',', '.')) > 0 ? b.portada.tiempo : '30'
  const uno = Number(n.replace(',', '.')) === 1
  const unidad = b.portada.unidad === 'h' ? (uno ? 'hora' : 'horas') : uno ? 'minuto' : 'minutos'
  return `Con una duración de ${n} ${unidad}`
}

/** La hoja del certificado sobre el fondo de la plantilla, con los datos del contenido y las firmas. */
export function VistaCertificado({ borrador, className }: { borrador: Borrador; className?: string }) {
  const tpl = plantillaDe(borrador.certificado.plantilla)
  const hoy = new Date()

  return (
    <Card className={cn('overflow-hidden p-0!', className)}>
      <div
        className="@container relative aspect-[774/598] w-full bg-cover bg-center text-foreground"
        style={{ backgroundImage: 'url(/images/lms-creator/certificados/fondo.jpg)' }}
      >
        {/* Las posiciones son las de la hoja del prototipo, en porcentaje: se ajusta a cualquier ancho. */}
        <div className="absolute top-[14%] right-[6%] left-[32.5%] flex h-[78%] flex-col">
          <Text as="p" weight="bold">
            Meta Colombia
          </Text>
          <div className="mt-[6%] flex flex-col gap-1">
            <Text as="p" variant="muted" size="xs">
              {hoy.getDate()} de {MESES[hoy.getMonth()]} de {hoy.getFullYear()}
            </Text>
            <Heading as="h3" level={3} className="line-clamp-2">
              Nombre del colaborador
            </Heading>
          </div>
          <div className="mt-[4%] flex flex-col gap-1">
            <Text as="p" size="sm">
              Finalizó satisfactoriamente el contenido:
            </Text>
            <Text as="p" weight="bold" className="line-clamp-2">
              {borrador.portada.titulo.trim() || DEMO_TITULO}
            </Text>
            {tpl.tiempo ? (
              <Text as="p" size="xs">
                {duracion(borrador)}
              </Text>
            ) : null}
            {/* La categoría solo si el contenido tiene una: sin categoría no se inventa. */}
            {borrador.portada.categoria ? (
              <Text as="p" variant="muted" size="xs">
                {nombreCategoria(borrador.portada.categoria)}
              </Text>
            ) : null}
          </div>

          <div className="mt-auto flex flex-col gap-3">
            <div className={tpl.firmas.length > 1 ? 'grid grid-cols-1 gap-3 @[520px]:grid-cols-2' : 'flex'}>
              {tpl.firmas.map((f) => (
                <div key={f.nombre} className="flex max-w-56 flex-col gap-1">
                  <img src={f.imagen} alt={`Firma de ${f.nombre}`} className="h-8 w-auto self-start object-contain @[520px]:h-12" />
                  <Separator />
                  <Text as="p" size="xs" weight="semibold">
                    {f.nombre}
                  </Text>
                  <Text as="p" variant="muted" size="xs">
                    {f.cargo}
                  </Text>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-0.5">
              <Text as="p" variant="muted" size="xs">
                Código No. ##########
              </Text>
              <Text as="p" variant="muted" size="xs">
                UBITS confirma la identidad de la persona y su finalización de este contenido
              </Text>
              {tpl.documento ? (
                <Text as="p" variant="muted" size="xs">
                  Documento: ##########
                </Text>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
