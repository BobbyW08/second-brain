import { useUIStore } from "@/stores/useUIStore";

export function useCommandDialog() {
  const [commandOpen, setCommandOpen] = useUIStore((state) => [
    state.commandOpen,
    state.setCommandOpen,
  ]);
  
  return {
    open: commandOpen,
    setOpen: setCommandOpen,
  };
}