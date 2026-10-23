/** Para comparar textos sin importar tildes ni mayúsculas ("cafe" encuentra "Café"). */
export const normalizarTexto = (texto: string): string =>
  texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();