import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Progress,
  ScrollArea,
  Text,
} from '@ubits/flux-ui'
import { EtiquetaIA } from '@/modules/design-system/ia/etiqueta-ia'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { ChangelogDialog } from '@/shared/components/Announcements'
import { Orb } from '@/shared/components/Orb'

import textura from '../assets/textura.jpg'
import { CAMBIO_SELECCION, iniciales } from './data'
import { useSuite, type Modal } from './estado'

// Modales del template. Los propios, sin la X de cerrar (revisión de diseño del 2026-09-11): se cierran
// con su botón, con Esc o tocando fuera.

/* ------------------------------------ confirmaciones y listas (uno solo) */

export function DialogoModal() {
  const suite = useSuite()
  // Se guarda el último contenido para que no desaparezca mientras el modal se cierra.
  const [ultimo, setUltimo] = useState<Modal | null>(suite.modal)
  if (suite.modal && suite.modal !== ultimo) setUltimo(suite.modal)
  const modal = suite.modal ?? ultimo

  const confirmar = () => {
    const accion = modal?.alConfirmar
    suite.setModal(null)
    accion?.()
  }

  const lista = modal?.personas ? (
    <ItemGroup>
      {modal.personas.map((persona) => (
        <Item key={persona.nombre} size="xs">
          <ItemMedia>
            <Avatar size="sm">
              <AvatarFallback>{persona.marca ?? iniciales(persona.nombre)}</AvatarFallback>
            </Avatar>
          </ItemMedia>
          <ItemContent className="min-w-0">
            <ItemTitle className="truncate">{persona.nombre}</ItemTitle>
            <ItemDescription className="truncate">{persona.detalle}</ItemDescription>
          </ItemContent>
        </Item>
      ))}
    </ItemGroup>
  ) : null

  return (
    <Dialog open={Boolean(suite.modal)} onOpenChange={(abierto) => (abierto ? null : suite.setModal(null))}>
      <DialogContent showCloseButton={false}>
        {modal ? (
          <>
            <DialogHeader>
              <DialogTitle>{modal.titulo}</DialogTitle>
              <DialogDescription>{modal.descripcion}</DialogDescription>
            </DialogHeader>
            {modal.texto ? <Text>{modal.texto}</Text> : null}
            {lista && (modal.personas?.length ?? 0) > 6 ? <ScrollArea className="h-72">{lista}</ScrollArea> : lista}
            <DialogFooter className="items-center sm:justify-between">
              {modal.nota ? (
                <Text as="span" variant="muted" size="xs">
                  {modal.nota}
                </Text>
              ) : (
                <span />
              )}
              <div className="flex flex-wrap justify-end gap-2">
                <DialogClose render={<Button variant="outline" />}>{modal.cancelar}</DialogClose>
                {modal.confirmar ? <Button onClick={confirmar}>{modal.confirmar}</Button> : null}
              </div>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------ novedades */

// Es ChangelogDialog, el de las novedades del marco: mismo texto, misma versión y mismos botones.
export function DialogoNovedades() {
  const suite = useSuite()
  return <ChangelogDialog open={suite.promo === 'novedades'} onOpenChange={(abierto) => (abierto ? null : suite.setPromo(null))} />
}

/* ---------------------------------------------- «Ver qué cambió» (Selección) */

export function DialogoCambio() {
  const suite = useSuite()

  return (
    <Dialog open={suite.promo === 'cambio'} onOpenChange={(abierto) => (abierto ? null : suite.setPromo(null))}>
      <DialogContent showCloseButton={false}>
        {/* La imagen del ambiente de IA con el antes y el después de una vacante. */}
        <div className="relative overflow-hidden rounded-lg">
          <img src={textura} alt="" className="h-40 w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-3 p-4">
            <Card size="sm" className="w-40">
              <CardContent className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                  <Text as="span" variant="muted" size="xs">
                    Vacante
                  </Text>
                  <Text as="span" size="sm" weight="medium">
                    Analista de datos
                  </Text>
                </div>
                <Progress value={60} aria-label="Avance de la vacante" />
              </CardContent>
            </Card>
            <Orb className="size-8" />
            <Card size="sm" className="w-52">
              <CardContent className="flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <IconoIA className="mt-0.5" />
                  <Text as="span" size="sm" weight="medium">
                    Moví 12 candidatos a Entrevistas
                  </Text>
                </div>
                <div className="flex gap-1.5">
                  <Badge variant="secondary" size="xs">
                    Hecho
                  </Badge>
                  <Badge variant="secondary" size="xs">
                    Sin correos
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <DialogHeader>
          <EtiquetaIA className="w-fit">Nuevo</EtiquetaIA>
          <DialogTitle>El agente ya ejecuta en Selección</DialogTitle>
          <DialogDescription className="sr-only">Qué puede hacer ahora el agente en Selección</DialogDescription>
        </DialogHeader>
        <ItemGroup>
          {CAMBIO_SELECCION.map((punto) => (
            <Item key={punto.texto} size="xs">
              <ItemMedia variant="icon">
                <HugeiconsIcon icon={punto.icono} aria-hidden="true" />
              </ItemMedia>
              <ItemContent>
                <Text size="sm">{punto.texto}</Text>
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Después</DialogClose>
          <Button className="sm:flex-1" onClick={suite.probarEnSeleccion}>
            Probarlo en Selección
            <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
