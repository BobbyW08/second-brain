import { createFileRoute } from '@tanstack/react-router'
import { TableView } from '@/components/tables/TableView'

function RouteComponent() {
  const { tableId } = Route.useParams()
  return <TableView tableId={tableId} />
}

export const Route = createFileRoute('/_authenticated/tables/$tableId')({
  component: RouteComponent,
})
