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
  { name: '本人', avatar: '😊' },
  { name: '家人', avatar: '👨‍👩‍👧‍👦' },
  { name: '朋友', avatar: '🤝' },
];

const bills = ref<Bill[]>([]);
const categories = ref<Record<'expense' | 'income', Category[]>>({
  expense: [...defaultCategories.expense],
  income: [...defaultCategories.income],
});
const persons = ref<Person[]>([...defaultPersons]);

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
    personAvatar: String(item.personAvatar ?? '😊'),
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
    // 账单加载
    const b = uni.getStorageSync('my_bills');
    if (b) {
      bills.value = JSON.parse(b);
    } else {
      bills.value = [];
      // 如果没有账单，且没有任何分类/成员记录，说明是全新用户，初始化默认值
      if (!uni.getStorageSync('my_categories') && !uni.getStorageSync('my_persons')) {
        sync();
      }
    }

    // 分类加载：如果存储里有，就用存储的；否则用默认的
    const c = uni.getStorageSync('my_categories');
    if (c) {
      categories.value = JSON.parse(c);
    } else {
      categories.value = {
        expense: [...defaultCategories.expense],
        income: [...defaultCategories.income],
      };
    }

    // 成员加载：如果存储里有，就用存储的；否则用默认的
    const p = uni.getStorageSync('my_persons');
    if (p) {
      persons.value = JSON.parse(p);
    } else {
      persons.value = [...defaultPersons];
    }

    // 如果是初次运行，同步一次以确保存储中有基础数据
    if (!c || !p) {
      sync();
    }
  };

  const addCategory = (type: 'expense' | 'income', cat: Category) => {
    const list = [...categories.value[type]];
    const otherIndex = list.findIndex((item) => item.name === '其他');
    if (otherIndex === -1) {
      list.push(cat);
    } else {
      list.splice(otherIndex, 0, cat);
    }
    categories.value = {
      ...categories.value,
      [type]: list,
    };
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
    categories.value = {
      expense: sanitizeCategoryList(nextCategories.expense),
      income: sanitizeCategoryList(nextCategories.income),
    };
    persons.value = nextPersons;
    sync();
  };

  const isCategoryDeletable = (type: 'expense' | 'income', categoryName: string) => {
    // 检查是否为默认分类
    const isDefault = defaultCategories[type].some((cat) => cat.name === categoryName);
    if (isDefault) return false;

    // 检查是否已被账单使用
    const isUsed = bills.value.some((bill) => bill.type === type && bill.category === categoryName);
    if (isUsed) return false;

    return true;
  };

  const isPersonDeletable = (personName: string) => {
    // 检查是否为默认成员
    const isDefault = defaultPersons.some((p) => p.name === personName);
    if (isDefault) return false;

    // 检查是否已被账单使用
    const isUsed = bills.value.some((bill) => bill.personName === personName);
    if (isUsed) return false;

    return true;
  };

  const isCategoryDefault = (type: 'expense' | 'income', categoryName: string) => {
    return defaultCategories[type].some((cat) => cat.name === categoryName);
  };

  const isPersonDefault = (personName: string) => {
    return defaultPersons.some((p) => p.name === personName);
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
    isCategoryDeletable,
    isPersonDeletable,
    isCategoryDefault,
    isPersonDefault,
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
    updateCategory: (type: 'expense' | 'income', index: number, newCat: Category) => {
      const oldCat = categories.value[type][index];
      if (!oldCat) return;

      const oldName = oldCat.name;
      // 更新分类列表
      const list = [...categories.value[type]];
      list[index] = { ...newCat };
      categories.value = {
        ...categories.value,
        [type]: list,
      };

      // 如果名称变了，同步更新所有关联账单
      if (oldName !== newCat.name) {
        bills.value.forEach((bill) => {
          if (bill.type === type && bill.category === oldName) {
            bill.category = newCat.name;
          }
        });
      }
      sync();
    },
    updatePerson: (index: number, newPerson: Person) => {
      const oldPerson = persons.value[index];
      if (!oldPerson) return;

      const oldName = oldPerson.name;
      // 更新成员列表
      const list = [...persons.value];
      list[index] = { ...newPerson };
      persons.value = list;

      // 同步更新所有关联账单的姓名和头像
      bills.value.forEach((bill) => {
        if (bill.personName === oldName) {
          bill.personName = newPerson.name;
          bill.personAvatar = newPerson.avatar;
        }
      });
      sync();
    },
    addCategory,
    removeCategory: (type: 'expense' | 'income', index: number) => {
      const category = categories.value[type][index];
      if (!category) return;

      if (defaultCategories[type].some((c) => c.name === category.name)) {
        uni.showToast({ title: '默认分类不可删除', icon: 'none' });
        return;
      }

      if (bills.value.some((b) => b.type === type && b.category === category.name)) {
        uni.showToast({ title: '该分类已有账单，不可删除', icon: 'none' });
        return;
      }

      const list = [...categories.value[type]];
      list.splice(index, 1);
      categories.value = {
        ...categories.value,
        [type]: list,
      };
      sync();
    },
    addPerson: (person: Person) => {
      if (!persons.value.find((p) => p.name === person.name)) {
        persons.value = [...persons.value, person];
        sync();
      }
    },
    removePerson: (index: number) => {
      const person = persons.value[index];
      if (!person) return;

      if (defaultPersons.some((p) => p.name === person.name)) {
        uni.showToast({ title: '默认成员不可删除', icon: 'none' });
        return;
      }

      if (bills.value.some((b) => b.personName === person.name)) {
        uni.showToast({ title: '该成员已有账单，不可删除', icon: 'none' });
        return;
      }

      const list = [...persons.value];
      list.splice(index, 1);
      persons.value = list;
      sync();
    },
  };
}
