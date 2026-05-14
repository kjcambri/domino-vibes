import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import { logDebug } from '../../lib/logger'
import { chatKeys } from '../chat/chatUtils'
import { friendsKeys, normalizeFriendSearch } from './friendsUtils'
import {
  cancelFriendRequest,
  getFriendsHub,
  getSpectatorGameRoom,
  heartbeatUserPresence,
  removeFriend,
  respondFriendRequest,
  searchFriendCandidates,
  sendFriendRequest,
} from './friendsService'

const FRIENDS_HUB_POLL_INTERVAL_MS = 15000
const FRIEND_SEARCH_MIN_LENGTH = 2
const USER_PRESENCE_HEARTBEAT_INTERVAL_MS = 30000
const SPECTATOR_POLL_INTERVAL_MS = 2500

export function useFriendsHub() {
  return useQuery({
    queryKey: friendsKeys.hub(),
    queryFn: getFriendsHub,
    refetchInterval: FRIENDS_HUB_POLL_INTERVAL_MS,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  })
}

export function useFriendSearch(query: string) {
  const normalizedQuery = normalizeFriendSearch(query)

  return useQuery({
    queryKey: friendsKeys.search(normalizedQuery),
    queryFn: () => searchFriendCandidates(normalizedQuery),
    enabled: normalizedQuery.length >= FRIEND_SEARCH_MIN_LENGTH,
    staleTime: 10000,
  })
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: friendsKeys.hub() })
      await queryClient.invalidateQueries({ queryKey: ['friends', 'search'] })
    },
  })
}

export function useRespondFriendRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: respondFriendRequest,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: friendsKeys.hub() })
      await queryClient.invalidateQueries({ queryKey: ['friends', 'search'] })
    },
  })
}

export function useCancelFriendRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cancelFriendRequest,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: friendsKeys.hub() })
      await queryClient.invalidateQueries({ queryKey: ['friends', 'search'] })
    },
  })
}

export function useRemoveFriend() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: removeFriend,
    onSuccess: async (_data, friendshipId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: friendsKeys.hub() }),
        queryClient.invalidateQueries({ queryKey: ['friends', 'search'] }),
        queryClient.removeQueries({
          queryKey: chatKeys.messages('direct', friendshipId),
        }),
      ])
    },
  })
}

export function useSpectatorGameRoom(gameId?: string) {
  return useQuery({
    queryKey: friendsKeys.spectatorGame(gameId),
    queryFn: () => getSpectatorGameRoom(gameId!),
    enabled: Boolean(gameId),
    refetchInterval: SPECTATOR_POLL_INTERVAL_MS,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  })
}

export function useFriendsRealtime(enabled = true) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled) {
      return
    }

    const channel = supabase
      .channel('friends-hub')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: friendsKeys.hub() })
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: friendsKeys.hub() })
        },
      )
      .subscribe((status) => {
        logDebug('[Domino Vibes friends realtime]', { status })
      })

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [enabled, queryClient])
}

export function useUserPresenceHeartbeat(enabled = true) {
  useEffect(() => {
    if (!enabled) {
      return
    }

    let isMounted = true
    let timerId: number | undefined

    const tick = () => {
      void heartbeatUserPresence()
        .catch((error) => {
          logDebug('[Domino Vibes presence] heartbeat_user_presence failed', {
            error,
          })
        })
        .finally(() => {
          if (isMounted) {
            timerId = window.setTimeout(
              tick,
              USER_PRESENCE_HEARTBEAT_INTERVAL_MS,
            )
          }
        })
    }

    tick()

    return () => {
      isMounted = false

      if (timerId) {
        window.clearTimeout(timerId)
      }
    }
  }, [enabled])
}

export const friendSearchMinLength = FRIEND_SEARCH_MIN_LENGTH
