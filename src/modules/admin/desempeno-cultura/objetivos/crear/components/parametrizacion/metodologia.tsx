import { Field, FieldError, FieldLabel, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, IconTile, Item, ItemContent, ItemDescription, ItemMedia, ItemTitle, Text } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { HugeiconsIcon } from '@hugeicons/react'
import { type CicloDraft } from '../../../modelo/constructor/cicloBuilderTypes'
import { setupModelOptions } from '../../../modelo/constructor/cicloSetup'
import { OBJECTIVE_MODEL_META, objectiveModelPreset, objectiveModelRuleSentences, objectiveModelVocab, type ObjectiveModelId, type ObjectiveModelRules } from '../../../modelo/constructor/objectiveModel'
import { TEXTO_POR_TONO } from '../../../../encuestas/components/tonos'
import { norteSegun, type Contestadas } from './preguntas'

const COMPLETA = 'Completa este campo'

// Icono en el color de su tono: la baldosa «soft» lo pinta en gris y la clase sola no le gana (diferencias.json › instalacion-estilos-sin-capa).
const TEXTO_FIJO_POR_TONO: Record<string, string> = {
  brand: 'text-primary!',
  positive: 'text-success!',
  warning: 'text-warning!',
  neutral: 'text-muted-foreground!',
  ai: 'text-primary!',
  violet: 'text-info!',
}

export function BloqueMetodologia({
  borrador,
  onCambio,
  conErrores,
  contestadas,
  onContestar,
}: {
  borrador: CicloDraft
  onCambio: (cambio: Partial<CicloDraft>) => void
  conErrores: boolean
  contestadas: Contestadas
  onContestar: (cambio: Partial<Contestadas>) => void
}) {
  const modelo = borrador.objectiveModel
  const elegirModelo = (nuevo: ObjectiveModelId) => {
    const heredadas = objectiveModelPreset(nuevo) ?? borrador.modelRules
    const reglas: ObjectiveModelRules = nuevo === 'custom' ? { ...heredadas, companyObjectives: 'optional' } : heredadas
    onContestar({ norte: false, recordatorios: false, frecuencia: false })
    onCambio({ objectiveModel: nuevo, modelRules: reglas, useCompanyObjectives: norteSegun(reglas, borrador.useCompanyObjectives, contestadas.norte) })
  }

  const vista = modelo
  const reglasVista = borrador.modelRules
  const metaVista = vista ? OBJECTIVE_MODEL_META[vista] : null
  const frases = vista ? objectiveModelRuleSentences(reglasVista, objectiveModelVocab(vista, reglasVista)) : []
  const faltaModelo = conErrores && modelo === null
  const norteForzado = modelo ? borrador.modelRules.companyObjectives !== 'optional' : false
  const norteRespondido = contestadas.norte || norteForzado
  const valorNorte = norteRespondido ? (borrador.useCompanyObjectives ? 'si' : 'no') : ''
  const faltaNorte = conErrores && !norteRespondido && !norteForzado

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field data-invalid={faltaModelo || undefined}>
          <FieldLabel htmlFor="ciclo-modelo">Modelo de medición</FieldLabel>
          <Select value={modelo ?? ''} onValueChange={(v) => elegirModelo(v as ObjectiveModelId)}>
            <SelectTrigger id="ciclo-modelo" aria-invalid={faltaModelo || undefined}>
              <SelectValue placeholder="Elige un modelo">
                {(v: string) =>
                  v ? (
                    <span className="flex min-w-0 items-center gap-2">
                      <HugeiconsIcon icon={OBJECTIVE_MODEL_META[v as ObjectiveModelId].icon} aria-hidden="true" className="shrink-0 text-muted-foreground" />
                      <span className="truncate">{OBJECTIVE_MODEL_META[v as ObjectiveModelId].label}</span>
                    </span>
                  ) : (
                    'Elige un modelo'
                  )
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {setupModelOptions(modelo).map((id) => (
                <SelectItem key={id} value={id}>
                  <div className="flex items-center gap-3 py-0.5">
                    <IconTile variant="soft" size="sm" className={`shrink-0 ${TEXTO_FIJO_POR_TONO[OBJECTIVE_MODEL_META[id].tone ?? 'neutral']} **:text-inherit!`}>
                      <HugeiconsIcon icon={OBJECTIVE_MODEL_META[id].icon} aria-hidden="true" />
                    </IconTile>
                    <div className="flex flex-col whitespace-normal">
                      <Text as="span" size="sm" weight="medium">{OBJECTIVE_MODEL_META[id].label}</Text>
                      <Text as="span" size="xs" variant="muted">{OBJECTIVE_MODEL_META[id].tagline}</Text>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {faltaModelo ? <FieldError>{COMPLETA}</FieldError> : null}
        </Field>

        <Field data-invalid={faltaNorte || undefined}>
          <FieldLabel htmlFor="ciclo-norte">Objetivos de la empresa</FieldLabel>
          <Select
            disabled={!modelo || norteForzado}
            value={valorNorte}
            onValueChange={(valor) => {
              onContestar({ norte: true })
              onCambio({ useCompanyObjectives: valor === 'si' })
            }}
          >
            <SelectTrigger id="ciclo-norte" aria-invalid={faltaNorte || undefined}>
              <SelectValue placeholder="Elige si los maneja o no">
                {(v: string) => !v ? 'Elige si los maneja o no' : v === 'si' ? 'Sí, incluir objetivos de la empresa' : 'No, no incluir objetivos de la empresa'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="si">
                <div className="flex flex-col whitespace-normal py-1">
                  <Text as="span" size="sm" weight="medium">Sí, incluir objetivos de la empresa</Text>
                </div>
              </SelectItem>
              <SelectItem value="no">
                <div className="flex flex-col whitespace-normal py-1">
                  <Text as="span" size="sm" weight="medium">No, no incluir objetivos de la empresa</Text>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          {faltaNorte ? <FieldError>{COMPLETA}</FieldError> : null}
        </Field>
      </div>

      {metaVista && vista ? (
        <Item variant="muted" className="items-start">
          <ItemMedia>
            <IconTile variant="soft" size="xs" className={TEXTO_POR_TONO[metaVista.tone ?? 'neutral']}>
              <HugeiconsIcon icon={metaVista.icon} aria-hidden="true" />
            </IconTile>
          </ItemMedia>
          <ItemContent className="gap-1">
            <ItemTitle>
              {vista === 'custom' ? 'Modelo personalizado' : metaVista.label}
              <Badge variant="primary-light" size="xs">
                Elegido
              </Badge>
            </ItemTitle>
            {/* La explicación del modelo entera y en letra pequeña: el tema la corta a dos líneas (diferencias.json › item-descripcion-corta-a-dos-lineas). */}
            <ItemDescription className="line-clamp-none! text-xs!">{vista === 'custom' ? metaVista.help : `${metaVista.fullName}. ${metaVista.structure}`}</ItemDescription>
            <Text as="span" size="xs" weight="semibold" className="mt-1">
              Reglas fijas que aplicará el sistema
            </Text>
            <ul className="flex list-disc flex-col ps-4">
              {frases.map((frase) => (
                <li key={frase}>
                  <Text as="span" size="xs" variant="muted">
                    {frase}
                  </Text>
                </li>
              ))}
            </ul>
          </ItemContent>
        </Item>
      ) : null}

    </>
  )
}
