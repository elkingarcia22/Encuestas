import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, Cancel01Icon, CheckmarkCircle02Icon, Clock01Icon } from '@hugeicons/core-free-icons'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Progress,
  Text,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { EtiquetaIA } from '@/modules/design-system/ia/etiqueta-ia'
import { CANDIDATURAS, cumplidosDe, tituloEtapa, type Candidatura } from '../propuestas/datos'
import { type Resumen } from './datos'
import { motion } from 'motion/react'
import { CURVA, entrada } from '../propuestas/components/movimiento'

// Lo que la IA encuentra y no cabe en una cifra. Nacieron debajo de la lectura grande de AI Insights (8 oct); desde el
// 16 oct son bloques que Orbit trae cuando se le pregunta y que se pueden sumar a un tablero:
// 1. Candidatos que la IA destaca: cumplen casi todo y siguen al principio del proceso, sin que nadie los mueva.
// 2. Qué vacantes atraen a la gente indicada: cuántos de los que llegan cumplen todo lo que pide cada una.
// 3. Dónde espera más la gente: los días en cada etapa, con la más lenta señalada.

const VACANTES = '/admin/seleccion/exploraciones/uno'
export const dias = (n: number) => (n === 1 ? '1 día' : `${n} días`)
const promedio = (lista: number[]) => (lista.length ? Math.round(lista.reduce((total, valor) => total + valor, 0) / lista.length) : 0)
const por = (parte: number, total: number) => (total ? Math.round((parte / total) * 100) : 0)

// Las candidaturas vivas de las vacantes que cuenta el resumen.
export const activasDe = (resumen: Resumen) => {
  const enEstas = new Set(resumen.filas.map((fila) => fila.vacante.id))
  return CANDIDATURAS.filter((c) => enEstas.has(c.vacante.id))
}

export function destacados(activas: Candidatura[]) {
  const vistas = new Set<string>()
  return activas
    .filter((c) => c.criterios.length && c.vacante.etapas.slice(0, 2).some((etapa) => etapa.id === c.etapa))
    .map((c) => ({ c, cumple: cumplidosDe(c.criterios) }))
    .filter(({ c, cumple }) => cumple / c.criterios.length >= 0.75)
    .sort((a, b) => b.cumple / b.c.criterios.length - a.cumple / a.c.criterios.length || b.c.dias - a.c.dias)
    .filter(({ c }) => (vistas.has(c.personaId) ? false : (vistas.add(c.personaId), true)))
    .slice(0, 4)
}

// Qué parte de los que llegan a cada vacante cumple todo lo que pide: dice qué publicaciones atraen a la gente indicada.
export function calidadPorVacante(activas: Candidatura[]) {
  const grupos = new Map<string, { vacante: Candidatura['vacante']; cumplen: number; total: number }>()
  for (const c of activas) {
    if (!c.criterios.length) continue
    const fila = grupos.get(c.vacante.id) ?? { vacante: c.vacante, cumplen: 0, total: 0 }
    fila.total += 1
    if (cumplidosDe(c.criterios) === c.criterios.length) fila.cumplen += 1
    grupos.set(c.vacante.id, fila)
  }
  return [...grupos.values()]
    .filter((fila) => fila.total >= 4)
    .map((fila) => ({ ...fila, parte: Math.round((fila.cumplen / fila.total) * 100) }))
    .sort((a, b) => b.parte - a.parte)
}

export function esperaPorEtapa(activas: Candidatura[]) {
  const grupos = new Map<string, number[]>()
  for (const c of activas) {
    const titulo = tituloEtapa(c.etapa)
    grupos.set(titulo, [...(grupos.get(titulo) ?? []), c.dias])
  }
  return [...grupos.entries()]
    .filter(([, lista]) => lista.length >= 3)
    .map(([titulo, lista]) => ({ titulo, promedio: promedio(lista), gente: lista.length }))
    .sort((a, b) => b.promedio - a.promedio)
    .slice(0, 5)
}

// `marca` señala una fila: en amarillo lo que pide atención; con `bien`, en verde lo que va mejor.
type Barra = { id: string; etiqueta: string; valor: number; texto: string; marca?: string; bien?: boolean; detalle?: string }

function Barras({ barras, tope }: { barras: Barra[]; tope: number }) {
  return (
    <ul className="flex flex-col gap-3">
      {barras.map((barra) => (
        <li key={barra.id} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-1.5">
              <Text as="span" size="sm" className="truncate" title={barra.etiqueta}>
                {barra.etiqueta}
              </Text>
              {barra.marca ? (
                <Badge variant={barra.bien ? 'success-light' : 'warning-light'} className="shrink-0">
                  {barra.marca}
                </Badge>
              ) : null}
            </span>
            <Text as="span" size="sm" weight="medium" className="shrink-0 tabular-nums">
              {barra.texto}
            </Text>
          </div>
          {barra.detalle ? (
            <Text as="span" variant="muted" size="xs" className="-mt-1 truncate">
              {barra.detalle}
            </Text>
          ) : null}
          {/* Más fina que la de la librería, como en las tarjetas de contenido (diferencias.json › progress-sin-alto-ni-color). */}
          <Progress value={por(barra.valor, tope)} aria-label={`${barra.etiqueta}: ${barra.texto}`} className="**:data-[slot=progress-track]:h-1.5" />
        </li>
      ))}
    </ul>
  )
}

function Bloque({ titulo, descripcion, children }: { titulo: string; descripcion: string; children: ReactNode }) {
  return (
    <section aria-label={titulo}>
      <Frame spacing="sm">
        <FrameHeader>
          <FrameTitle className="flex items-center gap-2">
            <IconoIA />
            {titulo}
          </FrameTitle>
          <FrameDescription className="text-pretty">{descripcion}</FrameDescription>
        </FrameHeader>
        {children}
      </Frame>
    </section>
  )
}

export function Destacados({ resumen }: { resumen: Resumen }) {
  const gente = destacados(activasDe(resumen))
  if (!gente.length) return null
  return (
    <Bloque
      titulo="Candidatos que la IA destaca"
      descripcion="Cumplen casi todo lo que pide su vacante y siguen al principio del proceso. Antes de buscar más gente, mira a estos."
    >
      {/* De a dos en el chat de Orbit; de a cuatro si el contenedor pasa de 896 px. */}
      <FramePanel className="grid gap-4 @md:grid-cols-2 @4xl:grid-cols-4">
        {gente.map(({ c, cumple }, orden) => (
          // Entran una tras otra y se levantan un poco al pasar el cursor.
          <motion.div key={c.id} {...entrada(orden, 10)} whileHover={{ y: -3, transition: { duration: 0.18, ease: CURVA } }}>
            <Card size="sm" className="h-full">
              <CardHeader className="gap-2">
                <EtiquetaIA className="w-fit">
                  Cumple {cumple} de {c.criterios.length}
                </EtiquetaIA>
                <div className="flex min-w-0 flex-col">
                  <Text as="span" weight="medium" className="truncate">
                    {c.candidato.nombre}
                  </Text>
                  <Text as="span" variant="muted" size="sm" className="truncate">
                    {c.candidato.cargo} · {c.candidato.empresa}
                  </Text>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <ul className="flex flex-col gap-1.5" aria-label={`Lo que lee la IA de ${c.candidato.nombre}`}>
                  {c.criterios.slice(0, 3).map((criterio) => (
                    <li key={criterio.requisito} className="flex items-start gap-1.5">
                      <HugeiconsIcon
                        icon={criterio.veredicto === 'cumple' ? CheckmarkCircle02Icon : Cancel01Icon}
                        size={14}
                        aria-hidden="true"
                        className={criterio.veredicto === 'cumple' ? 'mt-0.5 shrink-0 text-success' : 'mt-0.5 shrink-0 text-muted-foreground'}
                      />
                      <Text as="span" size="sm" className="line-clamp-2">
                        {criterio.requisito}
                      </Text>
                    </li>
                  ))}
                </ul>
                <Text as="span" variant="muted" size="xs" className="flex items-center gap-1">
                  <HugeiconsIcon icon={Clock01Icon} size={12} aria-hidden="true" />
                  {dias(c.dias)} en {tituloEtapa(c.etapa)} de {c.vacante.titulo}
                </Text>
              </CardContent>
              <CardFooter className="mt-auto">
                <Button variant="outline" size="sm" nativeButton={false} render={<Link to={`${VACANTES}/${c.vacante.id}?persona=${c.id}`} />}>
                  Ver su ficha
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} aria-hidden="true" />
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </FramePanel>
    </Bloque>
  )
}

export function CalidadVacantes({ resumen }: { resumen: Resumen }) {
  const calidad = calidadPorVacante(activasDe(resumen))
  const mejor = calidad[0]
  const peor = calidad[calidad.length - 1]
  if (!mejor || !peor || mejor === peor) return null
  // Las dos puntas y lo del medio: hasta cinco filas.
  const filas = calidad.length > 5 ? [...calidad.slice(0, 3), ...calidad.slice(-2)] : calidad
  return (
    <Bloque
      titulo="Qué vacantes atraen a la gente indicada"
      descripcion={`En ${mejor.vacante.titulo} el ${mejor.parte} % de los que llegan cumple todo lo que pide; en ${peor.vacante.titulo}, el ${peor.parte} %. Revisar cómo está escrita trae gente más afín.`}
    >
      <FramePanel className="flex flex-col gap-4">
        <Barras
          tope={100}
          barras={filas.map((fila) => ({
            id: fila.vacante.id,
            etiqueta: fila.vacante.titulo,
            detalle: `${fila.cumplen} de ${fila.total} cumplen todo`,
            valor: fila.parte,
            texto: `${fila.parte} %`,
            marca: fila === mejor ? 'La que mejor atrae' : fila === peor ? 'Revisa la publicación' : undefined,
            bien: fila === mejor,
          }))}
        />
        <div>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link to={`${VACANTES}/${peor.vacante.id}`} />}>
            Abrir {peor.vacante.titulo}
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} aria-hidden="true" />
          </Button>
        </div>
      </FramePanel>
    </Bloque>
  )
}

export function EsperaEtapas({ resumen }: { resumen: Resumen }) {
  const etapas = esperaPorEtapa(activasDe(resumen))
  const lenta = etapas[0]
  const rapida = etapas[etapas.length - 1]
  if (!lenta || !rapida || lenta === rapida) return null
  return (
    <Bloque
      titulo="Dónde espera más la gente"
      descripcion={`En ${lenta.titulo} la gente lleva ${dias(lenta.promedio)} en promedio; en ${rapida.titulo}, ${dias(rapida.promedio)}. Mover primero a quien más lleva es lo que más gente salva.`}
    >
      <FramePanel className="flex flex-col gap-4">
        <Barras
          tope={Math.max(lenta.promedio, 1)}
          barras={etapas.map((etapa) => ({
            id: etapa.titulo,
            etiqueta: etapa.titulo,
            detalle: `${etapa.gente} ${etapa.gente === 1 ? 'persona' : 'personas'} ahí`,
            valor: etapa.promedio,
            texto: dias(etapa.promedio),
            marca: etapa === lenta ? 'La más lenta' : undefined,
          }))}
        />
        <div>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link to={VACANTES} />}>
            Ir a Vacantes
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} aria-hidden="true" />
          </Button>
        </div>
      </FramePanel>
    </Bloque>
  )
}
