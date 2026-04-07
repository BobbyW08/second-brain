import { Input } from '@/components/ui/input';

interface NumberCellProps {
  value: number;
  onChange: (value: number) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export const NumberCell = ({ value, onChange, onKeyDown }: NumberCellProps) => {
  return (
    <Input
      type="number"
      value={value !== null && value !== undefined ? value.toString() : ''}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      onKeyDown={onKeyDown}
      autoFocus
    />
  );
};