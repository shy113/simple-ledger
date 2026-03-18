import { ref, computed } from 'vue';
import { getTodayDateString } from '../utils/dateHelper';
import type { Bill, Category, Person } from '../types';

type BackupSnapshot = {
  version: 1;
  exportedAt: string;
  bills: Bill[];
  categories: Record<'expense' | 'income', Category[]>;
  persons: Person[];
};

const defaultCategories: Record<'expense' | 'income', Category[]> = {
  expense: [
    { name: '餐饮', icon: '🍜' },
    { name: '交通', icon: '🚗' },
    { name: '购物', icon: '🛍️' },
    { name: '养车', icon: '🛞' },
    { name: '娱乐', icon: '🎮' },
    { name: '其他', icon: '📦' },
  ],
  income: [
    { name: '工资', icon: '💼' },
    { name: '兼职', icon: '🧾' },
    { name: '其他', icon: '✅' },
  ],
};

const defaultPersons: Person[] = [
  { name: '本人', avatar: '🧑' },
  { name: '家人', avatar: '👨‍👩‍👧‍👦' },
  { name: '朋友', avatar: '🤝' },
];

const bills = ref<Bill[]>([]);
const categories = ref<Record<'expense' | 'income', Category[]>>({
  expense: [...defaultCategories.expense],
  income: [...defaultCategories.income],
});
const persons = ref<Person[]>([...defaultPersons]);

const normalizeCategories = (items: Category[], defaults: Category[]) => {
  const otherItem = items.find((item) => item.name === '其他');
  const rest = items.filter((item) => item.name !== '其他');
  const missingDefaults = defaults.filter((item) => !items.some((cat) => cat.name === item.name && cat.icon === item.icon));
  const combined = [...rest, ...missingDefaults.filter((item) => item.name !== '其他')];

  if (otherItem) {
    combined.push(otherItem);
  } else {
    const otherDefault = defaults.find((item) => item.name === '其他');
    if (otherDefault) combined.push(otherDefault);
  }

  return combined;
};

const mergeMissingCategories = (loaded: Record<'expense' | 'income', Category[]>) => ({
  expense: normalizeCategories(loaded.expense, defaultCategories.expense),
  income: normalizeCategories(loaded.income, defaultCategories.income),
});

const mergeMissingPersons = (loaded: Person[]) => {
  const missing = defaultPersons.filter((item) => !loaded.some((person) => person.name === item.name));
  return missing.length ? [...loaded, ...missing] : loaded;
};

const sanitizeBill = (item: any): Bill | null => {
  if (!item || typeof item !== 'object') return null;
  const type = item.type === 'income' ? 'income' : 'expense';
  const amount = Number(item.amount);
  if (!Number.isFinite(amount)) return null;
  return {
    id: Number(item.id) || Date.now(),
    amount,
    type,
    category: String(item.category ?? '其他'),
    personName: String(item.personName ?? '本人'),
    personAvatar: String(item.personAvatar ?? '🧑'),
    date: String(item.date ?? getTodayDateString()),
    note: String(item.note ?? ''),
  };
};

const sanitizeCategoryList = (items: any): Category[] => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      name: String(item?.name ?? '').trim(),
      icon: String(item?.icon ?? '🧩').trim() || '🧩',
    }))
    .filter((item) => item.name);
};

const sanitizePersonList = (items: any): Person[] => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      name: String(item?.name ?? '').trim(),
      avatar: String(item?.avatar ?? '👤').trim() || '👤',
    }))
    .filter((item) => item.name);
};

export function useBills() {
  const totalExpense = computed(() =>
    bills.value
      .filter((bill) => bill.type === 'expense')
      .reduce((sum, bill) => sum + bill.amount, 0),
  );
  const totalIncome = computed(() =>
    bills.value
      .filter((bill) => bill.type === 'income')
      .reduce((sum, bill) => sum + bill.amount, 0),
  );
  const balance = computed(() => totalIncome.value - totalExpense.value);
  const sortedBills = computed(() => [...bills.value].sort((a, b) => b.id - a.id));

  const sync = () => {
    uni.setStorageSync('my_bills', JSON.stringify(bills.value));
    uni.setStorageSync('my_categories', JSON.stringify(categories.value));
    uni.setStorageSync('my_persons', JSON.stringify(persons.value));
  };

  const initData = () => {
    const b = uni.getStorageSync('my_bills');
    bills.value = b ? JSON.parse(b) : [];

    const c = uni.getStorageSync('my_categories');
    if (c) {
      const loaded = JSON.parse(c) as Record<'expense' | 'income', Category[]>;
      const merged = mergeMissingCategories(loaded);
      categories.value = merged;
      if (JSON.stringify(merged) !== JSON.stringify(loaded)) {
        sync();
      }
    }

    const p = uni.getStorageSync('my_persons');
    if (p) {
      const loaded = JSON.parse(p) as Person[];
      const merged = mergeMissingPersons(loaded);
      persons.value = merged;
      if (JSON.stringify(merged) !== JSON.stringify(loaded)) {
        sync();
      }
    }
  };

  const addCategory = (type: 'expense' | 'income', cat: Category) => {
    const list = categories.value[type];
    const otherIndex = list.findIndex((item) => item.name === '其他');
    if (otherIndex === -1) {
      list.push(cat);
    } else {
      list.splice(otherIndex, 0, cat);
    }
    sync();
  };

  const exportBackupData = () => JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      bills: bills.value,
      categories: categories.value,
      persons: persons.value,
    } satisfies BackupSnapshot,
    null,
    2,
  );

  const restoreBackupData = (raw: string | Record<string, any>) => {
    const payload = typeof raw === 'string' ? JSON.parse(raw.replace(/^\ufeff/, '')) : raw;
    const nextBills = Array.isArray(payload?.bills) ? payload.bills.map(sanitizeBill).filter(Boolean) as Bill[] : [];
    const nextCategories = payload?.categories && typeof payload.categories === 'object' ? payload.categories : {};
    const nextPersons = sanitizePersonList(payload?.persons);

    bills.value = nextBills;
    categories.value = mergeMissingCategories({
      expense: sanitizeCategoryList(nextCategories.expense),
      income: sanitizeCategoryList(nextCategories.income),
    });
    persons.value = mergeMissingPersons(nextPersons);
    sync();
  };

  return {
    bills,
    categories,
    persons,
    totalExpense,
    totalIncome,
    balance,
    sortedBills,
    initData,
    sync,
    exportBackupData,
    restoreBackupData,
    addBill: (bill: Omit<Bill, 'id'>) => {
      bills.value.push({
        ...bill,
        id: Date.now(),
        date: bill.date || getTodayDateString(),
      });
      sync();
    },
    updateBill: (updatedBill: Bill) => {
      const idx = bills.value.findIndex((item) => item.id === updatedBill.id);
      if (idx !== -1) {
        bills.value[idx] = { ...updatedBill };
        sync();
      }
    },
    removeBill: (id: number) => {
      bills.value = bills.value.filter((item) => item.id !== id);
      sync();
    },
    addCategory,
    removeCategory: (type: 'expense' | 'income', index: number) => {
      categories.value[type].splice(index, 1);
      sync();
    },
    addPerson: (person: Person) => {
      if (!persons.value.find((p) => p.name === person.name)) {
        persons.value.push(person);
        sync();
      }
    },
    removePerson: (index: number) => {
      persons.value.splice(index, 1);
      sync();
    },
  };
}
