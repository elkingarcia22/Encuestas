import { useState } from 'react'
import { Field, FieldDescription, FieldLabel, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@ubits/flux-ui'
import { ActionDialog, type ActionDialogItem } from '@/shared/components/ActionDialog'

// La ventana de «Escribirle a…»: la misma en la bandeja de la vacante (varias personas a la vez), en el expediente y en
// el detalle de la vacante (auditoría del 8-oct, H-250: «Enviar correo» salía al instante, sin plantilla ni mensaje).
// Lo que sale de la empresa se ve antes de mandarlo: a quién, con qué plantilla y con qué mensaje. Antes vivía dentro de
// la barra de acciones en lote; se movió aquí sin cambiar lo que dice ni cómo se ve.

const PLANTILLAS = [
  {
    id: 'entrevista',
    titulo: 'Invitación a entrevista',
    texto:
      'Hola {nombre}, gracias por tu interés en la vacante de {vacante}. Queremos conocerte: responde este correo con dos horarios que te queden bien esta semana.',
  },
  {
    id: 'documentos',
    titulo: 'Solicitud de documentos',
    texto:
      'Hola {nombre}, para seguir con tu proceso en {vacante} necesitamos tu certificado laboral y tu documento de identidad. Puedes responder este correo con los archivos.',
  },
  {
    id: 'actualizacion',
    titulo: 'Actualización del proceso',
    texto:
      'Hola {nombre}, te escribimos para contarte que tu proceso en {vacante} sigue avanzando. Te avisaremos apenas tengamos novedades.',
  },
]

const personas = (n: number) => `${n} ${n === 1 ? 'persona' : 'personas'}`

export function DialogoEscribir({
  abierto,
  onOpenChange,
  destinatarios,
  onEnviar,
}: {
  abierto: boolean
  onOpenChange: (abierto: boolean) => void
  // A quiénes les llega, con su etapa: se ve antes de confirmar.
  destinatarios: ActionDialogItem[]
  // Con el título de la plantilla elegida, para el aviso de «Enviaste…».
  onEnviar: (plantilla: string | undefined) => void
}) {
  const [plantilla, setPlantilla] = useState(PLANTILLAS[0].id)
  const [mensaje, setMensaje] = useState(PLANTILLAS[0].texto)
  // Cada vez que se abre, parte de la primera plantilla (se ajusta al abrir, no al cerrar, para que no cambie mientras sale).
  const [estabaAbierto, setEstabaAbierto] = useState(abierto)
  if (abierto !== estabaAbierto) {
    setEstabaAbierto(abierto)
    if (abierto) {
      setPlantilla(PLANTILLAS[0].id)
      setMensaje(PLANTILLAS[0].texto)
    }
  }

  const cuantas = destinatarios.length

  return (
    <ActionDialog
      open={abierto}
      onOpenChange={onOpenChange}
      size="wide"
      title={`Escribirle a ${personas(cuantas)}`}
      sub="Cada correo sale por separado y con el nombre de quien lo recibe. Sale al confirmar."
      items={destinatarios}
      confirmLabel={`Enviar ${cuantas === 1 ? 'el correo' : `${cuantas} correos`}`}
      pendingLabel="Enviando…"
      confirmDisabled={!mensaje.trim()}
      onConfirm={() => {
        onEnviar(PLANTILLAS.find((p) => p.id === plantilla)?.titulo)
        onOpenChange(false)
      }}
    >
      <div className="flex flex-col gap-4">
        <Field>
          <FieldLabel>Plantilla</FieldLabel>
          <Select
            value={plantilla}
            onValueChange={(valor) => {
              setPlantilla(valor as string)
              setMensaje(PLANTILLAS.find((p) => p.id === valor)?.texto ?? '')
            }}
          >
            <SelectTrigger className="w-full" aria-label="Plantilla del correo">
              <SelectValue>{(valor: string) => PLANTILLAS.find((p) => p.id === valor)?.titulo}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PLANTILLAS.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.titulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Mensaje</FieldLabel>
          <Textarea value={mensaje} onChange={(evento) => setMensaje(evento.target.value)} rows={5} />
          <FieldDescription>
            {'{nombre}'} y {'{vacante}'} se cambian por los datos de cada persona.
          </FieldDescription>
        </Field>
      </div>
    </ActionDialog>
  )
}
