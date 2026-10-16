import { ESTADOS, PRIORIDADES, TIPOS, ordenar, porPieza, type Diferencias } from './tipos.ts'

// El documento para el dev que mantiene la librería: una sección por pieza, cada diferencia con qué hace hoy, qué
// esperamos, qué se pide y cómo reproducirlo. Lo arman igual el botón «Descargar» de /design-system/componentes/dev y el
// exportador (ai-tools/flux-ui/exportar-diferencias.mjs).

const enlace = (texto: string, url: string | null) => (url ? `[${texto}](${url})` : null)

export function aMarkdown(datos: Diferencias) {
  const entradas = datos.entradas
  const cuenta = (filtro: (e: (typeof entradas)[number]) => boolean) => entradas.filter(filtro).length
  const lineas: string[] = []

  lineas.push(`# Diferencias entre el Playground UX de UBITS y @ubits/flux-ui ${datos.libreria}`)
  lineas.push('')
  lineas.push(
    `Revisado el ${datos.revisado} contra la librería instalada y el Storybook (${datos.storybook}). ` +
      `${entradas.length} diferencias: ${cuenta((e) => e.estado === 'pedido')} pedidos, ` +
      `${cuenta((e) => e.estado === 'propuesta')} propuestas de variante y ${cuenta((e) => e.estado === 'decidir')} por decidir.`,
  )
  lineas.push('')
  lineas.push('## Cómo leerlo')
  lineas.push('')
  for (const [clave, tipo] of Object.entries(TIPOS)) lineas.push(`- **${tipo.etiqueta}** (\`${clave}\`): ${tipo.ayuda}`)
  lineas.push('')
  for (const [clave, estado] of Object.entries(ESTADOS)) lineas.push(`- **${estado.etiqueta}** (\`${clave}\`): ${estado.ayuda}`)
  lineas.push('')

  const causas = entradas.filter((e) => entradas.some((otra) => otra.causa === e.id))
  if (causas.length) {
    lineas.push('## Empezar por aquí: causas de fondo')
    lineas.push('')
    for (const causa of causas) {
      const sintomas = entradas.filter((e) => e.causa === causa.id)
      lineas.push(`- **${causa.titulo}** (\`${causa.id}\`): explica ${sintomas.length} entradas más (${sintomas.map((e) => e.pieza).filter((p, i, a) => a.indexOf(p) === i).join(', ')}).`)
    }
    lineas.push('')
  }

  lineas.push('## Resumen')
  lineas.push('')
  lineas.push('| # | Pieza | Qué pasa | Tipo | Estado | Prioridad |')
  lineas.push('| --- | --- | --- | --- | --- | --- |')
  ordenar(entradas).forEach((e, i) =>
    lineas.push(
      `| ${i + 1} | ${e.pieza} | ${e.titulo} | ${TIPOS[e.tipo].etiqueta} | ${ESTADOS[e.estado].etiqueta} | ${PRIORIDADES[e.prioridad].etiqueta} |`,
    ),
  )
  lineas.push('')

  for (const grupo of porPieza(entradas)) {
    lineas.push(`## ${grupo.pieza}${grupo.slug && grupo.slug !== 'tema' ? ` (\`${grupo.slug}\`)` : ''}`)
    lineas.push('')
    for (const e of grupo.entradas) {
      lineas.push(`### ${e.titulo}`)
      lineas.push('')
      lineas.push(`\`${e.id}\` · ${TIPOS[e.tipo].etiqueta} · ${ESTADOS[e.estado].etiqueta} · prioridad ${PRIORIDADES[e.prioridad].etiqueta.toLowerCase()}`)
      lineas.push('')
      lineas.push(`- **Hoy:** ${e.hoy}`)
      lineas.push(`- **Esperado:** ${e.esperado}`)
      lineas.push(`- **Pedido:** ${e.pedido}`)
      const causa = e.causa ? entradas.find((otra) => otra.id === e.causa) : null
      if (causa) lineas.push(`- **Causa de fondo:** ${causa.titulo} (\`${causa.id}\`)`)
      const reproducir = [
        enlace('Storybook', e.reproducir.storybook),
        e.reproducir.props ? `props: \`${e.reproducir.props}\`` : null,
        enlace('ReUI', e.reproducir.reui),
      ].filter(Boolean)
      if (reproducir.length) lineas.push(`- **Reproducir:** ${reproducir.join(' · ')}`)
      const pantallas = e.nosotros.pantallas ? ` (${e.nosotros.pantallas} pantallas)` : ''
      lineas.push(`- **Cómo lo resolvemos hoy${pantallas}:** ${e.nosotros.como}`)
      if (e.nosotros.donde.length) lineas.push(`  - ${e.nosotros.donde.map((d) => `\`${d}\``).join(' · ')}`)
      lineas.push(`- **Verificado (${e.revisado}):** ${e.verificado}`)
      lineas.push('')
    }
  }
  return lineas.join('\n')
}
