import { useState, useEffect, useRef } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {  LibraryIcon, PlusSignIcon } from '@hugeicons/core-free-icons'
import { Button, Empty, EmptyHeader, EmptyTitle, EmptyDescription, Text } from '@ubits/flux-ui'
import { createBlankObjective, type CicloDraft, type Objective } from '../../../modelo/constructor/cicloBuilderTypes'
import { unalignFromCompanyObjective } from '../../../modelo/constructor/objectiveSets'
import { BancoObjetivos } from '../banco/banco-objetivos'
import { ListaObjetivos } from '../objetivo/lista-objetivos'

// Paso · Objetivos de la empresa: los resultados de la compañía en este ciclo. No se asignan a nadie ni llevan peso; el
// resto de los objetivos puede colgar de ellos. Mismo armado que «Secciones y preguntas» en Encuestas: arriba una fila
// con lo que se puede traer ya hecho (el banco); debajo, una tarjeta por objetivo que se
// edita en el sitio, con una sola abierta a la vez. Borrar uno desalinea todo lo que colgaba de él.

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
  const [banco, setBanco] = useState(false)
  const objetivos = borrador.companyObjectives
      
  const agregar = (nuevos: Objective[], abrir = false) => {
    onCambio((actual) => ({ companyObjectives: [...actual.companyObjectives, ...nuevos] }))
    if (abrir && nuevos[0]) setAbierta(nuevos[0].id)
  }
  const cambiarObjetivo = (id: string, cambio: Partial<Objective>) => onCambio((actual) => ({ companyObjectives: actual.companyObjectives.map((objetivo) => (objetivo.id === id ? { ...objetivo, ...cambio } : objetivo)) }))
  const eliminar = (id: string) => onCambio((actual) => ({ companyObjectives: actual.companyObjectives.filter((objetivo) => objetivo.id !== id), objectiveSets: unalignFromCompanyObjective(actual.objectiveSets, id) }))
  const crearManual = () => agregar([createBlankObjective(0)], true)

  useEffect(() => {
    if (objetivos.length === 0 && !agenteAbierto) {
      const nuevo = createBlankObjective(0)
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
    <section className="flex flex-col gap-4" aria-label="Objetivos de la empresa">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Text as="p" size="sm" variant="muted">Trae objetivos ya hechos desde el catálogo.</Text>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setBanco(true)}>
            <HugeiconsIcon icon={LibraryIcon} aria-hidden="true" />
            Elegir del banco
          </Button>
        </div>
      </div>

      {agenteAbierto && objetivos.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Creando objetivos con IA</EmptyTitle>
            <EmptyDescription>Cuéntale a Orbit Flow qué resultados necesita la empresa en este ciclo. Los objetivos que proponga aparecerán aquí para que los revises.</EmptyDescription>
          </EmptyHeader>
        </Empty>
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
            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={crearManual}>
                <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />
                Añadir objetivo
              </Button>
            </div>
          )}
        </>
      )}

      <BancoObjetivos abierto={banco} onAbiertoChange={setBanco} alcance="empresa" pesoLibre={0} destino="los objetivos de la empresa" onAgregar={(nuevos) => agregar(nuevos.map((objetivo) => ({ ...objetivo, weight: 0 })))} />
    </section>
  )
}
