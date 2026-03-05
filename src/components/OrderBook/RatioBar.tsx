/**
 * Bid/Ask Ratio Bar
 * 买卖盘比例条
 */

interface RatioBarProps {
  bidRatio: number;
  askRatio: number;
}

export function RatioBar({ bidRatio, askRatio }: RatioBarProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-t border-gray-700 text-xs">
      <span className="text-green-400">B {bidRatio}%</span>
      <div className="flex-1 flex h-1.5 rounded overflow-hidden">
        <div className="bg-green-500 h-full transition-all" style={{ width: `${bidRatio}%` }} />
        <div className="bg-red-500 h-full flex-1" />
      </div>
      <span className="text-red-400">{askRatio}% S</span>
    </div>
  );
}
