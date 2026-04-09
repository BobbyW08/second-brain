import { useCallback, useEffect, useRef, useState } from "react";

export function useAutosave<T>(
	saveFn: (value: T) => void,
	delay: number = 800,
) {
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	const save = useCallback(
		(value: T) => {
			if (timer.current) clearTimeout(timer.current);

			setIsSaving(true);
			timer.current = setTimeout(() => {
				saveFn(value);
				setIsSaving(false);
			}, delay);
		},
		[saveFn, delay],
	);

	// Cancel on unmount
	useEffect(
		() => () => {
			if (timer.current) clearTimeout(timer.current);
		},
		[],
	);

	return { save, isSaving };
}
