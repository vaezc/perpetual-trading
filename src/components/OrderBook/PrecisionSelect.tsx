"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PRICE_BUCKET_OPTIONS = [0.01, 0.1, 1, 10, 50] as const;

interface PrecisionSelectProps {
  value: number;
  onChange: (value: number) => void;
}

export function PrecisionSelect({ value, onChange }: PrecisionSelectProps) {
  return (
    <Select value={value.toString()} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger className="h-7 w-20 bg-gray-800 border-gray-700 text-xs text-gray-200 px-2 focus:ring-0 focus:ring-offset-0">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-gray-800 border-gray-700 text-xs text-white">
        {PRICE_BUCKET_OPTIONS.map((option) => (
          <SelectItem
            key={option}
            value={option.toString()}
            className="text-xs text-white focus:bg-gray-700 focus:text-white"
          >
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

