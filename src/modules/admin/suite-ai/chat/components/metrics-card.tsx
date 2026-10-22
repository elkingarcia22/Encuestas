import { useState } from 'react'
import { Button, Card, CardContent, CardFooter } from '@ubits/flux-ui'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { FilaCifras, type Cifra } from '@/modules/design-system/metricas/cifras'
import { PEOPLE, initialsOf } from '../../shared/data'

type MetricsCardProps = {
  reminderSent: boolean
  onSendReminder: () => void
}

const METRICS: Cifra[] = [
  { valor: '24', etiqueta: 'Vencidas' },
  { valor: '80', etiqueta: 'Asignadas' },
  { valor: '70 %', etiqueta: 'Terminación' },
  { valor: '18 sept', etiqueta: 'Cierre del ciclo' },
]

// Primeras 10 personas con evaluación vencida, como en el prototipo.
const OVERDUE = PEOPLE.slice(0, 10).map((name, i) => ({
  ini: initialsOf(name),
  title: name,
  meta: i % 3 === 0 ? 'Sin líder asignado' : `Vencida hace ${2 + i} días`,
}))

// Tarjeta de métricas de la conversación «Evaluaciones vencidas en Ventas».
export function MetricsCard({ reminderSent, onSendReminder }: MetricsCardProps) {
  const [participants, setParticipants] = useState(false)
  const [reminder, setReminder] = useState(false)

  return (
    <Card className="w-full gap-0 py-0">
      {/* Las cifras del sistema (Design system › Métricas): una fila partida por líneas, sin números armados a mano
          (auditoría, 5-oct). */}
      <CardContent className="py-4">
        <FilaCifras cifras={METRICS} columnas="grid-cols-2 lg:grid-cols-4" />
      </CardContent>
      <CardFooter className="flex-wrap items-center gap-2 border-t bg-muted/40 py-3">
        <span className="min-w-0 flex-1 text-[13px] text-foreground/70">
          {reminderSent
            ? 'Fuente: Evaluaciones 360 · Recordatorio enviado 9:52 · 24 personas notificadas'
            : 'Fuente: Evaluaciones 360 · Periodo 1–10 sept · Actualizado hace 12 min'}
        </span>
        <Button variant="outline" size="sm" onClick={() => setParticipants(true)}>
          Ver 24 participantes
        </Button>
        <Button size="sm" disabled={reminderSent} onClick={() => setReminder(true)}>
          {reminderSent ? 'Recordatorio enviado' : 'Enviar recordatorio'}
        </Button>
      </CardFooter>

      <ActionDialog
        open={participants}
        onOpenChange={setParticipants}
        title="24 evaluaciones vencidas"
        sub="Ventas · periodo 1–10 sept"
        items={OVERDUE}
        note="Se muestran 10 de 24"
        cancelLabel="Cerrar"
      />
      <ActionDialog
        open={reminder}
        onOpenChange={setReminder}
        title="Enviar recordatorio a 24 personas"
        sub="El correo sale ahora y no se puede deshacer. Los líderes quedan en copia."
        note="Se envía una sola vez"
        confirmLabel="Enviar recordatorio"
        onConfirm={onSendReminder}
      />
    </Card>
  )
}
