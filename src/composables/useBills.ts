import { ref, computed } from 'vue';
import { getTodayDateString } from '../utils/dateHelper';
import type { Bill, Category, Person } from '../types';

const bills = ref<Bill[]>([]);
const categories = ref<Record<'expense' | 'income', Category[]>>({
  expense: [
    { name: '餐饮', icon: '🍝' },
    { name: '交通', icon: '🚇' },
    { name: '购物', icon: '🛍️' },
    { name: '娱乐', icon: '🎮' },
    { name: '其他', icon: '🧾' },
  ],
  income: [
    { name: '工资', icon: '💵' },
    { name: '兼职', icon: '🛎️' },
    { name: '其他', icon: '✨' },
  ],
});
const persons = ref<Person[]>([
  { name: '本人', avatar: '🧑' },
  { name: '家人', avatar: '👨‍👩‍👧‍👦' },
  { name: '朋友', avatar: '🤝' },
]);

function pad(num: number): string {
  return String(num).padStart(2, '0');
}

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

  const inject50MockData = () => {
    const newMockBills: Bill[] = [];
    const expCats = categories.value.expense;
    const incCats = categories.value.income;
    const ps = persons.value;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const maxDay = Math.max(1, Math.min(now.getDate(), new Date(year, month + 1, 0).getDate()));

    for (let i = 1; i <= 50; i++) {
      const isIncome = Math.random() > 0.85;
      const catList = isIncome ? incCats : expCats;
      const cat = catList[Math.floor(Math.random() * catList.length)];
      const person = ps[Math.floor(Math.random() * ps.length)];
      const day = Math.floor(Math.random() * maxDay) + 1;
      const date = `${year}-${pad(month + 1)}-${pad(day)}`;

      newMockBills.push({
        id: i,
        amount: isIncome ? Math.random() * 5000 + 500 : Math.random() * 200 + 10,
        type: isIncome ? 'income' : 'expense',
        category: cat.name,
        personName: person.name,
        personAvatar: person.avatar,
        date,
        note: `模拟记录 #${i}`,
      });
    }

    bills.value = newMockBills;
    sync();
  };

  const initData = () => {
    const b = uni.getStorageSync('my_bills');
    if (b) bills.value = JSON.parse(b);
    else inject50MockData();

    const c = uni.getStorageSync('my_categories');
    if (c) categories.value = JSON.parse(c);

    const p = uni.getStorageSync('my_persons');
    if (p) persons.value = JSON.parse(p);
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
    inject50MockData,
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
    addCategory: (type: 'expense' | 'income', cat: Category) => {
      categories.value[type].push(cat);
      sync();
    },
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
