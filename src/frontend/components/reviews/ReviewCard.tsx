/**
 * Review Card Component
 */

'use client';

import { User, Trash2 } from 'lucide-react';
import { Review } from '@/types';
import { StarRating } from './StarRating';
import { Button } from '@/components/ui';
import { formatRelativeTime } from '@/lib/utils';
import { useAuth } from '@/hooks';

interface ReviewCardProps {
  review: Review;
  onDelete?: (reviewId: string) => void;
  isDeleting?: boolean;
}

export function ReviewCard({ review, onDelete, isDeleting }: ReviewCardProps) {
  const { user } = useAuth();
  const authorUsername =
    typeof review.author === 'object' ? review.author.username : 'Unknown';
  const authorId = typeof review.author === 'object' ? review.author._id : review.author;
  
  const canDelete = user && user._id === authorId;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
            <User className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{authorUsername}</h4>
            {review.createdAt && (
              <p className="text-xs text-gray-500">
                {formatRelativeTime(review.createdAt)}
              </p>
            )}
          </div>
        </div>

        {canDelete && onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(review._id)}
            isLoading={isDeleting}
            className="text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="mb-3">
        <StarRating rating={review.rating} size="sm" />
      </div>

      <p className="text-gray-700">{review.body}</p>
    </div>
  );
}
