import type { GeometryVO } from '../../domain/entities';

export interface IGeocoder {
  forwardGeocode(query: string): Promise<GeometryVO | null>;
}
