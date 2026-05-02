import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/useAuth'
import { createProfile, getProfile, type ProfileInput } from './profileService'

export function profileQueryKey(userId?: string) {
  return ['profile', userId] as const
}

export function useProfile() {
  const { user, isAuthenticated } = useAuth()

  const profileQuery = useQuery({
    queryKey: profileQueryKey(user?.id),
    queryFn: () => getProfile(user!.id),
    enabled: isAuthenticated && Boolean(user?.id),
  })

  return {
    profile: profileQuery.data ?? null,
    isProfileLoading: profileQuery.isLoading || profileQuery.isFetching,
    hasProfile: Boolean(profileQuery.data),
    profileError: profileQuery.error,
  }
}

export function useCreateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ProfileInput) => createProfile(input),
    onSuccess: (profile) => {
      queryClient.setQueryData(profileQueryKey(profile.id), profile)
    },
  })
}
