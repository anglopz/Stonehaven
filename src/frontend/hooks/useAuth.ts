/**
 * Authentication Hook
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores';
import { LoginData, RegisterData } from '@/types';
import { QUERY_KEYS } from '@/lib/constants';
import { getErrorMessage } from '@/lib/utils';

export function useAuth() {
  const queryClient = useQueryClient();
  const { user, isAuthenticated, setUser, logout: logoutStore } = useAuthStore();

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (data: LoginData) => authApi.login(data),
    onSuccess: (user) => {
      setUser(user);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER] });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => authApi.register(data),
    onSuccess: (user) => {
      setUser(user);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER] });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      logoutStore();
      queryClient.clear();
    },
  });

  const login = async (data: LoginData) => {
    try {
      await loginMutation.mutateAsync(data);
      return { success: true };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  };

  const register = async (data: RegisterData) => {
    try {
      await registerMutation.mutateAsync(data);
      return { success: true };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
      return { success: true };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading: loginMutation.isPending || registerMutation.isPending || logoutMutation.isPending,
    login,
    register,
    logout,
  };
}
