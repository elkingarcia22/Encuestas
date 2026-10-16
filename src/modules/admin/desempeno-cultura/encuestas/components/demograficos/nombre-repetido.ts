// Dos datos demográficos con el mismo nombre serían indistinguibles en los filtros de resultados, así que no se puede
// crear uno que ya existe. Se compara sin mayúsculas, sin tildes y sin espacios al borde. Lo usan el módulo de datos
// demográficos y el panel de crear dato dentro de la encuesta, con el mismo mensaje.

export const MENSAJE_NOMBRE_REPETIDO = 'Ya existe un dato demográfico con este nombre. Usa el que ya está o ponle otro nombre.'

export const plegarNombre = (valor: string) =>
  valor
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()

export const nombreRepetido = (nombre: string, usados: readonly string[]) => {
  const plegado = plegarNombre(nombre)
  return plegado !== '' && usados.some((usado) => plegarNombre(usado) === plegado)
}
