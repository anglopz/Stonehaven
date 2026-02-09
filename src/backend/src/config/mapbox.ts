import mbxGeocoding from '@mapbox/mapbox-sdk/services/geocoding';

/**
 * Mapbox geocoding service configuration
 */
const mapBoxToken = process.env.MAPBOX_TOKEN || '';

if (!mapBoxToken) {
  console.warn('Warning: MAPBOX_TOKEN is not set. Geocoding will not work.');
}

// Only create geocoder if token is available, otherwise create a mock that throws helpful errors
export const geocoder = mapBoxToken
  ? mbxGeocoding({ accessToken: mapBoxToken })
  : ({
      forwardGeocode: () => {
        throw new Error('MAPBOX_TOKEN is not set. Please configure it in your .env file.');
      },
    } as ReturnType<typeof mbxGeocoding>);
