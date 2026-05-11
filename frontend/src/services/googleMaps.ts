// Constante compartilhada de bibliotecas do Google Maps JS API.
// Importante: useJsApiLoader exige que `libraries` seja a MESMA referência em
// todas as telas — se mudar entre páginas, o loader gera warning "libraries
// option has changed" e pode recarregar o script.
// Por isso fica aqui em uma única fonte de verdade.
export const MAP_LIBRARIES: ('geometry' | 'drawing')[] = ['geometry', 'drawing'];
