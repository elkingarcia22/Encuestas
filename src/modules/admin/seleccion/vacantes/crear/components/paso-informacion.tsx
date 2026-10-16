import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Globe02Icon, GridViewIcon, Location01Icon } from '@hugeicons/core-free-icons'
import {
  Field,
  FieldDescription,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
} from '@ubits/flux-ui'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import { AREAS, CIUDADES, PAISES } from './datos'
import type { CamposSeccion } from './formulario'
import { SeccionFormulario } from './piezas'
import { REJILLA } from './rejilla'
import { Compensacion } from './seccion-compensacion'
import { Configuracion } from './seccion-configuracion'
import { Requisitos } from './seccion-requisitos'
import { MAX_NOMBRE, SECCIONES_INFORMACION, completa, type IdSeccion } from './secciones-informacion'
import { SelectorCreable } from './selectores'
import { crearCategoria, useCategoriasPropias } from '../../components/plantillas-propias'

// «Crear con IA» junto al nombre: arma los tres pasos a partir del cargo escrito.
type CrearConIa = { onCrearConIa: () => void; creandoConIa: boolean }

type Props = CamposSeccion & CrearConIa

// Nombre mínimo para que la IA tenga de dónde sacar el cargo.
const MIN_NOMBRE_IA = 3

// Un switch y no un objeto con las secciones: el objeto se queda con la versión vieja de cada una y,
// al editar una sección, la pantalla no se actualiza hasta recargar.
function contenido(id: IdSeccion, campos: CamposSeccion, ia: CrearConIa): ReactNode {
  switch (id) {
    case 'general':
      return <General {...campos} {...ia} />
    case 'requisitos':
      return <Requisitos {...campos} />
    case 'compensacion':
      return <Compensacion {...campos} />
    case 'configuracion':
      return <Configuracion {...campos} />
  }
}

// Las cuatro secciones a la vista y en orden, sin plegarse: qué falta lo dicen la marca de cada una y
// el panel «Así va la vacante».
export function PasoInformacion({ vacante, onCambio, onCrearConIa, creandoConIa }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {SECCIONES_INFORMACION.map(({ id, titulo }) => (
        <SeccionFormulario key={id} id={`seccion-${id}`} titulo={titulo} completa={completa(id, vacante)}>
          {contenido(id, { vacante, onCambio }, { onCrearConIa, creandoConIa })}
        </SeccionFormulario>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------ información general */

function General({ vacante, onCambio, onCrearConIa, creandoConIa }: CamposSeccion & CrearConIa) {
  const puedeCrear = vacante.nombre.trim().length >= MIN_NOMBRE_IA
  // Las áreas del sistema más las que se crearon: la misma lista sirve de categoría en el catálogo de plantillas.
  const creadas = useCategoriasPropias().map((categoria) => categoria.nombre)
  const areas = [...AREAS, ...creadas.filter((nombre) => !AREAS.includes(nombre))]

  return (
    <div className="flex flex-col gap-5">
      <Field>
        <FieldLabel htmlFor="vacante-nombre">Nombre de la vacante</FieldLabel>
        <div className="relative">
          <Input
            id="vacante-nombre"
            className="pr-[140px]"
            value={vacante.nombre}
            maxLength={MAX_NOMBRE}
            placeholder="Ej: Analista de datos"
            aria-describedby="vacante-nombre-ayuda"
            disabled={creandoConIa}
            onChange={(evento) => onCambio({ nombre: evento.target.value })}
          />
          <div className="absolute inset-y-0 right-1 flex items-center">
            {/* La acción de IA del paso: botón terciario con orbe, incrustado en el input */}
            <BotonIaSecundario
              size="sm"
              className="text-muted-foreground!"
              disabled={!puedeCrear || creandoConIa}
              onClick={onCrearConIa}
            >
              {creandoConIa ? 'Creando…' : 'Crear con IA'}
            </BotonIaSecundario>
          </div>
        </div>
        <FieldDescription id="vacante-nombre-ayuda" className="flex justify-between gap-3">
          <span>
            Máximo {MAX_NOMBRE} caracteres. Con «Crear con IA» armamos los tres pasos de la vacante a partir del nombre.
          </span>
          <span className="shrink-0 tabular-nums">
            {vacante.nombre.length}/{MAX_NOMBRE}
          </span>
        </FieldDescription>
      </Field>

      <div className={REJILLA}>
        {/* La carpeta ya no se pide al crear (8 oct, Nicolás: las etiquetas «deben estar afuera de crear una vacante y más
            atadas a la tabla»): se ponen desde la lista de Vacantes. */}
        <Field>
          <FieldLabel htmlFor="vacante-area">Área</FieldLabel>
          {/* Se puede crear una área que no esté: queda para las demás vacantes y como categoría de las plantillas. */}
          <SelectorCreable
            id="vacante-area"
            icono={GridViewIcon}
            opciones={areas}
            valor={vacante.area}
            onCambio={(area) => onCambio({ area })}
            onCrear={crearCategoria}
            crear="área"
            placeholder="Elige un área o escribe una nueva"
          />
        </Field>

        {/* País y ciudad juntos en su fila: la ciudad depende del país. */}
        <Field className="lg:col-start-1">
          <FieldLabel htmlFor="vacante-pais">
            País <Opcional />
          </FieldLabel>
          {/* Cambiar de país borra la ciudad si no pertenece al nuevo: no puede quedar «Medellín, México». */}
          <Select
            value={vacante.pais || null}
            onValueChange={(pais) =>
              onCambio({
                pais: pais ?? '',
                ciudad: pais && CIUDADES[pais]?.includes(vacante.ciudad) ? vacante.ciudad : '',
              })
            }
          >
            <SelectTrigger id="vacante-pais">
              {/* Sin esto el campo muestra el valor interno («colombia») en vez del nombre con su bandera. Con su icono,
                  como área (29 sep, reunión con Elkin: país y ciudad eran los únicos sin él). */}
              <SelectValue placeholder="Elige un país">
                {(valor: string | null) => {
                  const pais = PAISES.find((opcion) => opcion.valor === valor)
                  return (
                    <>
                      <HugeiconsIcon icon={Globe02Icon} className="text-muted-foreground" aria-hidden="true" />
                      {pais ? `${pais.bandera} ${pais.nombre}` : 'Elige un país'}
                    </>
                  )
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PAISES.map((pais) => (
                <SelectItem key={pais.valor} value={pais.valor}>
                  <span aria-hidden="true">{pais.bandera}</span> {pais.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor="vacante-ciudad">
            Ciudad <Opcional />
          </FieldLabel>
          <Select
            value={vacante.ciudad || null}
            onValueChange={(ciudad) => onCambio({ ciudad: ciudad ?? '' })}
            disabled={!vacante.pais}
          >
            <SelectTrigger id="vacante-ciudad">
              <SelectValue placeholder={vacante.pais ? 'Elige una ciudad' : 'Primero elige un país'}>
                {(valor: string | null) => (
                  <>
                    <HugeiconsIcon icon={Location01Icon} className="text-muted-foreground" aria-hidden="true" />
                    {valor || (vacante.pais ? 'Elige una ciudad' : 'Primero elige un país')}
                  </>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(CIUDADES[vacante.pais] ?? []).map((ciudad) => (
                <SelectItem key={ciudad} value={ciudad}>
                  {ciudad}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
    </div>
  )
}

function Opcional() {
  return (
    <Badge variant="secondary">
      Opcional
    </Badge>
  )
}
