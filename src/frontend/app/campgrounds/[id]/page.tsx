/**
 * Campground Detail Page
 */

'use client';

import { use } from 'react';
import Link from 'next/link';
import { useCampground, useAuth, useReview } from '@/hooks';
import { CampgroundCarousel } from '@/components/campgrounds/CampgroundCarousel';
import { ReviewCard, ReviewForm } from '@/components/reviews';
import { Button, Card, CardContent, CardFooter, Spinner, Badge } from '@/components/ui';
import { MapPin, User, Euro, Edit, Trash2, MessageSquare, MapIcon as MapIconLucide } from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { useRouter } from 'next/navigation';
import { useUiStore } from '@/stores';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import { MAPBOX_TOKEN } from '@/lib/constants';
import { Review } from '@/types';
import 'mapbox-gl/dist/mapbox-gl.css';

interface CampgroundDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function CampgroundDetailPage({ params }: CampgroundDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { campground, isLoading, error, deleteCampground, isDeleting } = useCampground(id);
  const { deleteReview, isDeleting: isDeletingReview } = useReview(id);
  const { addFlashMessage } = useUiStore();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this campground?')) return;

    const result = await deleteCampground(id);
    
    if (result.success) {
      addFlashMessage({
        type: 'success',
        message: 'Campground deleted successfully',
      });
      router.push(ROUTES.CAMPGROUNDS);
    } else {
      addFlashMessage({
        type: 'error',
        message: result.error || 'Failed to delete campground',
      });
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    const result = await deleteReview(reviewId);
    
    if (result.success) {
      addFlashMessage({
        type: 'success',
        message: 'Review deleted successfully',
      });
    } else {
      addFlashMessage({
        type: 'error',
        message: result.error || 'Failed to delete review',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Loading campground...</p>
        </div>
      </div>
    );
  }

  if (error || !campground) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Campground not found</p>
          <Link href={ROUTES.CAMPGROUNDS}>
            <Button className="mt-4">Back to Campgrounds</Button>
          </Link>
        </div>
      </div>
    );
  }

  const authorId = typeof campground.author === 'object' ? campground.author._id : campground.author;
  const authorUsername = typeof campground.author === 'object' ? campground.author.username : 'Unknown';
  const isOwner = user && user._id === authorId;
  const reviews = Array.isArray(campground.reviews) ? campground.reviews as Review[] : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left Column */}
        <div>
          {/* Carousel */}
          <CampgroundCarousel images={campground.images} title={campground.title} />

          {/* Info Card */}
          <Card className="mt-6">
            <CardContent className="p-6">
              <h1 className="mb-4 text-3xl font-bold text-gray-900">
                {campground.title}
              </h1>
              
              <p className="mb-6 text-gray-700">{campground.description}</p>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                  <span>{campground.location}</span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="h-5 w-5 text-emerald-600" />
                  <span>Submitted by <strong>{authorUsername}</strong></span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Euro className="h-5 w-5 text-emerald-600" />
                  <span className="text-2xl font-bold text-emerald-600">
                    €{campground.price}
                    <span className="text-base font-normal text-gray-600">/night</span>
                  </span>
                </div>
              </div>
            </CardContent>

            {isOwner && (
              <CardFooter className="flex gap-2">
                <Link href={ROUTES.CAMPGROUND_EDIT(campground._id)} className="flex-1">
                  <Button variant="outline" className="w-full">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  isLoading={isDeleting}
                  className="flex-1"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>

        {/* Right Column */}
        <div>
          {/* Map */}
          <div className="mb-6">
            <h3 className="mb-3 flex items-center gap-2 text-xl font-bold text-gray-900">
              <MapIconLucide className="h-5 w-5 text-emerald-600" />
              Location
            </h3>
            {MAPBOX_TOKEN ? (
              <div className="h-80 overflow-hidden rounded-lg shadow-lg">
                <Map
                  initialViewState={{
                    longitude: campground.geometry.coordinates[0],
                    latitude: campground.geometry.coordinates[1],
                    zoom: 10,
                  }}
                  mapStyle={`https://api.mapbox.com/styles/v1/mapbox/outdoors-v12?access_token=${MAPBOX_TOKEN}`}
                >
                  <NavigationControl position="top-right" />
                  <Marker
                    longitude={campground.geometry.coordinates[0]}
                    latitude={campground.geometry.coordinates[1]}
                    anchor="bottom"
                  >
                    <MapPin className="h-8 w-8 text-emerald-600" fill="currentColor" />
                  </Marker>
                </Map>
              </div>
            ) : (
              <div className="flex h-80 items-center justify-center rounded-lg bg-gray-100">
                <p className="text-gray-600">Map unavailable</p>
              </div>
            )}
          </div>

          {/* Review Form */}
          {user && <ReviewForm campgroundId={campground._id} />}

          {/* Reviews */}
          <div className="mt-6">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
              <MessageSquare className="h-5 w-5 text-emerald-600" />
              Reviews
              <Badge variant="secondary">{reviews.length}</Badge>
            </h3>

            {reviews.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                <MessageSquare className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                <p className="text-gray-600">
                  No reviews yet. Be the first to share your experience!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <ReviewCard
                    key={review._id}
                    review={review}
                    onDelete={handleDeleteReview}
                    isDeleting={isDeletingReview}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
