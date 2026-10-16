import { Text } from '@ubits/flux-ui'
import { TextoEnriquecido } from '@/modules/admin/aprendizaje/lms-creator/crear-contenido/components/editor-texto'
import { marcadoSeguro, parrafosDe } from '../../modelo/textoPagina'

// Lo que el autor escribió en la bienvenida o el cierre. Si lo escribió con el editor (marcado), se muestra con su formato
// —listas, títulos, enlaces— pasado antes por un filtro que deja solo lo que el editor sabe escribir; el texto sencillo de las
// encuestas de ejemplo sigue saliendo como párrafos del tema.

export function TextoPagina({ contenido }: { contenido: string }) {
  if (contenido.includes('<')) return <TextoEnriquecido html={marcadoSeguro(contenido)} className="text-base text-muted-foreground [&_strong]:font-semibold [&_strong]:text-foreground" />
  return (
    <div className="flex flex-col gap-3">
      {parrafosDe(contenido).map((parrafo, indice) => (
        <Text key={indice} as="p" variant="muted">
          {parrafo.map((tramo, parte) =>
            tramo.fuerte ? (
              <Text key={parte} as="span" variant="default" weight="semibold">
                {tramo.texto}
              </Text>
            ) : (
              <span key={parte}>{tramo.texto}</span>
            ),
          )}
        </Text>
      ))}
    </div>
  )
}
