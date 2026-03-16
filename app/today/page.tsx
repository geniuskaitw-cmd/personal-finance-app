'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Car,
  Utensils,
  ShoppingBag,
  Gamepad2,
  Stethoscope,
  GraduationCap,
  Home,
  Lamp,
  Wifi,
  Plane,
  Shirt,
  Gift,
  CircleHelp,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  MoreVertical,
  Edit,
  Trash2,
  X,
  Check,
  BarChart3,
} from 'lucide-react';

type Expense = {
  id: number;
  user_id: string;
  message: string;
  category: string | null;
  note: string;
  amount: number | null;
  time: string; // YYYY-MM-DD
  intent: string;
  created_at?: string;
};

type NameMap = Record<string, string>;
const NAME_MAP_KEY = 'finance_user_name_map';

const CATEGORIES = [
  '餐飲食品', '交通', '日用品', '娛樂', '醫療', '教育',
  '住房', '水電瓦斯', '電信網路', '旅遊', '服飾美妝', '送費'
];

// 取得今天 YYYY-MM-DD（台灣時區）
function getToday() {
  return new Date()
    .toLocaleString('sv-SE', { timeZone: 'Asia/Taipei' })
    .slice(0, 10);
}

// 偏移日期天數（offset: +1 明天、-1 昨天）
function shiftDate(dateStr: string, offset: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

// 取得指定日期所在週的日期（週一～週日）陣列
function getWeekRange(dateStr: string): string[] {
  const d = new Date(dateStr);
  const day = d.getDay() === 0 ? 7 : d.getDay(); // Sunday=0 調整為 7

  const monday = new Date(d);
  monday.setDate(d.getDate() - (day - 1));

  const list: string[] = [];
  for (let i = 0; i < 7; i++) {
    const tmp = new Date(monday);
    tmp.setDate(monday.getDate() + i);
    list.push(tmp.toISOString().slice(0, 10));
  }
  return list;
}

// 取得指定月份所有日期 YYYY-MM-DD 陣列
function getMonthRange(dateStr: string): string[] {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth();

  const result: string[] = [];
  const first = new Date(year, month, 1);

  let cur = first;
  while (cur.getMonth() === month) {
    result.push(cur.toISOString().slice(0, 10));
    cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
  }

  return result;
}

// 取得星期幾
function getWeekdayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay();
  switch (day) {
    case 0: return '週日';
    case 1: return '週一';
    case 2: return '週二';
    case 3: return '週三';
    case 4: return '週四';
    case 5: return '週五';
    case 6: return '週六';
    default: return '';
  }
}

// 格式化金額
function formatAmount(value: number): string {
  return value.toLocaleString('en-US');
}

// Icon mapping：依類別回傳 Icon 元件
function CategoryIcon({ category }: { category: string | null }) {
  const cat = category ?? '';

  if (cat === '餐飲食品') return <Utensils className="w-8 h-8" />;
  if (cat === '交通') return <Car className="w-8 h-8" />;
  if (cat === '日用品') return <ShoppingBag className="w-8 h-8" />;
  if (cat === '娛樂') return <Gamepad2 className="w-8 h-8" />;
  if (cat === '醫療') return <Stethoscope className="w-8 h-8" />;
  if (cat === '教育') return <GraduationCap className="w-8 h-8" />;
  if (cat === '住房') return <Home className="w-8 h-8" />;
  if (cat === '水電瓦斯') return <Lamp className="w-8 h-8" />;
  if (cat === '電信網路') return <Wifi className="w-8 h-8" />;
  if (cat === '旅遊') return <Plane className="w-8 h-8" />;
  if (cat === '服飾美妝') return <Shirt className="w-8 h-8" />;
  if (cat === '送費') return <Gift className="w-8 h-8" />;

  return <CircleHelp className="w-8 h-8" />;
}

function TodayPageContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState<string>(getToday());
  const [mode, setMode] = useState<'day' | 'week' | 'month'>('day');
  const [sort, setSort] = useState<
    'time-desc' | 'time-asc' | 'amount-desc' | 'amount-asc'
  >('time-desc');
  const [nameMap, setNameMap] = useState<NameMap>({});

  // 操作選單狀態
  const [actionItem, setActionItem] = useState<Expense | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // 編輯表單狀態
  const [editForm, setEditForm] = useState<{
    time: string;
    amount: string;
    note: string;
    category: string;
  }>({ time: '', amount: '', note: '', category: '' });

  /** 讀取 URL 參數中的 date */
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      setCurrentDate(dateParam);
    }
  }, [searchParams]);

  /** 名稱 map：從 Supabase 讀取 user_names */
  useEffect(() => {
    async function loadNameMap() {
      try {
        const { data, error } = await supabase
          .from('p_user_names')
          .select('user_id, display_name');

        if (error) {
          console.error('讀取暱稱失敗', error);
          const raw = localStorage.getItem(NAME_MAP_KEY);
          if (raw) setNameMap(JSON.parse(raw) as NameMap);
          return;
        }

        const map: NameMap = {};
        (data || []).forEach((row: { user_id: string; display_name: string }) => {
          map[row.user_id] = row.display_name;
        });
        setNameMap(map);
        localStorage.setItem(NAME_MAP_KEY, JSON.stringify(map));
      } catch (e) {
        console.warn('讀取暱稱發生錯誤', e);
      }
    }

    loadNameMap();
  }, []);

  /** 載入資料依模式決定日期範圍 */
  async function loadData() {
    setLoading(true);

    let dates: string[] = [];
    if (mode === 'day') {
      dates = [currentDate];
    } else if (mode === 'week') {
      dates = getWeekRange(currentDate);
    } else if (mode === 'month') {
      dates = getMonthRange(currentDate);
    }

    const { data, error } = await supabase
      .from('p_expenses')
      .select('*')
      .in('time', dates)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      setData([]);
    } else {
      const list = (data || []).slice();

      list.sort((a, b) => {
        if (sort === 'amount-desc') return (b.amount ?? 0) - (a.amount ?? 0);
        if (sort === 'amount-asc') return (a.amount ?? 0) - (b.amount ?? 0);
        if (sort === 'time-desc') return (b.created_at ?? '').localeCompare(a.created_at ?? '');
        if (sort === 'time-asc') return (a.created_at ?? '').localeCompare(b.created_at ?? '');
        return 0;
      });

      setData(list);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, mode, sort]);

  /** 操作功能：刪除與編輯 */
  function handleOpenAction(item: Expense) {
    setActionItem(item);
    setShowActionMenu(true);
  }

  function closeAllModals() {
    setActionItem(null);
    setShowActionMenu(false);
    setShowDeleteConfirm(false);
    setShowEditModal(false);
  }

  function onClickDelete() {
    setShowActionMenu(false);
    setShowDeleteConfirm(true);
  }

  async function doDelete() {
    if (!actionItem) return;

    const { error, data } = await supabase
      .from('p_expenses')
      .delete()
      .eq('id', actionItem.id)
      .select();

    if (error) {
      alert('刪除失敗：' + error.message);
    } else if (!data || data.length === 0) {
      alert('刪除失敗：可能是權限不足 (RLS) 或找不到該筆資料，請檢查 Supabase 的 Delete Policy。');
    } else {
      loadData();
    }
    closeAllModals();
  }

  function onClickEdit() {
    if (!actionItem) return;
    setEditForm({
      time: actionItem.time,
      amount: String(actionItem.amount ?? 0),
      note: actionItem.note || actionItem.message || '',
      category: actionItem.category || '',
    });
    setShowActionMenu(false);
    setShowEditModal(true);
  }

  async function doUpdate() {
    if (!actionItem) return;

    const amountVal = parseFloat(editForm.amount);
    if (isNaN(amountVal)) {
      alert('請輸入正確金額');
      return;
    }

    const { error, data } = await supabase
      .from('p_expenses')
      .update({
        time: editForm.time,
        amount: amountVal,
        note: editForm.note,
        category: editForm.category,
        message: editForm.note
      })
      .eq('id', actionItem.id)
      .select();

    if (error) {
      alert('更新失敗：' + error.message);
    } else if (!data || data.length === 0) {
      alert('更新失敗：可能是權限不足 (RLS) 或找不到該筆資料，請檢查 Supabase 的 Update Policy。');
    } else {
      loadData();
    }
    closeAllModals();
  }

  /** Header 顯示：日期標籤 + 總金額 */
  const { headerDateLabel, headerAmount } = useMemo(() => {
    let dateLabel = '';
    if (mode === 'day') {
      const weekday = getWeekdayLabel(currentDate);
      dateLabel = `${currentDate}（${weekday}）`;
    } else if (mode === 'week') {
      const range = getWeekRange(currentDate);
      const start = range[0];
      const end = range[range.length - 1];
      dateLabel = `${start} ~ ${end}`;
    } else if (mode === 'month') {
      const d = new Date(currentDate);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      dateLabel = `${y}-${m}`;
    }

    const total = data.reduce((sum, item) => sum + (item.amount ?? 0), 0);
    const label = `$ ${formatAmount(total)}`;

    return {
      headerDateLabel: dateLabel,
      headerAmount: label,
    };
  }, [currentDate, mode, data]);

  /** 左右切換「基準日期」依模式不同 */
  function handlePrev() {
    if (mode === 'day') {
      setCurrentDate(shiftDate(currentDate, -1));
    } else if (mode === 'week') {
      setCurrentDate(shiftDate(currentDate, -7));
    } else {
      const d = new Date(currentDate);
      d.setMonth(d.getMonth() - 1);
      setCurrentDate(d.toISOString().slice(0, 10));
    }
  }

  function handleNext() {
    if (mode === 'day') {
      setCurrentDate(shiftDate(currentDate, 1));
    } else if (mode === 'week') {
      setCurrentDate(shiftDate(currentDate, 7));
    } else {
      const d = new Date(currentDate);
      d.setMonth(d.getMonth() + 1);
      setCurrentDate(d.toISOString().slice(0, 10));
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-md-background">
      <div className="p-4 pb-20 max-w-4xl mx-auto w-full space-y-6">

        {/* Hero Section */}
        <div className="flex items-start justify-between">
          <section className="relative overflow-hidden pt-4 flex-1">
            <div className="flex flex-col items-start space-y-2">
              <span className="font-[family-name:var(--font-body)] text-xs uppercase tracking-widest text-md-on-surface-variant opacity-70">
                總金額
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-[family-name:var(--font-headline)] text-5xl md:text-7xl font-bold text-md-primary text-glow tracking-tighter">
                  {headerAmount}
                </span>
              </div>
            </div>
            <div className="absolute -right-20 -top-20 w-64 h-64 primary-gradient opacity-10 rounded-full blur-[100px]" />
          </section>

          <a
            href="/monthly"
            className="flex items-center justify-center w-12 h-12 rounded-full bg-md-surface-container-highest text-md-on-surface mt-4 transition-colors hover:bg-md-surface-container-high"
          >
            <LayoutGrid className="w-6 h-6" />
          </a>
        </div>

        {/* Date Selector */}
        <div className="glass-card rounded-xl p-4 flex items-center justify-between border-l-2 border-md-primary/30">
          <button onClick={handlePrev} className="p-2 hover:bg-md-surface-container-highest rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-md-primary" />
          </button>
          <h2 className="font-[family-name:var(--font-headline)] text-lg font-medium text-md-on-surface">
            {headerDateLabel}
          </h2>
          <button onClick={handleNext} className="p-2 hover:bg-md-surface-container-highest rounded-full transition-colors">
            <ChevronRight className="w-5 h-5 text-md-primary" />
          </button>
        </div>

        {/* Pill Tabs + Sort */}
        <div className="flex items-center justify-between">
          <div className="flex bg-md-surface-container-low p-1 rounded-full border border-md-outline-variant/10">
            {(['day', 'week', 'month'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all
                  ${mode === m
                    ? 'bg-md-surface-container-highest text-md-primary'
                    : 'text-md-on-surface-variant hover:text-md-on-surface'
                  }`}
              >
                {m === 'day' ? '日' : m === 'week' ? '週' : '月'}
              </button>
            ))}
          </div>

          <select
            value={sort}
            onChange={(e) =>
              setSort(
                e.target.value as
                | 'time-desc'
                | 'time-asc'
                | 'amount-desc'
                | 'amount-asc',
              )
            }
            className="bg-md-surface-container border border-md-outline-variant/10 rounded-xl px-3 py-2 text-xs text-md-on-surface"
          >
            <option value="time-desc">時間：新 → 舊</option>
            <option value="time-asc">時間：舊 → 新</option>
            <option value="amount-desc">金額：大 → 小</option>
            <option value="amount-asc">金額：小 → 大</option>
          </select>
        </div>

        {/* Loading state */}
        {loading && (
          <p className="text-center mt-4 text-md-on-surface-variant">載入中...</p>
        )}

        {/* Empty State */}
        {!loading && data.length === 0 && (
          <section className="flex flex-col items-center justify-center py-20 px-4 space-y-8 glass-card rounded-2xl border border-md-outline-variant/5 min-h-[400px]">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-2 border-dashed border-md-primary/20 animate-spin-slow" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 glass-card rounded-2xl flex items-center justify-center kinetic-glow rotate-45 border border-md-primary/20">
                  <BarChart3 className="w-8 h-8 text-md-primary-fixed-dim -rotate-45" />
                </div>
              </div>
            </div>
            <div className="text-center space-y-3">
              <h3 className="font-[family-name:var(--font-headline)] text-2xl font-semibold text-md-on-surface tracking-wide">沒有資料</h3>
              <p className="text-md-on-surface-variant max-w-xs mx-auto text-sm leading-relaxed">
                目前沒有此時段的記帳資料。
              </p>
            </div>
          </section>
        )}

        {/* Expense Cards */}
        <div className="space-y-3">
          {data.map((item) => {
            const amount = item.amount ?? 0;
            let amountColorClass = 'text-md-on-surface-variant';
            if (amount < 0) amountColorClass = 'text-md-error';
            else if (amount > 0) amountColorClass = 'text-green-500';

            const weekday = getWeekdayLabel(item.time);
            const displayUser = nameMap[item.user_id] || item.user_id;

            return (
              <div
                key={item.id}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleOpenAction(item);
                }}
                className="relative flex items-center p-4 pl-6 glass-card kinetic-glow group select-none"
              >
                {/* 左上角更多按鈕 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenAction(item);
                  }}
                  className="absolute top-1 left-1 p-1 rounded-full z-10 text-md-on-surface-variant"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {/* Icon */}
                <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 mr-4 bg-md-surface-container-highest text-md-on-surface">
                  <CategoryIcon category={item.category} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <div className="flex justify-between items-start">
                    <div className="font-bold text-lg truncate pr-2 text-md-on-surface">
                      {item.category || '未分類'}
                    </div>
                    <div className={`text-2xl font-bold ${amountColorClass} leading-none whitespace-nowrap`}>
                      {amount !== 0 ? formatAmount(amount) : '-'}
                    </div>
                  </div>

                  <div className="text-sm text-md-on-surface-variant">
                    {item.time}（{weekday}）
                  </div>

                  <div className="flex justify-between items-end min-h-[1.25rem]">
                    <div className="line-clamp-1 text-sm flex-1 pr-2 text-md-on-surface-variant">
                      {item.note || item.message}
                    </div>
                    <div className="text-sm whitespace-nowrap text-md-on-surface-variant">
                      {displayUser}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 操作選單 (Action Sheet) */}
      {showActionMenu && actionItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={closeAllModals}>
          <div className="w-full max-w-sm glass-card rounded-2xl overflow-hidden shadow-xl animate-in slide-in-from-bottom-10 fade-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-md-outline-variant/10 text-center font-bold text-md-on-surface">
              選擇操作
            </div>
            <div className="flex flex-col">
              <button
                onClick={onClickEdit}
                className="flex items-center justify-center gap-2 p-4 border-b border-md-outline-variant/10 text-md-primary font-medium"
              >
                <Edit className="w-5 h-5" />
                編輯紀錄
              </button>
              <button
                onClick={onClickDelete}
                className="flex items-center justify-center gap-2 p-4 text-md-error font-medium"
              >
                <Trash2 className="w-5 h-5" />
                刪除紀錄
              </button>
            </div>
            <div className="p-2 bg-md-surface-container">
              <button
                onClick={closeAllModals}
                className="w-full py-3 rounded-xl border border-md-outline-variant font-bold text-md-on-surface glass-card"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 刪除確認 */}
      {showDeleteConfirm && actionItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
          <div className="w-full max-w-sm glass-card rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-2 text-md-on-surface">確定要刪除嗎？</h3>
            <p className="mb-6 text-md-on-surface-variant">
              此操作無法復原，該筆記帳紀錄將會永久刪除。
            </p>
            <div className="flex gap-3">
              <button
                onClick={closeAllModals}
                className="flex-1 py-2.5 border border-md-outline-variant rounded-xl font-medium text-md-on-surface"
              >
                取消
              </button>
              <button
                onClick={doDelete}
                className="flex-1 py-2.5 bg-md-error text-md-on-error rounded-xl font-medium hover:opacity-90"
              >
                確認刪除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 編輯視窗 */}
      {showEditModal && actionItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-6">
          <div className="w-full max-w-md sm:rounded-2xl rounded-t-2xl p-5 shadow-xl h-[85vh] sm:h-auto flex flex-col glass-card">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-md-on-surface">編輯記帳</h3>
              <button onClick={closeAllModals} className="p-1 rounded-full text-md-on-surface-variant">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-md-on-surface-variant">日期</label>
                <input
                  type="date"
                  value={editForm.time}
                  onChange={e => setEditForm({ ...editForm, time: e.target.value })}
                  className="w-full min-w-0 appearance-none p-3 bg-md-surface-container border border-md-outline-variant/10 rounded-xl text-md-on-surface outline-none ring-2 ring-transparent focus:ring-md-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-md-on-surface-variant">金額</label>
                <input
                  type="number"
                  value={editForm.amount}
                  onChange={e => setEditForm({ ...editForm, amount: e.target.value })}
                  className="w-full p-3 bg-md-surface-container border border-md-outline-variant/10 rounded-xl text-md-on-surface outline-none ring-2 ring-transparent focus:ring-md-primary transition-all font-mono text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-md-on-surface-variant">項目 (備註)</label>
                <input
                  type="text"
                  value={editForm.note}
                  onChange={e => setEditForm({ ...editForm, note: e.target.value })}
                  className="w-full p-3 bg-md-surface-container border border-md-outline-variant/10 rounded-xl text-md-on-surface outline-none ring-2 ring-transparent focus:ring-md-primary transition-all"
                  placeholder="例如午餐便當..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-md-on-surface-variant">類別</label>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setEditForm({ ...editForm, category: cat })}
                      className={`p-2 rounded-lg text-xs font-medium border transition-all
                        ${editForm.category === cat
                          ? 'bg-md-primary text-md-on-primary border-md-primary'
                          : 'bg-md-surface-container text-md-on-surface border-md-outline-variant/10'
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-md-outline-variant/10">
              <button
                onClick={closeAllModals}
                className="flex-1 py-3 border border-md-outline-variant rounded-xl font-medium text-md-on-surface"
              >
                取消
              </button>
              <button
                onClick={doUpdate}
                className="flex-1 py-3 primary-gradient text-md-on-primary rounded-full font-bold kinetic-glow active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                儲存變更
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function TodayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-md-background"><p className="text-md-on-surface-variant">載入中...</p></div>}>
      <TodayPageContent />
    </Suspense>
  );
}
