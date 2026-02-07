/**
 * Type declarations for modules without official TypeScript definitions
 */

declare module 'ejs-mate' {
  import { Request, Response, NextFunction } from 'express';
  function ejsMate(path: string, options: any, callback: (err: Error | null, html?: string) => void): void;
  export = ejsMate;
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
