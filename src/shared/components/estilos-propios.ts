/**
 * Retoques que no se pueden pedir desde la librería y se repiten en varias pantallas. Cada uno dice qué arregla y
 * por qué; si algún día flux-ui lo resuelve, se borra de aquí y ya.
 */

/**
 * Una fila con interruptor no es una opción elegida.
 *
 * El tema pinta de azul cualquier `FieldLabel` que lleve dentro un control marcado —`.cn-field-label` aplica
 * `has-data-checked:bg-primary/5` y `has-data-checked:border-primary/30`—. Para una tarjeta de opción está bien: el
 * azul dice «esta es la que elegiste» entre varias. Pero un interruptor suelto no compite con nada: encendido no es
 * seleccionado, y el resalte sugiere una elección que no existe.
 *
 * Va en el `className` del `FieldLabel` que envuelve un `Switch`. Las tarjetas de opción no lo llevan y siguen igual.
 */
export const FILA_INTERRUPTOR = 'has-data-checked:bg-card! has-data-checked:border-border!'

/**
 * La tarjeta de opción responde al pasar el cursor.
 *
 * La «tarjeta de opción» de la librería (`FieldLabel` que envuelve a `Field`, con borde, esquina y tinte primario al
 * marcar: `.cn-field-label` en style-vega.css) no trae estado hover, así que no se nota que toda la tarjeta se puede
 * tocar. Se le da un gris tenue al pasar el cursor, solo si no está marcada (la marcada conserva su azul) ni
 * deshabilitada.
 *
 * Va en el `className` del `FieldLabel` de cada opción de un `RadioGroup` o de una lista de casillas.
 */
export const TARJETA_OPCION = 'cursor-pointer transition-colors hover:not-has-data-checked:not-has-data-disabled:bg-muted/60'
