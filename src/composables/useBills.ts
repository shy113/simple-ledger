import { ref, computed } from "vue";
import type { Bill, Category, Person } from "../types";

// 全局单例状态
const bills = ref<Bill[]>([]);
const categories = ref<Record<"expense" | "income", Category[]>>({
  expense: [
    { name: "餐饮", icon: "🍔" },
    { name: "交通", icon: "🚗" },
    { name: "购物", icon: "🛍️" },
    { name: "娱乐", icon: "🎮" },
    { name: "其它", icon: "📦" },
  ],
  income: [
    { name: "工资", icon: "💰" },
    { name: "兼职", icon: "🍳" },
    { name: "其它", icon: "🧧" },
  ],
});
const persons = ref<Person[]>([
  { name: "本人", avatar: "👨‍💼" },
  { name: "家人", avatar: "👩‍👧‍👦" },
  { name: "朋友", avatar: "🤝" },
]);

/**
 * 极简记账核心逻辑处理
 */
export function useBills() {
  const totalExpense = computed(() =>
    bills.value
      .filter((b) => b.type === "expense")
      .reduce((sum, b) => sum + b.amount, 0),
  );
  const totalIncome = computed(() =>
    bills.value
      .filter((b) => b.type === "income")
      .reduce((sum, b) => sum + b.amount, 0),
  );
  const balance = computed(() => totalIncome.value - totalExpense.value);
  const sortedBills = computed(() =>
    [...bills.value].sort((a, b) => b.id - a.id),
  );

  const initData = () => {
    const b = uni.getStorageSync("my_bills");
    if (b) bills.value = JSON.parse(b);
    else inject50MockData(); // 🚀 如果没有数据，注入50条精美数据

    const c = uni.getStorageSync("my_categories");
    if (c) categories.value = JSON.parse(c);
    const p = uni.getStorageSync("my_persons");
    if (p) persons.value = JSON.parse(p);
  };

  // 🚀 自动化数据生成器
  const inject50MockData = () => {
    const newMockBills: Bill[] = [];
    const expCats = categories.value.expense;
    const incCats = categories.value.income;
    const ps = persons.value;

    for (let i = 1; i <= 50; i++) {
      const isIncome = Math.random() > 0.85; // 15% 几率是收入
      const catList = isIncome ? incCats : expCats;
      const cat = catList[Math.floor(Math.random() * catList.length)];
      const person = ps[Math.floor(Math.random() * ps.length)];

      // 生成随机日期 (2026-03-01 到 2026-03-18)
      const day = Math.floor(Math.random() * 18) + 1;
      const date = `2026-03-${String(day).padStart(2, "0")}`;

      newMockBills.push({
        id: i,
        amount: isIncome
          ? Math.random() * 5000 + 500
          : Math.random() * 200 + 10,
        type: isIncome ? "income" : "expense",
        category: cat.name,
        personName: person.name,
        personAvatar: person.avatar,
        date: date,
        note: `模拟记录 #${i}`,
      });
    }
    bills.value = newMockBills;
    sync();
  };

  const sync = () => {
    uni.setStorageSync("my_bills", JSON.stringify(bills.value));
    uni.setStorageSync("my_categories", JSON.stringify(categories.value));
    uni.setStorageSync("my_persons", JSON.stringify(persons.value));
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
    addBill: (b: Omit<Bill, "id">) => {
      const today = new Date().toLocaleDateString("zh-CN");
      bills.value.push({
        ...b,
        id: Date.now(),
        date: b.date || today,
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
    addCategory: (type: "expense" | "income", cat: Category) => {
      categories.value[type].push(cat);
      sync();
    },
    removeCategory: (type: "expense" | "income", index: number) => {
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
