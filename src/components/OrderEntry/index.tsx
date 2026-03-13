'use client';

import { useId, useRef, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMarketStore } from '@/stores/marketStore';
import { usePositionStore } from '@/stores/positionStore';

const PCT_SHORTCUTS = [25, 50, 75, 100] as const;
const LEVERAGE_PRESETS = [1, 5, 10, 20, 50, 100, 125] as const;
type OrderType = 'limit' | 'market';
type Side = 'buy' | 'sell';

interface FormState {
  orderType: OrderType;
  price: string;
  quantity: string;
}

interface Errors {
  price?: string;
  quantity?: string;
}

function validate(state: FormState): Errors {
  const errors: Errors = {};
  if (state.orderType === 'limit' && (!state.price || isNaN(Number(state.price)) || Number(state.price) <= 0)) {
    errors.price = '请输入有效价格';
  }
  if (!state.quantity || isNaN(Number(state.quantity)) || Number(state.quantity) <= 0) {
    errors.quantity = '请输入有效数量';
  }
  return errors;
}

// ── 杠杆选择器 ─────────────────────────────────────────────

interface LeverageSelectorProps {
  leverage: number;
  onChange: (v: number) => void;
}

function LeverageSelector({ leverage, onChange }: LeverageSelectorProps) {
  const [open, setOpen] = useState(false);
  const [inputVal, setInputVal] = useState(String(leverage));
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  useEffect(() => { setInputVal(String(leverage)); }, [leverage]);

  function clamp(v: number) { return Math.min(125, Math.max(1, Math.round(v))); }

  return (
    <div className="relative">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">杠杆</span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-600 transition-colors"
        >
          {leverage}x
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </button>
      </div>

      {open && (
        <div
          ref={popoverRef}
          className="absolute bottom-full mb-2 right-0 z-50 w-64 border border-gray-700 rounded-lg shadow-xl p-4 flex flex-col gap-3"
          style={{ background: '#1a1f2e' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 shrink-0">杠杆</span>
            <input
              type="number"
              min={1}
              max={125}
              value={inputVal}
              onChange={(e) => {
                setInputVal(e.target.value);
                const n = parseInt(e.target.value, 10);
                if (!isNaN(n)) onChange(clamp(n));
              }}
              className="w-16 h-7 bg-gray-800 border border-gray-600 rounded text-xs text-white text-center focus:outline-none focus:border-blue-500"
            />
            <span className="text-xs text-gray-400">x</span>
          </div>
          <input
            type="range"
            min={1}
            max={125}
            step={1}
            value={leverage}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full accent-blue-500 cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>1x</span><span>125x</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {LEVERAGE_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onChange(p)}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  leverage === p ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {p}x
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full h-7 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
          >
            确认
          </button>
        </div>
      )}
    </div>
  );
}

// ── 订单表单 ───────────────────────────────────────────────

interface OrderFormProps {
  side: Side;
  formState: FormState;
  onChange: (patch: Partial<FormState>) => void;
  leverage: number;
  onLeverageChange: (v: number) => void;
}

function OrderForm({ side, formState, onChange, leverage, onLeverageChange }: OrderFormProps) {
  const baseAsset = useMarketStore((s) => s.currentMarket.baseAsset);
  const quoteAsset = useMarketStore((s) => s.currentMarket.quoteAsset);
  const symbol = useMarketStore((s) => s.currentMarket.symbol);
  const addOrder = usePositionStore((s) => s.addOrder);
  const priceInputId = useId();
  const quantityInputId = useId();
  const [errors, setErrors] = useState<Errors>({});

  // Tab 切换时清除错误
  useEffect(() => { setErrors({}); }, [side]);

  const isBuy = side === 'buy';
  const accentBg = isBuy ? '#0ecb81' : '#ef5350';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(formState);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});

    const price = formState.orderType === 'market' ? 0 : Number(formState.price);
    addOrder({
      symbol,
      side,
      type: formState.orderType,
      price,
      quantity: Number(formState.quantity),
      filled: 0,
      status: '未成交',
    });

    const priceDesc = formState.orderType === 'market' ? '市价' : `${formState.price} ${quoteAsset}`;
    toast.success(isBuy ? '买入委托成功' : '卖出委托成功', {
      description: `${formState.quantity} ${baseAsset} @ ${priceDesc}  ${leverage}x`,
      duration: 3000,
    });
    onChange({ price: '', quantity: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 p-3 flex-1" noValidate>
      {/* 限价 / 市价 Tab */}
      <div className="flex rounded overflow-hidden border border-gray-700 text-xs">
        {(['limit', 'market'] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => { onChange({ orderType: type }); setErrors({}); }}
            className={`flex-1 py-1 transition-colors ${
              formState.orderType === type
                ? 'bg-gray-700 text-white font-medium'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {type === 'limit' ? '限价单' : '市价单'}
          </button>
        ))}
      </div>

      {/* 价格 */}
      <div className="space-y-1">
        <Label htmlFor={priceInputId} className="text-xs text-gray-500">价格({quoteAsset})</Label>
        {formState.orderType === 'limit' ? (
          <>
            <div className="relative">
              <Input
                id={priceInputId}
                type="number"
                min="0"
                step="0.01"
                value={formState.price}
                onChange={(e) => { onChange({ price: e.target.value }); setErrors((p) => ({ ...p, price: undefined })); }}
                placeholder="0.00"
                className={`h-8 bg-gray-800 text-white text-xs pr-12 focus-visible:ring-gray-500 ${errors.price ? 'border-red-500' : 'border-gray-600'}`}
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">{quoteAsset}</span>
            </div>
            {errors.price && <p className="text-xs text-red-400">{errors.price}</p>}
          </>
        ) : (
          <div className="h-8 flex items-center px-3 rounded border border-gray-700 bg-gray-800/50">
            <span className="text-xs text-gray-500">以市场最优价成交</span>
          </div>
        )}
      </div>

      {/* 数量 */}
      <div className="space-y-1">
        <Label htmlFor={quantityInputId} className="text-xs text-gray-500">数量({baseAsset})</Label>
        <div className="relative">
          <Input
            id={quantityInputId}
            type="number"
            min="0"
            step="0.000001"
            value={formState.quantity}
            onChange={(e) => { onChange({ quantity: e.target.value }); setErrors((p) => ({ ...p, quantity: undefined })); }}
            placeholder="0.000000"
            className={`h-8 bg-gray-800 text-white text-xs pr-10 focus-visible:ring-gray-500 ${errors.quantity ? 'border-red-500' : 'border-gray-600'}`}
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">{baseAsset}</span>
        </div>
        {errors.quantity && <p className="text-xs text-red-400">{errors.quantity}</p>}
      </div>

      {/* 百分比快捷 */}
      <div className="grid grid-cols-4 gap-1">
        {PCT_SHORTCUTS.map((pct) => (
          <button
            key={pct}
            type="button"
            className="text-xs text-gray-400 bg-gray-800 hover:bg-gray-700 hover:text-gray-200 rounded py-1 transition-colors"
            onClick={() => { onChange({ quantity: String(pct) }); setErrors((p) => ({ ...p, quantity: undefined })); }}
          >
            {pct}%
          </button>
        ))}
      </div>

      {/* 可用余额 */}
      <div className="flex justify-between text-xs text-gray-500">
        <span>可用</span>
        <span className="text-gray-400">-- {isBuy ? quoteAsset : baseAsset}</span>
      </div>

      {/* 杠杆 */}
      <LeverageSelector leverage={leverage} onChange={onLeverageChange} />

      <div className="flex-1" />

      <button
        type="submit"
        className="w-full h-9 rounded-md text-sm font-semibold text-white transition-opacity hover:opacity-90 active:opacity-75"
        style={{ backgroundColor: accentBg }}
      >
        {isBuy ? '买入' : '卖出'} {baseAsset} {leverage}x
      </button>
    </form>
  );
}

// ── 主导出 ─────────────────────────────────────────────────

const INIT_FORM: FormState = { orderType: 'limit', price: '', quantity: '' };

export default function OrderEntry() {
  const [activeSide, setActiveSide] = useState<Side>('buy');
  const [leverage, setLeverage] = useState(10);
  const [forms, setForms] = useState<Record<Side, FormState>>({
    buy: { ...INIT_FORM },
    sell: { ...INIT_FORM },
  });

  function updateForm(side: Side, patch: Partial<FormState>) {
    setForms((prev) => ({ ...prev, [side]: { ...prev[side], ...patch } }));
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      {/* 买入 / 卖出 Tab */}
      <div className="flex border-b border-gray-700 shrink-0">
        {(['buy', 'sell'] as const).map((side) => {
          const isActive = activeSide === side;
          const sideColor = side === 'buy' ? '#0ecb81' : '#ef5350';
          return (
            <button
              key={side}
              onClick={() => setActiveSide(side)}
              className={`relative flex-1 py-2.5 text-sm font-medium transition-colors ${isActive ? '' : 'text-gray-500 hover:text-gray-300'}`}
              style={isActive ? { color: sideColor } : undefined}
            >
              {side === 'buy' ? '买入' : '卖出'}
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: sideColor }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 表单内容 */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <OrderForm
          side={activeSide}
          formState={forms[activeSide]}
          onChange={(patch) => updateForm(activeSide, patch)}
          leverage={leverage}
          onLeverageChange={setLeverage}
        />
      </div>
    </div>
  );
}
