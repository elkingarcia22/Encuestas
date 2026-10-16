import { useMemo, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { Progress, Text, cn } from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { BotonPantallaCompleta, usePantallaCompleta } from '../ranura-recurso'
import { useModoVista } from '../bloque-recurso'
import { leerDatosPresentacion } from './datos'
import { Diapositiva, LienzoDiapositiva } from './diapositiva'

export { abrirEdicionPresentacion, limpiarSesionPresentacion } from './sesion'

// Reproductor de la presentación ya generada: lo que el asistente muestra en la página (y lo que vería el colaborador).
// Una diapositiva a la vez en su marco 16:10, con anterior / siguiente y el contador. Las actividades funcionan.
//
// Aquí la diapositiva va **a sangre**: sin esquina ni borde propios, porque la tarjeta que la contiene ya recorta y ya
// tiene su borde. Con los suyos se veía un marco dentro de otro marco (Dave, 6-oct). El editor y las miniaturas sí
// los conservan, que ahí la diapositiva está suelta sobre el fondo.

export function VistaPresentacion({ datos }: { datos: unknown }) {
  const presentacion = useMemo(() => leerDatosPresentacion(datos), [datos])
  const [indice, setIndice] = useState(0)
  const caja = useRef<HTMLDivElement>(null)
  const { activa: enPantallaCompleta, alternar: alternarPantallaCompleta } = usePantallaCompleta(caja)
  const { compacto } = useModoVista()

  if (!presentacion) {
    return (
      <Text size="sm" className="text-muted-foreground">
        No hay datos editables para esta presentación. Genera una con IA de nuevo.
      </Text>
    )
  }

  const total = presentacion.diapositivas.length
  const actual = Math.min(indice, total - 1)
  const irA = (i: number) => setIndice(Math.max(0, Math.min(total - 1, i)))

  return (
    // Pantalla completa como el documento y el SCORM: una presentación se mira sin el panel alrededor, y era el otro
    // recurso de pantalla que no la ofrecía. En ella, la diapositiva se centra y las flechas quedan debajo, igual que
    // aquí (Dave, 9-oct).
    <div ref={caja} className={cn('relative flex w-full flex-col gap-3', enPantallaCompleta && 'h-screen justify-center bg-background p-6')}>
      <BotonPantallaCompleta activa={enPantallaCompleta} onAlternar={alternarPantallaCompleta} compacto={compacto} />
      <LienzoDiapositiva etiqueta={`Presentación: ${presentacion.titulo}`} className="rounded-none! border-0">
        <Diapositiva
          diapositiva={presentacion.diapositivas[actual]}
          acento={presentacion.acento}
          logo={presentacion.logo}
          modo="vista"
          onIrA={irA}
        />
      </LienzoDiapositiva>
      <div className="flex items-center gap-3 px-4 pb-4">
        <Hint label="Diapositiva anterior">
          <BotonIcono aria-label="Diapositiva anterior" disabled={actual === 0} onClick={() => irA(actual - 1)}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
          </BotonIcono>
        </Hint>
        <Progress value={((actual + 1) / total) * 100} aria-label="Avance de la presentación" className="flex-1" />
        <Text as="span" size="sm" className="shrink-0 text-muted-foreground tabular-nums" aria-live="polite">
          {`${(actual + 1).toLocaleString('es-CO')} / ${total.toLocaleString('es-CO')}`}
        </Text>
        <Hint label="Diapositiva siguiente">
          <BotonIcono aria-label="Diapositiva siguiente" disabled={actual === total - 1} onClick={() => irA(actual + 1)}>
            <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
          </BotonIcono>
        </Hint>
      </div>
    </div>
  )
}
