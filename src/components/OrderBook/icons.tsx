/**
 * OrderBook Icons
 * 订单簿视图模式图标
 */

const ACTIVE_COLOR = "#F0B90B";
const INACTIVE_COLOR = "#4B5563";
const BID_COLOR = "#26a17b";
const ASK_COLOR = "#ef4444";

interface IconProps {
  active: boolean;
}

export function BothIcon({ active }: IconProps) {
  const accent = active ? ACTIVE_COLOR : INACTIVE_COLOR;
  const bid = active ? BID_COLOR : INACTIVE_COLOR;
  const ask = active ? ASK_COLOR : INACTIVE_COLOR;
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="1" y="2" width="7" height="2" fill={accent} />
      <rect x="10" y="2" width="7" height="2" fill={accent} />
      <rect x="1" y="6" width="7" height="2" fill={bid} />
      <rect x="10" y="6" width="7" height="2" fill={ask} />
      <rect x="1" y="10" width="7" height="2" fill={bid} />
      <rect x="10" y="10" width="7" height="2" fill={ask} />
      <rect x="1" y="14" width="7" height="2" fill={bid} />
      <rect x="10" y="14" width="7" height="2" fill={ask} />
    </svg>
  );
}

export function BidsIcon({ active }: IconProps) {
  const accent = active ? ACTIVE_COLOR : INACTIVE_COLOR;
  const bid = active ? BID_COLOR : INACTIVE_COLOR;
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="1" y="2" width="16" height="2" fill={accent} />
      <rect x="1" y="6" width="16" height="2" fill={bid} />
      <rect x="1" y="10" width="16" height="2" fill={bid} />
      <rect x="1" y="14" width="16" height="2" fill={bid} />
    </svg>
  );
}

export function AsksIcon({ active }: IconProps) {
  const accent = active ? ACTIVE_COLOR : INACTIVE_COLOR;
  const ask = active ? ASK_COLOR : INACTIVE_COLOR;
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="1" y="2" width="16" height="2" fill={accent} />
      <rect x="1" y="6" width="16" height="2" fill={ask} />
      <rect x="1" y="10" width="16" height="2" fill={ask} />
      <rect x="1" y="14" width="16" height="2" fill={ask} />
    </svg>
  );
}
