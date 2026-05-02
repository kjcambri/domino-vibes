import { supabase } from '../../lib/supabaseClient'

export type Profile = {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

type ProfileRow = {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type ProfileInput = {
  userId: string
  username: string
  displayName: string
}

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, created_at, updated_at')
    .eq('id', userId)
    .maybeSingle<ProfileRow>()

  if (error) {
    throw error
  }

  return data ? toProfile(data) : null
}

export async function createProfile({
  userId,
  username,
  displayName,
}: ProfileInput) {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      username,
      display_name: displayName,
    })
    .select('id, username, display_name, avatar_url, created_at, updated_at')
    .single<ProfileRow>()

  if (error) {
    throw error
  }

  return toProfile(data)
}
