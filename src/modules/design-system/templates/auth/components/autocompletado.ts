// Chrome pinta de azul los campos que rellena con datos guardados (:autofill). Si la transición del fondo dura
// «para siempre», el campo se queda con el fondo del tema, en claro y en oscuro. Lo correcto es una regla global en
// src/index.css, que es andamiaje: está pendiente para ingeniería. Mientras, va en cada campo del acceso.
// Con «!»: el tema le pone transition-[color,box-shadow] al campo sin capa y le gana a cualquier clase.
export const SIN_FONDO_AUTOCOMPLETADO = 'autofill:[transition:background-color_600000s_0s,color_600000s_0s]!'
