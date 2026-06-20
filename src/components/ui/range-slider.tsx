import { cn } from "@/lib/utils/cn";

interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  minLabel?: string;
  maxLabel?: string;
  className?: string;
}

export function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  minLabel,
  maxLabel,
  className,
}: RangeSliderProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="px-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="norte-range w-full"
        />
      </div>
      {(minLabel || maxLabel) && (
        <div className="flex justify-between px-3 text-[10px] text-slate-400">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  );
}
