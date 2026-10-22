import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowDown01Icon,
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  File01Icon,
  HelpCircleIcon,
  RemoveCircleIcon,
  Undo02Icon,
} from '@hugeicons/core-free-icons'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  Text,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { FramePanel } from '@ubits/flux-ui'
import { Marco } from '@/modules/design-system/patrones/ficha'
import { VEREDICTO_BADGE, VEREDICTO_TEXTO, type Criterio, type Veredicto } from '../datos'

// Los requisitos de la vacante frente a la hoja de vida de una persona: qué concluyó la IA, de dónde lo sacó y
// cómo corregirlo.
//
// Antes era un acordeón cerrado («Cumple 0 de 4» con una barra al 25 %, porque la barra contaba los «a medias» y el
// texto no) y, al abrirlo, cuatro renglones grises con un chulo y una equis sin nombre que no decían qué estaba
// marcado. Nicolás (22 sep): «ni se entiende, y es de lo más importante que hay dentro». Ahora:
//
// - Siempre abierto. Es la razón para avanzar o rechazar a alguien; esconderlo detrás de un clic lo volvía decorado.
// - El resumen cuenta los cuatro veredictos por su nombre, sin barra: una barra obliga a decidir cuánto vale «a
//   medias», y cualquier respuesta contradice a alguien.
// - Cada requisito lleva su veredicto como icono a la izquierda, que es lo primero que se lee al bajar la vista.
// - La evidencia se parte en lo que se concluyó y de dónde salió (el cargo y la empresa de la hoja de vida).
// - Corregir es cambiar el veredicto desde el propio veredicto: un menú con las cuatro opciones y qué significa
//   cada una. Lo corregido a mano se marca y se puede deshacer.

export const ORDEN: Veredicto[] = ['cumple', 'parcial', 'por-validar', 'no-cumple']

export const ICONO: Record<Veredicto, typeof CheckmarkCircle02Icon> = {
  cumple: CheckmarkCircle02Icon,
  parcial: RemoveCircleIcon,
  'por-validar': HelpCircleIcon,
  'no-cumple': CancelCircleIcon,
}

// El ámbar de texto es `warning-foreground`: `warning` es relleno y no llega a contraste sobre blanco.
export const COLOR_ICONO: Record<Veredicto, string> = {
  cumple: 'text-success',
  parcial: 'text-warning-foreground',
  'por-validar': 'text-muted-foreground',
  'no-cumple': 'text-destructive',
}

// Cómo se cuenta cada veredicto en el resumen: «2 a medias», no «2 cumple a medias».
export const EN_RESUMEN: Record<Veredicto, (cuantos: number) => string> = {
  cumple: (n) => `${n} ${n === 1 ? 'cumple' : 'cumplen'}`,
  parcial: (n) => `${n} a medias`,
  'por-validar': (n) => `${n} por validar`,
  'no-cumple': (n) => `${n} no ${n === 1 ? 'cumple' : 'cumplen'}`,
}

export const QUE_SIGNIFICA: Record<Veredicto, string> = {
  cumple: 'Hay evidencia clara en el CV',
  parcial: 'Lo menciona, pero sin detalle suficiente',
  'por-validar': 'No hay dato; se pregunta en la entrevista',
  'no-cumple': 'No lo tiene o lo contradice',
}

// «Lo menciona pero sin detalle · Analista de inventarios en Éxito (2024 – hoy)»: lo que se concluyó y la fuente.
export function partirEvidencia(evidencia: string) {
  const [conclusion, ...fuente] = evidencia.split(' · ')
  return { conclusion, fuente: fuente.join(' · ') }
}

export type CorreccionVista = { quien: string; cuando: string; motivo?: string }

export function RequisitosPersona({
  criterios,
  iniciales,
  onCambiar,
  origen,
  autores,
  conEntrevista = false,
}: {
  // Si ya presentó la entrevista con la IA, la lectura la usa; si no, solo la hoja de vida (CA-52).
  conEntrevista?: boolean
  // Quién corrigió cada requisito, cuándo y por qué (CA-35), por su posición.
  autores?: Map<number, CorreccionVista>
  criterios: Criterio[]
  // Lo que propuso la IA: con ello se sabe qué corrigió el equipo y a qué se vuelve al deshacer.
  iniciales: Criterio[]
  onCambiar: (indice: number, veredicto: Veredicto) => void
  // De qué etapa sale, «Evaluación CV (etapa 1)»: lo leyó la IA en esa etapa (29 sep, reunión con Elkin: que se sepa de
  // dónde viene aunque la persona ya esté en otra).
  origen?: string
}) {
  const cuenta = ORDEN.map((veredicto) => ({
    veredicto,
    cuantos: criterios.filter((c) => c.veredicto === veredicto).length,
  })).filter((grupo) => grupo.cuantos)
  const corregidos = criterios.filter((c, i) => c.veredicto !== iniciales[i]?.veredicto).length

  // Un bloque como los de las demás pestañas de la ficha (25 sep, Nicolás: el resumen «se ve horrible»): el título con
  // el orbe, porque lo leyó la IA; el conteo a la derecha y un requisito por tarjeta, con su veredicto a la derecha,
  // que es el mismo control que lo corrige.
  return (
    <Marco
      titulo="Cómo cumple los requisitos"
      ia
      descripcion={
        corregidos
          ? `Lo propuso la IA; el equipo corrigió ${corregidos} ${corregidos === 1 ? 'requisito' : 'requisitos'}.`
          : `${origen ? `Lo leyó la IA en ${origen}` : 'Lo propuso la IA'}, con su CV${conEntrevista ? ' y la entrevista' : ''}. Si no estás de acuerdo, cambia el veredicto.`
      }
      accion={
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
          {cuenta.map(({ veredicto, cuantos }) => (
            <Badge key={veredicto} variant={VEREDICTO_BADGE[veredicto]} className="tabular-nums">
              {EN_RESUMEN[veredicto](cuantos)}
            </Badge>
          ))}
        </div>
      }
    >
      {criterios.map((criterio, indice) => {
        const { conclusion, fuente } = partirEvidencia(criterio.evidencia)
        const original = iniciales[indice]?.veredicto
        const corregido = original !== undefined && criterio.veredicto !== original
        return (
          <FramePanel key={criterio.requisito} className="p-0!">
            <Item size="sm" className="items-start!">
              <ItemMedia>
                <HugeiconsIcon
                  icon={ICONO[criterio.veredicto]}
                  size={20}
                  className={COLOR_ICONO[criterio.veredicto]}
                  aria-hidden
                />
              </ItemMedia>

              <ItemContent className="gap-1!">
                <ItemTitle className="w-full!">{criterio.requisito}</ItemTitle>
                <ItemDescription className="w-full!">{conclusion}</ItemDescription>
                {fuente ? (
                  <Text as="span" variant="muted" size="xs" className="flex items-center gap-1">
                    <HugeiconsIcon icon={File01Icon} size={12} aria-hidden className="shrink-0" />
                    <span className="min-w-0 truncate">{fuente}</span>
                  </Text>
                ) : null}
                {corregido ? (
                  <span className="flex flex-col gap-0.5">
                    <span className="flex flex-wrap items-center gap-x-2">
                      <Text as="span" variant="muted" size="xs">
                        {autores?.get(indice)
                          ? `Lo corrigió ${autores.get(indice)?.quien}, ${autores.get(indice)?.cuando}`
                          : 'Corregido por el equipo'}{' '}
                        · la IA decía «{VEREDICTO_TEXTO[original].toLowerCase()}»
                      </Text>
                      <Button variant="link" size="xs" className="h-auto! p-0!" onClick={() => onCambiar(indice, original)}>
                        <HugeiconsIcon icon={Undo02Icon} size={12} />
                        Volver a lo de la IA
                      </Button>
                    </span>
                    {autores?.get(indice)?.motivo ? (
                      <Text as="span" size="xs">
                        «{autores.get(indice)?.motivo}»
                      </Text>
                    ) : null}
                  </span>
                ) : null}
              </ItemContent>

              {/* El veredicto es también el control para corregirlo: se ve qué hay marcado y se cambia ahí mismo. */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      size="xs"
                      className="shrink-0"
                      aria-label={`${criterio.requisito}: ${VEREDICTO_TEXTO[criterio.veredicto]}. Cambiar`}
                    >
                      {VEREDICTO_TEXTO[criterio.veredicto]}
                      <HugeiconsIcon icon={ArrowDown01Icon} size={12} />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>¿Cumple este requisito?</DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                      value={criterio.veredicto}
                      onValueChange={(valor) => onCambiar(indice, valor as Veredicto)}
                    >
                      {ORDEN.map((veredicto) => (
                        <DropdownMenuRadioItem key={veredicto} value={veredicto} closeOnClick className="items-start!">
                          <HugeiconsIcon icon={ICONO[veredicto]} size={16} className={`mt-0.5 ${COLOR_ICONO[veredicto]}`} />
                          <span className="flex flex-col">
                            <span>{VEREDICTO_TEXTO[veredicto]}</span>
                            <Text as="span" variant="muted" size="xs">
                              {QUE_SIGNIFICA[veredicto]}
                            </Text>
                          </span>
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </Item>
          </FramePanel>
        )
      })}
    </Marco>
  )
}
