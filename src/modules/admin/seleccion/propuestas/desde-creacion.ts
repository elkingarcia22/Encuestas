import { CIUDADES, CONTRATOS, EXPERIENCIA_MAX, IDIOMAS, SENIORITY, etiquetaExperiencia } from '../vacantes/crear/components/datos'
import { configurarConIa } from '../vacantes/crear/components/configurar-con-ia'
import { SECCIONES_POR_DEFECTO } from '../vacantes/crear/components/descripcion'
import { CATALOGO, etapaDelCatalogo, preguntaNueva, type EtapaFlujo } from '../vacantes/crear/components/etapas'
import { VACANTE_VACIA, type Modalidad, type VacanteNueva } from '../vacantes/crear/components/formulario'
import { propuestaIa } from '../vacantes/crear/components/propuesta-ia'
import { CATALOGO_PLANTILLAS } from '../vacantes/components/datos'
import { etapasDe as etapasDePlantilla, type EtapaPlantilla } from '../vacantes/components/etapas-plantilla'
import { CANDIDATURAS, RECHAZADAS, vacanteNueva, type Candidatura, type EtapaVacante, type VacanteUI } from './datos'

// La vacante que arma la creación de Vacantes (la de Elkin: información, descripción y proceso de selección), puesta en
// la forma de la vacante de las exploraciones (30 sep, Nicolás: la exploración 1 crea con ese flujo). Sale publicada y
// sin nadie todavía: la gente llega importando hojas de vida o por el portal.
//
// Y de vuelta (1 oct, reunión con Elkin del 29 sep: «Editar» lleva a la misma experiencia por pasos): una vacante de la
// exploración se abre en la creación con lo que ya tiene, y al guardar se cambia en su sitio —mismo id, misma gente,
// mismas etapas donde sigan—. La que se armó con la creación vuelve tal cual; las sembradas se aproximan campo por campo.

const MODALIDAD: Record<Exclude<VacanteNueva['modalidad'], ''>, string> = { remoto: 'Remoto', presencial: 'Presencial', hibrido: 'Híbrido' }
const MODALIDAD_DE: Record<string, Modalidad> = { Remoto: 'remoto', Presencial: 'presencial', Híbrido: 'hibrido' }

// El rango de la vacante va en millones de pesos colombianos al mes. Lo que se escribe en otra moneda se lleva a
// pesos con una tasa aproximada: en la maqueta basta para que el rango se lea con sentido.
const PESOS_POR: Record<string, number> = { COP: 1, USD: 4000, EUR: 4400, MXN: 220, ARS: 4, CLP: 4.3, PEN: 1100, BRL: 730 }

const enMillones = (valor: string, moneda: string) => {
  const numero = Number(valor.replace(/[^\d.]/g, ''))
  if (!Number.isFinite(numero) || numero <= 0) return 0
  return Math.round(((numero * (PESOS_POR[moneda] ?? 1)) / 1_000_000) * 10) / 10
}

const rangoDe = (vacante: VacanteNueva): [number, number] => {
  const moneda = vacante.moneda || 'COP'
  if (vacante.tipoSalario === 'fijo') {
    const fijo = enMillones(vacante.salarioFijo, moneda)
    return [fijo, fijo]
  }
  return [enMillones(vacante.salarioDesde, moneda), enMillones(vacante.salarioHasta, moneda)]
}

const enPesos = (millones: number) => String(Math.round(millones * 1_000_000))

// «1B - Junior» se lee «Junior»: el código es de la tabla interna de niveles.
const seniorityDe = (seniority: string) => seniority.split(' - ').at(-1)?.trim() || 'Sin definir'

// Al revés: el nivel que dicen las vacantes sembradas («Semi senior») en la tabla de la creación.
const NIVEL_DE: [RegExp, string][] = [
  [/practicante|becari/i, '0 - Becario'],
  [/semi|mid/i, '1A - Mid'],
  [/junior/i, '1B - Junior'],
  [/senior/i, '2B - Senior'],
  [/lead|líder|lider/i, '2A - Lead'],
  [/manager|gerente|jefe/i, '3B - Manager'],
  [/director/i, '3A - Director'],
  [/vp|vicepresident/i, '4 - VP'],
]
const seniorityCodigo = (seniority: string) =>
  SENIORITY.find((nivel) => seniorityDe(nivel).toLowerCase() === seniority.toLowerCase()) ?? NIVEL_DE.find(([pista]) => pista.test(seniority))?.[1] ?? '1A - Mid'

// «1 a 2 años», «5 años o más», «Sin experiencia»: lo que dicen las vacantes, en los dos números de la creación.
function experienciaDe(texto: string): [number, number] {
  if (/sin experiencia/i.test(texto)) return [0, 0]
  const rango = texto.match(/(\d+)\s*(?:a|–|-)\s*(\d+)/)
  if (rango) return [Number(rango[1]), Number(rango[2])]
  const desde = texto.match(/(\d+)/)
  if (desde) return /\+|o más/.test(texto) ? [Number(desde[1]), EXPERIENCIA_MAX] : [Number(desde[1]), Number(desde[1])]
  return [VACANTE_VACIA.experienciaDesde, VACANTE_VACIA.experienciaHasta]
}

// «Inglés B2» pide inglés además del español; «No requerido» deja solo el español.
function idiomasDe(texto: string) {
  const pedidos = IDIOMAS.filter((idioma) => texto.toLowerCase().includes(idioma.toLowerCase()))
  return ['Español', ...pedidos.filter((idioma) => idioma !== 'Español')]
}

const mismos = (unos: string[], otros: string[]) => unos.length === otros.length && unos.every((uno) => otros.includes(uno))

const slug = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

// Lo que la vacante de la exploración toma de lo que se llenó en la creación. Con `antes` (al editar) se conserva lo
// que la creación no sabe decir igual —la sede con su torre, «Semi senior», «Inglés B2», las demás etiquetas, la
// descripción de cada etapa— mientras eso no se haya cambiado.
function camposDe(vacante: VacanteNueva, antes?: VacanteUI) {
  const titulo = vacante.nombre.trim() || 'Vacante sin nombre'
  const sede = vacante.modalidad === 'remoto' ? 'Remoto' : vacante.ciudad || vacante.pais || 'Sin sede'
  // Una sede que no está entre las ciudades de la creación («Planta Funza») abre con país y ciudad vacíos: si no se
  // tocaron, la vacante conserva la suya en vez de quedar «Sin sede».
  const inicial = antes ? creacionDesdeVacante(antes) : undefined
  const mismaSede = inicial && inicial.pais === vacante.pais && inicial.ciudad === vacante.ciudad && inicial.modalidad === vacante.modalidad
  const idioma = vacante.idiomas.length ? vacante.idiomas.join(', ') : 'No requerido'
  const etapas: EtapaVacante[] = vacante.etapas.map((etapa) => {
    const habia = antes?.etapas.find((una) => una.id === etapa.clave)
    return {
      id: etapa.clave,
      titulo: etapa.nombre,
      descripcion: habia?.descripcion ?? etapa.categoria,
      // Una etapa que ya tenía la vacante sigue siendo lo que era: la de la biblioteca de la creación con la que se abre
      // puede ser de IA («Antecedentes judiciales») sin que la de la vacante lo sea.
      ia: habia ? habia.ia : etapa.conIa || undefined,
      origen: habia?.origen ?? (etapa.propia ? 'propia' : 'plantilla'),
    }
  })
  return {
    titulo,
    // Sin «Publicar en el portal de empleo», queda solo para el equipo: el ojo tachado de la cabecera.
    oculta: !vacante.publicarEnBolsas,
    area: vacante.area || 'Sin área',
    sede: antes && (mismaSede || (sede !== 'Remoto' && antes.sede.startsWith(sede))) ? antes.sede : sede,
    modalidad: vacante.modalidad ? MODALIDAD[vacante.modalidad] : 'Sin definir',
    contrato: vacante.contrato || antes?.contrato || vacanteNueva().contrato,
    seniority: antes && seniorityCodigo(antes.seniority) === vacante.seniority ? antes.seniority : seniorityDe(vacante.seniority),
    experiencia: etiquetaExperiencia(vacante.experienciaDesde, vacante.experienciaHasta),
    idioma: antes && mismos(idiomasDe(antes.idioma), vacante.idiomas) ? antes.idioma : idioma,
    rango: rangoDe(vacante),
    descripcion: vacante.secciones.map((seccion) => seccion.texto.trim()).filter(Boolean),
    // Lo que se pide para el puesto son las habilidades: contra eso la IA mide el ajuste de cada persona.
    requisitos: vacante.habilidades,
    // Las etiquetas (las carpetas del producto) no se tocan al crear ni al editar: se ponen desde la tabla de Vacantes.
    etiquetas: antes?.etiquetas ?? [],
    etapas: etapas.length ? etapas : (antes?.etapas ?? vacanteNueva().etapas),
  }
}

// Lo que se llenó en la creación, tal cual: editar una vacante que nació ahí vuelve a abrir exactamente lo mismo.
const originales = new Map<string, VacanteNueva>()

export function vacanteDesdeCreacion(vacante: VacanteNueva): VacanteUI {
  const campos = camposDe(vacante)
  const nueva: VacanteUI = {
    ...vacanteNueva(),
    ...campos,
    // Con sufijo: el nombre puede repetir el de una vacante que ya está en la lista.
    id: `${slug(campos.titulo) || 'vacante'}-${Date.now().toString(36)}`,
    estado: 'Publicada',
  }
  originales.set(nueva.id, vacante)
  return nueva
}

// Las etapas de las vacantes sembradas, en las de la biblioteca de la creación: las que traen configuración (CV,
// Serena, pruebas, role play) llegan ya configuradas, para que guardar no pida configurar algo que la vacante ya tenía.
const DEL_CATALOGO: Record<string, string> = {
  cv: 'evaluacion-cv',
  psicometricas: 'psicometrico',
  serena: 'serena',
  roleplay: 'role-play',
  antecedentes: 'antecedentes',
  seleccionado: 'oferta',
  tecnica: 'prueba-tecnica',
  referencias: 'referencias',
}
const CATEGORIA_DE: Record<string, string> = {
  revision: 'Filtro inicial',
  reto: 'Prueba técnica',
  equipo: 'Entrevista con liderazgo',
  medico: 'Contratación',
  situacional: 'Prueba técnica',
}

function etapaParaCreacion(etapa: EtapaVacante, cargo: string): EtapaFlujo {
  const catalogo = CATALOGO.find((una) => una.id === DEL_CATALOGO[etapa.id])
  if (catalogo) return { ...configurarConIa(etapaDelCatalogo(catalogo), cargo), clave: etapa.id, nombre: etapa.titulo }
  return {
    id: `vacante-${etapa.id}`,
    nombre: etapa.titulo,
    categoria: CATEGORIA_DE[etapa.id] ?? 'Filtro inicial',
    conIa: Boolean(etapa.ia),
    configuracion: 'ninguna',
    propia: etapa.origen === 'propia',
    clave: etapa.id,
  }
}

export function creacionDesdeVacante(vacante: VacanteUI): VacanteNueva {
  const guardada = originales.get(vacante.id)
  if (guardada) return guardada
  const ciudad = vacante.sede.split(' · ')[0]
  const pais = Object.entries(CIUDADES).find(([, ciudades]) => ciudades.includes(ciudad))?.[0] ?? ''
  const [experienciaDesde, experienciaHasta] = experienciaDe(vacante.experiencia)
  const [desde, hasta] = vacante.rango
  return {
    ...VACANTE_VACIA,
    nombre: vacante.titulo,
    area: vacante.area,
    pais,
    ciudad: pais ? ciudad : '',
    contrato: CONTRATOS.includes(vacante.contrato) ? vacante.contrato : 'Término indefinido',
    idiomas: idiomasDe(vacante.idioma),
    seniority: seniorityCodigo(vacante.seniority),
    experienciaDesde,
    experienciaHasta,
    modalidad: MODALIDAD_DE[vacante.modalidad] ?? '',
    moneda: 'COP',
    tipoSalario: desde === hasta ? 'fijo' : 'rango',
    salarioFijo: enPesos(desde),
    salarioDesde: enPesos(desde),
    salarioHasta: enPesos(hasta),
    publicarEnBolsas: !vacante.oculta,
    habilidades: vacante.requisitos,
    secciones: SECCIONES_POR_DEFECTO.map((seccion, indice) => ({ ...seccion, texto: vacante.descripcion[indice] ?? '' })),
    etapas: vacante.etapas.map((etapa) => etapaParaCreacion(etapa, vacante.titulo)),
  }
}

// Si al editar se quitó una etapa con gente, esa gente pasa a la etapa anterior que siga (la primera, si no queda
// ninguna antes): lo mismo que hace el tablero al quitar una etapa desde ahí.
function reubicar(vacanteId: string, viejas: EtapaVacante[], nuevas: EtapaVacante[]) {
  const quedan = new Set(nuevas.map((etapa) => etapa.id))
  const orden = viejas.map((etapa) => etapa.id)
  const destinoDe = (etapa: string) => {
    for (let i = orden.indexOf(etapa) - 1; i >= 0; i -= 1) if (quedan.has(orden[i])) return orden[i]
    return nuevas[0]?.id ?? etapa
  }
  const mover = (candidatura: Candidatura) => {
    if (candidatura.vacante.id === vacanteId && !quedan.has(candidatura.etapa)) candidatura.etapa = destinoDe(candidatura.etapa)
  }
  CANDIDATURAS.forEach(mover)
  RECHAZADAS.forEach((rechazada) => mover(rechazada.candidatura))
}

// Guarda lo editado sobre la misma vacante (el mismo objeto que tienen sus candidaturas): así la lista, la cabecera y
// cada ficha dicen el nombre y las etapas nuevas sin buscarla de nuevo.
export function guardarEdicion(vacante: VacanteUI, editada: VacanteNueva) {
  const campos = camposDe(editada, vacante)
  reubicar(vacante.id, vacante.etapas, campos.etapas)
  Object.assign(vacante, campos)
  originales.set(vacante.id, editada)
  return vacante
}

// Crear desde una plantilla del catálogo (1 oct): el perfil que la IA propone para ese cargo y las etapas de la
// plantilla, ya configuradas. Las de la categoría dicen el área (Comercial → Ventas…).
const AREA_DE_CATEGORIA: Record<string, string> = {
  comercial: 'Ventas',
  servicio: 'Operaciones',
  operaciones: 'Operaciones',
  tecnologia: 'Tecnología',
  gente: 'Recursos Humanos',
}
const CATALOGO_DE_PLANTILLA: Record<string, string> = {
  'evaluacion-cv': 'evaluacion-cv',
  serena: 'serena',
  prueba: 'prueba-tecnica',
  'entrevista-lider': 'entrevista-lider',
  antecedentes: 'antecedentes',
  seleccionado: 'oferta',
}

function etapaDePlantilla(etapa: EtapaPlantilla, cargo: string): EtapaFlujo {
  const catalogo = CATALOGO.find((una) => una.id === CATALOGO_DE_PLANTILLA[etapa.id])
  if (!catalogo) {
    return { id: etapa.id, nombre: etapa.nombre, categoria: 'Filtro inicial', conIa: Boolean(etapa.conIA), configuracion: 'ninguna', clave: `${etapa.id}-${Date.now().toString(36)}` }
  }
  const configurada = { ...configurarConIa(etapaDelCatalogo(catalogo), cargo), nombre: etapa.nombre }
  // Serena llega con las preguntas de la plantilla, con los 100 puntos repartidos entre ellas.
  if (configurada.entrevista && etapa.preguntas?.length) {
    const cuantas = etapa.preguntas.length
    const base = Math.floor(100 / cuantas)
    configurada.entrevista = {
      ...configurada.entrevista,
      preguntas: etapa.preguntas.map((texto, indice) => ({
        ...preguntaNueva(),
        objetivo: 'Ver cómo responde a una situación real del cargo.',
        texto,
        puntos: indice === 0 ? 100 - base * (cuantas - 1) : base,
      })),
    }
  }
  return configurada
}

export function creacionDesdePlantilla(id: string): VacanteNueva | undefined {
  const plantilla = CATALOGO_PLANTILLAS.find((una) => una.id === id)
  if (!plantilla) return undefined
  const propuesta = propuestaIa(plantilla.nombre)
  const area = AREA_DE_CATEGORIA[plantilla.categoriaId] ?? propuesta.area ?? ''
  return {
    ...VACANTE_VACIA,
    ...propuesta,
    nombre: plantilla.nombre,
    area,
    etapas: etapasDePlantilla(plantilla).map((etapa) => etapaDePlantilla(etapa, plantilla.nombre)),
  }
}
