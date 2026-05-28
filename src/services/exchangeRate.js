/**
 * 即時匯率服務
 * 使用免費 API: open.er-api.com (ExchangeRate-API 開放版)
 * 支援幣別: JPY, TWD, USD, EUR, KRW（含 TWD/KRW，不需 API Key）
 */

const CACHE_KEY = 'exchangeRates';
const CACHE_DURATION = 60 * 60 * 1000; // 1 小時快取

// 匯率 API (免費、無需 API Key，支援 TWD/KRW)
const API_BASE = 'https://open.er-api.com/v6/latest';

/**
 * 從快取取得匯率資料
 */
const getCachedRates = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const { rates, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_DURATION) return null;
    return rates;
  } catch {
    return null;
  }
};

/**
 * 儲存匯率到快取
 */
const setCachedRates = (rates) => {
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    rates,
    timestamp: Date.now()
  }));
};

/**
 * 取得所有幣別對 TWD 的匯率
 * 回傳格式: { JPY: 0.215, USD: 30.5, EUR: 34.2, KRW: 0.023, TWD: 1 }
 * 意思是 1 單位外幣 = X TWD
 */
export const fetchExchangeRates = async () => {
  // 先檢查快取
  const cached = getCachedRates();
  if (cached) return cached;

  try {
    // 以 TWD 為基準取得匯率
    const res = await fetch(`${API_BASE}/TWD`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    if (data.result && data.result !== 'success') {
      throw new Error(`API result: ${data.result}`);
    }

    // data.rates = { JPY: X, USD: Y, ... } 表示 1 TWD = X 外幣
    // 我們需要反轉: 1 外幣 = 1/X TWD
    const rates = { TWD: 1 };
    const wanted = ['JPY', 'USD', 'EUR', 'KRW'];
    for (const cur of wanted) {
      const rate = data.rates?.[cur];
      rates[cur] = rate && rate > 0 ? 1 / rate : 0;
    }

    setCachedRates(rates);
    return rates;
  } catch (err) {
    console.warn('匯率 API 取得失敗，使用備用匯率:', err.message);
    // 備用靜態匯率 (大致值)
    return {
      TWD: 1,
      JPY: 0.215,
      USD: 32.5,
      EUR: 35.8,
      KRW: 0.024,
    };
  }
};

/**
 * 將金額從一個幣別換算成另一個幣別
 * @param {number} amount - 金額
 * @param {string} from - 來源幣別
 * @param {string} to - 目標幣別
 * @param {object} rates - 匯率表 (每種幣別對 TWD)
 * @returns {number} 換算後金額
 */
export const convertCurrency = (amount, from, to, rates) => {
  if (!rates || !amount || from === to) return amount;
  const fromRate = rates[from];
  const toRate = rates[to];
  if (!fromRate || !toRate) return amount;
  // 先轉成 TWD，再轉成目標幣別
  const inTWD = amount * fromRate;
  return inTWD / toRate;
};

/**
 * 格式化換算後的金額顯示文字
 * @param {number} amount - 原始金額
 * @param {string} from - 來源幣別 (如 JPY)
 * @param {object} rates - 匯率表
 * @returns {string|null} 換算文字，如 "≈ NT$1,234"，若來源就是 TWD 則回傳 null
 */
export const formatConvertedAmount = (amount, from, rates) => {
  if (!amount || from === 'TWD' || !rates) return null;
  const converted = convertCurrency(amount, from, 'TWD', rates);
  return `≈ NT$${Math.round(converted).toLocaleString()}`;
};

// ====================================================================
// 統一花費表示：所有事件 cost 一律以 JPY 為基準（BASE_CURRENCY）儲存。
// 輸入表單一律以 JPY 收件；顯示時依使用者選擇的幣別換算。
// 這樣切換預算幣別時才會「真的換算」而不是只換符號。
// ====================================================================

/** 系統內部儲存花費所使用的基準幣別 */
export const BASE_CURRENCY = 'JPY';

/** 幣別符號表 */
export const CURRENCY_SYMBOLS = {
  JPY: '¥',
  TWD: 'NT$',
  USD: '$',
  EUR: '€',
  KRW: '₩',
};

/**
 * 取得幣別對應符號
 */
export const getCurrencySymbol = (code) => CURRENCY_SYMBOLS[code] || code;

/**
 * 將 BASE_CURRENCY 金額換算到目標幣別並格式化為顯示文字
 * @param {number} amountInBase - 以 BASE_CURRENCY 表示的金額
 * @param {string} displayCurrency - 顯示目標幣別
 * @param {object} rates - 匯率表（每種幣別對 TWD）
 * @returns {string} 例如 "¥3,500" 或 "NT$753"
 */
export const formatCost = (amountInBase, displayCurrency, rates) => {
  const sym = getCurrencySymbol(displayCurrency);
  const value = convertCurrency(amountInBase || 0, BASE_CURRENCY, displayCurrency, rates);
  return `${sym}${Math.round(value).toLocaleString()}`;
};

/**
 * 取得「次要顯示文字」：當顯示幣別不是 BASE_CURRENCY 時，回傳原始 base 金額的提示。
 * 例如顯示 NT$753 時，回傳 "≈ ¥3,500"。
 */
export const formatBaseHint = (amountInBase, displayCurrency) => {
  if (!amountInBase || displayCurrency === BASE_CURRENCY) return null;
  return `≈ ${getCurrencySymbol(BASE_CURRENCY)}${Math.round(amountInBase).toLocaleString()}`;
};
