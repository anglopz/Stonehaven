/**
 * New Campground Page
 */

'use client';

import { CampgroundForm } from '@/components/campgrounds/CampgroundForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

export default function NewCampgroundPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New Campground</CardTitle>
        </CardHeader>
        <CardContent>
          <CampgroundForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
