'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
  CalendarDays, Clock, ChevronLeft, ChevronRight, List,
  MoreVertical, Edit, Trash2, X, Check,
} from 'lucide-react';

type CalendarEvent = {
  id: number; date: string; time: string | null; title: string;
  note: string | null; user_id: string; is_private: boolean; created_at?: string;
};

type Holiday = { date: string; name: string; isHoliday: boolean; };

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<'list' | 'month'>('list');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [holidays, setHolidays] = useState<Record<string, Holiday>>({});
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [actionItem, setActionItem] = useState<CalendarEvent | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<{ date: string; time: string; title: string }>({ date: '', time: '', title: '' });
  const listRef = useRef<HTMLDivElement>(null);
  const eventRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [currentDate, setCurrentDate] = useState(new Date());

  function getTodayStr() { return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Taipei' }).slice(0, 10); }
  const todayStr = getTodayStr();

  async function fetchUserNames() {
    const { data } = await supabase.from('p_user_names').select('user_id, display_name');
    if (data) { const map: Record<string, string> = {}; data.forEach((u: { user_id: string; display_name: string }) => (map[u.user_id] = u.display_name)); setUserMap(map); }
  }

  async function fetchAllData() {
    setLoading(true);
    const { data, error } = await supabase.from('p_calendar').select('*').eq('is_private', false).gte('date', todayStr).order('date', { ascending: true }).order('time', { ascending: true });
    if (error) console.error('讀取行事曆失敗', error);
    else setEvents(data || []);
    setLoading(false);
  }

  async function fetchHolidays(year: number) {
    try {
      const res = await fetch(`https://cdn.jsdelivr.net/gh/ruyut/TaiwanCalendar/data/${year}.json`);
      if (!res.ok) return;
      const list = await res.json();
      const map: Record<string, Holiday> = {};
      list.forEach((item: { date: string; isHoliday: boolean; description?: string; name?: string }) => {
        let dStr = item.date;
        if (dStr && !dStr.includes('-') && dStr.length === 8) dStr = `${dStr.slice(0, 4)}-${dStr.slice(4, 6)}-${dStr.slice(6, 8)}`;
        if (item.isHoliday) map[dStr] = { date: dStr, name: item.description || item.name || '國定假日', isHoliday: true };
      });
      setHolidays((prev) => ({ ...prev, ...map }));
    } catch (e) { console.warn('無法讀取假日資料', e); }
  }

  useEffect(() => { fetchAllData(); fetchUserNames(); const y = new Date().getFullYear(); fetchHolidays(y); fetchHolidays(y + 1); }, []);

  function handleOpenAction(item: CalendarEvent) { setActionItem(item); setShowActionMenu(true); }
  function closeAllModals() { setActionItem(null); setShowActionMenu(false); setShowDeleteConfirm(false); setShowEditModal(false); }
  function onClickDelete() { setShowActionMenu(false); setShowDeleteConfirm(true); }

  async function doDelete() {
    if (!actionItem) return;
    const { error, data } = await supabase.from('p_calendar').delete().eq('id', actionItem.id).select();
    if (error) alert('刪除失敗：' + error.message);
    else if (!data || data.length === 0) alert('刪除失敗：權限不足或資料不存在(RLS)');
    else fetchAllData();
    closeAllModals();
  }

  function onClickEdit() {
    if (!actionItem) return;
    setEditForm({ date: actionItem.date, time: actionItem.time || '', title: actionItem.title });
    setShowActionMenu(false); setShowEditModal(true);
  }

  async function doUpdate() {
    if (!actionItem) return;
    if (!editForm.date || !editForm.title) { alert('日期與標題為必填'); return; }
    const { error, data } = await supabase.from('p_calendar').update({ date: editForm.date, time: editForm.time || null, title: editForm.title }).eq('id', actionItem.id).select();
    if (error) alert('更新失敗：' + error.message);
    else if (!data || data.length === 0) alert('更新失敗：權限不足或資料不存在(RLS)');
    else fetchAllData();
    closeAllModals();
  }

  function goToListAndScroll(dateStr: string) {
    setViewMode('list');
    setTimeout(() => {
      const target = eventRefs.current[dateStr];
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else { const f = events.find((e) => e.date >= dateStr); if (f && eventRefs.current[f.date]) eventRefs.current[f.date]?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    }, 100);
  }

  function renderListView() {
    const todayEvents = events.filter(e => e.date === todayStr);
    return (
      <div className="pb-20 space-y-4" ref={listRef}>
        <div className="brutalist-card p-4">
          <h2 className="text-lg font-bold mb-2 text-foreground">今天是 {todayStr}</h2>
          {todayEvents.length > 0 ? (
            <div className="text-muted-foreground">今日有 {todayEvents.length} 件事。</div>
          ) : (
            <div className="text-muted-foreground">今日無事</div>
          )}
        </div>
        {events.length === 0 && <div className="text-center py-10 text-muted-foreground">尚無任何行程記錄</div>}
        {events.map((evt) => {
          const isPast = evt.date < todayStr;
          const isToday = evt.date === todayStr;
          const userName = userMap[evt.user_id] || '未知';
          return (
            <div key={evt.id}
              ref={(el) => { if (el && (!eventRefs.current[evt.date] || eventRefs.current[evt.date] === el)) eventRefs.current[evt.date] = el; }}
              onContextMenu={(e) => { e.preventDefault(); handleOpenAction(evt); }}
              className={`relative p-5 brutalist-card flex flex-col justify-between min-h-[120px] transition-all select-none ${isToday ? 'ring-2 ring-primary' : ''} ${isPast ? 'opacity-60 grayscale-[0.5]' : ''}`}>
              <button onClick={(e) => { e.stopPropagation(); handleOpenAction(evt); }} className="absolute top-2 right-2 p-1 rounded-md z-10 text-muted-foreground">
                <MoreVertical className="w-5 h-5" />
              </button>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start pr-8">
                  <div className={`text-xl font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>{evt.date}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`flex items-center px-2 py-1 rounded-md text-lg font-bold ${isToday ? 'bg-primary/20 text-primary' : 'bg-accent text-muted-foreground'}`}>
                    <Clock className="w-5 h-5 mr-1.5" />
                    {evt.time ? evt.time.slice(0, 5) : '全天'}
                  </div>
                </div>
                <div className="text-xl font-bold leading-relaxed mt-1 text-foreground">{evt.title || '(無標題)'}</div>
              </div>
              <div className="flex justify-between items-end mt-4 pt-3 border-t-2 border-primary/10">
                <span className="text-sm font-medium break-all mr-2 text-muted-foreground">{evt.note}</span>
                <span className="text-sm font-medium whitespace-nowrap text-muted-foreground">{userName}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function renderMonthView() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDayIndex = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: { type: string; key: string; val?: number; dateStr?: string }[] = [];
    for (let i = 0; i < startDayIndex; i++) cells.push({ type: 'empty', key: `empty-${i}` });
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ type: 'day', val: d, dateStr, key: dateStr });
    }
    return (
      <div>
        <div className="brutalist-card flex items-center justify-between mb-2 p-2">
          <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 hover:bg-accent rounded-md transition-colors">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="text-lg font-bold text-foreground">{year} 年 {month + 1} 月</div>
          <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 hover:bg-accent rounded-md transition-colors">
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </div>
        <div className="grid grid-cols-7 text-center mb-1 font-semibold text-sm text-muted-foreground">
          <div className="text-destructive">日</div><div>一</div><div>二</div><div>三</div><div>四</div><div>五</div><div className="text-positive">六</div>
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((cell) => {
            if (cell.type === 'empty') return <div key={cell.key} className="h-14 bg-muted rounded-md" />;
            const dayEvents = events.filter(e => e.date === cell.dateStr);
            const isHoliday = cell.dateStr ? holidays[cell.dateStr]?.isHoliday : false;
            const isToday = cell.dateStr === todayStr;
            return (
              <div key={cell.key} onClick={() => cell.dateStr && goToListAndScroll(cell.dateStr)}
                className={`h-14 rounded-md flex flex-col items-center justify-start pt-1 cursor-pointer relative overflow-hidden transition-all ${isToday ? 'ring-2 ring-primary' : ''} ${isHoliday ? 'bg-destructive/10 border border-destructive/20' : 'bg-card border border-primary/20'}`}>
                <span className={`text-sm font-medium ${isHoliday ? 'text-destructive' : 'text-foreground'}`}>{cell.val}</span>
                {isHoliday && cell.dateStr && <span className="text-[9px] text-destructive transform scale-90 truncate max-w-full">{holidays[cell.dateStr].name}</span>}
                <div className="flex gap-0.5 mt-auto mb-1 flex-wrap justify-center px-0.5">
                  {dayEvents.map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary" />)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (viewMode === 'list' && !loading && events.length > 0) {
      setTimeout(() => {
        eventRefs.current = {};
        const target = eventRefs.current[todayStr];
        if (target) target.scrollIntoView({ behavior: 'auto', block: 'start' });
        else { const future = events.find(e => e.date > todayStr); if (future && eventRefs.current[future.date]) eventRefs.current[future.date]?.scrollIntoView({ behavior: 'auto', block: 'start' }); }
      }, 300);
    }
  }, [loading, viewMode]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="p-4 pb-20 max-w-4xl mx-auto w-full flex-1 flex flex-col space-y-4">
        {/* Pill Tab */}
        <div className="flex justify-center">
          <div className="flex bg-muted p-1 rounded-md border-2 border-primary/30">
            <button onClick={() => setViewMode('month')} className={`px-6 py-2 rounded-sm text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'month' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              <CalendarDays className="w-4 h-4" /> 月曆
            </button>
            <button onClick={() => setViewMode('list')} className={`px-6 py-2 rounded-sm text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              <List className="w-4 h-4" /> 列表
            </button>
          </div>
        </div>
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">載入行程中...</div>
        ) : (
          <>
            {viewMode === 'list' && renderListView()}
            {viewMode === 'month' && renderMonthView()}
          </>
        )}
      </div>

      {showActionMenu && actionItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={closeAllModals}>
          <div className="w-full max-w-sm brutalist-card overflow-hidden shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b-2 border-primary/30 text-center font-bold text-foreground">選擇操作</div>
            <div className="flex flex-col">
              <button onClick={onClickEdit} className="flex items-center justify-center gap-2 p-4 border-b-2 border-primary/30 text-primary font-medium"><Edit className="w-5 h-5" /> 編輯行程</button>
              <button onClick={onClickDelete} className="flex items-center justify-center gap-2 p-4 text-destructive font-medium"><Trash2 className="w-5 h-5" /> 刪除行程</button>
            </div>
            <div className="p-2 bg-muted">
              <button onClick={closeAllModals} className="w-full py-3 rounded-md border-2 border-primary font-bold text-foreground bg-card">取消</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && actionItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
          <div className="w-full max-w-sm brutalist-card p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-2 text-foreground">確定要刪除嗎？</h3>
            <p className="mb-6 text-muted-foreground">此操作無法復原，該筆行程將會永久刪除。</p>
            <div className="flex gap-3">
              <button onClick={closeAllModals} className="flex-1 py-2.5 border-2 border-primary rounded-md font-medium text-foreground">取消</button>
              <button onClick={doDelete} className="flex-1 py-2.5 bg-destructive text-destructive-foreground rounded-md font-medium">確認刪除</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && actionItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-6">
          <div className="w-full max-w-md sm:rounded-md rounded-t-md p-5 shadow-xl max-h-[70vh] sm:max-h-none flex flex-col brutalist-card">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-foreground">編輯行程</h3>
              <button onClick={closeAllModals} className="p-1 rounded-md text-muted-foreground"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">日期</label>
                <input type="date" value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                  className="w-full p-3 bg-card border-2 border-primary/50 rounded-md text-foreground outline-none focus:border-primary transition-all min-w-0 appearance-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">時間 (選填)</label>
                <input type="time" value={editForm.time} onChange={e => setEditForm({ ...editForm, time: e.target.value })}
                  className="w-full p-3 bg-card border-2 border-primary/50 rounded-md text-foreground outline-none focus:border-primary transition-all min-w-0 appearance-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">項目 (標題)</label>
                <input type="text" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })}
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