/**
 * Review Form Component
 */

'use client';

import { useState } from 'react';
import { StarRating } from './StarRating';
import { Button, Textarea } from '@/components/ui';
import { useReview } from '@/hooks';
import { useUiStore } from '@/stores';

interface ReviewFormProps {
  campgroundId: string;
  onSuccess?: () => void;
}

export function ReviewForm({ campgroundId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const { createReview, isCreating } = useReview(campgroundId);
  const { addFlashMessage } = useUiStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!body.trim()) {
      addFlashMessage({
        type: 'error',
        message: 'Please write a review',
      });
      return;
    }

    const result = await createReview({ rating, body: body.trim() });

    if (result.success) {
      addFlashMessage({
        type: 'success',
        message: 'Review submitted successfully!',
      });
      setRating(5);
      setBody('');
      onSuccess?.();
    } else {
      addFlashMessage({
        type: 'error',
        message: result.error || 'Failed to submit review',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg bg-gray-50 p-6">
      <h3 className="mb-4 text-xl font-bold text-gray-900">Leave a Review</h3>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Rating <span className="text-red-500">*</span>
        </label>
        <StarRating rating={rating} interactive onChange={setRating} size="lg" />
      </div>

      <div className="mb-4">
        <Textarea
          label="Your Review"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder="Share your experience..."
          required
        />
      </div>

      <Button type="submit" isLoading={isCreating} className="w-full">
        Submit Review
      </Button>
    </form>
  );
}
