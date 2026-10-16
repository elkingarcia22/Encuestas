import { useState } from 'react'

import {
  AGENT_ACTIVITY,
  APPROVAL_STEPS,
  type ActivityEntry,
  type PlanStep,
} from '../../shared/data'
import { notify } from '@/shared/components/notify'

// Estado compartido entre el plan de pasos y el panel de actividad.
export function useApprovalFlow() {
  const [steps, setSteps] = useState<PlanStep[]>(APPROVAL_STEPS)
  const [activity, setActivity] = useState<ActivityEntry[]>(AGENT_ACTIVITY)
  const [published, setPublished] = useState(false)

  const publish = () => {
    // Paso 3 hecho → paso 4 corre solo → timeline se actualiza → «Completado».
    setPublished(true)
    setSteps((s) => s.map((st, i) => (i === 2 ? { ...st, state: 'done', meta: 'Publicado 9:43 · 309 correos' } : i === 3 ? { ...st, state: 'now', meta: 'Asignando…' } : st)))
    setActivity((a) => a.map((e, i) => (i === 2 ? { ...e, title: 'Publicó el aviso', detail: 'Correo enviado a 309 personas · 3 sin correo válido', time: '9:43 · 2,1 s', state: 'done' } : i === 3 ? { ...e, title: 'Asignando el curso', detail: 'Política de vacaciones · 312 personas', state: 'now' } : e)))
    notify('Aviso publicado · 309 correos enviados')

    window.setTimeout(() => {
      setSteps((s) => s.map((st, i) => (i === 3 ? { ...st, state: 'done', meta: 'Asignado a 312 personas' } : st)))
      setActivity((a) => a.map((e, i) => (i === 3 ? { ...e, title: 'Asignó el curso', detail: 'Política de vacaciones · 312 personas', time: '9:44 · 4,0 s', state: 'done' } : e)))
      notify('Curso asignado · plan completado')
    }, 1600)
  }

  const doneCount = steps.filter((s) => s.state === 'done').length

  return { steps, activity, published, publish, doneCount }
}
