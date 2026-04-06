import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import dayGridPlugin from '@fullcalendar/daygrid'
import './styles/calendar.css'

export function CalendarView() {
  return (
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
    />
  )
}
