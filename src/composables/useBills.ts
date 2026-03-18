import { ref, computed } from 'vue';
import { getTodayDateString } from '../utils/dateHelper';
import type { Bill, Category, Person } from '../types';

const defaultCategories: Record<'expense' | 'income', Category[]> = {
  expense: [
    { name: '餐饮', icon: '🍝' },
    { name: '交通', icon: '🚇' },
    { name: '购物', icon: '🛍️' },
    { name: '养车', icon: '🚗' },
    { name: '娱乐', icon: '🎮' },
    { name: '其他', icon: '🧾' },
  ],
  income: [
    { name: '工资', icon: '💵' },
    { name: '兼职', icon: '🛎️' },
    { name: '其他', icon: '✨' },
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
  } else if (defaults.some((item) => item.name === '其他')) {
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