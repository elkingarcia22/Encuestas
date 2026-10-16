import { cn } from '@ubits/flux-ui'
import { SourcePills } from '../../components/agent-kit'
import styles from '../../components/agent.module.css'
import type { Finding, SectionId } from './data'

type FindingsProps = {
  items: Finding[]
  risk?: boolean
  onSource: (section: SectionId) => void
  className?: string
}

// Fortalezas o riesgos del resumen: cada afirmación con sus fuentes debajo.
export function Findings({ items, risk = false, onSource, className }: FindingsProps) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {items.map((item, index) => (
        <div key={item.text} className={cn('flex gap-2.5', styles.lineIn)} style={{ animationDelay: `${index * 60}ms` }}>
          <span aria-hidden="true" className={cn('mt-1.75 size-1.5 shrink-0 rounded-full', risk ? 'bg-warning' : 'bg-foreground')} />
          <div className="min-w-0 flex-1">
            <div className="text-sm leading-normal text-foreground/80">{item.text}</div>
            {item.sources.length ? (
              <SourcePills
                className="mt-2"
                sources={item.sources.map((source) => ({ label: source.label, onClick: () => onSource(source.section) }))}
              />
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}
