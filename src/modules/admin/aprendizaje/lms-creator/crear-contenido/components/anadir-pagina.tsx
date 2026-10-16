import { useEffect, useState } from 'react'
import { Badge, Card, CardContent, Field, FieldLabel, Input, Text, cn } from '@ubits/flux-ui'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { Hint } from '@/shared/components/Hint'
import { ImagenGlass } from '@/shared/components/ImagenGlass'
import type { TipoRecurso } from './borrador'
import { TARJETAS_TIPO, type TarjetaTipo } from './tipos-recurso'
import { EtiquetaIA } from '@/modules/design-system/ia/etiqueta-ia'

// «Añadir página»: título opcional y el tipo de recurso principal. Todos avanzan al clic, también Evaluación: la página
// nace de una vez y se abre para escribir o generar las preguntas (sin el paso de marcarla y confirmar «Crear página»).

type Props = {
  abierto: boolean
  evento: boolean
  onCerrar: () => void
  /** El creador eligió un tipo. `titulo` es lo que escribió (puede ir vacío). */
  onElegir: (tipo: TipoRecurso, titulo: string) => void
}

export function AnadirPagina({ abierto, evento, onCerrar, onElegir }: Props) {
  const [titulo, setTitulo] = useState('')

  // Cada vez que abre, parte en blanco.
  useEffect(() => {
    if (abierto) setTitulo('')
  }, [abierto])

  // En un evento, la asistencia va **de primera**: es el recurso que da sentido al tipo, y escondida entre las
  // últimas parecía un extra (Dave, 2-oct). En un contenido normal ni siquiera se ofrece.
  const tarjetas = TARJETAS_TIPO.filter((t) => !t.soloEvento || evento).sort((a, b) =>
    evento ? Number(b.id === 'asistencia') - Number(a.id === 'asistencia') : 0,
  )

  const elegir = (t: TarjetaTipo) => {
    if (t.deshabilitada) return
    onElegir(t.id as TipoRecurso, titulo)
  }

  return (
    <ActionDialog
      open={abierto}
      onOpenChange={(abrir) => {
        if (!abrir) onCerrar()
      }}
      // La única ventana del sistema (decisión 4 de la auditoría, 5-oct). Sin pie: se avanza al elegir un tipo.
      size="wide"
      title="Añadir página"
      hideFooter
    >
      {/* El ancho lo pone la ventana («wide», 736px): a pantalla completa las tarjetas quedaban enormes y elegir el
          tipo de recurso no necesita toda la pantalla. */}
      <div className="flex w-full flex-col gap-6">
        <Field>
          <FieldLabel htmlFor="cc-anadir-titulo">
            Título de la página
            <Badge variant="secondary" size="xs">
              Opcional
            </Badge>
          </FieldLabel>
          <Input id="cc-anadir-titulo" maxLength={120} placeholder="Escribe el título de la página" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        </Field>

        <Text variant="muted" size="sm">
          Selecciona el tipo de recurso principal que quieres añadir
        </Text>

        <div role="list" className="grid grid-cols-1 gap-3 min-[521px]:grid-cols-2 min-[901px]:grid-cols-4">
          {tarjetas.map((t) => {
            return (
              <div role="listitem" key={t.id}>
                <Card
                  size="sm"
                  role="button"
                  tabIndex={t.deshabilitada ? -1 : 0}
                  aria-disabled={t.deshabilitada ? true : undefined}
                  aria-label={t.deshabilitada ? `${t.etiqueta} (no disponible)` : t.etiqueta}
                  onClick={() => elegir(t)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      elegir(t)
                    }
                  }}
                  // El hover de las acciones rápidas del Inicio del admin, tal cual: la tarjeta sube 2 px, toma un
                  // borde azul suave y sombra, y la ilustración crece un poco. Una tarjeta no disponible no se mueve
                  // ni se marca, y con «reducir movimiento» solo cambian borde y sombra (Dave, 6-oct).
                  className={cn(
                    'relative h-full',
                    t.deshabilitada
                      ? 'cursor-not-allowed opacity-50'
                      : 'group cursor-pointer transition-[translate,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md! focus-visible:border-primary/30 motion-reduce:transition-none motion-reduce:hover:translate-y-0',
                  )}
                >
                  {/* La insignia cuelga de la **tarjeta**, no del contenido: dentro de CardContent el relleno la
                      empujaba a 24 px del filo. Es el mismo arreglo que ya se le hizo al Inicio del admin, y ahora
                      las dos quedan a 8 px de las dos esquinas (Dave, 6-oct). */}
                  {t.ia ? (
                    <Hint label="Incluye asistencia con IA." side="top">
                      <EtiquetaIA className="absolute top-2 right-2 z-10" aria-label="Incluye asistencia con IA." tabIndex={-1}>
                        IA
                      </EtiquetaIA>
                    </Hint>
                  ) : null}
                  <CardContent className="flex flex-col items-center justify-center gap-2 text-center">
                    <span className="shrink-0 transition-transform duration-200 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100">
                      {/* Casi todas van con un icono del set Glass; el roleplay trae ilustración propia porque lo
                          que lo distingue es que conversa y evalúa **nuestro agente** (ver `tipos-recurso`).
                          **Ocupa el mismo cuadro de 52 px, pero se dibuja a 38.** Los PNG del set traen aire
                          transparente alrededor y su dibujo llena un 74 % del cuadro; el orbe llena el 99 %, así que
                          a la misma medida se veía bastante más grande que sus vecinos (Dave, 9-oct). */}
                      {t.imagen ? (
                        <span className="flex size-13 shrink-0 items-center justify-center">
                          <img src={t.imagen} alt="" aria-hidden="true" width={38} height={38} draggable={false} />
                        </span>
                      ) : (
                        <ImagenGlass nombre={t.glass} tamano={52} className="shrink-0" />
                      )}
                    </span>
                    <Text as="span" size="sm" weight="medium">
                      {t.etiqueta}
                    </Text>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      </div>
    </ActionDialog>
  )
}
