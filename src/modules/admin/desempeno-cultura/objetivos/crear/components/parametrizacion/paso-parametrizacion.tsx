import { useEffect, useState } from 'react'
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
  descripcionActiva,
  onDescripcionActiva,
}: {
  borrador: CicloDraft
  onCambio: (cambio: Partial<CicloDraft>) => void
  conErrores: boolean
  descripcionActiva: boolean
  onDescripcionActiva: (activa: boolean) => void
}) {
  const [llegoCompleto] = useState(() => setupIssue(borrador) === null)
  const [contestadas, setContestadas] = useState<Contestadas>({ norte: llegoCompleto, recordatorios: llegoCompleto, frecuencia: llegoCompleto })
  const [nivelContestado, setNivelContestado] = useState(llegoCompleto)

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
            conError={conErrores && setupBlockIssue(bloque, borrador) !== null}
          >
            {bloque === 'identity' ? <BloqueIdentidad borrador={borrador} onCambio={onCambio} conErrores={conErrores} descripcionActiva={descripcionActiva} onDescripcionActiva={onDescripcionActiva} /> : null}
            {bloque === 'methodology' ? <BloqueMetodologia borrador={borrador} onCambio={onCambio} conErrores={conErrores} contestadas={contestadas} onContestar={(cambio) => setContestadas((previas) => ({ ...previas, ...cambio }))} /> : null}
            {bloque === 'governance' ? <BloqueGobierno borrador={borrador} onCambio={onCambio} conErrores={conErrores} nivelContestado={nivelContestado} onNivelContestado={setNivelContestado} contestadas={contestadas} onContestar={(cambio) => setContestadas((previas) => ({ ...previas, ...cambio }))} /> : null}
          </Bloque>
        ))}
      </div>
    </section>
  )
}
