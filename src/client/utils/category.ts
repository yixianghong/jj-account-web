import type { Category } from '~/types/accounting';

// 分類對應的 SVG 線性圖示（Lucide，經 @nuxt/icon 載入）
// 統一線性風格、可隨主題變色，取代 emoji（符合 no-emoji-icons 準則）
export const categoryIcons: Record<Category, string> = {
  '存款': 'i-lucide-piggy-bank',
  '上期結餘': 'i-lucide-history',
  '飲食': 'i-lucide-utensils',
  '購物': 'i-lucide-shopping-bag',
  '生活': 'i-lucide-sofa',
  '旅遊': 'i-lucide-plane',
  '醫療': 'i-lucide-heart-pulse',
  '交通': 'i-lucide-car',
  '房屋': 'i-lucide-home',
  '電費': 'i-lucide-zap',
  '水費': 'i-lucide-droplet',
  '瓦斯費': 'i-lucide-flame',
  '網路費': 'i-lucide-wifi',
  '管理費': 'i-lucide-building-2',
  '其他': 'i-lucide-tag',
};

// 分類圖標的色塊樣式（語意化、淺/深色模式皆可讀）
export const categoryColors: Record<Category, string> = {
  '存款': 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  '上期結餘': 'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400',
  '飲食': 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400',
  '購物': 'bg-pink-100 text-pink-600 dark:bg-pink-500/15 dark:text-pink-400',
  '生活': 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  '旅遊': 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400',
  '醫療': 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
  '交通': 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
  '房屋': 'bg-lime-100 text-lime-600 dark:bg-lime-500/15 dark:text-lime-400',
  '電費': 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/15 dark:text-yellow-400',
  '水費': 'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400',
  '瓦斯費': 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
  '網路費': 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400',
  '管理費': 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300',
  '其他': 'bg-gray-100 text-gray-500 dark:bg-gray-500/15 dark:text-gray-300',
};

export function getCategoryIcon(category: string): string {
  return categoryIcons[category as Category] ?? 'i-lucide-tag';
}

export function getCategoryColor(category: string): string {
  return categoryColors[category as Category] ?? 'bg-gray-100 text-gray-500 dark:bg-gray-500/15 dark:text-gray-300';
}

// 日期分組標籤：今天 / 昨天 / M月D日（依本地時區）
export function formatDateGroupLabel(dateStr: string): string {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (dateStr === todayStr) return '今天';
  if (dateStr === yesterdayStr) return '昨天';

  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}
