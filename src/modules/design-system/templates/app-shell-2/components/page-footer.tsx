export function PageFooter() {
  return (
    <footer className="flex flex-wrap items-center gap-3 border-t border-border/60 px-1 py-4">
      <img src="/ubits-logo.svg" alt="Ubits" className="h-4 w-auto shrink-0 dark:hidden" />
      <img src="/ubits-logo-white.svg" alt="Ubits" className="hidden h-4 w-auto shrink-0 dark:block" />
      <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <a href="#" className="text-foreground underline underline-offset-4">
          Términos y condiciones de uso de la plataforma
        </a>
        <span aria-hidden="true">|</span>
        <a href="#" className="text-foreground underline underline-offset-4">
          Política de privacidad
        </a>
      </p>
    </footer>
  )
}
