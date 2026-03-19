'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Car, Utensils, ShoppingBag, Gamepad2, Stethoscope, GraduationCap,
  Home, Lamp, Wifi, Plane, Shirt, Gift, Coins,
  ChevronLeft, ChevronRight, MoreVertical, Edit, Trash2, X, Check, BarChart3,
} from 'lucide-react';

type Expense = {
  id: number;
  user_id: string;
  message: string;
  category: string | null;
  note: string;
  amount: number | null;
  time: string;
  intent: string;
  created_at?: string;
};

type NameMap = Record<string, string>;
const NAME_MAP_KEY = 'finance_user_name_map';

const CATEGORIES = [
  '餐飲食品', '交通', '日用品', '娛樂', '醫療', '教育',
  '住房', '水電瓦斯', '電信網路', '旅遊', '服飾美妝', '送費', '雜費',
];

function getToday() {
  return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Taipei' }).slice(0, 10);
}

function shiftDate(dateStr: string, days: number) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function getWeekRange(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(d); mon.setDate(d.getDate() + diffToMon);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  return { start: mon.toISOString().slice(0, 10), end: sun.toISOString().slice(0, 10) };
}

function getMonthRange(dateStr: string) {
  const ym = dateStr.slice(0, 7);
  const y = parseInt(ym.split('-')[0]);
  const m = parseInt(ym.split('-')[1]);
  const lastDay = new Date(y, m, 0).getDate();
  return { start: `${ym}-01`, end: `${ym}-${String(lastDay).padStart(2, '0')}` };
}

function getWeekdayLabel(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const labels = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
  return labels[d.getDay()];
}

function formatAmount(n: number) {
  return n < 0 ? `-$${Math.abs(n).toLocaleString()}` : `$${n.toLocaleString()}`;
}

function CategoryIcon({ category, className }: { category: string; className?: string }) {
  const props = { className: className || 'w-5 h-5' };
  switch (category) {
    case '餐飲食品': return <Utensils {...props} />;
    case '交通': return <Car {...props} />;
    case '日用品': return <ShoppingBag {...props} />;
    case '娛樂': return <Gamepad2 {...props} />;
    case '醫療': return <Stethoscope {...props} />;
    case '教育': return <GraduationCap {...props} />;
    case '住房': return <Home {...props} />;
    case '水電瓦斯': return <Lamp {...props} />;
    case '電信網路': return <Wifi {...props} />;
    case '旅遊': return <Plane {...props} />;
    case '服飾美妝': return <Shirt {...props} />;
    case '送費': return <Gift {...props} />;
    case '雜費': return <Coins {...props} />;
    default: return <Coins {...props} />;
  }
}

function TodayPageContent() {
  const searchParams = useSearchParams();
  const paramDate = searchParams.get('date');

  const [selectedDate, setSelectedDate] = useState(() => paramDate || getToday());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [nameMap, setNameMap] = useState<NameMap>({});
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [rangeMode, setRangeMode] = useState<'day' | 'week' | 'month'>('day');

  // Action menu state
  const [actionItem, setActionItem] = useState<Expense | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ category: '', amount: '', note: '' });

  useEffect(() => { if (paramDate && paramDate !== selectedDate) setSelectedDate(paramDate); }, [paramDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load name map
  useEffect(() => {
    async function loadNames() {
      try {
        const cached = localStorage.getItem(NAME_MAP_KEY);
        if (cached) setNameMap(JSON.parse(cached));
      } catch {}
      const { data } = await supabase.from('p_user_names').select('user_id, display_name');
      if (data) {
        const map: NameMap = {};
        data.forEach((u: { user_id: string; display_name: string }) => (map[u.user_id] = u.display_name));
        setNameMap(map);
        try { localStorage.setItem(NAME_MAP_KEY, JSON.stringify(map)); } catch {}
      }
    }
    loadNames();
  }, []);

  // Fetch expenses
  useEffect(() => {
    async function fetchExpenses() {
      setLoading(true);
      let start = selectedDate, end = selectedDate;
      if (rangeMode === 'week') {
        const r = getWeekRange(selectedDate);
        start = r.start; end = r.end;
      } else if (rangeMode === 'month') {
        const r = getMonthRange(selectedDate);
        start = r.start; end = r.end;
      }
      const { data, error } = await supabase
        .from('p_expenses')
        .select('*')
        .gte('time', start)
        .lte('time', end)
        .order('created_at', { ascending: false });
      if (error) console.error(error);
      setExpenses(data || []);
      setLoading(false);
    }
    fetchExpenses();
  }, [selectedDate, rangeMode]);

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (filterCategory !== 'all' && e.category !== filterCategory) return false;
      return true;
    });
  }, [expenses, filterCategory]);

  const totalAmount = useMemo(() => filtered.reduce((s, e) => s + (e.amount || 0), 0), [filtered]);
  const usedCategories = useMemo(() => [...new Set(expenses.map((e) => e.category).filter(Boolean))], [expenses]);

  // Action handlers
  function handleOpenAction(item: Expense) { setActionItem(item); setShowActionMenu(true); }
  function closeAllModals() { setActionItem(null); setShowActionMenu(false); setShowDeleteConfirm(false); setShowEditModal(false); }
  function onClickDelete() { setShowActionMenu(false); setShowDeleteConfirm(true); }
  function onClickEdit() {
    if (!actionItem) return;
    setEditForm({ category: actionItem.category || '', amount: String(actionItem.amount || 0), note: actionItem.note || '' });
    setShowActionMenu(false);
    setShowEditModal(true);
  }

  async function doDelete() {
    if (!actionItem) return;
    const { error, data } = await supabase.from('p_expenses').delete().eq('id', actionItem.id).select();
    if (error) alert('刪除失敗：' + error.message);
    else if (!data || data.length === 0) alert('刪除失敗：權限不足或資料不存在(RLS)');
    else { setExpenses((prev) => prev.filter((e) => e.id !== actionItem.id)); }
    closeAllModals();
  }

  async function doUpdate() {
    if (!actionItem) return;
    const amt = parseFloat(editForm.amount);
    if (isNaN(amt)) { alert('請輸入正確的金額'); return; }
    const { error, data } = await supabase.from('p_expenses').update({
      category: editForm.category || null,
      amount: amt,
      note: editForm.note,
    }).eq('id', actionItem.id).select();
    if (error) alert('更新失敗：' + error.message);
    else if (!data || data.length === 0) alert('更新失敗：權限不足或資料不存在(RLS)');
    else {
      setExpenses((prev) => prev.map((e) => e.id === actionItem.id ? { ...e, category: editForm.category || null, amount: amt, note: editForm.note } : e));
    }
    closeAllModals();
  }

  function getRangeLabel() {
    if (rangeMode === 'day') return `${selectedDate} (${getWeekdayLabel(selectedDate)})`;
    if (rangeMode === 'week') {
      const r = getWeekRange(selectedDate);
      return `${r.start} ~ ${r.end}`;
    }
    return selectedDate.slice(0, 7);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="p-4 pb-20 max-w-4xl mx-auto w-full flex-1 flex flex-col space-y-4">

        {/* Hero card */}
        <div className="brutalist-card p-5">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setSelectedDate(shiftDate(selectedDate, rangeMode === 'month' ? -30 : rangeMode === 'week' ? -7 : -1))} className="p-2 rounded-md border-2 border-primary/50 text-primary transition-colors hover:bg-accent">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <div className="text-sm text-muted-foreground font-medium">{getRangeLabel()}</div>
            </div>
            <button onClick={() => setSelectedDate(shiftDate(selectedDate, rangeMode === 'month' ? 30 : rangeMode === 'week' ? 7 : 1))} className="p-2 rounded-md border-2 border-primary/50 text-primary transition-colors hover:bg-accent">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center">
            <div className={`text-4xl font-bold ${totalAmount >= 0 ? 'text-positive' : 'text-destructive'}`}>
              {formatAmount(totalAmount)}
            </div>
          </div>
        </div>

        {/* Range mode tabs */}
        <div className="flex justify-center">
          <div className="flex bg-muted p-1 rounded-md border-2 border-primary/30">
            {(['day', 'week', 'month'] as const).map((mode) => (
              <button key={mode} onClick={() => setRangeMode(mode)}
                className={`px-5 py-1.5 rounded-sm text-sm font-medium transition-all ${rangeMode === mode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                {mode === 'day' ? '日' : mode === 'week' ? '週' : '月'}
              </button>
            ))}
          </div>
        </div>

        {/* Category filter only */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
            className="brutalist-card px-3 py-1.5 text-sm text-foreground min-w-0">
            <option value="all">全部分類</option>
            {usedCategories.map((cat) => <option key={cat!} value={cat!}>{cat}</option>)}
          </select>
        </div>

        {/* Expense list */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">載入中...</div>
        ) : filtered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-10">
            <BarChart3 className="w-12 h-12 mb-3 animate-spin-slow" />
            <div>這段期間沒有記帳資料</div>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => {
              const userName = nameMap[item.user_id] || item.user_id;
              return (
                <div key={item.id}
                  onContextMenu={(e) => { e.preventDefault(); handleOpenAction(item); }}
                  className="brutalist-card p-4 flex items-center gap-3 transition-all active:scale-[0.98] select-none relative">
                  <button onClick={(e) => { e.stopPropagation(); handleOpenAction(item); }}
                    className="absolute top-2 right-2 p-1 rounded-md text-muted-foreground z-10">
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Category icon */}
                  <div className="w-10 h-10 rounded-md border-2 border-primary/50 flex items-center justify-center text-primary shrink-0">
                    <CategoryIcon category={item.category || ''} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pr-6">
                    {/* Row 1: category + amount */}
                    <div className="flex justify-between items-center">
                      <div className="font-bold text-foreground truncate">{item.category || '未分類'}</div>
                      <div className={`text-lg font-bold whitespace-nowrap ml-2 ${(item.amount || 0) >= 0 ? 'text-positive' : 'text-destructive'}`}>
                        {formatAmount(item.amount || 0)}
                      </div>
                    </div>
                    {/* Row 2: date + weekday */}
                    <div className="text-sm text-muted-foreground mt-0.5">
                      {item.time}（{getWeekdayLabel(item.time)}）
                    </div>
                    {/* Row 3: message + userName */}
                    <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                      <span className="truncate">{item.message || ''}</span>
                      <span className="whitespace-nowrap ml-2">{userName}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Action menu */}
      {showActionMenu && actionItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={closeAllModals}>
          <div className="w-full max-w-sm brutalist-card overflow-hidden shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b-2 border-primary/30 text-center font-bold text-foreground">選擇操作</div>
            <div className="flex flex-col">
              <button onClick={onClickEdit} className="flex items-center justify-center gap-2 p-4 border-b-2 border-primary/30 text-primary font-medium">
                <Edit className="w-5 h-5" /> 編輯
              </button>
              <button onClick={onClickDelete} className="flex items-center justify-center gap-2 p-4 text-destructive font-medium">
                <Trash2 className="w-5 h-5" /> 刪除
              </button>
            </div>
            <div className="p-2 bg-muted">
              <button onClick={closeAllModals} className="w-full py-3 rounded-md border-2 border-primary font-bold text-foreground bg-card">取消</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {showDeleteConfirm && actionItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
          <div className="w-full max-w-sm brutalist-card p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-2 text-foreground">確定要刪除嗎？</h3>
            <p className="mb-6 text-muted-foreground">此操作無法復原，該筆資料將會永久刪除。</p>
            <div className="flex gap-3">
              <button onClick={closeAllModals} className="flex-1 py-2.5 border-2 border-primary rounded-md font-medium text-foreground">取消</button>
              <button onClick={doDelete} className="flex-1 py-2.5 bg-destructive text-destructive-foreground rounded-md font-medium">確認刪除</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {showEditModal && actionItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-6">
          <div className="w-full max-w-md sm:rounded-md rounded-t-md p-5 shadow-xl max-h-[70vh] sm:max-h-none flex flex-col brutalist-card">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-foreground">編輯記帳</h3>
              <button onClick={closeAllModals} className="p-1 rounded-md text-muted-foreground"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">分類</label>
                <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full p-3 bg-card border-2 border-primary/50 rounded-md text-foreground outline-none focus:border-primary transition-all">
                  <option value="">未分類</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">金額</label>
                <input type="number" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  className="w-full p-3 bg-card border-2 border-primary/50 rounded-md text-foreground outline-none focus:border-primary transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">備註</label>
                <input type="text" value={editForm.note} onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                  className="w-full p-3 bg-card border-2 border-primary/50 rounded-md text-foreground outline-none focus:border-primary transition-all" />
              </div>
            </div>
            <div className="flex gap-3 mt-6 pt-4 border-t-2 border-primary/30">
              <button onClick={closeAllModals} className="flex-1 py-3 border-2 border-primary rounded-md font-medium text-foreground">取消</button>
              <button onClick={doUpdate} className="flex-1 py-3 bg-primary text-primary-foreground rounded-md font-bold active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
                <Check className="w-5 h-5" /> 儲存變更
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">載入中...</div>}>
      <TodayPageContent />
    </Suspense>
  );
}