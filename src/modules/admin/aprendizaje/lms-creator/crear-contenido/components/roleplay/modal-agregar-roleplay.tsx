import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarImage,
  Button,
  Field,
  FieldDescription,
  FieldLabel,
  Heading,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  Text,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { BotonIa } from '@/shared/components/BotonIa'
import { Orb } from '@/shared/components/Orb'
import { Composer } from '@/modules/admin/suite-ai/shared/composer'
import { useTemporizadores } from '@/modules/design-system/estados/temporizadores'
import { MenuIdeas } from '../../../compartido/menu-ideas'
import { BASE_LMS, confirmarRecurso, setBorrador } from '../borrador'
import { listarRoleplays, type RoleplayGuardado } from './biblioteca'
import { DURACION_GENERAR_MS, IDEAS_EJEMPLO, proponerRoleplay } from './ia'
import { LIMITES, roleplayVacio } from './modelo'

// **La puerta del evaluador roleplay.** La misma de los otros recursos de IA: se escribe la idea y la IA arma todo, o
// se toma algo que ya existe en «Tus roleplays». Detrás va el **paso a paso con su resumen**, que es lo amigable de
// esta experiencia; esta puerta nació en la propuesta v2 y las dos se fusionaron el 7-oct.
//
// Qué cambia frente a la puerta anterior (Dave, 6 y 7-oct):
// - **Hay biblioteca.** Antes el roleplay era el único recurso de IA sin dónde retomar un borrador ni reusar uno ya
//   hecho; video y presentación sí lo tenían, y la experiencia se sentía distinta sin motivo.
// - **La puerta no configura nada.** Modo, duración y voz vivían aquí y volvían a aparecer en el formulario; eso
//   hacía que el modal se leyera como un paso más. Aquí solo se elige **por dónde empezar**.
// - **La IA propone aquí** y el formulario abre lleno, con su insignia junto al título.
//
// Va en ActionDialog, la ventana de contenido del sistema (acuerdo del 6-oct), en «wide» como «Agregar video», y con el
// botón de IA del sistema (BotonIa, el único primario de IA desde el 5-oct).

/**
 * Una fila por roleplay, no la tarjeta con portada de «Tus videos»: un roleplay **no tiene miniatura** que enseñar
 * —solo el orbe—, así que la portada 16:9 gastaba 170 px de alto para pintar un icono. En la pantalla de 1366 × 610 de
 * nuestros usuarios eso obligaba a desplazarse dentro del modal para llegar a lo que importa (Dave, 7-oct).
 */
function TarjetaRoleplay({ item, onElegir }: { item: RoleplayGuardado; onElegir: (item: RoleplayGuardado) => void }) {
  const borrador = item.estado === 'borrador'
  return (
    <Item size="sm" variant="outline" render={<button type="button" />} className="w-full text-left" onClick={() => onElegir(item)}>
      <ItemMedia className="self-center!">
        {item.cfg.imagen ? (
          <Avatar size="sm">
            <AvatarImage src={item.cfg.imagen} alt="" />
          </Avatar>
        ) : (
          <Orb className="size-8" />
        )}
      </ItemMedia>
      <ItemContent className="min-w-0">
        <ItemTitle className="w-full">
          <span className="line-clamp-1 min-w-0">{item.titulo}</span>
        </ItemTitle>
        <ItemDescription className="line-clamp-1">{item.personaje}</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Badge variant={borrador ? 'info-light' : 'success-light'} size="sm">
          {borrador ? 'Borrador' : 'Listo'}
        </Badge>
      </ItemActions>
    </Item>
  )
}

type Props = {
  abierto: boolean
  onCerrar: () => void
  /** «Volver» a «Agregar página»; sin él no se muestra la flecha. */
  onVolver?: () => void
  /** Se reusó un roleplay ya armado y la página quedó creada. */
  onListo: (paginaId: string) => void
}

export function ModalAgregarRoleplay({ abierto, onCerrar, onVolver, onListo }: Props) {
  const navigate = useNavigate()
  const programar = useTemporizadores()
  const [idea, setIdea] = useState('')
  const [todos, setTodos] = useState(false)
  const [generando, setGenerando] = useState(false)
  const [guardados, setGuardados] = useState<RoleplayGuardado[]>([])

  // Cada vez que abre parte limpio y vuelve a leer la biblioteca: pudo haberse guardado un borrador desde el editor.
  useEffect(() => {
    if (!abierto) return
    setIdea('')
    setTodos(false)
    setGenerando(false)
    setGuardados(listarRoleplays())
  }, [abierto])

  /** Deja lo que haya que sembrar y abre el formulario que toque. */
  const irAlEditor = (propuesta: { conIA: boolean; idea?: string; guardadoId?: string; cfg?: ReturnType<typeof roleplayVacio> }) => {
    setBorrador({
      roleplayPropuesto: { cfg: propuesta.cfg ?? roleplayVacio(), conIA: propuesta.conIA, idea: propuesta.idea, guardadoId: propuesta.guardadoId },
    })
    navigate(`${BASE_LMS}/agregar-roleplay`)
  }

  const crearConIA = () => {
    const limpia = idea.trim()
    if (!limpia || generando) return
    // La IA propone **aquí** y el paso a paso abre lleno, como hacía el setup anterior.
    setGenerando(true)
    programar(() => irAlEditor({ conIA: true, idea: limpia, cfg: proponerRoleplay(limpia, roleplayVacio(), 'evaluacion') }), DURACION_GENERAR_MS)
  }

  const elegirGuardado = (item: RoleplayGuardado) => {
    // Un borrador se retoma donde quedó; uno listo se reusa tal cual y la página nace de una vez.
    if (item.estado === 'borrador') {
      irAlEditor({ conIA: false, cfg: item.cfg, guardadoId: item.propio ? item.id : undefined })
      return
    }
    onListo(confirmarRecurso({ tipo: 'roleplay', roleplay: item.cfg, generadoConIA: true }, item.cfg.titulo))
  }

  const recientes = guardados.slice(0, 3)

  return (
    <ActionDialog
      open={abierto}
      onOpenChange={(v) => !v && onCerrar()}
      size="wide"
      className="max-h-[min(650px,calc(100svh-2rem))]!"
      title={todos ? 'Tus roleplays' : 'Agregar evaluador roleplay'}
      sub="Cuéntale a la IA qué quieres que practiquen, o parte de uno que ya tengas: un borrador se retoma donde lo dejaste y uno listo se copia en esta página."
      onBack={todos ? () => setTodos(false) : onVolver}
      dismissible={false}
      hideFooter={todos}
      footer={
        <>
          {/* Secundario y no un enlace: es una de las dos vías, no una salida de emergencia. */}
          <Button variant="outline" disabled={generando} onClick={() => irAlEditor({ conIA: false })}>
            Empezar en blanco
          </Button>
          <BotonIa disabled={!idea.trim() || generando} onClick={crearConIA}>
            {generando ? 'Generando' : 'Crear con IA'}
          </BotonIa>
        </>
      }
    >
      {todos ? (
        <div className="flex w-full flex-col gap-4">
          <Text size="sm" variant="muted">
            {guardados.length} roleplays en tu biblioteca
          </Text>
          <div className="flex flex-col gap-2">
            {guardados.map((item) => (
              <TarjetaRoleplay key={item.id} item={item} onElegir={elegirGuardado} />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex w-full flex-col gap-4">
          <Field>
            <div className="flex items-center justify-between gap-2">
              {/* Sin insignia de obligatorio: la idea solo hace falta si se quiere la propuesta de la IA. */}
              <FieldLabel>Idea del roleplay</FieldLabel>
              <MenuIdeas ideas={IDEAS_EJEMPLO} onElegir={(texto: string) => setIdea(texto)} />
            </div>
            {/* La caja para escribirle a la IA es la del chat de Suite AI; se genera desde el pie. */}
            <Composer
              value={idea}
              onChange={(v) => setIdea(v.slice(0, LIMITES.escenario))}
              onSend={crearConIA}
              onVoice={() => undefined}
              ariaLabel="Idea del roleplay"
              placeholder="Ej. Que aprendan a responder preguntas difíciles en una reunión de seguimiento, sin divagar."
              rows={2}
              attach={false}
              voice={false}
              action={null}
            />
            <FieldDescription>La IA arma el escenario, el personaje y los objetivos; tú ajustas lo que quieras.</FieldDescription>
          </Field>

          <section className="flex flex-col gap-3" aria-labelledby="roleplays-recientes">
            <div className="flex items-center justify-between gap-3">
              <Heading as="h4" level={6} id="roleplays-recientes">
                Tus roleplays
              </Heading>
              <Button variant="ghost" size="xs" onClick={() => setTodos(true)}>
                Ver todos
                <HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" aria-hidden="true" />
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              {recientes.map((item) => (
                <TarjetaRoleplay key={item.id} item={item} onElegir={elegirGuardado} />
              ))}
            </div>
          </section>
        </div>
      )}
    </ActionDialog>
  )
}
