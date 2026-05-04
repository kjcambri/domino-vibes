import { logWarn } from '../../lib/logger'
import { supabase } from '../../lib/supabaseClient'
import { type FeaturedLiveGamePreview } from './types'
import { mapFeaturedLiveGamePreviewPayload } from './livePreviewUtils'

export async function getFeaturedLiveGamePreview(): Promise<FeaturedLiveGamePreview | null> {
  const { data, error } = await supabase.rpc('get_featured_live_game_preview')

  if (error) {
    logWarn('[Domino Vibes] featured live game preview failed', { error })
    throw error
  }

  return mapFeaturedLiveGamePreviewPayload(data)
}
