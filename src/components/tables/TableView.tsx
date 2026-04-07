import { useState, useMemo } from 'react';
import { useTableSchema, useTableRows } from '@/queries/tables';
import { useCreateRow, useUpdateRow } from '@/queries/tableRows';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { TableCellRenderer } from '@/components/tables/cells/TableCellRenderer';
import { useAuth } from '@/context/AuthContext';

interface TableViewProps {
  tableId: string;
}

export const TableView = ({ tableId }: TableViewProps) => {
  const { data: schema, isLoading: schemaLoading, error: schemaError } = useTableSchema(tableId);
  const { data: rows, isLoading: rowsLoading, error: rowsError, refetch } = useTableRows(tableId);
  const createRowMutation = useCreateRow(tableId);
  const updateRowMutation = useUpdateRow(tableId);
  const { user } = useAuth();

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
  const columns = useMemo(() => {
    // Handle case where schema.columns might be null or undefined
    const columnsArray = schema.columns || [];
    
    // If columns is a JSON string, parse it
    let parsedColumns: any[] = [];
    if (Array.isArray(columnsArray)) {
      parsedColumns = columnsArray;
    } else if (typeof columnsArray === 'string') {
      try {
        parsedColumns = JSON.parse(columnsArray);
      } catch (e) {
        console.error('Failed to parse columns JSON:', e);
        parsedColumns = [];
      }
    }
    
    return parsedColumns;
  }, [schema.columns]);

  // Handle adding a new row
  const handleAddRow = async () => {
    if (!user) return;
    
    setIsCreatingRow(true);
    try {
      await createRowMutation.mutateAsync({
        user_id: user.id,
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
        <Button onClick={handleAddRow} disabled={isCreatingRow || !user}>
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

      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead>
            <tr className="border-b">
              {columns.map((column) => (
                <th key={column.name} className="p-2 text-left border-r">
                  {column.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows?.map((row) => (
              <tr key={row.id} className="border-b">
                {columns.map((column) => (
                  <td key={`${row.id}-${column.name}`} className="p-2 border-r">
                    <TableCellRenderer
                      column={column}
                      value={(row.data as Record<string, unknown>)?.[column.name]}
                      onChange={(newValue) => {
                        updateRowMutation.mutate({
                          rowId: row.id,
                          data: { ...(row.data as Record<string, unknown>), [column.name]: newValue },
                        });
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};