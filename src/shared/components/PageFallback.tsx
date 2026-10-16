import styles from '@/shared/layouts/RootLayout.module.css'

export function PageFallback() {
  return (
    <div className={styles.fallback} role="status">
      Cargando módulo…
    </div>
  )
}
