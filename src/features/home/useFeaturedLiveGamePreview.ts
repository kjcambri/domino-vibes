import { useQuery } from '@tanstack/react-query'
import { getFeaturedLiveGamePreview } from './livePreviewService'
import {
  getLivePreviewPollInterval,
  homePreviewKeys,
} from './livePreviewUtils'

function isDocumentVisible() {
  return typeof document === 'undefined' || document.visibilityState === 'visible'
}

export function useFeaturedLiveGamePreview() {
  return useQuery({
    queryKey: homePreviewKeys.featuredLiveGame(),
    queryFn: getFeaturedLiveGamePreview,
    refetchInterval: () => getLivePreviewPollInterval(isDocumentVisible()),
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    retry: 1,
    staleTime: 5000,
  })
}
