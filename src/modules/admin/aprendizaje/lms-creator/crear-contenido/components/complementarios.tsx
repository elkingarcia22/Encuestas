import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon, Download01Icon, TextAlignLeftIcon } from '@hugeicons/core-free-icons'
import { Button, Frame, FramePanel, IconTile, Item, ItemContent, ItemMedia, Text } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { actualizarPagina, type Complementarios, type Pagina } from './borrador'
import { EditorTexto } from './editor-texto'
import { FileUpload, type ArchivoCargado } from './file-upload'

// Recursos complementarios de una página: un texto y un archivo descargable, como máximo uno de cada uno. No van en las
// evaluaciones, y el texto no se ofrece cuando el recurso principal ya es un texto. Quitar es inmediato.

const VACIO: Complementarios = { orden: [], texto: '' }

const ACEPTA_DESCARGABLE =
  '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt,.csv,application/pdf,application/msword,application/zip,text/plain,text/csv'

export function RecursosComplementarios({ pagina }: { pagina: Pagina }) {
  const c = pagina.complementarios ?? VACIO
  const [archivo, setArchivo] = useState<ArchivoCargado | null>(null)
  const principalTexto = pagina.recurso?.tipo === 'texto'
  const tieneTexto = c.orden.includes('texto')
  const tieneArchivo = c.orden.includes('archivo')

  const cambiar = (siguiente: Complementarios) => actualizarPagina(pagina.id, { complementarios: siguiente })
  const agregar = (tipo: 'texto' | 'archivo') => cambiar({ ...c, orden: [...c.orden, tipo] })
  const quitar = (tipo: 'texto' | 'archivo') => {
    if (tipo === 'archivo') setArchivo(null)
    cambiar({ ...c, orden: c.orden.filter((o) => o !== tipo), texto: tipo === 'texto' ? '' : c.texto, archivo: tipo === 'archivo' ? undefined : c.archivo })
  }

  const invitaciones = [
    !tieneTexto && !principalTexto ? { tipo: 'texto' as const, etiqueta: 'Texto', icono: TextAlignLeftIcon } : null,
    !tieneArchivo ? { tipo: 'archivo' as const, etiqueta: 'Archivo descargable', icono: Download01Icon } : null,
  ].filter((i): i is NonNullable<typeof i> => Boolean(i))

  return (
    <div className="flex flex-col gap-4">
      {c.orden.map((tipo) =>
        tipo === 'texto' ? (
          <Frame key="texto">
            <FramePanel className="flex flex-col gap-3">
              <EditorTexto
                id={`cc-comp-texto-${pagina.id}`}
                etiqueta="Texto complementario"
                valor={c.texto}
                onCambio={(html) => cambiar({ ...c, texto: html })}
                placeholder="Escribe el texto complementario"
              />
              <BotonQuitar onClick={() => quitar('texto')} />
            </FramePanel>
          </Frame>
        ) : (
          <Frame key="archivo">
            <FramePanel className="flex flex-col gap-3">
              <FileUpload
                titulo="Archivo descargable"
                acepta={ACEPTA_DESCARGABLE}
                maximoMb={256}
                formatos="PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, ZIP, RAR, TXT, CSV · Hasta 256 MB"
                exito={false}
                compacta
                archivo={archivo ?? (c.archivo ? { nombre: c.archivo.nombre, peso: Number(c.archivo.peso) || 0, url: '', archivo: new File([], c.archivo.nombre) } : null)}
                onArchivo={(a) => {
                  setArchivo(a)
                  cambiar({ ...c, archivo: a ? { nombre: a.nombre, peso: String(a.peso) } : undefined })
                }}
              />
              <BotonQuitar onClick={() => quitar('archivo')} />
            </FramePanel>
          </Frame>
        ),
      )}

      {invitaciones.length ? (
        <section aria-label="Recursos complementarios opcionales" className="flex flex-col gap-3">
          <Text variant="muted" size="sm" className="flex items-center gap-2">
            Agrega un recurso complementario
            <Badge variant="secondary" size="xs">
              Opcional
            </Badge>
          </Text>
          <div className="grid gap-3 sm:grid-cols-2">
            {invitaciones.map((i) => (
              <Item key={i.tipo} variant="outline" size="sm" render={<button type="button" />} className="cursor-pointer text-left" onClick={() => agregar(i.tipo)}>
                <ItemMedia>
                  <IconTile variant="soft" size="sm">
                    <HugeiconsIcon icon={i.icono} />
                  </IconTile>
                </ItemMedia>
                <ItemContent>
                  <Text as="span" size="sm" weight="medium">
                    {i.etiqueta}
                  </Text>
                </ItemContent>
              </Item>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function BotonQuitar({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="destructive" size="sm" className="self-end" onClick={onClick}>
      <HugeiconsIcon icon={Delete02Icon} size={14} />
      Eliminar
    </Button>
  )
}
