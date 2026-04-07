import { createFileRoute } from '@tanstack/react-router'
import { TableView } from '@/components/tables/TableView'

export const Route = createFileRoute('/_authenticated/tables/$tableId')({
  component: TableView,
})
