import { useMemo, useState } from 'react'
import { Delete02Icon } from '@hugeicons/core-free-icons'
import { Field, FieldDescription, FieldLabel, Input } from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { DialogoConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { buildDemographicRows, type DemographicRow } from '../../modelo/demographicRows'
import { deleteLibraryDemographic, duplicateAsLibraryDemographic, useDemographicsLibrary } from '../../modelo/demographicsLibrary'
import { FichaDemografico } from './ficha-demografico'
import { FormularioDemografico, type DemograficoEditable } from './formulario-demografico'
import { TablaDemograficos, type AccionDemografico } from './tabla-demograficos'

// La pestaña «Datos demográficos»: el catálogo de variables por las que cualquier encuesta puede
// cortar sus resultados. Los del sistema se ven y se duplican, pero no se editan ni se eliminan.

type Formulario = { abierto: false } | { abierto: true; editando: DemograficoEditable | null; vez: number }

export function PestanaDemograficos() {
  const biblioteca = useDemographicsLibrary()
  const filas = useMemo(() => buildDemographicRows(biblioteca), [biblioteca])
  const [viendo, setViendo] = useState<DemographicRow | null>(null)
  const [formulario, setFormulario] = useState<Formulario>({ abierto: false })
  const [porEliminar, setPorEliminar] = useState<{ filas: DemographicRow[]; limpiar?: () => void }>({ filas: [] })
  const [texto, setTexto] = useState('')

  // La ficha lee la fila viva: si se edita desde otra parte, muestra lo último.
  const fichaViva = viendo ? (filas.find((fila) => fila.id === viendo.id) ?? null) : null
  const editandoKey = formulario.abierto ? formulario.editando?.key : undefined
  const nombresUsados = filas.filter((fila) => fila.id !== editandoKey).map((fila) => fila.name)

  const abrirFormulario = (editando: DemograficoEditable | null) => setFormulario({ abierto: true, editando, vez: Date.now() })

  const duplicar = (lista: readonly DemographicRow[]) => {
    const creados = lista
      .map((fila) => duplicateAsLibraryDemographic({ label: fila.name, type: fila.type, optionLabels: fila.optionLabels }))
      .filter((creado) => creado !== null)
    if (creados.length === 0) return notify('No se pudo duplicar', 'Inténtalo de nuevo en unos segundos.')
    notify(
      creados.length === 1 ? 'Demográfico duplicado' : `${creados.length} demográficos duplicados`,
      creados.length === 1 ? `«${creados[0].label}» ya está disponible.` : undefined,
    )
  }

  const ejecutar = (accion: AccionDemografico, fila: DemographicRow) => {
    if (accion === 'ver') return setViendo(fila)
    if (accion === 'duplicar') return duplicar([fila])
    if (fila.origin === 'system') return
    if (accion === 'editar') return abrirFormulario({ key: fila.id, label: fila.name, type: fila.type, optionLabels: fila.optionLabels })
    if (accion === 'eliminar') setPorEliminar({ filas: [fila] })
  }

  const una = porEliminar.filas.length === 1 ? porEliminar.filas[0] : null
  const listoParaEliminar = una ? texto.trim() === una.name : porEliminar.filas.length > 1

  const cerrarEliminar = () => {
    setTexto('')
    setPorEliminar({ filas: [] })
  }

  const eliminar = () => {
    const borrados = porEliminar.filas.filter((fila) => deleteLibraryDemographic(fila.id)).length
    porEliminar.limpiar?.()
    cerrarEliminar()
    if (borrados > 0) notify(borrados === 1 ? 'Demográfico eliminado' : `${borrados} demográficos eliminados`)
  }

  return (
    <>
      <TablaDemograficos
        filas={filas}
        onAccion={ejecutar}
        onCrear={() => abrirFormulario(null)}
        onDuplicarVarias={(lista, limpiar) => {
          duplicar(lista)
          limpiar()
        }}
        onEliminarVarias={(lista, limpiar) => setPorEliminar({ filas: lista, limpiar })}
      />

      <FichaDemografico
        fila={fichaViva}
        onCerrar={() => setViendo(null)}
        onEditar={(fila) => {
          setViendo(null)
          ejecutar('editar', fila)
        }}
        onDuplicar={(fila) => {
          setViendo(null)
          duplicar([fila])
        }}
        onEliminar={(fila) => {
          setViendo(null)
          ejecutar('eliminar', fila)
        }}
      />

      {formulario.abierto ? (
        <FormularioDemografico
          // Cada apertura empieza limpia (o con los datos del que se edita).
          key={formulario.vez}
          abierto
          onAbiertoChange={(abierto) => (abierto ? undefined : setFormulario({ abierto: false }))}
          editando={formulario.editando}
          nombresUsados={nombresUsados}
          onGuardado={() => setFormulario({ abierto: false })}
          onEliminar={() => {
            const fila = filas.find((una) => una.id === formulario.editando?.key)
            setFormulario({ abierto: false })
            if (fila) ejecutar('eliminar', fila)
          }}
        />
      ) : null}

      <DialogoConfirmar
        abierto={porEliminar.filas.length > 0}
        onAbiertoChange={(abierto) => (abierto ? undefined : cerrarEliminar())}
        icono={Delete02Icon}
        titulo={una ? '¿Eliminar el dato demográfico?' : '¿Eliminar los datos demográficos?'}
        descripcion={
          una
            ? `«${una.name}» sale del módulo y no se puede recuperar. Los filtros de resultados que lo usen dejarán de funcionar.`
            : `Los ${porEliminar.filas.length} datos demográficos marcados salen del módulo y no se pueden recuperar. Los filtros de resultados que los usen dejarán de funcionar.`
        }
        accion="Eliminar"
        destructiva
        deshabilitada={!listoParaEliminar}
        onConfirmar={eliminar}
      >
        {una ? (
          <Field>
            <FieldLabel htmlFor="confirmar-eliminar-demografico">Escribe «{una.name}» para confirmar</FieldLabel>
            <Input id="confirmar-eliminar-demografico" value={texto} autoComplete="off" onChange={(evento) => setTexto(evento.target.value)} />
            <FieldDescription>Así nadie borra un demográfico en uso por un clic de más.</FieldDescription>
          </Field>
        ) : null}
      </DialogoConfirmar>
    </>
  )
}
