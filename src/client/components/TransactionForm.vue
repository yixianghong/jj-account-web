<template>
  <form class="space-y-5 pb-2" @submit.prevent="handleSubmit">
    <!-- 類型切換 -->
    <div class="flex p-1 rounded-2xl bg-gray-100 dark:bg-gray-800">
      <button
        type="button"
        class="flex-1 py-2 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5"
        :class="form.type === 'expense' ? 'bg-white dark:bg-gray-900 shadow-sm text-rose-600' : 'text-gray-500'"
        @click="form.type = 'expense'"
      >
        <UIcon name="i-heroicons-arrow-trending-down" /> 支出
      </button>
      <button
        type="button"
        class="flex-1 py-2 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5"
        :class="form.type === 'income' ? 'bg-white dark:bg-gray-900 shadow-sm text-emerald-600' : 'text-gray-500'"
        @click="form.type = 'income'"
      >
        <UIcon name="i-heroicons-arrow-trending-up" /> 收入
      </button>
    </div>

    <!-- 金額（主視覺） -->
    <div class="flex items-center justify-center gap-1 py-2">
      <span class="text-3xl font-bold" :class="form.type === 'income' ? 'text-emerald-500' : 'text-rose-500'">$</span>
      <input
        v-model.number="form.amount"
        type="number"
        inputmode="decimal"
        step="1"
        min="0"
        required
        placeholder="0"
        class="w-44 bg-transparent text-center text-5xl font-extrabold tabular-nums outline-none placeholder:text-gray-300"
        :class="form.type === 'income' ? 'text-emerald-600' : 'text-rose-600'"
      >
    </div>

    <!-- 分類 -->
    <div>
      <p class="text-xs font-medium text-gray-400 mb-2">分類</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="category in filteredCategories"
          :key="category"
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border transition-all"
          :class="form.category === category
            ? 'bg-primary-500 border-primary-500 text-white shadow-sm'
            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary-300'"
          @click="form.category = category"
        >
          <span>{{ categoryIcons[category] }}</span>{{ category }}
        </button>
      </div>
    </div>

    <!-- 描述 -->
    <UFormField label="描述">
      <UInput v-model="form.description" type="text" required placeholder="這筆是什麼？" class="w-full" />
    </UFormField>

    <!-- 日期 + 請款狀態 -->
    <div class="grid grid-cols-2 gap-3">
      <UFormField label="日期">
        <UInput v-model="form.date" type="date" required class="w-full" />
      </UFormField>
      <UFormField label="請款狀態">
        <div class="flex p-1 rounded-xl bg-gray-100 dark:bg-gray-800" :class="form.type === 'income' && 'opacity-50 pointer-events-none'">
          <button
            type="button"
            class="flex-1 py-1.5 text-xs font-medium rounded-lg transition-all"
            :class="form.paymentStatus === 'pending' ? 'bg-white dark:bg-gray-900 shadow-sm text-amber-600' : 'text-gray-500'"
            @click="form.paymentStatus = 'pending'"
          >未請款</button>
          <button
            type="button"
            class="flex-1 py-1.5 text-xs font-medium rounded-lg transition-all"
            :class="form.paymentStatus === 'paid' ? 'bg-white dark:bg-gray-900 shadow-sm text-emerald-600' : 'text-gray-500'"
            @click="form.paymentStatus = 'paid'"
          >已請款</button>
        </div>
      </UFormField>
    </div>

    <!-- 付款人 -->
    <div>
      <p class="text-xs font-medium text-gray-400 mb-2">付款人</p>
      <div class="flex gap-2">
        <button
          v-for="option in recorderOptions"
          :key="option.value"
          type="button"
          class="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border transition-all"
          :class="form.recorder === option.value
            ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-400'
            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'"
          :title="option.label"
          @click="form.recorder = option.value"
        >
          <span
            class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            :class="form.recorder === option.value ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'"
          >{{ option.label.charAt(0).toUpperCase() }}</span>
          <span class="text-sm font-medium" :class="form.recorder === option.value ? 'text-primary-700 dark:text-primary-300' : 'text-gray-600 dark:text-gray-300'">{{ option.label }}</span>
        </button>
      </div>
    </div>

    <!-- 提交 -->
    <div class="sticky bottom-0 bg-white dark:bg-gray-900 pt-2">
      <UButton type="submit" color="primary" size="lg" block class="h-12 text-base font-semibold rounded-2xl">
        {{ submitButtonText || '新增記帳' }}
      </UButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import type {
  Transaction,
  TransactionType,
  PaymentStatus,
  Category,
  AccountBook,
} from "~/types/accounting";
import { CATEGORIES } from "~/types/accounting";
import { categoryIcons } from "~/utils/category";
import { useAuth } from "~/composables/useAuth";
import { useUsers } from '~/composables/useUsers'

const props = defineProps<{
  book: AccountBook | null;
  initialData?: Transaction;
  submitButtonText?: string;
}>();

const emit = defineEmits<{
  (
    e: "submit",
    transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">
  ): void;
}>();

const { user } = useAuth();
const { getUserInfo } = useUsers();

const recorderOptions = ref<{ label: string; value: string; }[]>([]);

// 根據類型過濾分類選項
const filteredCategories = computed(() => {
  if (form.value.type === 'income') {
    return ['存款', '上期結餘', '其他'] as Category[];
  } else {
    return CATEGORIES.filter(category =>
      category !== '存款' && category !== '上期結餘'
    );
  }
});

// 監聽 book 變化，更新選項
watch(() => props.book, async (newBook) => {
  if (!newBook) {
    recorderOptions.value = [];
    return;
  }

  // 取得帳本擁有者
  const owner = newBook.userId;

  // 取得共享使用者列表，並過濾掉擁有者
  const sharedUsers = (newBook.sharedUsers || []).filter(email => email !== owner);

  // 合併使用者列表
  const allUsers = [owner, ...sharedUsers];

  const options = await Promise.all(allUsers.map(async identifier => {
    const userInfo = await getUserInfo(identifier);
    const displayName = userInfo.displayName || identifier;
    return {
      label: displayName,
      value: displayName
    };
  }));

  recorderOptions.value = options;
}, { immediate: true });

const form = ref({
  type: props.initialData?.type || "expense" as TransactionType,
  amount: props.initialData?.amount || 0,
  category: props.initialData?.category || "飲食" as Category,
  description: props.initialData?.description || "",
  date: props.initialData?.date || new Date().toISOString().split("T")[0],
  recorder: props.initialData?.recorder || '',
  paymentStatus: props.initialData?.paymentStatus || "pending" as PaymentStatus,
});

// 監聽使用者狀態，更新預設記帳人
watch(user, async (newUser) => {
  if (newUser?.uid) {
    // 取得使用者資訊並設定為預設記帳人
    const userInfo = await getUserInfo(newUser.uid);
    const displayName = userInfo.displayName || newUser.uid;
    form.value.recorder = displayName;
  }
}, { immediate: true });

// 當類型變更時，自動設定相應的分類和請款狀態
watch(
  () => form.value.type,
  (newType) => {
    if (newType === "income") {
      form.value.paymentStatus = "paid";
      form.value.category = "存款";
    } else if (newType === "expense") {
      form.value.paymentStatus = "pending";
      form.value.category = "飲食";
    }
  }
);

// 當分類變更為「上期結餘」時，自動設定為已請款
watch(
  () => form.value.category,
  (newCategory) => {
    if (newCategory === "上期結餘") {
      form.value.paymentStatus = "paid";
    }
  }
);

const handleSubmit = async () => {
  emit("submit", { ...form.value });

  // 重置表單，保持當前的記帳人
  const currentRecorder = form.value.recorder;
  form.value = {
    type: "expense",
    amount: 0,
    category: "飲食",
    description: "",
    date: new Date().toISOString().split("T")[0],
    recorder: currentRecorder, // 保持當前的記帳人
    paymentStatus: "pending",
  };
};
</script>
