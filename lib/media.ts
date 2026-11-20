import 'server-only'
import { parseClip } from '@/lib/core/media'
import type { Clip } from '@/lib/core/media'
import { createPublicClient } from '@/lib/supabase/public'

/** Approved, curated clips for a word or a grammar topic. Empty when none exist or Supabase is down. */
export async function approvedClips(topicType: 'word' | 'grammar', topicKey: string, limit = 4): Promise<Clip[]> {
  try {
    const { data } = await createPublicClient()
      .from('media_clips')
      .select('id, video_id, start_seconds, end_seconds, transcript, attribution, license')
      .eq('topic_type', topicType)
      .eq('topic_key', topicKey)
      .eq('provider', 'youtube')
      .eq('approved', true)
      .order('created_at', { ascending: true })
      .limit(limit)
    return ((data ?? []) as unknown[]).map(parseClip).filter((c): c is Clip => c !== null)
  } catch {
    return []
  }
}

/** The YouGlish widget is on unless NEXT_PUBLIC_YOUGLISH_ENABLED=false. Commercial use needs their permission. */
export const youglishEnabled = (): boolean => process.env.NEXT_PUBLIC_YOUGLISH_ENABLED !== 'false'
