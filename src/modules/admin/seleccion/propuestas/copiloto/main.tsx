import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, ArrowRight01Icon, Cancel01Icon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  Button,
  Card,
  CardContent,
  Drawer,
  DrawerContent,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Separator,
  Text,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { Orb } from '@/shared/components/Orb'
import { notify, notifyAction } from '@/shared/components/notify'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { ETAPAS } from '../../vacantes/detalle/components/data'
import { CANDIDATURAS, ESPERA_RESPUESTA, VEREDICTO_BADGE, VEREDICTO_TEXTO, cumplidosDe, type Candidatura , tituloEtapa } from '../datos'
import { DialogoRechazo } from '../components/dialogo-rechazo'
import { FichaPersona } from '../components/ficha-persona'

// Propuesta 3 · Copiloto de selección.
//
// La pantalla abre con las decisiones del día, ya ordenadas por la IA y con su porqué a la vista: cumple tantos
// requisitos, esto le falta, lleva tantos días esperando. Dos botones por persona y a la siguiente.
//
// La IA ordena y explica; nunca decide sola (es la regla de Ashby, que marca cada criterio pero no autorrechaza).
// El resto del proceso sigue ahí, a un clic: esta pantalla solo elige por dónde empezar.

const siguiente = (etapa: string): string | null => {
  const indice = ETAPAS.findIndex((e) => e.id === etapa)
  return indice >= 0 && indice < ETAPAS.length - 1 ? ETAPAS[indice + 1].id : null
}

// Por qué esta persona necesita una decisión hoy, en una frase que se pueda discutir.
function porque(candidatura: Candidatura): string {
  const { criterios, candidato, dias } = candidatura
  const cumple = cumplidosDe(criterios)
  const medias = criterios.filter((c) => c.veredicto === 'parcial').length
  const cuenta =
    cumple === 0 && medias
      ? `Ningún requisito completo y ${medias} a medias`
      : `Cumple ${cumple} de ${criterios.length} requisitos${medias ? ` y ${medias} a medias` : ''}`

  const noCumple = criterios.find((c) => c.veredicto === 'no-cumple')
  const porValidar = criterios.find((c) => c.veredicto === 'por-validar')
  const pega = noCumple
    ? `; no cumple ${noCumple.requisito.toLowerCase()}`
    : porValidar
      ? `; falta confirmar ${porValidar.requisito.toLowerCase()}`
      : ''

  const serena = candidato.serena ? ` Serena AI le dio ${candidato.serena} de 100.` : ''
  const espera = candidato.accion ? ` ${candidato.accion}.` : ` Lleva ${dias} ${dias === 1 ? 'día' : 'días'} sin moverse.`
  return `${cuenta}${pega}.${serena}${espera}`
}

export function Component() {
  const [lista, setLista] = useState<Candidatura[]>(CANDIDATURAS)
  const [hechas, setHechas] = useState<string[]>([])
  const [abiertaId, setAbiertaId] = useState<string | null>(null)
  const [rechazando, setRechazando] = useState<Candidatura[] | null>(null)

  // La cola del día: lo que espera respuesta o lleva tiempo parado, lo más urgente arriba.
  const cola = useMemo(
    () =>
      lista
        .filter((c) => !hechas.includes(c.id))
        .filter((c) => ESPERA_RESPUESTA(c) || c.dias >= 4)
        .sort((a, b) => Number(ESPERA_RESPUESTA(b)) - Number(ESPERA_RESPUESTA(a)) || b.dias - a.dias),
    [lista, hechas],
  )

  const abierta = lista.find((c) => c.id === abiertaId) ?? null

  const avanzar = (candidatura: Candidatura) => {
    const destino = siguiente(candidatura.etapa)
    if (!destino) return
    setLista((actual) => actual.map((c) => (c.id === candidatura.id ? { ...c, etapa: destino, dias: 0 } : c)))
    setHechas((actuales) => [...actuales, candidatura.id])
    notifyAction(`${candidatura.candidato.nombre} pasó a ${tituloEtapa(destino)}`, undefined, {
      label: 'Deshacer',
      onClick: () => {
        setLista((actual) => actual.map((c) => (c.id === candidatura.id ? { ...c, etapa: candidatura.etapa, dias: candidatura.dias } : c)))
        setHechas((actuales) => actuales.filter((id) => id !== candidatura.id))
      },
    })
  }

  const rechazar = (motivo: string, avisar: boolean) => {
    const ids = (rechazando ?? []).map((c) => c.id)
    setLista((actual) => actual.filter((c) => !ids.includes(c.id)))
    notify(`${rechazando?.[0].candidato.nombre} quedó rechazado`, `${motivo}. ${avisar ? 'El correo ya salió.' : 'Sin correo.'}`)
    setRechazando(null)
    setAbiertaId(null)
  }

  return (
    <PageShell>
      <PageHeader
        breadcrumbs={[
          { label: 'Inicio', path: '/admin' },
          { label: 'Selección', path: '/admin/seleccion/vacantes' },
          { label: 'Hoy' },
        ]}
        media={<Orb className="size-10" />}
        title={cola.length ? `Hoy necesitas decidir ${cola.length} ${cola.length === 1 ? 'cosa' : 'cosas'}` : 'Estás al día'}
        description="Revisé a las personas en proceso de tus tres vacantes. Estas son las que no pueden seguir esperando; el resto sigue su curso."
      />

      <PageContent>
        {cola.length ? (
          <div className="flex flex-col gap-3">
            {cola.map((candidatura) => {
              const destino = siguiente(candidatura.etapa)
              return (
                <Card key={candidatura.id} className="gap-0! py-0!">
                  <CardContent className="flex flex-col gap-4 p-5!">
                    <div className="flex flex-wrap items-start gap-3">
                      <Avatar size="lg">
                        <AvatarFallback>{candidatura.candidato.iniciales}</AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <Text as="span" size="lg" weight="medium">
                            {candidatura.candidato.nombre}
                          </Text>
                          <Badge variant="secondary">
                            {candidatura.vacante.titulo}
                          </Badge>
                          <Badge variant="outline">
                            {tituloEtapa(candidatura.etapa)}
                          </Badge>
                          {ESPERA_RESPUESTA(candidatura) ? (
                            <Badge variant="warning-light">
                              <HugeiconsIcon icon={Alert02Icon} size={12} />
                              Espera respuesta
                            </Badge>
                          ) : null}
                        </span>
                        <Text as="p" variant="muted" size="sm">
                          {candidatura.candidato.cargo} · {candidatura.candidato.empresa}
                        </Text>
                      </div>
                    </div>

                    {/* El porqué: lo que la IA vio, con las palabras de la vacante. Lo marca el orbe, no una chispa (auditoría, 5-oct). */}
                    <div className="flex items-start gap-2.5 rounded-lg bg-muted p-3.5">
                      <IconoIA className="mt-0.5 shrink-0" />
                      <Text as="p" size="sm" className="min-w-0 flex-1">
                        {porque(candidatura)}
                      </Text>
                    </div>

                    {/* Los requisitos, para poder discutir la propuesta */}
                    <div className="flex flex-wrap gap-1.5">
                      {candidatura.criterios.map((criterio) => (
                        <Badge key={criterio.requisito} variant={VEREDICTO_BADGE[criterio.veredicto]}>
                          {criterio.requisito.length > 34 ? `${criterio.requisito.slice(0, 34)}…` : criterio.requisito} ·{' '}
                          {VEREDICTO_TEXTO[criterio.veredicto]}
                        </Badge>
                      ))}
                    </div>

                    <Separator />

                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="ghost" size="sm" className="mr-auto text-muted-foreground!" onClick={() => setAbiertaId(candidatura.id)}>
                        Ver todo de {candidatura.candidato.nombre.split(' ')[0]}
                      </Button>
                      <Button variant="outline" onClick={() => setRechazando([candidatura])}>
                        <HugeiconsIcon icon={Cancel01Icon} size={16} />
                        Descartar
                      </Button>
                      {destino ? (
                        <Button onClick={() => avanzar(candidatura)}>
                          Pasar a {tituloEtapa(destino)}
                          <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                        </Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} />
              </EmptyMedia>
              <EmptyTitle>Nada pendiente por hoy</EmptyTitle>
              <EmptyDescription>
                Lo que sigue en proceso no necesita tu decisión todavía. Te aviso cuando alguien lleve más de cuatro días
                esperando.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {/* Lo que sigue su curso, plegado: el proceso completo nunca desaparece */}
        {hechas.length ? (
          <div className="flex flex-col gap-2">
            <Text as="div" weight="medium">
              Decidido hoy
            </Text>
            <ItemGroup className="gap-1.5!">
              {lista
                .filter((c) => hechas.includes(c.id))
                .map((candidatura) => (
                  <Item key={candidatura.id} variant="muted" size="sm">
                    <ItemMedia variant="icon">
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="text-success" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{candidatura.candidato.nombre}</ItemTitle>
                      <ItemDescription>
                        {candidatura.vacante.titulo} · ahora en {tituloEtapa(candidatura.etapa)}
                      </ItemDescription>
                    </ItemContent>
                  </Item>
                ))}
            </ItemGroup>
          </div>
        ) : null}
      </PageContent>

      <Drawer open={abierta !== null} onOpenChange={(abiertoAhora) => !abiertoAhora && setAbiertaId(null)}>
        <DrawerContent className="w-[min(34rem,100vw)]!">
          {abierta ? (
            <FichaPersona
              candidatura={abierta}
              onAvanzar={() => {
                avanzar(abierta)
                setAbiertaId(null)
              }}
              onRechazar={() => setRechazando([abierta])}
              onIrA={(id) => setAbiertaId(id)}
            />
          ) : null}
        </DrawerContent>
      </Drawer>

      {rechazando?.length ? (
        <DialogoRechazo
          key={rechazando.map((c) => c.id).join()}
          abierto
          onOpenChange={(abiertoAhora) => setRechazando(abiertoAhora ? rechazando : null)}
          pedido={{ id: 0, candidaturas: rechazando }}
          vacante={rechazando[0].vacante}
          lista={lista}
          onConfirmar={(decision) => rechazar(decision.motivo, Boolean(decision.correo))}
        />
      ) : null}
    </PageShell>
  )
}

Component.displayName = 'SeleccionCopilotoPage'
