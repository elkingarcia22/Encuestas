import { useEffect, useRef, useState } from 'react'
import type { CicloDraft } from '../../../modelo/constructor/cicloBuilderTypes'
import { SETUP_BLOCK_ORDER, setupBlockIssue, setupIssue, type SetupBlockId } from '../../../modelo/constructor/cicloSetup'
import { Bloque } from './bloque'
import { BloqueGobierno } from './gobierno'
import { BloqueIdentidad } from './identidad'
import { BloqueMetodologia } from './metodologia'
import { type Contestadas } from './preguntas'

const BLOQUES: Readonly<Partial<Record<SetupBlockId, { titulo: string; ayuda: string }>>> = {
  identity: { titulo: 'Identidad y tiempos', ayuda: 'Cómo se llama el ciclo y entre qué fechas corre.' },
  methodology: { titulo: 'Modelo de medición', ayuda: 'Con qué modelo se miden los objetivos y sus reglas.' },
  governance: { titulo: 'Gobierno', ayuda: 'Quién redacta los objetivos. Define dónde termina tu trabajo: el quién.' },
}

export function PasoParametrizacion({
  borrador,
  onCambio,
  conErrores,
  nombreDuplicado = false,
  descripcionActiva,
  onDescripcionActiva,
}: {
  borrador: CicloDraft
  onCambio: (cambio: Partial<CicloDraft>) => void
  conErrores: boolean
  /** Otro ciclo ya se llama así (como en Crear encuesta): el nombre sale en rojo y no se avanza. */
  nombreDuplicado?: boolean
  descripcionActiva: boolean
  onDescripcionActiva: (activa: boolean) => void
}) {
  const [llegoCompleto] = useState(() => setupIssue(borrador) === null)
  // Un ciclo que se reabre ya trae decidido si lleva objetivos de la empresa: el campo sale lleno aunque falte otra cosa.
  const [contestadas, setContestadas] = useState<Contestadas>({ norte: llegoCompleto || borrador.useCompanyObjectives !== null, recordatorios: llegoCompleto, frecuencia: llegoCompleto })
  const [nivelContestado, setNivelContestado] = useState(llegoCompleto)

  // Al completar una sección, la pantalla baja sola a la siguiente que todavía tiene algo pendiente, para que la atención
  // quede en lo que falta (Elkin, 20-oct). Solo cuando una sección pasa de incompleta a completa por algo que hizo la
  // persona: al abrir un ciclo ya armado no se mueve nada. Si se completó escribiendo (el nombre), espera a que salga del
  // campo, para no mover la pantalla en medio de una palabra.
  const visibles = SETUP_BLOCK_ORDER.filter((bloque) => bloque !== 'permissions')
  const completas = visibles.map((bloque) => setupBlockIssue(bloque, borrador) === null)
  const antes = useRef(completas)
  useEffect(() => {
    const previas = antes.current
    antes.current = completas
    const recien = visibles.findIndex((_, i) => completas[i] && !previas[i])
    if (recien === -1) return
    const siguiente = visibles.find((_, i) => i > recien && !completas[i])
    if (!siguiente) return
    const bajar = () => requestAnimationFrame(() => document.getElementById(`bloque-${siguiente}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    const activo = document.activeElement
    if (activo instanceof HTMLInputElement || activo instanceof HTMLTextAreaElement) {
      // Si al salir ya va a otro control (un desplegable, otro campo), eligió a dónde ir: mover la vista ahí dejaba la
      // lista del desplegable flotando fuera de su sitio (20-oct). Solo baja si sale del campo sin ir a otro lado.
      const alSalir = (evento: Event) => {
        if (!(evento as FocusEvent).relatedTarget) bajar()
      }
      activo.addEventListener('blur', alSalir, { once: true })
      return () => activo.removeEventListener('blur', alSalir)
    }
    bajar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completas.join()])

  useEffect(() => {
    if (!conErrores) return
    const falla = SETUP_BLOCK_ORDER.find((bloque) => setupBlockIssue(bloque, borrador) !== null)
    if (falla) {
      const target = falla === 'methodology' ? 'identity' : falla
      requestAnimationFrame(() => document.getElementById(`bloque-${target}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conErrores])

  return (
    <section className="flex flex-col gap-4" aria-label="Parametrización">
      <div className="flex flex-col gap-3">
        {SETUP_BLOCK_ORDER.filter(b => b !== 'permissions').map((bloque) => (
          <Bloque
            key={bloque}
            id={bloque}
            {...BLOQUES[bloque]!}
            conError={conErrores && (setupBlockIssue(bloque, borrador) !== null || (bloque === 'identity' && nombreDuplicado))}
          >
            {bloque === 'identity' ? <BloqueIdentidad borrador={borrador} onCambio={onCambio} conErrores={conErrores} nombreDuplicado={nombreDuplicado} descripcionActiva={descripcionActiva} onDescripcionActiva={onDescripcionActiva} /> : null}
            {bloque === 'methodology' ? <BloqueMetodologia borrador={borrador} onCambio={onCambio} conErrores={conErrores} contestadas={contestadas} onContestar={(cambio) => setContestadas((previas) => ({ ...previas, ...cambio }))} /> : null}
            {bloque === 'governance' ? <BloqueGobierno borrador={borrador} onCambio={onCambio} conErrores={conErrores} nivelContestado={nivelContestado} onNivelContestado={setNivelContestado} contestadas={contestadas} onContestar={(cambio) => setContestadas((previas) => ({ ...previas, ...cambio }))} /> : null}
          </Bloque>
        ))}
      </div>
    </section>
  )
}
