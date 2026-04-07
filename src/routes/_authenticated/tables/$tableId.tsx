import { createFileRoute } from '@tanstack/react-router'

// TableView is implemented in Ticket 5-C. Placeholder renders until then.
function TableViewPlaceholder() {
  return <div className="p-6 text-muted-foreground">Table view coming soon (Ticket 5-C).</div>
}

export const Route = createFileRoute('/_authenticated/tables/$tableId')({
  component: TableViewPlaceholder,
})
