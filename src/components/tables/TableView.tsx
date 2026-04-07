import { useState, useMemo } from 'react';
import { useTableSchema, useTableRows } from '@/queries/tables';
import { useCreateRow, useUpdateRow } from '@/queries/tableRows';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'luc-react';
import { ColumnDef } from '@tanstack/react-table';
import { TableCellRenderer } from '@/components/tables/cells/TableCellRenderer';
import { useAuth } from '@/context/AuthContext';

interface TableViewProps {
  tableId: string;
}

export const TableView = ({ tableId }: TableViewProps) => {
  const { data: schema, isLoading: schemaLoading, error: schemaError } = useTableSchema(tableId);
  const { data: rows, isLoading: rowsLoading, error: rowsError, refetch } = useTableRows(tableId);
  const createRowMutation = useCreateRow();
  const updateRowMutation = useUpdateRow();

  const [isCreatingRow, setIsCreatingRow] = useState(false);

  // Handle loading and error states
  if (schemaLoading || rowsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (schemaError || rowsError) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold text-red-600">Error loading table data</h2>
        <p className="text-red-500">
          {schemaError?.message || rowsError?.message || 'Unknown error'}
        </p>
      </div>
    );
  }

  if (!schema || !rows) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold">No data available</h2>
      </div>
    );
  }

  // Create columns based on schema
  const columns: ColumnDef<any>[] = useMemo(() => {
    return schema.columns.map((column) => ({
      accessorKey: column.name,
      header: column.name,
      cell: ({ row }) => (
        <TableCellRenderer
          column={column}
          value={row.original[column.name]}
          onChange={(newValue) => {
            updateRowMutation.mutate({
              tableId,
              rowId: row.original.id,
              column: column.name,
              value: newValue,
            });
          }}
        />
      ),
    }));
  }, [schema.columns, tableId, updateRowMutation]);

  // Handle adding a new row
  const handleAddRow = async () => {
    setIsCreatingRow(true);
    try {
      await createRowMutation.mutateAsync({
        tableId,
        data: {},
      });
      // Refetch to get the new row
      await refetch();
    } catch (error) {
      console.error('Error creating row:', error);
    } finally {
      setIsCreatingRow(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Table View</h1>
        <Button onClick={handleAddRow} disabled={isCreatingRow}>
          {isCreatingRow ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Add Row
            </>
          )}
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={rows.data}
        enableSorting
        enableFiltering
        enableColumnVisibility
      />
    </div>
  );
};