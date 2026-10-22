import { useEffect } from 'react'
import { Image01Icon } from '@hugeicons/core-free-icons'
import { Field, FieldDescription, FieldTitle } from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { AdjuntoCsv } from '@/modules/design-system/estados/procesos'
import { REQUISITOS, VACIO, listo, type Archivo, type TipoImagen } from './datos'

// Campo de imagen con sus tres estados: vacío (zona para elegir), cargando (barra y cancelar) y listo
// (miniatura, peso y quitar). La carga es simulada: al elegir, la barra avanza sola hasta completar.
// Lo que se ve es el cargador único del equipo, AdjuntoCsv (Design system › Estados › Procesos largos), a todo el
// ancho; aquí solo se suman el título, la medida y el enlace de recomendaciones.
export function CampoImagen({ tipo, imagen, value, onChange }: { tipo: TipoImagen; imagen: string; value: Archivo; onChange: (value: Archivo) => void }) {
  const req = REQUISITOS[tipo]

  useEffect(() => {
    if (value.estado !== 'cargando') return
    const timer = window.setTimeout(() => {
      onChange(value.progreso >= 100 ? listo(tipo) : { ...value, progreso: Math.min(100, value.progreso + 20) })
    }, value.progreso === 0 ? 1200 : 450)
    return () => window.clearTimeout(timer)
  }, [value, onChange, tipo])

  return (
    <Field>
      <FieldTitle>{req.titulo}</FieldTitle>

      <AdjuntoCsv
        estado={value.estado === 'vacio' ? 'idle' : value.estado === 'cargando' ? 'uploading' : 'done'}
        vacio={{ titulo: 'Selecciona un archivo', descripcion: req.formatos }}
        nombre={value.estado === 'vacio' ? '' : value.nombre}
        descripcion={value.estado === 'cargando' ? `Cargando… ${value.progreso} %` : value.estado === 'listo' ? `Completado (${value.tamano})` : ''}
        porcentaje={value.estado === 'cargando' ? value.progreso : 0}
        icono={Image01Icon}
        etiquetaElegir={`Seleccionar ${req.titulo.toLowerCase()}`}
        imagen={value.estado === 'listo' ? imagen : undefined}
        className="w-full!"
        onElegir={() => onChange({ estado: 'cargando', nombre: req.archivo, progreso: 0 })}
        onQuitar={() => {
          onChange(VACIO)
          if (value.estado === 'listo') notify('Imagen eliminada', 'Guarda los cambios para aplicarlo.', 'success')
        }}
      />

      <FieldDescription>
        {req.medida} · {req.peso}
      </FieldDescription>
      {/* 13-oct (nada-que-finja): el enlace a la guía de recomendaciones solo avisaba que la abría; sin guía a la que llevar, se quita. */}
    </Field>
  )
}
