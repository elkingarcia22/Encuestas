import { useMemo, type MouseEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert02Icon,
  ArrowRight01Icon,
  Delete02Icon,
  Download04Icon,
  Mail01Icon,
  MailBlock01Icon,
  MoreHorizontalIcon,
  PlusSignIcon,
  Tag01Icon,
  UserMultipleIcon,
  UserSharingIcon,
} from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  FramePanel,
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Text,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { Marco } from '../../vacantes/detalle/candidato/components/piezas'
import { CANDIDATURAS, VACANTES_UI, VEREDICTO_TEXTO, type Candidatura, type VacanteUI } from '../datos'
import { ETIQUETAS_PERSONA, hace, type EstadoProceso, type Persona, type Proceso } from '../personas'
import { perfilDePersona } from '../perfil-candidato'
import { cupoEn, etiquetar, type Ajuste, type PersonaViva } from '../base'
import { PerfilCandidato } from './perfil-candidato'
import { COLOR_ICONO, ICONO } from './requisitos-persona'
import type { Base } from './use-base'

// La ficha de alguien de la base global («Mis candidatos») y lo que se le hace desde ella. La usan las tres
// exploraciones con la capa común (`use-base.tsx`); la página vieja (`base-candidatos.tsx`) todavía la usa sin ella.

const BADGE_PROCESO: Record<EstadoProceso, 'info-light' | 'success-light' | 'destructive-outline'> = {
  'En proceso': 'info-light',
  Contratado: 'success-light',
  // `destructive-light` queda blanco sobre rosa en el tema claro; el contorno sí se lee.
  Descartado: 'destructive-outline',
}

// Con la capa común llega la persona al día (`vivos`: lo que se movió en las vacantes); sin ella, sus procesos tal cual.
type PersonaDeLaBase = Persona & Partial<Pick<PersonaViva, 'vivos' | 'duplicadoDe' | 'ajuste'>>
const procesosDe = (persona: PersonaDeLaBase): Proceso[] => persona.vivos ?? persona.procesos

// Hace cuántos días se le escribió: el texto solo cambia de un día para otro.
const diasDesde = (cuando: number) => Math.floor((Date.now() - cuando) / 86_400_000)

// ── La celda que demuestra que es una sola persona ──
//
// Si alguien está en dos procesos vivos no se parte en dos filas: se dice arriba de los dos enlaces. Cada proceso lleva
// su estado, su etapa y el salto a la vacante, que es lo que resuelve «saber en qué anda».
export function EnQueAnda({ persona, ruta }: { persona: PersonaDeLaBase; ruta: string }) {
  const procesos = procesosDe(persona)
  const vivos = procesos.filter((proceso) => proceso.estado === 'En proceso')

  if (!procesos.length) {
    return (
      <Text as="span" variant="muted" size="sm">
        Libre
      </Text>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-1">
      {vivos.length > 1 ? (
        <Badge variant="info-light" className="w-fit">
          La misma persona en {vivos.length} procesos
        </Badge>
      ) : null}
      {/* Estado y vacante arriba, etapa debajo: los nombres de etapa («Antecedentes judiciales») no caben en la misma
          línea que el de la vacante y se salían de la columna. Dos líneas es además el alto que ya tiene la celda de
          la persona, así que la fila no crece. Si se descartó, la etapa lleva el porqué. */}
      {procesos.map((proceso) => (
        <div key={`${proceso.vacanteId}-${proceso.etapa}`} className="flex min-w-0 flex-col">
          <div className="flex min-w-0 items-center gap-1.5">
            <Badge variant={BADGE_PROCESO[proceso.estado]} className="shrink-0">
              {proceso.estado}
            </Badge>
            <Button
              variant="link"
              size="sm"
              nativeButton={false}
              // `shrink`: el botón de la librería no se encoge, y un nombre largo se montaba sobre la columna de al lado.
              className="h-auto! min-w-0 shrink p-0!"
              render={<Link to={`${ruta}/${proceso.vacanteId}`} />}
              onClick={(evento: MouseEvent) => evento.stopPropagation()}
            >
              <span className="truncate">{proceso.vacante}</span>
            </Button>
          </div>
          <Text as="span" variant="muted" size="xs" className="truncate">
            {proceso.etapa}
            {proceso.estado === 'Descartado' && proceso.motivo ? ` · ${proceso.motivo.toLowerCase()}` : ''}
          </Text>
        </div>
      ))}
    </div>
  )
}

// ── Qué tanto sirve para la vacante con la que se compara ──
//
// Lo mismo que dice la columna de la tabla, abierto: cuántos requisitos cumple, por qué lo dice la IA y cada requisito
// con su veredicto. Termina en la decisión que sigue a leerlo: postularla ahí.
function ParaVacante({ persona, vacante, ajuste, base }: { persona: PersonaViva; vacante: VacanteUI; ajuste: Ajuste; base: Base }) {
  const cupo = cupoEn(persona.vivos, vacante)
  const abierta = vacante.estado === 'Publicada'
  // Corto a propósito: va encima de su perfil y de sus pestañas, que son lo que se viene a leer.
  return (
    <Marco
      titulo={`Para ${vacante.titulo}`}
      ia
      descripcion={ajuste.razones.join(' · ')}
      accion={
        <Badge
          variant={ajuste.cumple === ajuste.total ? 'success-light' : ajuste.cumple * 2 >= ajuste.total ? 'warning-light' : 'outline'}
          size="sm"
          className="shrink-0 tabular-nums"
        >
          Cumple {ajuste.cumple} de {ajuste.total}
        </Badge>
      }
    >
      <FramePanel className="flex flex-col gap-2">
        <ItemGroup className="gap-0!">
          {ajuste.criterios.map((criterio) => (
            <Item key={criterio.requisito} size="xs" className="items-start! px-0!">
              <ItemMedia>
                <HugeiconsIcon icon={ICONO[criterio.veredicto]} size={18} className={COLOR_ICONO[criterio.veredicto]} aria-hidden />
              </ItemMedia>
              <ItemContent className="min-w-0 gap-0!">
                <ItemTitle className="w-full!">{criterio.requisito}</ItemTitle>
                <ItemDescription className="w-full! truncate">
                  {VEREDICTO_TEXTO[criterio.veredicto]} · {criterio.evidencia}
                </ItemDescription>
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {/* Si no puede entrar, se dice por qué en vez de apagar el botón sin explicación. */}
          {cupo.puede && abierta ? (
            <Button variant="outline" size="sm" onClick={() => base.postular([persona], vacante.id)}>
              <HugeiconsIcon icon={UserSharingIcon} size={16} />
              Postular a esta vacante
            </Button>
          ) : (
            <Text as="span" variant="muted" size="sm">
              {abierta ? (cupo.puede ? '' : cupo.texto) : 'La vacante no está publicada: no recibe gente.'}
            </Text>
          )}
        </div>
      </FramePanel>
    </Marco>
  )
}

// ── La ficha de alguien de la base ──
//
// `ficha-persona.tsx` es la ficha de una **candidatura**: vive de los requisitos de una vacante y termina en «Avanzar
// de etapa» y «Rechazar». Aquí la mitad de la base no tiene candidatura (nunca aplicó, o su proceso ya cerró), así que
// esa ficha no encaja: no hay requisitos que abrir ni etapa que avanzar. Por eso esta ficha es propia, con la misma
// forma visual —mismo cuerpo con scroll, mismos bloques y misma barra de decisiones abajo— y la de la candidatura se
// reutiliza tal cual un nivel más adentro, cuando se pulsa «Ver su ajuste» en un proceso vivo.
//
// Es solo el cuerpo: quién es (avatar, nombre, cargo, origen), la X y el pie (`AccionesFicha`) los pone el
// `DrawerShell` del sistema, como en todos los paneles (24 sep, Nicolás: «¿por qué acá no usaste nuestro verdadero
// drawer?»).
//
// Arriba, lo que hay que saber antes de hacer nada con ella: si parece estar dos veces, si pidió no recibir correos, si
// se unió con otra ficha, si ya se le escribió y si anda en varios procesos. Con una vacante comparada, qué tanto sirve.
export function FichaBase({
  persona,
  ruta,
  base,
  onVerCandidatura,
  onEtiqueta,
  quienEs,
}: {
  persona: PersonaDeLaBase
  ruta: string
  // Quién es (cara, nombre, cargo), arriba de todo y con el scroll de la ficha. Solo donde no lo pone un panel: la
  // bandeja de la exploración 1 abre la ficha al lado de la lista, sin `DrawerShell`.
  quienEs?: ReactNode
  // Con la capa común: los avisos traen su acción, se compara con la vacante y las etiquetas se guardan en la base.
  base?: Base
  onVerCandidatura: (candidatura: Candidatura) => void
  // Sin la capa común (la página vieja): la página guarda las etiquetas.
  onEtiqueta?: (etiqueta: string) => void
}) {
  const procesos = procesosDe(persona)
  const vivos = procesos.filter((proceso) => proceso.estado === 'En proceso')
  const viva = base ? (persona as PersonaViva) : null
  // El perfil completo, el mismo de las exploraciones pero sin «Resumen» ni «Etapas»: aquí no hay una vacante
  // concreta. Sale de los procesos al día de la persona, que cambian al postularla o moverla.
  const perfil = useMemo(() => perfilDePersona({ ...persona, procesos }), [persona, procesos])
  const otra = viva?.duplicadoDe ? base?.todas.find((una) => una.id === viva.duplicadoDe) : undefined
  const etiquetas = base ? base.disponibles : ETIQUETAS_PERSONA

  const alternar = (etiqueta: string) => {
    if (!base) return onEtiqueta?.(etiqueta)
    const tiene = persona.etiquetas.includes(etiqueta)
    etiquetar([persona.id], tiene ? [] : [etiqueta], tiene ? [etiqueta] : [])
  }

  return (
    <PerfilCandidato
      perfil={perfil}
      // En la base lo primero que se pregunta es en qué anda: si tiene procesos, abre en su historial.
      pestanaInicial={procesos.length ? 'vacantes' : 'informacion'}
      cabecera={
        <div className="flex flex-col gap-4">
          {quienEs}
          {/* La misma persona dos veces: se une aquí mismo, sin buscar a la otra. */}
          {otra && viva ? (
            <Alert variant="warning">
              <HugeiconsIcon icon={Alert02Icon} size={16} />
              {/* El correo va abajo: el título se corta en una línea y es lo que distingue a las dos. */}
              <AlertTitle>Puede ser la misma persona que {otra.nombre}</AlertTitle>
              <AlertDescription>
                {otra.correo} · mismo nombre y mismo cargo, con otro correo. Al unirlas queda una sola ficha con lo de las dos.
              </AlertDescription>
              <AlertAction>
                <Button variant="outline" size="sm" onClick={() => base?.unir(viva)}>
                  Unir fichas
                </Button>
              </AlertAction>
            </Alert>
          ) : null}

          {persona.noContactar ? (
            <Alert>
              <HugeiconsIcon icon={MailBlock01Icon} size={16} />
              <AlertTitle>Pidió no recibir correos</AlertTitle>
              <AlertDescription>Queda fuera de lo que escribas desde aquí, también de los envíos a varias.</AlertDescription>
            </Alert>
          ) : null}

          {persona.unidaCon ? (
            <Alert variant="info">
              <HugeiconsIcon icon={UserMultipleIcon} size={16} />
              <AlertTitle>Se unió con otra ficha</AlertTitle>
              <AlertDescription>
                {persona.otrosCorreos?.length
                  ? `Correo alterno: ${persona.otrosCorreos.join(', ')}. Se sigue encontrando por él.`
                  : `Se unió con la ficha de ${persona.unidaCon}.`}
              </AlertDescription>
            </Alert>
          ) : null}

          {persona.contacto ? (
            <Alert>
              <HugeiconsIcon icon={Mail01Icon} size={16} />
              <AlertTitle>
                Le escribiste {hace(diasDesde(persona.contacto.cuando))}: «{persona.contacto.asunto}»
              </AlertTitle>
            </Alert>
          ) : null}

          {/* Lo mismo que avisa la ficha de la candidatura, dicho desde el otro lado: no son dos personas. */}
          {vivos.length > 1 ? (
            <Alert variant="info">
              <HugeiconsIcon icon={UserSharingIcon} size={16} />
              <AlertTitle>Está en {vivos.length} procesos a la vez</AlertTitle>
              <AlertDescription>Es un solo registro: lo que corrijas aquí se ve en las dos vacantes.</AlertDescription>
            </Alert>
          ) : null}

          {/* Etiquetas (las carpetas del producto). Se ponen y se quitan en el mismo menú; una nueva, en su ventana. */}
          <div className="flex flex-wrap items-center gap-1.5">
            {persona.etiquetas.length ? (
              persona.etiquetas.map((etiqueta) => (
                <Badge key={etiqueta} variant="secondary">
                  {etiqueta}
                </Badge>
              ))
            ) : (
              <Text as="span" variant="muted" size="sm">
                Sin etiquetas todavía.
              </Text>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="w-fit" />}>
                <HugeiconsIcon icon={Tag01Icon} size={16} />
                Poner o quitar etiquetas
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-72 w-60 overflow-auto">
                {/* Crear va primero: con muchas etiquetas, al final de la lista no se ve sin bajar. */}
                {base && viva ? (
                  <>
                    <DropdownMenuGroup>
                      <DropdownMenuItem onClick={() => base.etiquetar([viva])}>
                        <HugeiconsIcon icon={PlusSignIcon} size={16} />
                        Crear una etiqueta…
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                  </>
                ) : null}
                <DropdownMenuGroup>
                  {/* El nombre del grupo va dentro de DropdownMenuGroup: fuera, Base UI revienta. */}
                  <DropdownMenuLabel>Etiquetas de la empresa</DropdownMenuLabel>
                  {etiquetas.map((etiqueta) => (
                    <DropdownMenuCheckboxItem key={etiqueta} checked={persona.etiquetas.includes(etiqueta)} onCheckedChange={() => alternar(etiqueta)}>
                      {etiqueta}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {base?.paraVacante && viva?.ajuste ? <ParaVacante persona={viva} vacante={base.paraVacante} ajuste={viva.ajuste} base={base} /> : null}
        </div>
      }
      // Al pie de cada vacante del historial: entrar a la candidatura viva («Ver su ajuste», que abre la ficha de la
      // vacante un nivel más adentro) e ir a la vacante.
      accionesPostulacion={(postulacion) => {
        // La candidatura solo existe mientras el proceso está vivo; la de un proceso cerrado ya no se guarda.
        const candidatura =
          base && viva && postulacion.vacanteId
            ? base.candidaturaDe(viva, postulacion.vacanteId)
            : postulacion.candidaturaId
              ? CANDIDATURAS.find((una) => una.id === postulacion.candidaturaId)
              : undefined
        const vacante = postulacion.vacanteId ? VACANTES_UI.find((una) => una.id === postulacion.vacanteId) : undefined
        return (
          <>
            {candidatura ? (
              <Button variant="outline" size="sm" onClick={() => onVerCandidatura(candidatura)}>
                <IconoIA />
                Ver su ajuste
              </Button>
            ) : null}
            {vacante ? (
              <Button variant="outline" size="sm" nativeButton={false} render={<Link to={`${ruta}/${vacante.id}`} />}>
                Ir a la vacante
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
              </Button>
            ) : null}
          </>
        )
      }}
    />
  )
}

// ── El pie de la ficha ──
//
// La decisión de esta pantalla, siempre a la vista: meterla en una vacante. Al lado, las etiquetas (lo que más se toca
// después) y lo ocasional en «⋯», que va primero, a la izquierda de todo, como en todas las cabeceras y pies del
// proyecto (25 sep: «⋯» · terciario · secundario · primario).
export function AccionesFicha({ persona, base }: { persona: PersonaViva; base: Base }) {
  return (
    <>
      <DropdownMenu>
        <Hint label="Más acciones" side="top">
          <DropdownMenuTrigger render={<BotonIcono size="icon" aria-label={`Más acciones con ${persona.nombre}`} />}>
            <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
          </DropdownMenuTrigger>
        </Hint>
        <DropdownMenuContent side="top" align="start" className="w-60">
          <DropdownMenuGroup>
            {/* Apagado y con el porqué: si se escondiera, parecería que falta. */}
            <DropdownMenuItem disabled={persona.noContactar} onClick={() => base.escribir([persona])}>
              <HugeiconsIcon icon={Mail01Icon} size={16} />
              <span className="flex flex-col">
                Escribirle
                {persona.noContactar ? (
                  <Text as="span" variant="muted" size="xs">
                    Pidió no recibir correos
                  </Text>
                ) : null}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => base.exportar([persona])}>
              <HugeiconsIcon icon={Download04Icon} size={16} />
              Exportar a CSV
            </DropdownMenuItem>
            {persona.duplicadoDe ? (
              <DropdownMenuItem onClick={() => base.unir(persona)}>
                <HugeiconsIcon icon={UserMultipleIcon} size={16} />
                Unir fichas
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem variant="destructive" onClick={() => base.eliminar([persona])}>
              <HugeiconsIcon icon={Delete02Icon} size={16} />
              Eliminar sus datos
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button variant="outline" onClick={() => base.etiquetar([persona])}>
        <HugeiconsIcon icon={Tag01Icon} size={16} />
        Etiquetas
      </Button>
      <Button onClick={() => base.postular([persona])}>
        <HugeiconsIcon icon={UserSharingIcon} size={16} />
        Postular a una vacante
      </Button>
    </>
  )
}
