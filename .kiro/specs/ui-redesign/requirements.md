# 需求文件

## 簡介

本文件定義家庭記帳應用程式 UI 重新設計的需求。此次重新設計將現有的簡潔淺色/暗色雙模式 UI 升級為以 Material Design 3 為靈感的暗色優先設計語言，包含玻璃擬態卡片、動態光暈效果、新字型系統與 pill 形狀的導航元件。所有現有功能（記帳 CRUD、行事曆 CRUD、月曆總覽、統計圖表、設定）必須完整保留。

## 詞彙表

- **設計系統（Design_System）**：定義色彩、字型、視覺效果 token 的 CSS 變數集合，以 `--md-*` 為前綴
- **玻璃擬態卡片（Glass_Card）**：使用半透明背景（`rgba(48,53,64,0.4)`）搭配 `backdrop-blur` 效果的卡片容器
- **動態光暈（Kinetic_Glow）**：使用 `box-shadow` 產生的 cyan 色調光暈效果（`rgba(0,218,243,0.08)`）
- **Pill_Tab**：圓角膠囊形狀的 tab 選擇器元件
- **底部導航列（Bottom_Nav）**：固定於畫面底部的主要導航元件，使用 `usePathname()` 判斷活躍狀態
- **Top_App_Bar**：固定於畫面頂部的應用程式標題列，具有 `backdrop-blur` 效果
- **佈局元件（Layout）**：`layout.tsx` 中的共用佈局，包含 Top_App_Bar、Bottom_Nav 與背景裝飾
- **記帳頁面（Today_Page）**：`/today` 路由的記帳功能頁面
- **行事曆頁面（Calendar_Page）**：`/calendar` 路由的行事曆功能頁面
- **月曆總覽頁面（Monthly_Page）**：`/monthly` 路由的月曆總覽功能頁面
- **統計頁面（Stats_Page）**：`/stats` 路由的統計圖表功能頁面
- **設定頁面（Settings_Page）**：`/settings` 路由的設定功能頁面

## 需求

### 需求 1：設計 Token 系統

**使用者故事：** 身為開發者，我希望有一套統一的 CSS 變數設計 Token 系統，以便所有頁面能一致地使用色彩、字型與視覺效果。

#### 驗收條件

1. THE Design_System SHALL 在 `globals.css` 的 `:root` 中定義所有暗色主題的 CSS 變數，使用 `--md-*` 前綴
2. THE Design_System SHALL 定義以下核心色彩變數：`--md-background`、`--md-on-surface`、`--md-primary`、`--md-primary-container`、`--md-secondary`、`--md-tertiary`、`--md-tertiary-container`、`--md-error`
3. THE Design_System SHALL 定義五個 surface 層級變數：`--md-surface-container-lowest`、`--md-surface-container-low`、`--md-surface-container`、`--md-surface-container-high`、`--md-surface-container-highest`
4. THE Design_System SHALL 定義邊框與輔助變數：`--md-outline`、`--md-outline-variant`、`--md-on-surface-variant`
5. THE Design_System SHALL 定義字型變數 `--font-headline` 對應 Space Grotesk 以及 `--font-body` 對應 Inter
6. WHEN 使用者的系統偏好為 light mode，THE Design_System SHALL 透過 `@media (prefers-color-scheme: light)` 覆寫所有 CSS 變數為淺色主題值
7. THE Design_System SHALL 透過 Tailwind CSS 4 的 `@theme inline` 區塊將 CSS 變數映射為 Tailwind 工具類別

### 需求 2：字型載入

**使用者故事：** 身為使用者，我希望看到一致且美觀的字型排版，以便獲得良好的閱讀體驗。

#### 驗收條件

1. THE Layout SHALL 透過 `next/font/google` 載入 Space Grotesk 字型（字重 300-700）並設定為 `--font-headline` CSS 變數
2. THE Layout SHALL 透過 `next/font/google` 載入 Inter 字型（字重 300-600）並設定為 `--font-body` CSS 變數
3. THE Layout SHALL 將兩個字型的 CSS 變數類別套用至 `<html>` 元素的 `className`
4. THE Layout SHALL 使用 `display: 'swap'` 策略載入字型，避免字型載入期間的文字不可見（FOIT）
5. IF 字型載入失敗，THEN THE Layout SHALL 使用系統預設字型作為 fallback 正常顯示內容


### 需求 3：共用佈局與導航

**使用者故事：** 身為使用者，我希望有一致的頂部標題列與底部導航列，以便在各頁面間輕鬆切換。

#### 驗收條件

1. THE Top_App_Bar SHALL 使用 sticky 定位，具有 `backdrop-blur-md` 效果與半透明背景（`bg-background/80`），並顯示應用程式圖示與標題
2. THE Bottom_Nav SHALL 使用 fixed 定位於畫面底部，具有 `backdrop-blur-xl` 效果與半透明背景（`bg-background/95`），並顯示四個導航項目：記帳、行事曆、統計、設定
3. THE Bottom_Nav SHALL 使用 `usePathname()` hook 判斷當前路由的活躍狀態
4. WHEN 導航項目為活躍狀態，THE Bottom_Nav SHALL 以 pill 形狀（`rounded-full bg-primary/10 text-primary`）顯示活躍指示器
5. WHEN 當前路由為 `/monthly`，THE Bottom_Nav SHALL 將「記帳」導航項目標示為活躍狀態
6. THE Layout SHALL 在背景渲染兩個裝飾性模糊光圈（primary 色調於左上、secondary 色調於右下），使用 `fixed pointer-events-none -z-10` 確保不影響互動

### 需求 4：玻璃擬態卡片

**使用者故事：** 身為使用者，我希望看到具有深度感與現代感的卡片設計，以便獲得視覺上的愉悅體驗。

#### 驗收條件

1. THE Glass_Card SHALL 使用半透明背景（`rgba(48,53,64,0.4)`）、`backdrop-blur-[20px]`、`rounded-2xl` 與細微邊框（`border-outline-variant/5`）
2. WHERE 卡片為重要內容（如統計圖表、事件卡片），THE Glass_Card SHALL 額外套用 Kinetic_Glow 效果（`shadow-[0px_20px_40px_rgba(0,218,243,0.08)]`）
3. IF 瀏覽器不支援 `backdrop-filter`，THEN THE Glass_Card SHALL 降級為純色背景（`bg-surface-container-highest`）

### 需求 5：Pill Tab 選擇器

**使用者故事：** 身為使用者，我希望使用直覺的 tab 切換器來切換檢視模式，以便快速找到需要的資訊。

#### 驗收條件

1. THE Pill_Tab SHALL 使用圓角膠囊形狀的容器（`bg-surface-container-low p-1 rounded-full border-outline-variant/10`）
2. WHEN tab 為活躍狀態，THE Pill_Tab SHALL 以 `bg-surface-container-highest text-primary rounded-full` 樣式顯示
3. WHEN tab 為非活躍狀態，THE Pill_Tab SHALL 以 `text-on-surface-variant` 樣式顯示，並在 hover 時變為 `text-on-surface`
4. WHEN 使用者點擊 tab，THE Pill_Tab SHALL 切換至對應的檢視模式並更新活躍狀態

### 需求 6：記帳頁面重新設計

**使用者故事：** 身為使用者，我希望記帳頁面具有現代化的視覺設計，同時保留所有記帳功能。

#### 驗收條件

1. THE Today_Page SHALL 以 Hero section 風格顯示總金額，使用 `font-headline text-5xl md:text-7xl text-primary` 並搭配文字光暈效果
2. THE Today_Page SHALL 使用 Glass_Card 容器包裹日期切換器，並在左側加上 `border-l-2 border-primary/30` 裝飾
3. THE Today_Page SHALL 使用 Pill_Tab 取代現有的底線式 tab 來切換日/週/月檢視模式
4. THE Today_Page SHALL 使用 Glass_Card 樣式渲染每筆記帳卡片
5. WHEN 記帳列表為空，THE Today_Page SHALL 顯示帶有旋轉虛線圓圈動畫的空狀態畫面
6. THE Today_Page SHALL 使用 `max-w-4xl` 取代現有的 `max-w-md` 作為內容最大寬度
7. THE Today_Page SHALL 完整保留所有記帳 CRUD 功能（新增、讀取、編輯、刪除），Supabase 查詢邏輯不變

### 需求 7：行事曆頁面重新設計

**使用者故事：** 身為使用者，我希望行事曆頁面具有一致的新設計風格，同時保留所有行事曆功能。

#### 驗收條件

1. THE Calendar_Page SHALL 使用 Pill_Tab 風格的切換按鈕
2. THE Calendar_Page SHALL 使用 Glass_Card 樣式渲染今日狀態卡與事件卡片，事件卡片額外套用 Kinetic_Glow 效果
3. THE Calendar_Page SHALL 使用 `bg-surface-container rounded-xl` 樣式渲染月曆格子
4. WHEN 日期為假日，THE Calendar_Page SHALL 以 `bg-error/10 border-error/20` 樣式標示
5. THE Calendar_Page SHALL 使用 `max-w-4xl` 作為內容最大寬度
6. THE Calendar_Page SHALL 完整保留所有行事曆 CRUD 功能，Supabase 查詢邏輯不變

### 需求 8：月曆總覽頁面重新設計

**使用者故事：** 身為使用者，我希望月曆總覽頁面具有一致的新設計風格，同時保留所有月曆功能。

#### 驗收條件

1. THE Monthly_Page SHALL 使用 Glass_Card 容器包裹月份切換器
2. THE Monthly_Page SHALL 使用 `text-on-surface-variant uppercase tracking-widest` 樣式渲染星期列
3. THE Monthly_Page SHALL 使用 `bg-surface-container-high rounded-xl` 樣式渲染日期格子
4. WHEN 日期為今日，THE Monthly_Page SHALL 以 `bg-primary-container text-on-primary` 樣式標示
5. THE Monthly_Page SHALL 使用 Glass_Card 搭配 bento grid 風格渲染底部統計區域
6. THE Monthly_Page SHALL 使用 `max-w-4xl` 作為內容最大寬度
7. THE Monthly_Page SHALL 完整保留所有月曆總覽功能，Supabase 查詢邏輯不變

### 需求 9：統計頁面重新設計

**使用者故事：** 身為使用者，我希望統計頁面具有一致的新設計風格，同時保留所有統計功能。

#### 驗收條件

1. THE Stats_Page SHALL 使用 Glass_Card 搭配 Kinetic_Glow 效果渲染圓餅圖容器
2. THE Stats_Page SHALL 使用 Glass_Card 樣式渲染分類列表
3. THE Stats_Page SHALL 使用 `bg-surface-container-low` 樣式渲染進度條背景
4. THE Stats_Page SHALL 使用 Glass_Card 搭配 `backdrop-blur-sm` overlay 渲染趨勢圖 Modal
5. THE Stats_Page SHALL 使用 `max-w-4xl` 作為內容最大寬度
6. THE Stats_Page SHALL 完整保留所有統計功能，Supabase 查詢邏輯不變

### 需求 10：設定頁面重新設計

**使用者故事：** 身為使用者，我希望設定頁面具有一致的新設計風格，同時保留所有設定功能。

#### 驗收條件

1. THE Settings_Page SHALL 使用 `font-headline text-xl tracking-tight` 樣式渲染標題
2. THE Settings_Page SHALL 使用 `bg-surface-container border-outline-variant/10 rounded-xl` 樣式渲染表單輸入欄位
3. THE Settings_Page SHALL 使用 primary 漸層背景搭配 `rounded-full` 與 Kinetic_Glow 效果渲染儲存按鈕
4. THE Settings_Page SHALL 使用 `bg-surface-container-high rounded-xl p-4` 樣式渲染列表項目
5. THE Settings_Page SHALL 使用 `max-w-4xl` 作為內容最大寬度
6. THE Settings_Page SHALL 完整保留所有設定功能，Supabase 查詢邏輯不變

### 需求 11：Modal 與 Overlay 重新設計

**使用者故事：** 身為使用者，我希望彈出視窗具有一致的新設計風格，同時保留所有互動功能。

#### 驗收條件

1. WHEN Modal 開啟，THE Layout SHALL 顯示 `backdrop-blur-sm` 的半透明 overlay
2. THE Layout SHALL 使用 Glass_Card 樣式渲染 Modal 容器
3. THE Layout SHALL 完整保留所有 Modal 的互動功能（編輯表單、刪除確認等）

### 需求 12：響應式佈局與無障礙性

**使用者故事：** 身為使用者，我希望應用程式在各種裝置上都能正確顯示，且所有互動元素都易於操作。

#### 驗收條件

1. THE Layout SHALL 使用 `max-w-4xl` 作為所有頁面的內容最大寬度，取代現有的 `max-w-md`
2. THE Layout SHALL 確保所有互動元素（按鈕、連結、tab）的觸控目標至少為 44x44px
3. THE Design_System SHALL 確保所有文字與背景的色彩對比度符合 WCAG AA 標準
4. WHILE 使用者啟用 `prefers-reduced-motion`，THE Layout SHALL 降低或停用動畫效果（如旋轉虛線圓圈、光暈效果）

### 需求 13：功能完整性保證

**使用者故事：** 身為使用者，我希望 UI 重新設計後所有現有功能都能正常運作，不會因為視覺變更而遺失任何功能。

#### 驗收條件

1. THE Layout SHALL 完整保留所有 Supabase 資料互動邏輯，包括 `.from()`、`.select()`、`.insert()`、`.update()`、`.delete()` 呼叫
2. THE Layout SHALL 完整保留所有 lucide-react 圖示的使用
3. THE Layout SHALL 不新增任何 npm 依賴項，僅使用 `next/font/google`（Next.js 內建）載入字型
4. THE Layout SHALL 維持現有的路由結構不變（`/today`、`/calendar`、`/monthly`、`/stats`、`/settings`）
