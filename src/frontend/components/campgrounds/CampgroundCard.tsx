/**
 * Campground Card Component
 */

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, User, Euro } from 'lucide-react';
import { Campground } from '@/types';
import { ROUTES } from '@/lib/constants';
import { Card, CardContent, Badge, Button } from '@/components/ui';
import { truncate } from '@/lib/utils';

interface CampgroundCardProps {
  campground: Campground;
}

export function CampgroundCard({ campground }: CampgroundCardProps) {
  const imageUrl =
    campground.images && campground.images.length > 0
      ? campground.images[0].card || campground.images[0].url
      : 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800';

  const authorUsername =
    typeof campground.author === 'object' ? campground.author.username : 'Unknown';

  return (
    <Card hover className="group overflow-hidden">
      {/* Image */}
      <div className="relative h-56 w-full overflow-hidden">
        <Image
          src={imageUrl}
          alt={campground.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-110"
        />
        
        {/* Price Badge */}
        <div className="absolute right-3 top-3">
          <Badge className="bg-emerald-600 text-white shadow-lg">
            <Euro className="mr-1 h-3 w-3" />
            {campground.price}/night
          </Badge>
        </div>

        {/* Location Badge */}
        <div className="absolute bottom-3 left-3">
          <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
            <MapPin className="mr-1 h-3 w-3" />
            {campground.location}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-5">
        <h3 className="mb-2 text-xl font-bold text-gray-900 line-clamp-1">
          {campground.title}
        </h3>
        
        <p className="mb-4 text-sm text-gray-600 line-clamp-2">
          {truncate(campground.description, 120)}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <User className="mr-1 h-4 w-4" />
            <span>{authorUsername}</span>
          </div>
          
          <Link href={ROUTES.CAMPGROUND_DETAIL(campground._id)}>
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
