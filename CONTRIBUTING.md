# 貢獻指南 — Trip Planner（tokyo-trip）

> 本專案為「多媒體系統設計」課程作品：**React + Vite + Supabase** 打造的旅遊行程規劃 SPA。
> **未來所有開發（不論成員、不論分支）都必須依循本指南執行**。
> 任何違反 Git Flow 或 Conventional Commits 的提交，會在 Code Review 階段被退回。

---

## 1. 技術棧速覽

| 類別 | 內容 |
| --- | --- |
| 前端 | React 19、Vite 7、Tailwind CSS 4 |
| 狀態管理 | React Hooks（含自訂 hooks）|
| 後端 | Supabase（PostgreSQL + Auth + RLS）|
| 地圖 / 拖曳 | React-Leaflet、@dnd-kit |
| 部署 | GitHub Pages（`npm run deploy`）|
| 語系 | 介面 zh-TW、註解 zh-TW、識別字 en |
| 基準幣別 | **JPY**（所有 `event.cost` 一律以日圓儲存，顯示時由 `formatCost` 換算）|

---

## 2. Git Flow 分支模型

```
main      ← 永遠可部署，僅由 release / hotfix 合入
develop   ← 整合分支，所有 feature/fix 都先合入 develop
feature/* ← 新功能開發
fix/*     ← 非緊急 bug 修復
hotfix/*  ← 線上 main 緊急修復
release/* ← 準備發版（凍結功能、改 version、寫 changelog）
```

### 2.1 分支命名規則

格式：`<type>/<scope>-<簡短描述-kebab-case>`

| 類型 | 範例 |
| --- | --- |
| 新功能 | `feature/budget-multi-currency` |
| Bug 修復 | `fix/map-marker-overlap` |
| 緊急修復 | `hotfix/auth-login-redirect` |
| 重構 | `refactor/trip-detail-split-tabs` |
| 文件 | `docs/contributing-guide` |
| 套件升級 | `chore/deps-vite-7` |

> 一條分支只做一件事，避免「順手改其他東西」。

---

## 3. 版本號（SemVer）

`vMAJOR.MINOR.PATCH`

| 升版類型 | 觸發條件 |
| --- | --- |
| MAJOR | 破壞性 API 變更，例如改變 Supabase schema 且舊資料不能向後相容 |
| MINOR | 新增功能且向下相容，例如新增「打包清單分享」分頁 |
| PATCH | Bug 修復、效能優化、文件更新 |

每次 `release/*` 分支建立時，更新 `package.json` 的 `version` 並打 tag：

```powershell
git tag -a v0.2.0 -m "release: v0.2.0"
git push origin v0.2.0
```

---

## 4. Conventional Commits

格式：

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### 4.1 Type

| Type | 用途 |
| --- | --- |
| `feat` | 新功能 |
| `fix` | Bug 修復 |
| `refactor` | 不改變外部行為的重構 |
| `perf` | 效能優化 |
| `style` | 排版/空白/分號，不影響邏輯 |
| `docs` | 文件 |
| `test` | 測試 |
| `chore` | 雜項（依賴升級、設定、CI）|
| `build` | 影響建置產物 |
| `revert` | 還原先前 commit |

### 4.2 Scope（本專案專用）

| Scope | 對應模組 / 檔案 |
| --- | --- |
| `ui` | 共用樣式、icon、Tailwind 設定 |
| `trip` | 行程 CRUD（`TripList.jsx`、`TripDetail.jsx`）|
| `budget` | 預算分頁、幣別換算（`tabs/BudgetTab.jsx`、`services/exchangeRate.js`）|
| `map` | 地圖（`TripMap.jsx`、Nominatim 整合）|
| `packing` | 打包清單（`tabs/PackingTab.jsx`）|
| `group` | 動態組別（`GroupSelector.jsx`、`EventTimelineGroup.jsx`）|
| `auth` | 登入註冊（`AuthPage.jsx`、`hooks/useAuth.js`）|
| `supabase` | DB schema、RLS、`supabaseClient.js`、`supabaseService.js` |
| `hooks` | 自訂 hooks（`hooks/*.js`）|
| `services` | 第三方服務整合（匯率、地理編碼…）|
| `utils` | 工具函式（`utils/dataTransform.js`）|
| `deps` | 套件升降版 |
| `config` | `vite.config.js` / `tailwind.config.js` / `eslint.config.js` / `postcss.config.js` |
| `docs` | README、CONTRIBUTING、IMPLEMENTATION_*、測試清單 |

### 4.3 Subject 規則

- 使用「動詞開頭、現在式、不加句號」
- ≤ 50 字（中英混用皆可）
- 不要寫「修了一些東西」這種模糊描述

### 4.4 範例

```
feat(budget): 新增以 JPY 為基準的多幣別即時換算
fix(map): 修正 Nominatim 速率限制 429 錯誤
refactor(trip): 將 TripDetail 拆分為 BudgetTab / PackingTab
perf(trip): 為 getDayCost / getTripCost 加上 useMemo
chore(deps): 升級 @supabase/supabase-js 至 2.90
docs(contributing): 重寫貢獻指南以符合本專案技術棧
```

含 body 的範例：

```
fix(budget): 修正切換幣別後總額未換算的問題

舊版只更新貨幣符號但未換算數值。改以 BASE_CURRENCY = JPY
為基準儲存，顯示時透過 formatCost(amount, currency, rates)
換算。所有事件 cost 一律以日圓輸入。

Closes #42
```

---

## 5. 三種典型工作流程

### 5.1 開發新功能

```powershell
git checkout develop
git pull
git checkout -b feature/budget-export-csv
# ...開發、commit...
git push -u origin feature/budget-export-csv
# 建立 PR：feature/* → develop
```

合入 `develop` 前必須通過：

1. `npm run lint`（ESLint 0 warning）
2. `npm run build` 成功
3. 至少一位 reviewer approve
4. 在 `測試/測試清單.md` 對應項目打勾

### 5.2 發版

```powershell
git checkout develop
git pull
git checkout -b release/v0.3.0
# 更新 package.json 的 version
# 更新 README 的 Changelog（或新增 CHANGELOG.md）
git commit -am "chore(release): v0.3.0"
git push -u origin release/v0.3.0
# PR：release/* → main，merge 後打 tag
git checkout main
git pull
git tag -a v0.3.0 -m "release: v0.3.0"
git push origin v0.3.0
# 同時 merge 回 develop
git checkout develop
git merge --no-ff main
git push
# 部署
npm run deploy
```

### 5.3 線上熱修

```powershell
git checkout main
git pull
git checkout -b hotfix/auth-redirect-loop
# ...修 bug、commit...
git push -u origin hotfix/auth-redirect-loop
# PR：hotfix/* → main，同步合回 develop，並打 PATCH tag
```

---

## 6. 程式碼規範

### 6.1 必要事項

- 所有檔案要能通過 `npm run lint`。
- 元件使用 **PascalCase**；hooks 以 `use` 開頭；工具函式 camelCase。
- 一個檔案只 export 一個主要元件 / hook，必要時可附小型輔助元件。
- 元件超過 **400 行** 必須拆分（例如 `TripDetail.jsx` 已拆出 `tabs/`）。
- 共用邏輯抽到 `src/hooks/` 或 `src/services/` 或 `src/utils/`。
- **花費（cost）一律以 JPY 儲存**，顯示時呼叫 `formatCost(amount, currency, rates)`。
- 對 `localStorage`、API 等副作用，使用 `useDebouncedEffect` 等減壓策略，避免每次 keystroke 都寫。

### 6.2 禁止事項

- ❌ 直接 commit 到 `main` 或 `develop`
- ❌ `git push --force`（除非該分支只有自己用，並先口頭通知）
- ❌ 在 commit message 中寫 `update`、`fix bug`、`改了一下` 這類無意義訊息
- ❌ 把 `.env`、Supabase service key、個資資料夾納入版控
- ❌ 跳過 `lint` 或 `build` 直接合併 PR
- ❌ 在 `feature/*` 分支同時做多個不相關的功能（請開新分支）

### 6.3 註解與文件

- 公開 API（services、hooks、utils 的 export）需有 JSDoc。
- 元件 props 若數量多，於檔案頂部用註解列出每個 prop 的用途。
- 更動 Supabase schema 時，須同步更新 `supabase_schema.sql` 與 `SUPABASE_MIGRATION_GUIDE.md`。

---

## 7. PR Checklist（複製到 PR 描述）

```
- [ ] 分支命名符合 `<type>/<scope>-<desc>` 規則
- [ ] Commit message 符合 Conventional Commits
- [ ] `npm run lint` 通過
- [ ] `npm run build` 通過
- [ ] 已在本機 `npm run dev` 手動驗證
- [ ] 已更新對應文件（README / IMPLEMENTATION / 測試清單）
- [ ] 若涉及 schema 變更：已更新 `supabase_schema.sql`
- [ ] 若涉及花費邏輯：已確認 cost 以 JPY 儲存、以 `formatCost` 顯示
```

---

## 8. 快速指令參考

```powershell
# 安裝相依
npm install

# 開發
npm run dev          # http://localhost:5173/tokyo-trip/

# 程式碼檢查
npm run lint

# 建置
npm run build

# 預覽建置結果
npm run preview

# 部署到 GitHub Pages
npm run deploy
```

---

## 9. 環境變數

於專案根目錄建立 `.env.local`（**不可入庫**）：

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

若未提供，App 會自動 fallback 到「本地模式」（資料寫入 `localStorage`）。

---

## 10. 聯絡與權責

- 規範違反：由 PR reviewer 退回並貼上本文件對應段落連結。
- 規範修訂：須以 `docs/contributing-*` 分支提 PR，由全體成員同意後合入 `develop`。

> 寫好程式不是目的，**讓下一個接手的人不想罵髒話**才是。
