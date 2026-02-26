/** Value Object representing a GeoJSON Point. */
export interface GeometryVO {
  type: 'Point';
  coordinates: [number, number];
}
