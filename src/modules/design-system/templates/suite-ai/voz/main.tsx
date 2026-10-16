import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { AudioWave01Icon, ChartLineData01Icon, LeftToRightListBulletIcon, Mic01Icon, PauseIcon, PlayIcon, StopIcon } from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  cn,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Heading,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  Progress,
  Separator,
  Text,
  toast,
} from '@ubits/flux-ui'
import { Orb } from '@/shared/components/Orb'

import { PREGUNTA_VOZ, TURNOS, ruta } from '../components/data'
import { useSuite } from '../components/estado'
import { LogoEmpresa, MensajeAgente } from '../components/piezas'

// Caso 04 del concepto: el modo voz. Pantalla completa y oscura (la clase «dark» cambia los
// tokens solo aquí), la bolita de IA grande, la pregunta dicha y la respuesta con acciones.

export function Component() {
  const suite = useSuite()
  const navigate = useNavigate()
  const [escuchando, setEscuchando] = useState(true)
  const [segundos, setSegundos] = useState(12)
  const [detalle, setDetalle] = useState(false)

  useEffect(() => {
    if (!escuchando) return
    const reloj = window.setInterval(() => setSegundos((s) => s + 1), 1000)
    return () => window.clearInterval(reloj)
  }, [escuchando])

  const alternar = () => {
    setEscuchando((e) => !e)
    toast.add({ title: escuchando ? 'Micrófono en pausa' : 'Te escucho' })
  }
  const tiempo = `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`

  return (
    <div className="dark bg-background text-foreground fixed inset-0 z-50 flex flex-col overflow-auto">
      <header className="flex shrink-0 items-center gap-3 px-6 py-4">
        <LogoEmpresa />
        <Separator orientation="vertical" className="h-4" />
        <Text as="span" weight="medium">
          Orbit Flow
        </Text>
        <Badge variant={escuchando ? 'destructive-outline' : 'outline'} size="sm">
          {escuchando ? 'Modo voz activo' : 'Micrófono en pausa'}
        </Badge>
        <Button variant="outline" size="sm" className="ml-auto" onClick={() => navigate(ruta('chat'))}>
          Volver al chat
        </Button>
      </header>
      <Separator />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-8 px-6 py-12">
        <div className="flex flex-col items-center gap-4">
          <Orb className="size-44" />
          <HugeiconsIcon
            icon={AudioWave01Icon}
            aria-hidden="true"
            className={cn('text-muted-foreground size-8', escuchando && 'animate-pulse')}
          />
        </div>

        <Heading as="h1" level={2} className="text-center">
          «{PREGUNTA_VOZ}»
        </Heading>

        <div className="w-full max-w-2xl">
          <MensajeAgente>
            <Text variant="muted">
              Ventas Bogotá está en{' '}
              <Text as="span" weight="semibold">
                58% de participación
              </Text>
              , nueve puntos por debajo del promedio de la empresa. La caída está concentrada en el turno de la tarde.
            </Text>
          </MensajeAgente>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="outline" aria-expanded={detalle} onClick={() => setDetalle((d) => !d)}>
            <HugeiconsIcon icon={ChartLineData01Icon} aria-hidden="true" />
            {detalle ? 'Ocultar el detalle' : 'Ver el detalle por turno'}
          </Button>
          <Button variant="outline" onClick={suite.prepararAviso}>
            <HugeiconsIcon icon={LeftToRightListBulletIcon} aria-hidden="true" />
            Preparar un aviso para el turno tarde
          </Button>
        </div>

        {detalle ? (
          // Card y no Frame: el panel de Frame toma el color claro aunque la pantalla sea oscura.
          <Card className="w-full max-w-xl">
            <CardHeader>
              <CardTitle>Participación por turno</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {TURNOS.map((turno) => (
                <div key={turno.turno} className="grid grid-cols-[5rem_minmax(0,1fr)_3rem] items-center gap-3">
                  <Text as="span" size="sm">
                    {turno.turno}
                  </Text>
                  <Progress value={turno.valor} aria-label={`Turno ${turno.turno}: ${turno.valor} %`} />
                  <Text as="span" size="sm" className="text-end">
                    {turno.valor}%
                  </Text>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {/* Barra de control de la voz */}
        <Item variant="outline" className="mt-auto w-full max-w-xl">
          <ItemMedia>
            <Button
              size="icon-lg"
              variant={escuchando ? 'default' : 'outline'}
              aria-label={escuchando ? 'Pausar el micrófono' : 'Activar el micrófono'}
              aria-pressed={escuchando}
              onClick={alternar}
            >
              <HugeiconsIcon icon={Mic01Icon} aria-hidden="true" />
            </Button>
          </ItemMedia>
          <ItemContent className="min-w-0">
            <ItemTitle>{escuchando ? 'Te escucho · español' : 'Micrófono en pausa'}</ItemTitle>
            <ItemDescription>{tiempo} · haz una pausa y sigo esperando</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button variant="ghost" size="sm" onClick={suite.escribirEnVez}>
              Escribir
            </Button>
            <Button variant="outline" size="icon" aria-label={escuchando ? 'Pausar' : 'Seguir escuchando'} onClick={alternar}>
              <HugeiconsIcon icon={escuchando ? PauseIcon : PlayIcon} aria-hidden="true" />
            </Button>
            <Button variant="secondary" size="icon" aria-label="Terminar y ver la respuesta en el chat" onClick={suite.terminarVoz}>
              <HugeiconsIcon icon={StopIcon} aria-hidden="true" />
            </Button>
          </ItemActions>
        </Item>
      </main>
    </div>
  )
}

Component.displayName = 'DesignSystemTemplateSuiteAiVoz'
