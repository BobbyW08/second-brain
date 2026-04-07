import { Input } from '@/components/ui/input';

interface DateCellProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export const DateCell = ({ value, onChange, onKeyDown }: DateCellProps) => {
  // Convert to ISO format for input field
  const formattedValue = value ? new Date(value).toISOString().split('T')[0] : '';
  
  return (
    <Input
      type="date"
      value={formattedValue}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      autoFocus
    />
  );
};