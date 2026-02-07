/**
 * Campgrounds Index Page
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCampground } from '@/hooks';
import { CampgroundCard, CampgroundsMap } from '@/components/campgrounds';
import { Button, Input, Spinner } from '@/components/ui';
import { PlusCircle, MapIcon, Grid3x3, Search } from 'lucide-react';
import { ROUTES } from '@/lib/constants';

export default function CampgroundsPage() {
  const { campgrounds, isLoading, error } = useCampground();
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter campgrounds by search query
  const filteredCampgrounds = campgrounds?.filter((campground) => {
    const query = searchQuery.toLowerCase();
    return (
      campground.title.toLowerCase().includes(query) ||
      campground.location.toLowerCase().includes(query) ||
      campground.description.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Loading campgrounds...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load campgrounds</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold text-gray-900">All Campgrounds</h1>
            <p className="text-gray-600">
              Discover {filteredCampgrounds?.length || 0} amazing camping spots
            </p>
          </div>
          
          <Link href={ROUTES.CAMPGROUND_NEW}>
            <Button size="lg">
              <PlusCircle className="mr-2 h-5 w-5" />
              Add New Campground
            </Button>
          </Link>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Search */}
        <div className="relative flex-1 md:max-w-md">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by title, location, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3x3 className="mr-2 h-4 w-4" />
            Grid
          </Button>
          <Button
            variant={viewMode === 'map' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('map')}
          >
            <MapIcon className="mr-2 h-4 w-4" />
            Map
          </Button>
        </div>
      </div>

      {/* Map View */}
      {viewMode === 'map' && filteredCampgrounds && filteredCampgrounds.length > 0 && (
        <div className="mb-8">
          <CampgroundsMap campgrounds={filteredCampgrounds} />
        </div>
      )}

      {/* Empty State */}
      {(!filteredCampgrounds || filteredCampgrounds.length === 0) && (
        <div className="flex min-h-[40vh] items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
          <div className="text-center">
            {searchQuery ? (
              <>
                <Search className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                <h3 className="mb-2 text-xl font-semibold text-gray-700">
                  No campgrounds found
                </h3>
                <p className="mb-4 text-gray-600">
                  Try adjusting your search terms
                </p>
                <Button onClick={() => setSearchQuery('')}>Clear Search</Button>
              </>
            ) : (
              <>
                <MapIcon className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                <h3 className="mb-2 text-xl font-semibold text-gray-700">
                  No Campgrounds Yet
                </h3>
                <p className="mb-4 text-gray-600">
                  Be the first to add a campground!
                </p>
                <Link href={ROUTES.CAMPGROUND_NEW}>
                  <Button size="lg">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Create First Campground
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && filteredCampgrounds && filteredCampgrounds.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCampgrounds.map((campground) => (
            <CampgroundCard key={campground._id} campground={campground} />
          ))}
        </div>
      )}
    </div>
  );
}
