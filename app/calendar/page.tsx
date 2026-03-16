'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
  CalendarDays,
  Clock,
  ChevronLeft,
  ChevronRight,
  List,
  MoreVertical,
  Edit,
  Trash2,
  X,
  Check,
} from 'lucide-react';

/** 型別定義 */
type CalendarEvent = {
  id: number;
  date: string;
  time: string | null;
  title: string;
  note: string | null;
  user_id: string;
  is_private: boolean;
  created_at?: string;
};

type Holiday = {
  date: string;
  name: string;
  isHoliday: boolean;
};

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<'list' | 'month'>('list');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [holidays, setHolidays] = useState<Record<string, Holiday>>({});
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // 操作選單狀態
  const [actionItem, setActionItem] = useState<CalendarEvent | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // 編輯表單狀態
  const [editForm, setEditForm] = useState<{
    date: string;
    time: string;
    title: string;
  }>({ date: '', time: '', title: '' });

  // 用於 List View 自動滾動
  const listRef = useRef<HTMLDivElement>(null);
  const eventRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // 月曆模式的瀏覽年月
  const [currentDate, setCurrentDate] = useState(new Date());

  // 取得台灣時區 YYYY-MM-DD
  function getTodayStr() {
    return new Date()
      .toLocaleString('sv-SE', { timeZone: 'Asia/Taipei' })
      .slice(0, 10);
  }
  const todayStr = getTodayStr();

  /** 資料讀取 */
  useEffect(() => {
    fetchAllData();
    fetchUserNames();
    const y = new Date().getFullYear();
    fetchHolidays(y);
    fetchHolidays(y + 1);
  }, []);

  async function fetchUserNames() {
    const { data } = await supabase.from('p_user_names').select('user_id, display_name');
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((u: any) => (map[u.user_id] = u.display_name));
      setUserMap(map);
    }
  }

  async function fetchAllData() {
    setLoading(true);
    const { data, error } = await supabase
      .from('p_calendar')
      .select('*')
      .eq('is_private', false)
      .gte('date', todayStr)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) {
      console.error('讀取行事曆失敗', error);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  }

  // 載入台灣國定假日
  async function fetchHolidays(year: number) {
    try {
      const res = await fetch(
        `https://cdn.jsdelivr.net/gh/ruyut/TaiwanCalendar/data/${year}.json`
      );
      if (!res.ok) return;
      const list = await res.json();
      const map: Record<string, Holiday> = {};
      list.forEach((item: any) => {
        let dStr = item.date;
        if (dStr && !dStr.includes('-') && dStr.length === 8) {
          dStr = `${dStr.slice(0, 4)}-${dStr.slice(4, 6)}-${dStr.slice(6, 8)}`;
        }
        if (item.isHoliday) {
          map[dStr] = {
            date: dStr,
            name: item.description || item.name || '國定假日',
            isHoliday: true,
          };
        }
      });
      setHolidays((prev) => ({ ...prev, ...map }));
    } catch (e) {
      console.warn('無法讀取假日資料', e);
    }
  }

  /** 操作功能：刪除與編輯 */
  function handleOpenAction(item: CalendarEvent) {
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
    const { error, data } = await supabase.from('p_calendar').delete().eq('id', actionItem.id).select();
    if (error) {
      alert('刪除失敗：' + error.message);
    } else if (!data || data.length === 0) {
      alert('刪除失敗：權限不足或資料不存在(RLS)');
    } else {
      fetchAllData();
    }
    closeAllModals();
  }

  function onClickEdit() {
    if (!actionItem) return;
    setEditForm({
      date: actionItem.date,
      time: actionItem.time || '',
      title: actionItem.title,
    });
    setShowActionMenu(false);
    setShowEditModal(true);
  }

  async function doUpdate() {
    if (!actionItem) return;
    if (!editForm.date || !editForm.title) {
      alert('日期與標題為必填');
      return;
    }

    const { error, data } = await supabase
      .from('p_calendar')
      .update({
        date: editForm.date,
        time: editForm.time || null,
        title: editForm.title,
      })
      .eq('id', actionItem.id)
      .select();

    if (error) {
      alert('更新失敗：' + error.message);
    } else if (!data || data.length === 0) {
      alert('更新失敗：權限不足或資料不存在(RLS)');
    } else {
      fetchAllData();
    }
    closeAllModals();
  }

  /** 互動邏輯 */
  function goToListAndScroll(dateStr: string) {
    setViewMode('list');
    setTimeout(() => {
      const target = eventRefs.current[dateStr];
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        const futureEvent = events.find((e) => e.date >= dateStr);
        if (futureEvent && eventRefs.current[futureEvent.date]) {
          eventRefs.current[futureEvent.date]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 100);
  }

  /** 渲染組件：列表模式 */
  function renderListView() {
    const todayEvents = events.filter(e => e.date === todayStr);
    const sortedEvents = events;

    return (
      <div className="pb-20 space-y-4" ref={listRef}>
        {/* 今天摘要卡片 */}
        <div className="glass-card p-4">
          <h2 className="font-[family-name:var(--font-headline)] text-lg font-bold mb-2 text-md-on-surface">
            今天是 {todayStr}
          </h2>
          {todayEvents.length > 0 ? (
            <div className="text-md-on-surface-variant">
              今日有 {todayEvents.length} 件事。
            </div>
          ) : (
            <div className="text-md-on-surface-variant">今日無事</div>
          )}
        </div>

        {sortedEvents.length === 0 && (
          <div className="text-center py-10 text-md-on-surface-variant">尚無任何行程記錄</div>
        )}

        {sortedEvents.map((evt) => {
          const isPast = evt.date < todayStr;
          const isToday = evt.date === todayStr;
          const userName = userMap[evt.user_id] || '未知';

          return (
            <div
              key={evt.id}
              ref={(el) => {
                if (el && (!eventRefs.current[evt.date] || eventRefs.current[evt.date] === el)) {
                  eventRefs.current[evt.date] = el;
                }
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                handleOpenAction(evt);
              }}
              className={`relative p-5 glass-card kinetic-glow flex flex-col justify-between min-h-[120px] transition-all select-none
                        ${isToday ? 'ring-1 ring-md-primary' : ''}
                        ${isPast ? 'opacity-60 grayscale-[0.5]' : ''}
                    `}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenAction(evt);
                }}
                className="absolute top-2 right-2 p-1 rounded-full z-10 text-md-on-surface-variant"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start pr-8">
                  <div className={`text-xl font-bold ${isToday ? 'text-md-primary' : 'text-md-on-surface'}`}>
                    {evt.date}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`flex items-center px-2 py-1 rounded-lg text-lg font-bold
                      ${isToday ? 'bg-md-primary/20 text-md-primary' : 'bg-md-surface-container-highest text-md-on-surface-variant'}`}
                  >
                    <Clock className="w-5 h-5 mr-1.5" />
                    {evt.time ? evt.time.slice(0, 5) : '全天'}
                  </div>
                </div>

                <div className="text-xl font-bold leading-relaxed mt-1 text-md-on-surface">
                  {evt.title || '(無標題)'}
                </div>
              </div>

              <div className="flex justify-between items-end mt-4 pt-3 border-t border-md-outline-variant/10">
                <span className="text-sm font-medium break-all mr-2 text-md-on-surface-variant">
                  {evt.note}
                </span>
                <span className="text-sm font-medium whitespace-nowrap text-md-on-surface-variant">
                  {userName}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  /** 渲染組件：月曆模式 */
  function renderMonthView() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDayIndex = firstDay.getDay(); // 0=Sun

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: { type: string; key: string; val?: number; dateStr?: string }[] = [];
    for (let i = 0; i < startDayIndex; i++) {
      cells.push({ type: 'empty', key: `empty-${i}` });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ type: 'day', val: d, dateStr, key: dateStr });
    }

    return (
      <div>
        {/* 月份 Header */}
        <div className="glass-card flex items-center justify-between mb-2 p-2">
          <button
            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
            className="p-2 hover:bg-md-surface-container-highest rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-md-on-surface" />
          </button>
          <div className="font-[family-name:var(--font-headline)] text-lg font-bold text-md-on-surface">
            {year} 年 {month + 1} 月
          </div>
          <button
            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            className="p-2 hover:bg-md-surface-container-highest rounded-full transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-md-on-surface" />
          </button>
        </div>

        {/* 星期 Header */}
        <div className="grid grid-cols-7 text-center mb-1 font-semibold text-sm text-md-on-surface-variant">
          <div className="text-md-error">日</div>
          <div>一</div>
          <div>二</div>
          <div>三</div>
          <div>四</div>
          <div>五</div>
          <div className="text-green-500">六</div>
        </div>

        {/* 日期格 */}
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((cell) => {
            if (cell.type === 'empty') {
              return <div key={cell.key} className="h-14 bg-md-surface-container-low rounded-xl" />;
            }

            const dayEvents = events.filter(e => e.date === cell.dateStr);
            const isHoliday = cell.dateStr ? holidays[cell.dateStr]?.isHoliday : false;
            const isToday = cell.dateStr === todayStr;

            return (
              <div
                key={cell.key}
                onClick={() => cell.dateStr && goToListAndScroll(cell.dateStr)}
                className={`h-14 rounded-xl flex flex-col items-center justify-start pt-1 cursor-pointer relative overflow-hidden transition-all
                            ${isToday ? 'ring-2 ring-md-primary' : ''}
                            ${isHoliday ? 'bg-md-error/10 border border-md-error/20' : 'bg-md-surface-container'}
                        `}
              >
                <span className={`text-sm font-medium ${isHoliday ? 'text-md-error' : 'text-md-on-surface'}`}>
                  {cell.val}
                </span>

                {isHoliday && cell.dateStr && (
                  <span className="text-[9px] text-md-error transform scale-90 truncate max-w-full">
                    {holidays[cell.dateStr].name}
                  </span>
                )}

                <div className="flex gap-0.5 mt-auto mb-1 flex-wrap justify-center px-0.5">
                  {dayEvents.map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-md-primary" />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /** 主渲染 */
  useEffect(() => {
    if (viewMode === 'list' && !loading && events.length > 0) {
      setTimeout(() => {
        eventRefs.current = {};
        const target = eventRefs.current[todayStr];
        if (target) {
          target.scrollIntoView({ behavior: 'auto', block: 'start' });
        } else {
          const future = events.find(e => e.date > todayStr);
          if (future && eventRefs.current[future.date]) {
            eventRefs.current[future.date]?.scrollIntoView({ behavior: 'auto', block: 'start' });
          }
        }
      }, 300);
    }
  }, [loading, viewMode]);

  return (
    <div className="min-h-screen flex flex-col bg-md-background">
      <div className="p-4 pb-20 max-w-4xl mx-auto w-full flex-1 flex flex-col space-y-4">

        {/* Pill Tab 切換 */}
        <div className="flex justify-center">
          <div className="flex bg-md-surface-container-low p-1 rounded-full border border-md-outline-variant/10">
            <button
              onClick={() => setViewMode('month')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2
                ${viewMode === 'month'
                  ? 'bg-md-surface-container-highest text-md-primary'
                  : 'text-md-on-surface-variant hover:text-md-on-surface'
                }`}
            >
              <CalendarDays className="w-4 h-4" />
              月曆
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2
                ${viewMode === 'list'
                  ? 'bg-md-surface-container-highest text-md-primary'
                  : 'text-md-on-surface-variant hover:text-md-on-surface'
                }`}
            >
              <List className="w-4 h-4" />
              列表
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-md-on-surface-variant">
            載入行程中...
          </div>
        ) : (
          <>
            {viewMode === 'list' && renderListView()}
            {viewMode === 'month' && renderMonthView()}
          </>
        )}
      </div>

      {/* 操作選單 */}
      {showActionMenu && actionItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={closeAllModals}>
          <div className="w-full max-w-sm glass-card rounded-2xl overflow-hidden shadow-xl animate-in slide-in-from-bottom-10 fade-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-md-outline-variant/10 text-center font-bold text-md-on-surface">選擇操作</div>
            <div className="flex flex-col">
              <button onClick={onClickEdit} className="flex items-center justify-center gap-2 p-4 border-b border-md-outline-variant/10 text-md-primary font-medium">
                <Edit className="w-5 h-5" /> 編輯行程
              </button>
              <button onClick={onClickDelete} className="flex items-center justify-center gap-2 p-4 text-md-error font-medium">
                <Trash2 className="w-5 h-5" /> 刪除行程
              </button>
            </div>
            <div className="p-2 bg-md-surface-container">
              <button onClick={closeAllModals} className="w-full py-3 rounded-xl border border-md-outline-variant font-bold text-md-on-surface glass-card">
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
              此操作無法復原，該筆行程將會永久刪除。
            </p>
            <div className="flex gap-3">
              <button onClick={closeAllModals} className="flex-1 py-2.5 border border-md-outline-variant rounded-xl font-medium text-md-on-surface">取消</button>
              <button onClick={doDelete} className="flex-1 py-2.5 bg-md-error text-md-on-error rounded-xl font-medium hover:opacity-90">確認刪除</button>
            </div>
          </div>
        </div>
      )}

      {/* 編輯視窗 */}
      {showEditModal && actionItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-6">
          <div className="w-full max-w-md sm:rounded-2xl rounded-t-2xl p-5 shadow-xl h-[70vh] sm:h-auto flex flex-col glass-card">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-md-on-surface">編輯行程</h3>
              <button onClick={closeAllModals} className="p-1 rounded-full text-md-on-surface-variant"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-md-on-surface-variant">日期</label>
                <input
                  type="date"
                  value={editForm.date}
                  onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                  className="w-full p-3 bg-md-surface-container border border-md-outline-variant/10 rounded-xl text-md-on-surface outline-none ring-2 ring-transparent focus:ring-md-primary transition-all min-w-0 appearance-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-md-on-surface-variant">時間 (選填)</label>
                <input
                  type="time"
                  value={editForm.time}
                  onChange={e => setEditForm({ ...editForm, time: e.target.value })}
                  className="w-full p-3 bg-md-surface-container border border-md-outline-variant/10 rounded-xl text-md-on-surface outline-none ring-2 ring-transparent focus:ring-md-primary transition-all min-w-0 appearance-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-md-on-surface-variant">項目 (標題)</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full p-3 bg-md-surface-container border border-md-outline-variant/10 rounded-xl text-md-on-surface outline-none ring-2 ring-transparent focus:ring-md-primary transition-all"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6 pt-4 border-t border-md-outline-variant/10">
              <button onClick={closeAllModals} className="flex-1 py-3 border border-md-outline-variant rounded-xl font-medium text-md-on-surface">取消</button>
              <button onClick={doUpdate} className="flex-1 py-3 primary-gradient text-md-on-primary rounded-full font-bold kinetic-glow active:scale-[0.98] transition-transform flex items-center justify-center gap-2"><Check className="w-5 h-5" /> 儲存變更</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
