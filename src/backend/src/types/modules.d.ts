/**
 * Type declarations for modules without official TypeScript definitions
 */

declare module 'multer-storage-cloudinary' {
  export interface CloudinaryStorageOptions {
    cloudinary: unknown;
    params?: Record<string, unknown>;
  }
  export class CloudinaryStorage {
    constructor(options: CloudinaryStorageOptions);
  }
}

declare module '@mapbox/mapbox-sdk/services/geocoding' {
  export interface GeocodeService {
    forwardGeocode(options: {
      query: string;
      limit?: number;
    }): {
      send(): Promise<{
        body: {
          features: Array<{
            geometry: {
              type: 'Point';
              coordinates: [number, number];
            };
          }>;
        };
      }>;
    };
  }

  export default function geocodingService(options: { accessToken: string }): GeocodeService;
}
