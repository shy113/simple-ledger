import { ref, computed } from 'vue';
import type { Bill, Category, Person } from '../types';

// 全局单例状态
const bills = ref<Bill[]>([]);
const categories = ref<Record<'expense' | 'income', Category[]>>({
  expense: [
    { name: '餐饮', icon: '🍔' }, { name: '交通', icon: '🚗' }, { name: '购物', icon: '🛍️' },
    { name: '娱乐', icon: '🎮' }, { name: '其它', icon: '📦' }
  ],
  income: [
    { name: '工资', icon: '💰' }, { name: '兼职', icon: '🍳' }, { name: '其它', icon: '🧧' }
  ]
});
const persons = ref<Person[]>([
  { name: '本人', avatar: '👨‍💼' },
  { name: '家人', avatar: '👩‍👧‍👦' },
  { name: '朋友', avatar: '🤝' }
]);

/**
 * 极简记账核心逻辑处理
 */
export function useBills() {
  const totalExpense = computed(() => bills.value.filter(b => b.type === 'expense').reduce((sum, b) => sum + b.amount, 0));
  const totalIncome = computed(() => bills.value.filter(b => b.type === 'income').reduce((sum, b) => sum + b.amount, 0));
  const balance = computed(() => totalIncome.value - totalExpense.value);
  const sortedBills = computed(() => [...bills.value].sort((a, b) => b.id - a.id));

  const initData = () => {
    const b = uni.getStorageSync('my_bills');
    if (b) bills.value = JSON.parse(b);
    else injectMockData();
    const c = uni.getStorageSync('my_categories');
    if (c) categories.value = JSON.parse(c);
    const p = uni.getStorageSync('my_persons');
    if (p) persons.value = JSON.parse(p);
  };

  const injectMockData = () => {
    const mockBills: Bill[] = [
      { id: 1, amount: 45, type: 'expense', category: '餐饮', personName: '本人', personAvatar: '👨‍💼', date: '2026-03-18', note: '午餐麦当劳' },
      { id: 2, amount: 15000, type: 'income', category: '工资', personName: '本人', personAvatar: '👨‍💼', date: '2026-03-15', note: '3月基本工资' },
      { id: 3, amount: 238.5, type: 'expense', category: '购物', personName: '家人', personAvatar: '👩‍👧‍👦', date: '2026-03-17', note: '山姆超市采购' },
      { id: 4, amount: 32, type: 'expense', category: '交通', personName: '本人', personAvatar: '👨‍💼', date: '2026-03-18', note: '打车去公司' },
      { id: 5, amount: 120, type: 'expense', category: '娱乐', personName: '家人', personAvatar: '👩‍👧‍👦', date: '2026-03-16', note: '周末看电影' },
      { id: 6, amount: 500, type: 'income', category: '兼职', personName: '本人', personAvatar: '👨‍💼', date: '2026-03-10', note: '设计私活稿费' }
    ];
    bills.value = mockBills;
    sync();
  };

  const sync = () => {
    uni.setStorageSync('my_bills', JSON.stringify(bills.value));
    uni.setStorageSync('my_categories', JSON.stringify(categories.value));
    uni.setStorageSync('my_persons', JSON.stringify(persons.value));
  };

  return {
    bills, categories, persons,
    totalExpense, totalIncome, balance, sortedBills,
    initData, sync,
    addBill: (b: Omit<Bill, 'id' | 'date'>) => {
      bills.value.push({ ...b, id: Date.now(), date: b.date || new Date().toLocaleDateString() });
      sync();
    },
    updateBill: (updatedBill: Bill) => {
      const idx = bills.value.findIndex(item => item.id === updatedBill.id);
      if (idx !== -1) {
        bills.value[idx] = { ...updatedBill };
        sync();
      }
    },
    removeBill: (id: number) => {
      bills.value = bills.value.filter(item => item.id !== id);
      sync();
    },
    addCategory: (type: 'expense' | 'income', cat: Category) => {
      categories.value[type].push(cat);
      sync();
    },
    removeCategory: (type: 'expense' | 'income', index: number) => {
      categories.value[type].splice(index, 1);
      sync();
    },
    addPerson: (person: Person) => {
      if (!persons.value.find(p => p.name === person.name)) {
        persons.value.push(person);
        sync();
      }
    },
    removePerson: (index: number) => {
      persons.value.splice(index, 1);
      sync();
    }
  };
}
