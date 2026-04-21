/**
 * 即時匯率服務
 * 使用免費 API: frankfurter.dev (歐洲央行匯率資料)
 * 支援幣別: JPY, TWD, USD, EUR, KRW
 */

const CACHE_KEY = 'exchangeRates';
const CACHE_DURATION = 60 * 60 * 1000; // 1 小時快取

// 匯率 API (免費、無需 API Key)
const API_BASE = 'https://api.frankfurter.dev/latest';

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
    const res = await fetch(`${API_BASE}?from=TWD&to=JPY,USD,EUR,KRW`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();

    // data.rates = { JPY: X, USD: Y, ... } 表示 1 TWD = X JPY
    // 我們需要反轉: 1 JPY = 1/X TWD
    const rates = { TWD: 1 };
    for (const [cur, rate] of Object.entries(data.rates)) {
      rates[cur] = rate > 0 ? 1 / rate : 0;
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
