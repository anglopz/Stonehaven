/**
 * Review Hook
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsApi } from '@/lib/api';
import { ReviewFormData } from '@/types';
import { QUERY_KEYS } from '@/lib/constants';
import { getErrorMessage } from '@/lib/utils';

export function useReview(campgroundId: string) {
  const queryClient = useQueryClient();

  // Create review mutation
  const createMutation = useMutation({
    mutationFn: (data: ReviewFormData) => reviewsApi.create(campgroundId, data),
    onSuccess: () => {
      // Invalidate campground query to refetch with new review
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CAMPGROUND, campgroundId] });
    },
  });

  // Delete review mutation
  const deleteMutation = useMutation({
    mutationFn: (reviewId: string) => reviewsApi.delete(campgroundId, reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CAMPGROUND, campgroundId] });
    },
  });

  const createReview = async (data: ReviewFormData) => {
    try {
      const result = await createMutation.mutateAsync(data);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  };

  const deleteReview = async (reviewId: string) => {
    try {
      await deleteMutation.mutateAsync(reviewId);
      return { success: true };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  };

  return {
    createReview,
    deleteReview,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
