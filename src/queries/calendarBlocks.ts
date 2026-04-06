import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/utils/supabase'
import { Tables } from '@/types/database.types'

export type CalendarBlock = Tables<'calendar_blocks'>

export function useCalendarBlocks(dateRange: { start: string; end: string }) {
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
      const { data, error } = await supabase
        .from('calendar_blocks')
        .update(updates)
        .eq('id', blockId)
        .select()
        .throwOnError()
      
      if (error) throw error
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
      const { error } = await supabase
        .from('calendar_blocks')
        .delete()
        .eq('id', blockId)
        .throwOnError()
      
      if (error) throw error
      return blockId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-blocks'] })
    },
  })
}