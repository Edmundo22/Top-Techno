import { useEffect, type RefObject } from 'react';
import { logError } from '../../../utils/logger';

// Autocomplete de endereço "estilo Google Maps" ligado a um <input> próprio
// (design do projeto). Usa `google.maps.places.Autocomplete`, o widget que
// renderiza o dropdown de sugestões (`.pac-container`) e completa pelo teclado.
// Ao escolher um endereço, enquadra o mapa (viewport ou centro + zoom).
//
// Requer a biblioteca `places` em MAP_LIBRARIES e a Places API habilitada na
// chave do Google Cloud.
export function useAddressAutocomplete(
  inputRef: RefObject<HTMLInputElement | null>,
  map: google.maps.Map | null,
  ready: boolean,
): void {
  useEffect(() => {
    const input = inputRef.current;
    if (!ready || !map || !input) return;
    if (!google.maps.places || !google.maps.places.Autocomplete) return;

    let autocomplete: google.maps.places.Autocomplete | null = null;
    let listener: google.maps.MapsEventListener | null = null;

    try {
      autocomplete = new google.maps.places.Autocomplete(input, {
        fields: ['geometry'],
      });
      // Prioriza resultados próximos do que já está visível no mapa.
      autocomplete.bindTo('bounds', map);
      listener = autocomplete.addListener('place_changed', () => {
        const place = autocomplete?.getPlace();
        const geometry = place?.geometry;
        if (!geometry) return;
        if (geometry.viewport) {
          map.fitBounds(geometry.viewport);
        } else if (geometry.location) {
          map.setCenter(geometry.location);
          map.setZoom(17);
        }
      });
    } catch (err) {
      logError('autocomplete de endereço (init)', err);
    }

    return () => {
      if (listener) google.maps.event.removeListener(listener);
      if (autocomplete) google.maps.event.clearInstanceListeners(autocomplete);
      // o widget legado injeta o dropdown no body; remove os órfãos ao desmontar
      document.querySelectorAll('.pac-container').forEach((el) => el.remove());
    };
  }, [inputRef, map, ready]);
}
