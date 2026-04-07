import { useState } from "react";
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import dayGridPlugin from '@fullcalendar/daygrid'
import './styles/calendar.css'
import { useCalendarBlocks, useUpdateBlock, useCreateBlock } from '@/queries/calendarBlocks'
import { useCompleteTask } from '@/queries/tasks'
import { useAuth } from '@/context/AuthContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function CalendarView() {
  const { user } = useAuth()
  
  const userId = user?.id
  
  const today = new Date()
  const rangeStart = new Date(today)
  rangeStart.setDate(today.getDate() - 14)
  const rangeEnd = new Date(today)
  rangeEnd.setDate(today.getDate() + 14)
  
  const { data: calendarBlocks } = useCalendarBlocks({
    start: rangeStart.toISOString(),
    end: rangeEnd.toISOString(),
  })
  
  const { mutate: updateBlock } = useUpdateBlock()
  const createBlock = useCreateBlock()
  const completeTask = useCompleteTask(userId ?? '')
  
  const [pendingBlock, setPendingBlock] = useState<{
    start: string
    end: string
  } | null>(null)
  
  const [title, setTitle] = useState('')
  const [blockType, setBlockType] = useState<string>('focus')
  
  const handleConfirm = () => {
    if (!title.trim() || !pendingBlock || !userId) return
    
    createBlock.mutate({
      user_id: userId,
      title: title.trim(),
      start_time: pendingBlock.start,
      end_time: pendingBlock.end,
      block_type: blockType,
      task_id: null,
      color: null,
      google_event_id: null,
      is_synced: null,
    })
    
    setTitle('')
    setBlockType('focus')
    setPendingBlock(null)
  }
  
  return (
    <>
      <FullCalendar
        plugins={[timeGridPlugin, interactionPlugin, dayGridPlugin]}
        initialView="timeGridThreeDay"
        views={{
          timeGridThreeDay: {
            type: 'timeGrid',
            duration: { days: 3 },
            buttonText: '3 day',
          },
        }}
        nowIndicator={true}
        allDaySlot={true}
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        slotLaneContent={(arg) => {
          if (!arg.time) return null;
          
          const ms = arg.time.milliseconds

          const NOON = 12 * 60 * 60 * 1000       // 43200000ms
          const EVENING = 18 * 60 * 60 * 1000    // 64800000ms

          // Only inject label at the start of each zone, not every slot
          const isMorningStart = ms === 6 * 60 * 60 * 1000   // 06:00
          const isAfternoonStart = ms === NOON                 // 12:00
          const isEveningStart = ms === EVENING                // 18:00

          if (isMorningStart) {
            return (
              <div className="zone-label zone-label--morning">
                Morning
              </div>
            )
          }
          if (isAfternoonStart) {
            return (
              <div className="zone-label zone-label--afternoon">
                Afternoon
              </div>
            )
          }
          if (isEveningStart) {
            return (
              <div className="zone-label zone-label--evening">
                Evening
              </div>
            )
          }
          return null
        }}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridDay,timeGridThreeDay,dayGridMonth',
        }}
        height="100%"
        selectable={true}
        select={(info) => {
          setPendingBlock({ start: info.startStr, end: info.endStr })
        }}
        events={(calendarBlocks ?? []).map(block => ({
          id: block.id,
          title: block.title,
          start: block.start_time,
          end: block.end_time,
          extendedProps: { 
            block_type: block.block_type, 
            task_id: block.task_id,
            is_synced: block.is_synced
          },
        }))}
        eventDrop={(info) => {
          updateBlock({
            blockId: info.event.id,
            updates: {
              start_time: info.event.startStr,
              end_time: info.event.endStr,
            },
          })
        }}
        eventResize={(info) => {
          updateBlock({
            blockId: info.event.id,
            updates: {
              end_time: info.event.endStr,
            },
          })
        }}
        eventReceive={(info) => {
          if (!userId) return;
          
          const taskId = info.event.id
          const title = info.event.title
          const start = info.event.startStr
          const end = info.event.endStr

          createBlock.mutate({
            user_id: userId,
            title,
            start_time: start,
            end_time: end,
            block_type: 'task',
            task_id: taskId,
            color: null,
            google_event_id: null,
            is_synced: null,
          })

          completeTask.mutate(taskId)

          // Remove the ghost event FullCalendar added — the real block comes from the DB
          info.event.remove()
        }}
        eventContent={(arg) => (
          <div className="fc-event-main-frame">
            <div className="fc-event-title">{arg.event.title}</div>
            {arg.event.extendedProps.is_synced && (
              <span className="text-[10px] opacity-60 ml-1">G</span>
            )}
          </div>
        )}
      />
      
      <Dialog open={!!pendingBlock} onOpenChange={(open) => {
        if (!open) {
          setPendingBlock(null)
          setTitle('')
          setBlockType('focus')
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New block</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirm()
            }}
            autoFocus
          />
          {/* Block type selector */}
          <div className="flex gap-2 mt-2">
            {['focus', 'task', 'event'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setBlockType(type)}
                className={blockType === type ? 'ring-2 ring-primary rounded px-2 py-1 text-sm capitalize' : 'px-2 py-1 text-sm capitalize'}
              >
                {type}
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => {
              setPendingBlock(null)
              setTitle('')
              setBlockType('focus')
            }}>Cancel</Button>
            <Button onClick={handleConfirm} disabled={!title.trim()}>Add</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}