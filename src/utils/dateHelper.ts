/**
 * 智能日期解析工具
 * 支持格式：20260318, 260318, 0318, 3-18, 2026-3-18 等
 */
export function smartParseDate(input: string): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const cleanInput = input.replace(/[^0-9]/g, ''); // 提取数字

  // 1. 处理带分隔符的格式 (如 26-03-18 或 3-18)
  if (input.includes('-') || input.includes('/') || input.includes('.')) {
    const parts = input.split(/[-/.]/);
    if (parts.length === 3) {
      let y = parts[0];
      if (y.length === 2) y = '20' + y;
      return `${y}-${pad(parts[1])}-${pad(parts[2])}`;
    }
    if (parts.length === 2) {
      return `${currentYear}-${pad(parts[0])}-${pad(parts[1])}`;
    }
  }

  // 2. 处理纯数字格式
  // YYYYMMDD
  if (cleanInput.length === 8) {
    return `${cleanInput.substring(0, 4)}-${cleanInput.substring(4, 6)}-${cleanInput.substring(6, 8)}`;
  }
  // YYMMDD
  if (cleanInput.length === 6) {
    return `20${cleanInput.substring(0, 2)}-${cleanInput.substring(2, 4)}-${cleanInput.substring(4, 6)}`;
  }
  // MMDD
  if (cleanInput.length === 4) {
    return `${currentYear}-${cleanInput.substring(0, 2)}-${cleanInput.substring(2, 4)}`;
  }

  // 如果解析失败，返回原始输入或今天的日期
  return input || `${currentYear}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function pad(num: string | number): string {
  return String(num).padStart(2, '0');
}

/**
 * 获取本月第一天和最后一天
 */
export function getMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = `${year}-${pad(month + 1)}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  return {
    start: firstDay,
    end: `${year}-${pad(month + 1)}-${pad(lastDay)}`
  };
}
