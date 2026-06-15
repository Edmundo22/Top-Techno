// Constante compartilhada de bibliotecas do Google Maps JS API.
// Importante: useJsApiLoader exige que `libraries` seja a MESMA referência em
// todas as telas — se mudar entre páginas, o loader gera warning "libraries
// option has changed" e pode recarregar o script.
// Por isso fica aqui em uma única fonte de verdade.
//
// `drawing` foi removida: o DrawingManager saiu do Maps JS API na v3.65
// (https://developers.google.com/maps/deprecations). O desenho de
// círculo/polígono no cadastro de locais agora é manual (clique no mapa).
export const MAP_LIBRARIES: 'geometry'[] = ['geometry'];
