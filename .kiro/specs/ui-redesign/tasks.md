# 實作任務

## 任務 1：設計 Token 系統與全域樣式

- [x] 1.1 更新 `app/globals.css`：在 `:root` 中定義所有 `--md-*` 暗色主題 CSS 變數（background、on-surface、primary、primary-container、secondary、tertiary、tertiary-container、error、五個 surface 層級、outline、outline-variant、on-surface-variant、on-primary、on-tertiary、inverse-surface、inverse-on-surface）
- [x] 1.2 在 `app/globals.css` 中新增 `@media (prefers-color-scheme: light)` 區塊，覆寫所有 CSS 變數為淺色主題值
- [x] 1.3 在 `app/globals.css` 中新增 Tailwind CSS 4 的 `@theme inline` 區塊，將 `--md-*` 變數映射為 Tailwind 工具類別
- [x] 1.4 在 `app/globals.css` 中定義字型變數 `--font-headline` 與 `--font-body`
- [x] 1.5 在 `app/globals.css` 中新增玻璃擬態（glass card）、動態光暈（kinetic glow）、空狀態旋轉動畫等 CSS 工具類別
- [x] 1.6 在 `app/globals.css` 中新增 `@supports (backdrop-filter: blur(20px))` 漸進增強規則
- [x] 1.7 在 `app/globals.css` 中新增 `@media (prefers-reduced-motion: reduce)` 規則以降低動畫效果

## 任務 2：字型載入與共用佈局

- [x] 2.1 更新 `app/layout.tsx`：透過 `next/font/google` 載入 Space Grotesk（字重 300-700, display: swap）與 Inter（字重 300-600, display: swap），並將 CSS 變數類別套用至 `<html>` 元素
- [x] 2.2 更新 `app/layout.tsx`：實作 sticky Top App Bar，使用 `backdrop-blur-md` 與半透明背景，顯示應用程式圖示與標題
- [x] 2.3 更新 `app/layout.tsx`：實作 fixed Bottom Navigation Bar，使用 `usePathname()` 判斷活躍狀態，四個導航項目（記帳、行事曆、統計、設定）使用 pill 形狀活躍指示器，`/monthly` 路由歸屬於「記帳」tab
- [x] 2.4 更新 `app/layout.tsx`：新增兩個背景裝飾性模糊光圈（primary 左上、secondary 右下），使用 `fixed pointer-events-none -z-10`

## 任務 3：記帳頁面（/today）重新設計

- [x] 3.1 更新 `app/today/page.tsx`：將總金額改為 Hero section 風格（`font-headline text-5xl md:text-7xl text-primary` + 文字光暈效果）
- [x] 3.2 更新 `app/today/page.tsx`：將日期切換器改為 Glass Card 容器 + `border-l-2 border-primary/30` 裝飾
- [x] 3.3 更新 `app/today/page.tsx`：將日/週/月 tab 從底線式改為 Pill Tab 風格
- [x] 3.4 更新 `app/today/page.tsx`：將記帳卡片改為 Glass Card 樣式
- [x] 3.5 更新 `app/today/page.tsx`：將空狀態改為旋轉虛線圓圈動畫 + Glass Card 容器
- [x] 3.6 更新 `app/today/page.tsx`：將 Modal（編輯、刪除確認）改為 Glass Card + `backdrop-blur-sm` overlay
- [x] 3.7 更新 `app/today/page.tsx`：將內容最大寬度從 `max-w-md` 改為 `max-w-4xl`
- [x] 3.8 驗證 `app/today/page.tsx`：確認所有 Supabase CRUD 查詢邏輯未被修改

## 任務 4：行事曆頁面（/calendar）重新設計

- [x] 4.1 更新 `app/calendar/page.tsx`：將切換按鈕改為 Pill Tab 風格
- [x] 4.2 更新 `app/calendar/page.tsx`：將今日狀態卡與事件卡片改為 Glass Card 樣式，事件卡片加上 Kinetic Glow
- [x] 4.3 更新 `app/calendar/page.tsx`：將月曆格子改為 `bg-surface-container rounded-xl` 樣式
- [x] 4.4 更新 `app/calendar/page.tsx`：將假日標示改為 `bg-error/10 border-error/20` 樣式
- [x] 4.5 更新 `app/calendar/page.tsx`：將內容最大寬度從 `max-w-md` 改為 `max-w-4xl`
- [x] 4.6 驗證 `app/calendar/page.tsx`：確認所有 Supabase CRUD 查詢邏輯未被修改

## 任務 5：月曆總覽頁面（/monthly）重新設計

- [x] 5.1 更新 `app/monthly/page.tsx`：將月份切換器改為 Glass Card 容器
- [x] 5.2 更新 `app/monthly/page.tsx`：將星期列改為 `text-on-surface-variant uppercase tracking-widest` 樣式
- [x] 5.3 更新 `app/monthly/page.tsx`：將日期格子改為 `bg-surface-container-high rounded-xl` 樣式，今日標示使用 `bg-primary-container text-on-primary`
- [x] 5.4 更新 `app/monthly/page.tsx`：將底部統計區域改為 Glass Card + bento grid 風格
- [x] 5.5 更新 `app/monthly/page.tsx`：將內容最大寬度從 `max-w-md` 改為 `max-w-4xl`
- [x] 5.6 驗證 `app/monthly/page.tsx`：確認所有 Supabase 查詢邏輯未被修改

## 任務 6：統計頁面（/stats）重新設計

- [x] 6.1 更新 `app/stats/page.tsx`：將圓餅圖容器改為 Glass Card + Kinetic Glow 樣式
- [x] 6.2 更新 `app/stats/page.tsx`：將分類列表改為 Glass Card 樣式
- [x] 6.3 更新 `app/stats/page.tsx`：將進度條背景改為 `bg-surface-container-low` 樣式
- [x] 6.4 更新 `app/stats/page.tsx`：將趨勢圖 Modal 改為 Glass Card + `backdrop-blur-sm` overlay
- [x] 6.5 更新 `app/stats/page.tsx`：將內容最大寬度從 `max-w-md` 改為 `max-w-4xl`
- [x] 6.6 驗證 `app/stats/page.tsx`：確認所有 Supabase 查詢邏輯未被修改

## 任務 7：設定頁面（/settings）重新設計

- [x] 7.1 更新 `app/settings/page.tsx`：將標題改為 `font-headline text-xl tracking-tight` 樣式
- [x] 7.2 更新 `app/settings/page.tsx`：將表單輸入欄位改為 `bg-surface-container border-outline-variant/10 rounded-xl` 樣式
- [x] 7.3 更新 `app/settings/page.tsx`：將儲存按鈕改為 primary 漸層 + `rounded-full` + Kinetic Glow 樣式
- [x] 7.4 更新 `app/settings/page.tsx`：將列表項目改為 `bg-surface-container-high rounded-xl p-4` 樣式
- [x] 7.5 更新 `app/settings/page.tsx`：將內容最大寬度從 `max-w-md` 改為 `max-w-4xl`
- [x] 7.6 驗證 `app/settings/page.tsx`：確認所有 Supabase 查詢邏輯未被修改
