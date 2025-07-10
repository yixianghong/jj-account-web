<template>
  <div class="mobile-form-container">
    <form class="space-y-6" @submit.prevent="handleSubmit">
      <!-- 類型選擇 - 大按鈕設計 -->
      <div class="type-selector">
        <UFormField label="類型" class="mb-3">
          <div class="flex gap-3">
            <UButton
              :variant="form.type === 'expense' ? 'solid' : 'outline'"
              :color="form.type === 'expense' ? 'error' : 'neutral'"
              class="flex-1  text-base font-medium"
              @click="form.type = 'expense'"
            >
              <UIcon name="i-heroicons-arrow-trending-down" class="mr-2" />
              支出
            </UButton>
            <UButton
              :variant="form.type === 'income' ? 'solid' : 'outline'"
              :color="form.type === 'income' ? 'success' : 'neutral'"
              class="flex-1  text-base font-medium"
              @click="form.type = 'income'"
            >
              <UIcon name="i-heroicons-arrow-trending-up" class="mr-2" />
              收入
            </UButton>
          </div>
        </UFormField>
      </div>

      <!-- 分類選擇 - 網格佈局 -->
      <div class="category-selector">
        <UFormField label="分類" class="mb-3">
          <div class="grid grid-cols-3 gap-3">
            <UButton
              v-for="category in filteredCategories"
              :key="category"
              :variant="form.category === category ? 'solid' : 'outline'"
              :color="form.category === category ? 'primary' : 'neutral'"
              class=" text-sm font-medium"
              @click="form.category = category"
            >
              {{ categoryIcons[category] }} {{ category }}
            </UButton>
          </div>
        </UFormField>
      </div>

      <!-- 付款人選擇 -->
      <div class="recorder-selector">
        <UFormField label="付款人" class="mb-3">
          <div class="flex gap-3">
            <button
              v-for="option in recorderOptions"
              :key="option.value"
              type="button"
              class="recorder-avatar"
              :class="{
                'recorder-avatar--selected': form.recorder === option.value,
                'recorder-avatar--unselected': form.recorder !== option.value
              }"
              @click="form.recorder = option.value"
              :title="option.label"
            >
              <span class="recorder-avatar__text">
                {{ option.label.charAt(0) }}
              </span>
            </button>
          </div>
        </UFormField>
      </div>

      <!-- 金額和描述輸入 - 同一行 -->
      <div class="grid grid-cols-2 gap-4">
        <div class="amount-input">
          <UFormField label="金額">
            <div class="relative">
              <UInput
                v-model.number="form.amount"
                class="w-full text-3xl font-bold text-center pr-4"
                type="number"
                inputmode="decimal"
                step="1"
                min="0"
                required
                placeholder="0"
              />
            </div>
          </UFormField>
        </div>
        <div class="description-input">
          <UFormField label="描述">
            <UInput
              v-model="form.description"
              type="text"
              required
              class="w-full text-base"
              placeholder="請輸入描述"
            />
          </UFormField>
        </div>
      </div>

      <!-- 日期和請款狀態 -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <UFormField label="日期" class="mb-3">
            <UInput
              v-model="form.date"
              type="date"
              required
              class="w-full  text-base"
            />
          </UFormField>
        </div>
        <div>
          <UFormField label="請款狀態" class="mb-3">
            <div class="flex gap-3">
              <UButton
                :variant="form.paymentStatus === 'pending' ? 'solid' : 'outline'"
                :color="form.paymentStatus === 'pending' ? 'warning' : 'neutral'"
                class="flex-1  text-sm font-medium"
                @click="form.paymentStatus = 'pending'"
                :disabled="form.type === 'income'"
              >
                未請款
              </UButton>
              <UButton
                :variant="form.paymentStatus === 'paid' ? 'solid' : 'outline'"
                :color="form.paymentStatus === 'paid' ? 'success' : 'neutral'"
                class="flex-1  text-sm font-medium"
                @click="form.paymentStatus = 'paid'"
                :disabled="form.type === 'income'"
              >
                已請款
              </UButton>
            </div>
          </UFormField>
        </div>
      </div>

      <!-- 提交按鈕 - 固定在底部 -->
      <div class="submit-section">
        <UButton
          type="submit"
          color="primary"
          size="lg"
          class="w-full h-14 text-lg font-semibold"
        >
          <UIcon name="i-heroicons-check" class="mr-2" />
          {{ submitButtonText || '新增記帳' }}
        </UButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import type {
  Transaction,
  TransactionType,
  PaymentStatus,
  Category,
  AccountBook,
  Recorder,
} from "~/types/accounting";
import { CATEGORIES } from "~/types/accounting";
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

// 分類圖標映射
const categoryIcons: Record<Category, string> = {
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
  '其他': '📝'
};

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

<style scoped>
.mobile-form-container {
  max-width: 100%;
  padding: 1rem;
  background: white;
  min-height: 100vh;
}

.form-header {
  padding: 1rem 0;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 1.5rem;
}

.type-selector {
  margin-bottom: 1.5rem;
}

.category-selector {
  margin-bottom: 1.5rem;
}

.recorder-selector {
  margin-bottom: 1.5rem;
}

.submit-section {
  position: sticky;
  bottom: 0;
  background: white;
  padding: 1rem 0;
  border-top: 1px solid #e5e7eb;
  margin-top: 2rem;
}

/* 響應式設計 */
@media (max-width: 640px) {
  .mobile-form-container {
    padding: 0.5rem;
  }
  
  .form-header {
    padding: 0.5rem 0;
  }
  
  .submit-section {
    padding: 0.5rem 0;
  }
}

/* 付款人頭貼樣式 */
.recorder-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 3px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 600;
  font-size: 12px;
  position: relative;
}

.recorder-avatar--selected {
  background-color: rgb(16 185 129);
  color: white;
  border-color: rgb(16 185 129);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.recorder-avatar--unselected {
  background-color: rgb(243 244 246);
  color: rgb(107 114 128);
  border-color: rgb(229 231 235);
}

.recorder-avatar--unselected:hover {
  background-color: rgb(229 231 235);
  border-color: rgb(156 163 175);
  transform: scale(1.02);
}

.recorder-avatar__text {
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

/* 自定義 tooltip 樣式 */
.recorder-avatar {
  position: relative;
}

.recorder-avatar:hover::after {
  content: attr(title);
  position: absolute;
  bottom: -40px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgb(17 24 39);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  z-index: 1000;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.recorder-avatar:hover::before {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: rgb(17 24 39);
  z-index: 1000;
}

/* 觸控優化 */
@media (hover: none) and (pointer: coarse) {
  .u-button {
    min-height: 44px;
  }
  
  .u-input {
    min-height: 44px;
  }
  
  .recorder-avatar {
    min-width: 30px;
    min-height: 30px;
  }
}
</style>
