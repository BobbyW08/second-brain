import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/context/AuthContext'
import { useTodayJournalPage } from '@/queries/pages'
import { useCreateJournalPage } from '@/queries/pages'

export function JournalView() {
  const { user } = useAuth()
  const { data: todayPage, isLoading } = useTodayJournalPage(user?.id ?? '')
  const { mutate: createJournalPage } = useCreateJournalPage()
  const navigate = useNavigate()

  // Auto-create today's entry if it doesn't exist
  useEffect(() => {
    if (isLoading) return

    if (!todayPage) {
      const today = new Date().toISOString().split('T')[0]

      createJournalPage(
        { user_id: user?.id ?? '', journal_date: today },
        { 
          onSuccess: (page) => {
            if (page?.id) {
              navigate({ to: '/journal/$pageId', params: { pageId: page.id } })
            }
          }
        }
      )
    } else {
      if (todayPage?.id) {
        navigate({ to: '/journal/$pageId', params: { pageId: todayPage.id } })
      }
    }
  }, [isLoading, todayPage, user?.id, navigate, createJournalPage])

  // While creating/redirecting, show nothing (or a skeleton)
  return null
}
