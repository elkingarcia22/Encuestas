import { useEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar03Icon } from '@hugeicons/core-free-icons'
import { Button, Calendar, Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger, Separator } from '@ubits/flux-ui'
import { CALENDARIO_ES } from '@/modules/design-system/formularios/rango-de-fechas'
import { formatSurveyDate, parseSurveyDate } from '../modelo/surveyListDates'

// La fecha de una fila, editable en su propia celda. «Editar fechas» y «Reabrir encuesta» son el
// mismo gesto sobre la tabla y solo cambian qué significa guardar, así que no abren una ventana
// aparte: la celda se vuelve un selector con su calendario, el mismo de los campos de fecha de
// Formularios (CampoFecha): en español y con mes y año en su selector.

export type ModoFecha = 'inicio' | 'cierre' | 'reabrir'
/** Lo que dice el selector en cada modo: su título, la línea de qué pasa al guardar y el botón. */
export type TextosFecha = Record<ModoFecha, { titulo: string; detalle: string; accion: string }>

const COPIA: TextosFecha = {
  inicio: { titulo: 'Nueva fecha de inicio', detalle: 'La encuesta comenzará a admitir respuestas ese día.', accion: 'Guardar' },
  cierre: { titulo: 'Nueva fecha de cierre', detalle: 'La encuesta deja de admitir respuestas ese día.', accion: 'Guardar' },
  reabrir: { titulo: 'Reabrir hasta', detalle: 'La encuesta vuelve a estar en curso y admite respuestas hasta ese día.', accion: 'Aplicar nueva fecha' },
}

const ANIO = new Date().getFullYear()

export function CeldaFecha({
  valor,
  modo,
  minimo,
  bloqueada,
  onEmpezar,
  onGuardar,
  onCancelar,
  textos = COPIA,
}: {
  /** Otros textos para el selector (Objetivos: «El ciclo deja de recibir avances ese día»). Sin ellos, los de Encuestas. */
  textos?: TextosFecha
  valor: string
  /** El modo de edición en curso para esta celda, o null si no se está editando. */
  modo: ModoFecha | null
  minimo: Date
  /** Otra fila está en edición: esta no se puede tocar mientras tanto. */
  bloqueada: boolean
  onEmpezar: () => void
  onGuardar: (fecha: Date) => void
  onCancelar: () => void
}) {
  const [elegida, setElegida] = useState<Date | undefined>(undefined)
  const abierta = modo !== null
  // Al reabrir no hay fecha por defecto: hay que decir hasta cuándo vuelve a estar abierta.
  const propuesta = elegida ?? (modo === 'reabrir' ? undefined : (parseSurveyDate(valor) ?? undefined))
  const valida = propuesta !== undefined && propuesta >= minimo
  const copia = modo ? textos[modo] : null
  // Si la fila quedó fuera de la vista (se reabre desde otra pantalla), se trae al centro para que el selector abra sobre ella.
  const disparador = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (abierta) disparador.current?.scrollIntoView({ block: 'center' })
  }, [abierta])

  return (
    // Al reabrir (cambia el estado de la encuesta) lo demás queda bloqueado hasta aplicar o cancelar; al editar una fecha, no.
    <Popover
      modal={modo === 'reabrir'}
      open={abierta}
      onOpenChange={(siguiente) => {
        if (siguiente) {
          setElegida(undefined)
          onEmpezar()
        } else if (abierta) {
          onCancelar()
        }
      }}
    >
      <PopoverTrigger
        render={
          <Button
            ref={disparador}
            variant={abierta ? 'outline' : 'ghost'}
            size="sm"
            disabled={bloqueada}
            className="-ms-2 h-8 px-2 tabular-nums"
            aria-label={`Cambiar la fecha ${valor}`}
          />
        }
      >
        {abierta ? <HugeiconsIcon icon={Calendar03Icon} aria-hidden="true" /> : null}
        {abierta && modo === 'reabrir' && !elegida ? 'Elegir' : propuesta && abierta ? formatSurveyDate(propuesta) : valor}
      </PopoverTrigger>
      {/* Al costado de la fila y no encima: el calendario es alto y, sobre la tabla, tapaba las demás filas y las métricas. */}
      <PopoverContent side="left" align="center" sideOffset={8} className="w-auto gap-0! p-0!">
        {copia ? (
          <>
            {/* El contenedor de la librería trae 16px de relleno y de hueco entre bloques; aquí van en 0 (con «!», que el tema no se
                deja ganar) para que el aire lo pongan las piezas: 12px a los lados, igual que el relleno del calendario, así el título,
                la primera columna de días y los botones del pie quedan sobre el mismo borde.
                `w-0 min-w-full`: el texto no ensancha el selector, que mide lo que el calendario. */}
            <PopoverHeader className="w-0 min-w-full gap-0.5 px-3 pt-3 pb-2.5">
              <PopoverTitle>{copia.titulo}</PopoverTitle>
              <PopoverDescription>{copia.detalle}</PopoverDescription>
            </PopoverHeader>
            <Separator />
            <Calendar
              mode="single"
              selected={propuesta}
              weekStartsOn={1}
              defaultMonth={propuesta ?? minimo}
              disabled={{ before: minimo }}
              onSelect={(fecha: Date | undefined) => setElegida(fecha)}
              captionLayout="dropdown"
              startMonth={new Date(ANIO - 5, 0)}
              endMonth={new Date(ANIO + 5, 11)}
              formatters={CALENDARIO_ES}
            />
            <Separator />
            <div className="flex justify-end gap-2 px-3 py-2.5">
              <Button variant="ghost" size="sm" onClick={onCancelar}>
                Cancelar
              </Button>
              <Button size="sm" disabled={!valida} onClick={() => propuesta && onGuardar(propuesta)}>
                {copia.accion}
              </Button>
            </div>
          </>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
