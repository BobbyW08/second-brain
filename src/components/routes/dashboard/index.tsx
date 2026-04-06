import { CalendarView } from "@/components/calendar/CalendarView";

export function Route() {
  return (
    <div className="flex-1 p-4">
      <CalendarView />
      {/* TODO: Ticket 3-D — eventReceive wired here for bucket drag */}
    </div>
  );
}