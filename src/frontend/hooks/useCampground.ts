/**
 * Campground Hook
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { campgroundsApi } from '@/lib/api';
import { CampgroundFormData } from '@/types';
import { QUERY_KEYS } from '@/lib/constants';
import { getErrorMessage } from '@/lib/utils';

export function useCampground(id?: string) {
  const queryClient = useQueryClient();

  // Get all campgrounds
  const { data: campgrounds, isLoading: isLoadingAll } = useQuery({
    queryKey: [QUERY_KEYS.CAMPGROUNDS],
    queryFn: () => campgroundsApi.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get single campground
  const {
    data: campground,
    isLoading: isLoadingOne,
    error,
  } = useQuery({
    queryKey: [QUERY_KEYS.CAMPGROUND, id],
    queryFn: () => campgroundsApi.getById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  // Create campground mutation
  const createMutation = useMutation({
    mutationFn: (data: CampgroundFormData) => campgroundsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CAMPGROUNDS] });
    },
  });

  // Update campground mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CampgroundFormData }) =>
      campgroundsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CAMPGROUNDS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CAMPGROUND, variables.id] });
    },
  });

  // Delete campground mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => campgroundsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CAMPGROUNDS] });
    },
  });

  const createCampground = async (data: CampgroundFormData) => {
    try {
      const result = await createMutation.mutateAsync(data);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  };

  const updateCampground = async (id: string, data: CampgroundFormData) => {
    try {
      const result = await updateMutation.mutateAsync({ id, data });
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  };

  const deleteCampground = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  };

  return {
    campgrounds,
    campground,
    isLoading: isLoadingAll || isLoadingOne,
    error,
    createCampground,
    updateCampground,
    deleteCampground,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
