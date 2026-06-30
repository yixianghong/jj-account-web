import type { Category } from '~/types/accounting';

// 分類對應的 emoji 圖標（與 TransactionForm 一致）
export const categoryIcons: Record<Category, string> = {
  '存款': '💰',
  '上期結餘': '📊',
  '飲食': '🍽️',
  '購物': '🛒',
  '生活': '🏠',
  '旅遊': '✈️',
  '醫療': '🏥',
  '交通': '🚗',
  '房屋': '🏡',
  '電費': '⚡',
  '水費': '💧',
  '瓦斯費': '🔥',
  '網路費': '📡',
  '管理費': '🏢',
  '其他': '📝',
};

// 分類圖標背景色（柔和、語意化，深色模式下也可讀）
export const categoryColors: Record<Category, string> = {
  '存款': 'bg-emerald-100 text-emerald-700',
  '上期結餘': 'bg-sky-100 text-sky-700',
  '飲食': 'bg-orange-100 text-orange-700',
  '購物': 'bg-pink-100 text-pink-700',
  '生活': 'bg-amber-100 text-amber-700',
  '旅遊': 'bg-cyan-100 text-cyan-700',
  '醫療': 'bg-red-100 text-red-700',
  '交通': 'bg-blue-100 text-blue-700',
  '房屋': 'bg-lime-100 text-lime-700',
  '電費': 'bg-yellow-100 text-yellow-700',
  '水費': 'bg-sky-100 text-sky-700',
  '瓦斯費': 'bg-rose-100 text-rose-700',
  '網路費': 'bg-indigo-100 text-indigo-700',
  '管理費': 'bg-slate-100 text-slate-700',
  '其他': 'bg-gray-100 text-gray-600',
};

export function getCategoryIcon(category: string): string {
  return categoryIcons[category as Category] ?? '📝';
}

export function getCategoryColor(category: string): string {
  return categoryColors[category as Category] ?? 'bg-gray-100 text-gray-600';
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
