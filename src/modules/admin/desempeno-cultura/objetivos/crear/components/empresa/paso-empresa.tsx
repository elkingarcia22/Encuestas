import { useState, useEffect, useRef } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { PlusSignIcon } from '@hugeicons/core-free-icons'
import { Button } from '@ubits/flux-ui'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { createBlankObjective, type CicloDraft, type Objective } from '../../../modelo/constructor/cicloBuilderTypes'
import { unalignFromCompanyObjective } from '../../../modelo/constructor/objectiveSets'
import { ListaObjetivos } from '../objetivo/lista-objetivos'
import { MARGEN_BARRA, useMostrarAlAbrir } from '../mostrar-al-abrir'

// Paso · Objetivos de la empresa: los resultados de la compañía en este ciclo. No se asignan a nadie ni llevan peso; el
// resto de los objetivos puede colgar de ellos. Una tarjeta por objetivo que se edita en el sitio, con una sola
// abierta a la vez (el banco de objetivos se quitó de la creación el 20-oct). Borrar uno desalinea todo lo que colgaba de él.

export function PasoEmpresa({
  borrador,
  onCambio,
  conErrores,
  propuesta,
  agenteAbierto,
}: {
  borrador: CicloDraft
  /** Un cambio hecho, o una función sobre el borrador más reciente (la que usan las ediciones de cada tarjeta). */
  onCambio: (cambio: Partial<CicloDraft> | ((actual: CicloDraft) => Partial<CicloDraft>)) => void
  conErrores: boolean
  /** Ids de la tanda que propuso la IA y aún no se conserva. */
  propuesta: ReadonlySet<string>
  agenteAbierto: boolean
}) {
  const [abierta, setAbierta] = useState<string | null>(borrador.companyObjectives[0]?.id ?? null)
  const objetivos = borrador.companyObjectives
      
  const agregar = (nuevos: Objective[], abrir = false) => {
    onCambio((actual) => ({ companyObjectives: [...actual.companyObjectives, ...nuevos] }))
    if (abrir && nuevos[0]) setAbierta(nuevos[0].id)
  }
  const cambiarObjetivo = (id: string, cambio: Partial<Objective>) => onCambio((actual) => ({ companyObjectives: actual.companyObjectives.map((objetivo) => (objetivo.id === id ? { ...objetivo, ...cambio } : objetivo)) }))
  const eliminar = (id: string) => onCambio((actual) => ({ companyObjectives: actual.companyObjectives.filter((objetivo) => objetivo.id !== id), objectiveSets: unalignFromCompanyObjective(actual.objectiveSets, id) }))
  // Cuando la IA agrega objetivos, la pantalla baja sola hasta que «Agregar objetivo» se vea (Elkin, 21-oct). Vale con el panel
  // de Orbit abierto o ya cerrado. Los que crea la persona a mano (o el en blanco con el que arranca el paso) ya se abren a
  // la vista y no mueven la pantalla: se marcan en `propio` antes de entrar a la lista.
  const [finLista, mostrarFin] = useMostrarAlAbrir()
  const cantidadAntes = useRef(objetivos.length)
  const propio = useRef(false)
  useEffect(() => {
    if (objetivos.length > cantidadAntes.current && !propio.current) {
      // Dos intentos: la tarjeta nueva se abre con animación y el botón sigue bajando después del primero.
      mostrarFin()
      const retraso = window.setTimeout(mostrarFin, 450)
      cantidadAntes.current = objetivos.length
      return () => window.clearTimeout(retraso)
    }
    propio.current = false
    cantidadAntes.current = objetivos.length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objetivos.length])
  const crearManual = () => {
    propio.current = true
    agregar([createBlankObjective(0)], true)
  }

  useEffect(() => {
    if (objetivos.length === 0 && !agenteAbierto) {
      const nuevo = createBlankObjective(0)
      propio.current = true
      onCambio((actual) => (actual.companyObjectives.length > 0 ? {} : { companyObjectives: [nuevo] }))
    }
  }, [objetivos.length, agenteAbierto, onCambio])

  // Al entrar, el primer objetivo llega abierto (sea el que ya existía o el que se acaba de crear en blanco).
  const abiertoAlEntrar = useRef(false)
  useEffect(() => {
    if (abiertoAlEntrar.current || objetivos.length === 0) return
    abiertoAlEntrar.current = true
    setAbierta(objetivos[0].id)
  }, [objetivos])

  return (
    <section data-objetivos className="flex flex-col gap-4" aria-label="Objetivos de la empresa">
      {agenteAbierto && objetivos.length === 0 ? (
        // Con la pieza de vacío del sistema y su ilustración glass (13-oct).
        <PrimeraVez
          icono="glass-message"
          titulo="Creando objetivos con IA"
          descripcion="Cuéntale a Orbit qué resultados necesita la empresa en este ciclo. Los objetivos que proponga aparecerán aquí para que los revises."
          className="py-8 border"
        />
      ) : (
        <>
          <ListaObjetivos
            objetivos={objetivos}
            variante="empresa"
            modelo={borrador.objectiveModel}
            reglas={borrador.modelRules}
            conErrores={conErrores}
            alineables={() => ({ empresa: [] })}
            alineacionRequerida={false}
            alcance="empresa"
            onCambio={cambiarObjetivo}
            onEliminar={eliminar}
            abierta={abierta}
            onAbierta={setAbierta}
            contextoIa={{ nombreCiclo: borrador.name }}
            resaltados={propuesta}
          />
          {objetivos.length > 0 && (
            <div ref={finLista} data-fin-objetivos className={`flex justify-end pt-2 ${MARGEN_BARRA}`}>
              <Button variant="outline" onClick={crearManual}>
                <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />
                Agregar objetivo
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
