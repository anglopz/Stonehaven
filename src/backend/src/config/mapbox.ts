import mbxGeocoding from '@mapbox/mapbox-sdk/services/geocoding';

/**
 * Mapbox geocoding service configuration
 */
const mapBoxToken = process.env.MAPBOX_TOKEN || '';

if (!mapBoxToken) {
  console.warn('Warning: MAPBOX_TOKEN is not set. Geocoding will not work.');
}

export const geocoder = mbxGeocoding({ accessToken: mapBoxToken });
