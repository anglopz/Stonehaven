/**
 * Edit Campground Page
 */

'use client';

import { use } from 'react';
import Link from 'next/link';
import { useCampground } from '@/hooks';
import { CampgroundForm } from '@/components/campgrounds/CampgroundForm';
import { Card, CardContent, CardHeader, CardTitle, Button, Spinner } from '@/components/ui';
import { ROUTES } from '@/lib/constants';

interface EditCampgroundPageProps {
  params: Promise<{ id: string }>;
}

export default function EditCampgroundPage({ params }: EditCampgroundPageProps) {
  const { id } = use(params);
  const { campground, isLoading, error } = useCampground(id);

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

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle>Edit Campground</CardTitle>
        </CardHeader>
        <CardContent>
          <CampgroundForm mode="edit" campground={campground} />
        </CardContent>
      </Card>
    </div>
  );
}
