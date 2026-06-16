import { useEffect } from 'react';
import { logError } from '../../../utils/logger';

// Caixa de busca de endereço DENTRO do mapa, no topo-centro, entre os controles
// padrão do Google. Usa o `PlaceAutocompleteElement` (Places API "new") —
// substituto do legado `google.maps.places.Autocomplete`, que está deprecado.
// Ao selecionar um endereço, enquadra o mapa no local (viewport ou centro+zoom).
//
// Requer a biblioteca `places` em MAP_LIBRARIES e a Places API (New) habilitada
// na chave do Google Cloud. A largura é responsiva (min(360px, 70vw)).
export function useMapAddressSearch(map: google.maps.Map | null): void {
  useEffect(() => {
    if (!map) return;

    let cancelled = false;
    let container: HTMLDivElement | null = null;
    let element: google.maps.places.PlaceAutocompleteElement | null = null;

    const onSelect = async (event: Event) => {
      try {
        // A API "new" entrega `placePrediction`; versões anteriores do widget
        // entregavam `place` direto. Suportamos os dois.
        const e = event as unknown as {
          placePrediction?: { toPlace: () => google.maps.places.Place };
          place?: google.maps.places.Place;
        };
        const place = e.placePrediction ? e.placePrediction.toPlace() : e.place;
        if (!place) return;
        await place.fetchFields({ fields: ['location', 'viewport'] });
        if (cancelled) return;
        if (place.viewport) {
          map.fitBounds(place.viewport);
        } else if (place.location) {
          map.setCenter(place.location);
          map.setZoom(17);
        }
      } catch (err) {
        logError('busca de endereço (select)', err);
      }
    };

    try {
      element = new google.maps.places.PlaceAutocompleteElement({});
      element.addEventListener('gmp-select', onSelect as EventListener);
      // compat: nome de evento usado em versões anteriores do widget
      element.addEventListener('gmp-placeselect', onSelect as EventListener);

      container = document.createElement('div');
      container.style.margin = '10px';
      container.style.width = 'min(360px, 70vw)';
      container.appendChild(element);
      map.controls[google.maps.ControlPosition.TOP_CENTER].push(container);
    } catch (err) {
      logError('busca de endereço (init)', err);
    }

    return () => {
      cancelled = true;
      if (element) {
        element.removeEventListener('gmp-select', onSelect as EventListener);
        element.removeEventListener('gmp-placeselect', onSelect as EventListener);
      }
      if (container) {
        const arr = map.controls[google.maps.ControlPosition.TOP_CENTER];
        for (let i = 0; i < arr.getLength(); i++) {
          if (arr.getAt(i) === container) {
            arr.removeAt(i);
            break;
          }
        }
      }
    };
  }, [map]);
}
