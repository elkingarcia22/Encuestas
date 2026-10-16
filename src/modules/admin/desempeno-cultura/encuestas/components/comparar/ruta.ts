// La dirección de un comparativo: la base y las demás en la URL, para que se pueda volver a él,
// recargar sin perderlo y compartirlo. No lleva datos de personas, solo ids de encuestas.
export const RUTA_COMPARATIVO = '/admin/desempeno-cultura/encuestas/comparativo'

export const rutaComparativo = (base: string, ids: readonly string[]) =>
  `${RUTA_COMPARATIVO}?base=${encodeURIComponent(base)}&con=${ids
    .filter((id) => id !== base)
    .map(encodeURIComponent)
    .join(',')}`
