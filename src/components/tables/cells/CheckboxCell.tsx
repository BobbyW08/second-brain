import { Checkbox } from '@/components/ui/checkbox';

interface CheckboxCellProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export const CheckboxCell = ({ value, onChange }: CheckboxCellProps) => {
  return (
    <Checkbox
      checked={value}
      onCheckedChange={onChange}
    />
  );
};