import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  Attachment01Icon,
  Cancel01Icon,
  FolderAttachmentIcon,
  GoogleDriveIcon,
  Link02Icon,
  Mail01Icon,
  PlusSignIcon,
  SlackIcon,
  Xls01Icon,
} from '@hugeicons/core-free-icons'
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Text,
  toast,
} from '@ubits/flux-ui'
import { Composer } from '@/modules/admin/suite-ai/shared/composer'

import { CONECTORES, ruta } from './data'

// Campo para escribirle al agente, como en el concepto: atajos arriba, franja opcional dentro
// (novedad o contexto), «+» con archivos y conectores, «Voz» y enviar. El cuadro es Composer.

const ICONO_CONECTOR: Record<string, typeof Mail01Icon> = { Gmail: Mail01Icon, Slack: SlackIcon, 'Google Drive': GoogleDriveIcon }

export function Compositor({
  valor,
  onValor,
  onEnviar,
  placeholder = 'Escribe una tarea o una pregunta',
  atajos,
  novedad,
  contexto,
  aviso = true,
  voz = true,
}: {
  valor: string
  onValor: (valor: string) => void
  onEnviar: (texto: string) => void
  placeholder?: string
  atajos?: ReactNode
  // Franja de novedad de Composer («Nuevo · Ya ejecuta acciones en Selección»).
  novedad?: { onVer: () => void; onCerrar: () => void }
  // Pastilla del objeto en contexto de Composer («… en contexto · el agente responde sobre este objeto»).
  contexto?: { etiqueta: string; onQuitar: () => void }
  aviso?: boolean
  voz?: boolean
}) {
  const navigate = useNavigate()
  const [adjunto, setAdjunto] = useState<'no' | 'subiendo' | 'listo'>('no')

  useEffect(() => {
    if (adjunto !== 'subiendo') return
    const espera = window.setTimeout(() => setAdjunto('listo'), 1200)
    return () => window.clearTimeout(espera)
  }, [adjunto])

  const enviar = () => {
    if (!valor.trim()) return toast.add({ title: 'Escribe una tarea o una pregunta' })
    onEnviar(valor)
    onValor('')
  }

  return (
    <div className="flex flex-col gap-2">
      {atajos ? <div className="flex flex-wrap gap-2">{atajos}</div> : null}
      {adjunto !== 'no' ? (
        <Attachment size="sm" state={adjunto === 'subiendo' ? 'uploading' : 'done'} className="w-fit">
          <AttachmentMedia>
            <HugeiconsIcon icon={Xls01Icon} aria-hidden="true" />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>lideres-ventas.xlsx</AttachmentTitle>
            <AttachmentDescription>{adjunto === 'subiendo' ? 'Subiendo…' : '48 KB'}</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label="Quitar archivo" onClick={() => setAdjunto('no')}>
              <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
      ) : null}
      {/* El cuadro es Composer, el del chat de Suite AI. Solo el «+» es propio (va por footerStart): el de Composer
          no avisa cuando se elige «Agregar archivos», y aquí eso muestra el archivo subiendo. */}
      <Composer
        value={valor}
        onChange={onValor}
        onSend={enviar}
        placeholder={placeholder}
        onVoice={() => navigate(ruta('voz'))}
        voice={voz}
        news={Boolean(novedad)}
        onOpenNews={novedad?.onVer}
        onDismissNews={novedad?.onCerrar}
        contextChip={contexto?.etiqueta}
        onRemoveContext={contexto?.onQuitar}
        attach={false}
        footerStart={<MenuAgregar onArchivo={() => setAdjunto('subiendo')} />}
      />
      {aviso ? (
        <div className="text-center">
          <Text as="span" variant="muted" size="xs">
            El agente puede cometer errores. Antes de ejecutar verás el impacto.
          </Text>
        </div>
      ) : null}
    </div>
  )
}

function MenuAgregar({ onArchivo }: { onArchivo: () => void }) {
  const [conectados, setConectados] = useState<string[]>(CONECTORES)

  return (
    <DropdownMenu>
      {/* El mismo disparador del «+» de Composer: con contorno y en pastilla. */}
      <DropdownMenuTrigger
        render={<Button variant="outline" size="icon" aria-label="Agregar archivos o conectores" className="[--radius:calc(infinity*1px)]" />}
      >
        <HugeiconsIcon icon={PlusSignIcon} size={18} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={onArchivo}>
            <HugeiconsIcon icon={Attachment01Icon} aria-hidden="true" />
            <div className="flex min-w-0 flex-col gap-1">
              <span>Agregar archivos</span>
              <Text as="span" variant="muted" size="xs">
                PDF, Excel o CSV de tu equipo
              </Text>
            </div>
            <DropdownMenuShortcut>⌘U</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <HugeiconsIcon icon={Link02Icon} aria-hidden="true" />
              <div className="flex min-w-0 flex-col gap-1">
                <span>Conectores</span>
                <Text as="span" variant="muted" size="xs">
                  Gmail, Slack y Google Drive
                </Text>
              </div>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Conectados</DropdownMenuLabel>
                {CONECTORES.map((conector) => (
                  <DropdownMenuCheckboxItem
                    key={conector}
                    checked={conectados.includes(conector)}
                    onCheckedChange={(activo) =>
                      setConectados((previos) => (activo ? [...previos, conector] : previos.filter((c) => c !== conector)))
                    }
                  >
                    <HugeiconsIcon icon={ICONO_CONECTOR[conector]} aria-hidden="true" />
                    {conector}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toast.add({ title: 'Catálogo de conectores' })}>
                <HugeiconsIcon icon={Add01Icon} aria-hidden="true" />
                Agregar conectores
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {/* Las etiquetas de menú de Base UI necesitan ir dentro de un grupo. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-2">
            <HugeiconsIcon icon={FolderAttachmentIcon} aria-hidden="true" className="size-4" />
            Hasta 10 archivos · 25 MB cada uno
          </DropdownMenuLabel>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
