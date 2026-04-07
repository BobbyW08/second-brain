import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/utils/supabase'
import type { Tables } from '@/types/database.types'
import { createGoogleEvent, updateGoogleEvent, deleteGoogleEvent } from '@/server/googleCalendar'

export type CalendarBlock = Tables<'calendar_blocks'>

export function useCalendarBlocks(dateRange: { start: string, end: string }) {
  return useQuery({
    queryKey: ['calendar-blocks', dateRange.start, dateRange.end],
    queryFn: async () => {
      const { data } = await supabase
        .from('calendar_blocks')
        .select('*')
        .gte('start_time', dateRange.start)
        .lte('end_time', dateRange.end)
        .throwOnError()
      return data
    },
  })
}

export function useCreateBlock() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (block: Omit<CalendarBlock, 'id' | 'created_at' | 'updated_at' | 'user_id'> & { user_id: string }) => {
      const { data, error } = await supabase
        .from('calendar_blocks')
        .insert(block)
        .select()
        .throwOnError()
      
      if (error) throw error
      
      // If this is a synced block, also create on Google Calendar
      if (data[0].is_synced) {
        // Get the user's Google tokens from the profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('google_access_token, google_refresh_token')
          .eq('id', data[0].user_id)
          .single()
          .throwOnError()
        
        if (!profileData.google_access_token || !profileData.google_refresh_token) return data[0]
        
        const googleEvent = await createGoogleEvent({
          block: {
            title: data[0].title,
            start_time: data[0].start_time,
            end_time: data[0].end_time,
          },
          accessToken: profileData.google_access_token,
          refreshToken: profileData.google_refresh_token,
        })
        
        // Update the block with the Google event ID
        const { data: updatedData, error: updateError } = await supabase
          .from('calendar_blocks')
          .update({ google_event_id: googleEvent.googleEventId })
          .eq('id', data[0].id)
          .select()
          .throwOnError()
        
        if (updateError) throw updateError
        return updatedData[0]
      }
      
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-blocks'] })
    },
  })
}

export function useUpdateBlock() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ blockId, updates }: { blockId: string; updates: Partial<CalendarBlock> }) => {
      // First get the current block to check if it's synced
      const { data: currentBlock, error: fetchError } = await supabase
        .from('calendar_blocks')
        .select('*')
        .eq('id', blockId)
        .single()
        .throwOnError()
      
      if (fetchError) throw fetchError
      
      const { data, error } = await supabase
        .from('calendar_blocks')
        .update(updates)
        .eq('id', blockId)
        .select()
        .throwOnError()
      
      if (error) throw error
      
      // If this is a synced block and we're updating it, also update on Google Calendar
      if (currentBlock.is_synced && currentBlock.google_event_id) {
        // Get the user's Google tokens from the profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('google_access_token, google_refresh_token')
          .eq('id', currentBlock.user_id)
          .single()
          .throwOnError()
        
        if (!profileData.google_access_token || !profileData.google_refresh_token) return data[0]
        
        const updateData: { title?: string; start_time?: string; end_time?: string } = {}
        if (updates.title !== undefined) updateData.title = updates.title
        if (updates.start_time !== undefined) updateData.start_time = updates.start_time
        if (updates.end_time !== undefined) updateData.end_time = updates.end_time
        
        if (Object.keys(updateData).length > 0) {
          await updateGoogleEvent({
            googleEventId: currentBlock.google_event_id,
            updates: updateData,
            accessToken: profileData.google_access_token,
            refreshToken: profileData.google_refresh_token,
          })
        }
      }
      
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-blocks'] })
    },
  })
}

export function useDeleteBlock() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (blockId: string) => {
      // First get the current block to check if it's synced
      const { data: currentBlock, error: fetchError } = await supabase
        .from('calendar_blocks')
        .select('*')
        .eq('id', blockId)
        .single()
        .throwOnError()
      
      if (fetchError) throw fetchError
      
      const { error } = await supabase
        .from('calendar_blocks')
        .delete()
        .eq('id', blockId)
        .throwOnError()
      
      if (error) throw error
      
      // If this is a synced block, also delete from Google Calendar
      if (currentBlock.is_synced && currentBlock.google_event_id) {
        // Get the user's Google tokens from the profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('google_access_token, google_refresh_token')
          .eq('id', currentBlock.user_id)
          .single()
          .throwOnError()
        
        if (!profileData.google_access_token || !profileData.google_refresh_token) return
        
        await deleteGoogleEvent({
          googleEventId: currentBlock.google_event_id,
          accessToken: profileData.google_access_token,
          refreshToken: profileData.google_refresh_token,
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-blocks'] })
    },
  })
}

// ─── Undo Delete ───────────────────────────────────────────────────────────────

export function useUndoDeleteCalendarBlock() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (blockData: CalendarBlock) => {
      // Re-insert the deleted block with its original data
      const { data, error } = await supabase
        .from('calendar_blocks')
        .insert(blockData)
        .select()
        .throwOnError()
      
      if (error) throw error
      return data[0]
    },
    onMutate: async (blockData) => {
      // Optimistically add the block back to the cache
      queryClient.setQueryData<CalendarBlock[]>(['calendar-blocks'], (old) => [
        ...(old ?? []),
        blockData
      ])
    },
    onError: (_err, _blockData, context) => {
      // Revert optimistic update on error
      queryClient.setQueryData(['calendar-blocks'], context?.previous)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-blocks'] })
    },
  })
}

// ─── Sync Google Events ────────────────────────────────────────────────────────

export function useSyncGoogleEvents() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('google_access_token, google_refresh_token')
        .eq('id', userId)
        .single()
        .throwOnError()

      if (!profile?.google_access_token || !profile?.google_refresh_token) return

      await syncGoogleCalendar({
        data: {
          userId,
          accessToken: profile.google_access_token,
          refreshToken: profile.google_refresh_token,
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-blocks'] })
    },
  })
}
