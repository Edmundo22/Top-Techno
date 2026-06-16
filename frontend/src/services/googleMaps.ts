// Constante compartilhada de bibliotecas do Google Maps JS API.
// Importante: useJsApiLoader exige que `libraries` seja a MESMA referência em
// todas as telas — se mudar entre páginas, o loader gera warning "libraries
// option has changed" e pode recarregar o script.
// Por isso fica aqui em uma única fonte de verdade.
//
// `drawing` foi removida: o DrawingManager saiu do Maps JS API na v3.65
// (https://developers.google.com/maps/deprecations). O desenho de
// círculo/polígono no cadastro de locais agora usa o Terra Draw
// (terra-draw + terra-draw-google-maps-adapter).
//
// `places`: usada pela caixa de busca de endereço do modal de cadastro de
// locais (`google.maps.places.Autocomplete` ligado a um input próprio). Requer
// a Places API habilitada na chave.
export const MAP_LIBRARIES: ('geometry' | 'places')[] = ['geometry', 'places'];
