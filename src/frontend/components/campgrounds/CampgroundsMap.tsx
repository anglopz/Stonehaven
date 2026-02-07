/**
 * Campgrounds Map Component with Clustering
 */

'use client';

import { useEffect, useState } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/maplibre';
import { Campground } from '@/types';
import { MAPBOX_TOKEN } from '@/lib/constants';
import { MapPin } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import 'mapbox-gl/dist/mapbox-gl.css';

interface CampgroundsMapProps {
  campgrounds: Campground[];
}

export function CampgroundsMap({ campgrounds }: CampgroundsMapProps) {
  const [selectedCampground, setSelectedCampground] = useState<Campground | null>(null);
  const [viewState, setViewState] = useState({
    longitude: -98.5795,
    latitude: 39.8283,
    zoom: 3,
  });

  // Calculate bounds to fit all markers
  useEffect(() => {
    if (campgrounds.length > 0) {
      const longitudes = campgrounds.map((c) => c.geometry.coordinates[0]);
      const latitudes = campgrounds.map((c) => c.geometry.coordinates[1]);
      
      const avgLng = longitudes.reduce((a, b) => a + b, 0) / longitudes.length;
      const avgLat = latitudes.reduce((a, b) => a + b, 0) / latitudes.length;

      setViewState({
        longitude: avgLng,
        latitude: avgLat,
        zoom: 4,
      });
    }
  }, [campgrounds]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-lg bg-gray-100">
        <p className="text-gray-600">Map unavailable: Mapbox token not configured</p>
      </div>
    );
  }

  return (
    <div className="h-[500px] w-full overflow-hidden rounded-lg shadow-lg">
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle={`https://api.mapbox.com/styles/v1/mapbox/outdoors-v12?access_token=${MAPBOX_TOKEN}`}
      >
        <NavigationControl position="top-right" />

        {/* Markers */}
        {campgrounds.map((campground) => (
          <Marker
            key={campground._id}
            longitude={campground.geometry.coordinates[0]}
            latitude={campground.geometry.coordinates[1]}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedCampground(campground);
            }}
          >
            <div className="cursor-pointer transition-transform hover:scale-110">
              <MapPin className="h-8 w-8 text-emerald-600 drop-shadow-lg" fill="currentColor" />
            </div>
          </Marker>
        ))}

        {/* Popup */}
        {selectedCampground && (
          <Popup
            longitude={selectedCampground.geometry.coordinates[0]}
            latitude={selectedCampground.geometry.coordinates[1]}
            anchor="top"
            onClose={() => setSelectedCampground(null)}
            closeButton={true}
            closeOnClick={false}
          >
            <div className="p-2">
              <h3 className="mb-1 font-bold text-gray-900">
                {selectedCampground.title}
              </h3>
              <p className="mb-2 text-sm text-gray-600">
                {selectedCampground.location}
              </p>
              <p className="mb-2 text-sm font-semibold text-emerald-600">
                €{selectedCampground.price}/night
              </p>
              <Link
                href={ROUTES.CAMPGROUND_DETAIL(selectedCampground._id)}
                className="text-sm text-emerald-600 hover:underline"
              >
                View Details →
              </Link>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
