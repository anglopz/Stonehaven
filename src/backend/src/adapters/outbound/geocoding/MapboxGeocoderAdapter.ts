import type { IGeocoder } from '../../../application/ports';
import type { GeometryVO } from '../../../domain/entities';
import { geocoder } from '../../../config/mapbox';

export class MapboxGeocoderAdapter implements IGeocoder {
  async forwardGeocode(query: string): Promise<GeometryVO | null> {
    const geoData = await geocoder
      .forwardGeocode({ query, limit: 1 })
      .send();

    const features = geoData.body?.features;
    if (!features?.length) return null;

    const geometry = features[0].geometry as {
      type: 'Point';
      coordinates: [number, number];
    };

    return geometry;
  }
}
