import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { InformationCircleIcon, LibraryIcon, PlusSignIcon } from '@hugeicons/core-free-icons'
import { Alert, AlertAction, AlertDescription, Button, Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, Text } from '@ubits/flux-ui'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { TOTAL_WEIGHT, type ObjectiveSet } from '../../../modelo/constructor/cicloBuilderTypes'
import type { IntencionAsignacion } from './piezas-asignacion'

// Fase 2 del panel de asignación: los objetivos de los destinatarios elegidos, con el mismo armado que el paso
// «Objetivos de la empresa». Para quién son y cuánto deben sumar ya lo dicen el título y la bajada del panel, así que
// aquí no se repiten. Arriba, lo que se puede traer ya hecho (el banco) y «Repartir por igual» mientras el peso no cuadra;
// debajo, el aviso de cupo recortado o el de carga previa, la lista de tarjetas y «Añadir objetivo».

export function FaseObjetivos({
  set,
  total,
  cupo,
  onRepartir,
  onRecuperar,
  aviso,
  iaAbierta,
  sinIa,
  onElegir,
  children,
}: {
  set: ObjectiveSet
  total: number
  cupo: number
  onRepartir: () => void
  /** El cupo se recortó por otra asignación que ya no se cruza: se puede devolver. */
  onRecuperar?: () => void
  aviso: ReactNode
  iaAbierta: boolean
  /** Con Orbit Flow ya abierto, «Proponer con IA» no se ofrece otra vez. */
  sinIa: boolean
  onElegir: (intencion: Exclude<IntencionAsignacion, 'plantilla'>) => void
  children: ReactNode
}) {
  const vacio = set.objectives.length === 0

  return (
    <section className="flex flex-col gap-4" aria-label="Objetivos de la asignación">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Text as="p" size="sm" variant="muted">Trae objetivos ya hechos desde el catálogo o pídele a la IA que los proponga.</Text>
        <div className="flex items-center gap-2">
          {total !== cupo && !vacio ? (
            <Button variant="ghost" onClick={onRepartir}>
              Repartir por igual
            </Button>
          ) : null}
          <Button variant="outline" onClick={() => onElegir('banco')}>
            <HugeiconsIcon icon={LibraryIcon} aria-hidden="true" />
            Elegir del banco
          </Button>
          {/* «Proponer con IA» se queda: decisión de Cristian al unir el 9-oct (la IA, el último de la fila). */}
          <BotonIaSecundario disabled={sinIa} onClick={() => onElegir('ia')}>
            Proponer con IA
          </BotonIaSecundario>
        </div>
      </div>

      {onRecuperar && !iaAbierta ? (
        <Alert variant="info">
          <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
          <AlertDescription>
            <p>
              Esta asignación reparte solo <strong>{cupo} %</strong>, pero ya nadie más se cruza con ella.
            </p>
          </AlertDescription>
          <AlertAction>
            <Button variant="outline" size="sm" onClick={onRecuperar}>
              Recuperar el {TOTAL_WEIGHT} %
            </Button>
          </AlertAction>
        </Alert>
      ) : null}
      {iaAbierta ? null : aviso}

      {vacio && iaAbierta ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconoIA />
            </EmptyMedia>
            <EmptyTitle>Creando objetivos con IA</EmptyTitle>
            <EmptyDescription>Dile a Orbit Flow, en el panel derecho, qué necesitas medir. Los objetivos que genere aparecerán aquí para que los revises.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : vacio ? (
        <PrimeraVez
          icono="glass-add"
          titulo="Todavía no hay objetivos"
          descripcion="Escribe el primero o tráelo del banco."
          accion={{ texto: 'Añadir objetivo', icono: PlusSignIcon, onClick: () => onElegir('manual') }}
          className="py-8 border-dashed"
        />
      ) : (
        <>
          {children}
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => onElegir('manual')}>
              <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />
              Añadir objetivo
            </Button>
          </div>
        </>
      )}
    </section>
  )
}
