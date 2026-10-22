import { Text } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { plural } from '@/modules/design-system/patrones/formato'
import { PAISES, etiquetaExperiencia as experienciaEnTexto } from './datos'
import { pendienteEtapa, resumenEtapa } from './etapas'
import type { VacanteNueva } from './formulario'
import { AvanceObligatorios, Aviso, BloqueResumen, ItemDetalle, ItemEstado, ListaDatos, TarjetaResumen } from './piezas-resumen'
import { avanceInformacion, completa } from './secciones-informacion'

const MODALIDAD: Record<VacanteNueva['modalidad'], string> = { '': '', remoto: 'Remoto', presencial: 'Presencial', hibrido: 'Híbrido' }

type Fila = { termino: string; valor: string }

function dinero(valor: string) {
  const numero = Number(valor)
  return Number.isFinite(numero) ? `$${numero.toLocaleString('es-CO')}` : '$0'
}

function etiquetaExperiencia(v: VacanteNueva) {
  return experienciaEnTexto(v.experienciaDesde, v.experienciaHasta)
}

// Lo ya elegido en el paso 1, como filas de término y valor. Lo que sale de un deslizador (experiencia,
// salario) siempre tiene un valor: solo se muestra cuando ya se tocó su sección, para que el panel no se
// vea lleno con el formulario vacío.
function filasDeInformacion(v: VacanteNueva): Fila[] {
  const pais = PAISES.find((opcion) => opcion.valor === v.pais)?.nombre
  const requisitosTocados = Boolean(v.contrato || v.seniority || v.modalidad || v.idiomas.length)
  const salario = v.tipoSalario === 'fijo' ? dinero(v.salarioFijo) : `${dinero(v.salarioDesde)} – ${dinero(v.salarioHasta)}`
  const filas: Fila[] = [
    { termino: 'Área', valor: v.area },
    { termino: 'Ubicación', valor: [v.ciudad, pais].filter(Boolean).join(', ') },
    { termino: 'Contrato', valor: v.contrato },
    { termino: 'Seniority', valor: v.seniority },
    { termino: 'Experiencia', valor: requisitosTocados ? etiquetaExperiencia(v) : '' },
    { termino: 'Idiomas', valor: v.idiomas.join(', ') },
    { termino: 'Salario', valor: v.moneda ? `${salario} ${v.moneda}`.trim() : '' },
    { termino: 'Se publica en', valor: completa('configuracion', v) ? (v.publicarEnBolsas ? 'Portal de empleo' : 'Solo interna') : '' },
  ]
  return filas.filter((fila) => fila.valor)
}

// Panel de apoyo de los tres pasos, a la derecha y siempre a la vista. El nombre, la modalidad y —desde
// el paso 2— el área y la ubicación se quedan fijos arriba como contexto; el cuerpo cambia de un paso a
// otro y se enfoca solo en lo que se está llenando ahí: los datos del paso 1, las secciones de la
// descripción o las etapas del proceso. No repite entre pasos lo que ya quedó decidido en uno anterior.
// `kicker` cambia el antetítulo cuando el flujo arma una plantilla en vez de una vacante.
export function ResumenVacante({ vacante, paso, kicker = 'Así va la vacante' }: { vacante: VacanteNueva; paso: number; kicker?: string }) {
  const pais = PAISES.find((opcion) => opcion.valor === vacante.pais)?.nombre
  const contexto = [vacante.area, [vacante.ciudad, pais].filter(Boolean).join(', ')].filter(Boolean).join(' · ')

  return (
    <TarjetaResumen
      kicker={kicker}
      nombre={vacante.nombre.trim()}
      sinNombre="Sin nombre todavía"
      insignias={
        vacante.modalidad ? (
          <Badge variant="secondary">
            {MODALIDAD[vacante.modalidad]}
          </Badge>
        ) : null
      }
      // Del paso 2 en adelante el paso 1 ya quedó atrás: esta línea recuerda de qué vacante se trata.
      contexto={paso > 1 ? contexto : undefined}
    >
      {paso === 1 ? <FocoInformacion vacante={vacante} /> : paso === 2 ? <FocoDescripcion vacante={vacante} /> : <FocoProceso vacante={vacante} />}
    </TarjetaResumen>
  )
}

// Paso 1: la barra de avance con los datos obligatorios que faltan y, debajo, lo que ya se eligió.
function FocoInformacion({ vacante }: { vacante: VacanteNueva }) {
  const { falta, total } = avanceInformacion(vacante)
  const filas = filasDeInformacion(vacante)

  return (
    <>
      {/* Lo que falta va arriba; cuando ya está todo, el aviso de listo baja al final, debajo de lo elegido. */}
      {falta.length ? <AvanceObligatorios falta={falta} total={total} /> : null}
      {filas.length || vacante.habilidades.length ? (
        <BloqueResumen>
          <ListaDatos filas={filas} />
          {vacante.habilidades.length ? (
            <div className="flex flex-col gap-2">
              <Text as="div" variant="muted" size="sm">
                Habilidades
              </Text>
              <div className="flex flex-wrap gap-1.5">
                {vacante.habilidades.map((habilidad) => (
                  <Badge key={habilidad} variant="outline">
                    {habilidad}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </BloqueResumen>
      ) : null}
      {falta.length ? null : <AvanceObligatorios falta={falta} total={total} />}
    </>
  )
}

// Paso 2: cuál sección está escrita y cuál no. Sin mostrar el texto —es el borrador de alguien más—: solo
// si ya quedó, igual que la marca «Completa» de sus tarjetas en el propio paso.
function FocoDescripcion({ vacante }: { vacante: VacanteNueva }) {
  const pendientes = vacante.secciones.filter((seccion) => !seccion.texto.trim())

  return (
    <div className="flex flex-col gap-4">
      {pendientes.length ? (
        <Aviso tono="warning">{plural(pendientes.length, 'Falta escribir una sección', `Faltan escribir ${pendientes.length} secciones`)}</Aviso>
      ) : (
        <Aviso tono="success">{plural(vacante.secciones.length, 'La sección está escrita.', `Las ${vacante.secciones.length} secciones están escritas.`)}</Aviso>
      )}
      <div className="flex flex-col gap-2.5">
        {vacante.secciones.map((seccion) => (
          <ItemEstado key={seccion.id} titulo={seccion.titulo} completa={Boolean(seccion.texto.trim())} />
        ))}
      </div>
    </div>
  )
}

// El mismo detalle que en la tarjeta de la etapa (su categoría y, si ya se ajustó, un resumen de cómo
// quedó), para no tener que bajar hasta el flujo a comprobarlo.
function detalleEtapa(etapa: Parameters<typeof pendienteEtapa>[0]) {
  const pendiente = pendienteEtapa(etapa)
  if (pendiente) return pendiente
  const resumen = resumenEtapa(etapa)
  return resumen ? `${etapa.categoria} · ${resumen}` : etapa.categoria
}

// Paso 3: cada etapa del flujo con su categoría y cómo quedó, y qué frena la publicación.
function FocoProceso({ vacante }: { vacante: VacanteNueva }) {
  const { etapas } = vacante
  if (etapas.length === 0) return <Aviso tono="warning">Agrega al menos una etapa para publicar.</Aviso>

  const porConfigurar = etapas.filter((etapa) => pendienteEtapa(etapa) !== null).length

  return (
    <div className="flex flex-col gap-4">
      {porConfigurar ? (
        <Aviso tono="warning">{plural(porConfigurar, 'Falta configurar una etapa', `Faltan configurar ${porConfigurar} etapas`)}</Aviso>
      ) : (
        <Aviso tono="success">Lista para publicar.</Aviso>
      )}
      <div className="flex flex-col gap-3">
        {etapas.map((etapa) => (
          <ItemDetalle key={etapa.clave} titulo={etapa.nombre} detalle={detalleEtapa(etapa)} />
        ))}
      </div>
    </div>
  )
}
