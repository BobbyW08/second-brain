import { useState } from 'react';
import type { TableColumn } from '@/queries/tables';
import { TextCell } from '@/components/tables/cells/TextCell';
import { CheckboxCell } from '@/components/tables/cells/CheckboxCell';
import { SelectCell } from '@/components/tables/cells/SelectCell';
import { DateCell } from '@/components/tables/cells/DateCell';
import { NumberCell } from '@/components/tables/cells/NumberCell';
import { UrlCell } from '@/components/tables/cells/UrlCell';

interface TableCellRendererProps {
  column: TableColumn;
  value: any;
  onChange: (value: any) => void;
}

export const TableCellRenderer = ({ column, value, onChange }: TableCellRendererProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onChange(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // If we're not editing, show the display version
  if (!isEditing) {
    return (
      <div
        role="button"
        tabIndex={0}
        className="cursor-pointer hover:bg-gray-100 p-2 rounded"
        onClick={() => setIsEditing(true)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsEditing(true) }}
      >
        {renderDisplayValue(column.type, value)}
      </div>
    );
  }

  // If we're editing, show the appropriate editor
  return (
    <div className="p-2">
      {renderEditor(column, editValue, (newValue) => setEditValue(newValue), handleKeyDown)}
    </div>
  );
};

const renderDisplayValue = (type: string, value: any) => {
  switch (type) {
    case 'text':
    case 'url':
      return value || '';
    case 'checkbox':
      return value ? '✓' : '✗';
    case 'select':
      return value || '';
    case 'date':
      return value ? new Date(value).toLocaleDateString() : '';
    case 'number':
      return value !== null && value !== undefined ? value.toString() : '';
    default:
      return value || '';
  }
};

const renderEditor = (
  column: TableColumn,
  value: any,
  onChange: (value: any) => void,
  onKeyDown: (e: React.KeyboardEvent) => void
) => {
  switch (column.type) {
    case 'text':
      return (
        <TextCell
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
        />
      );
    case 'checkbox':
      return (
        <CheckboxCell
          value={value}
          onChange={onChange}
        />
      );
    case 'select':
      return (
        <SelectCell
          value={value}
          options={column.options || []}
          onChange={onChange}
        />
      );
    case 'date':
      return (
        <DateCell
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
        />
      );
    case 'number':
      return (
        <NumberCell
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
        />
      );
    case 'url':
      return (
        <UrlCell
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
        />
      );
    default:
      return (
        <TextCell
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
        />
      );
  }
};
