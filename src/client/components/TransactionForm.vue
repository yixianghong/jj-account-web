<template>
  <div class="transaction-form">
    <h2 class="text-xl font-bold mb-4">新增記帳</h2>
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <UFormField label="類型">
            <USelect
              v-model="form.type"
              class="w-full"
              :items="[
                { label: '收入', value: 'income' },
                { label: '支出', value: 'expense' }
              ]"
            />
          </UFormField>
        </div>
        <div>
          <UFormField label="金額">
            <UInput
              v-model.number="form.amount"
              class="w-full"
              type="number"
              inputmode="decimal"
              step="0.01"
              min="0"
              required
            />
          </UFormField>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <UFormField label="分類">
            <USelect
              v-model="form.category"
              class="w-full"
              :items="CATEGORIES.map(category => ({ label: category, value: category }))"
              required
            />
          </UFormField>
        </div>
        <div>
          <UFormField label="記帳人">
            <USelect
              v-model="form.recorder"
              class="w-full"
              :items="recorderOptions"
              required
            />
          </UFormField>
        </div>
      </div>

      <div>
        <UFormField label="描述">
          <UInput
            v-model="form.description"
            type="text"
            required
            class="w-full"
          />
        </UFormField>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <UFormField label="日期">
            <UInput
              v-model="form.date"
              type="date"
              required
              class="w-full"
            />
          </UFormField>
        </div>
        <div>
          <UFormField label="請款狀態">
            <USelect
              v-model="form.paymentStatus"
              class="w-full"
              :items="[
                { label: '未請款', value: 'pending' },
                { label: '已請款', value: 'paid' }
              ]"
              :disabled="form.type === 'income'"
            />
          </UFormField>
        </div>
      </div>

      <UButton
        type="submit"
        color="primary"
        block
      >
        新增記帳
      </UButton>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type {
  Transaction,
  TransactionType,
  PaymentStatus,
  Category,
  AccountBook,
} from "~/types/accounting";
import { CATEGORIES } from "~/types/accounting";
import { useAuth } from "~/composables/useAuth";
import { useUsers } from '~/composables/useUsers'

const props = defineProps<{
  book: AccountBook | null
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
    return {
      label: userInfo.displayName || identifier,
      value: userInfo.uid
    };
  }));

  recorderOptions.value = options;
}, { immediate: true });

const form = ref({
  type: "expense" as TransactionType,
  amount: 0,
  category: "其他" as Category,
  description: "",
  date: new Date().toISOString().split("T")[0],
  recorder: '',
  paymentStatus: "pending" as PaymentStatus,
});

// 監聽使用者狀態，更新預設記帳人
watch(user, (newUser) => {
  if (newUser?.uid) {
    form.value.recorder = newUser.uid;
  }
}, { immediate: true });

// 當類型變更為收入時，自動設定為已請款
watch(
  () => form.value.type,
  (newType) => {
    if (newType === "income") {
      form.value.paymentStatus = "paid";
      form.value.category = "存款";
    }
  }
);

const handleSubmit = () => {
  emit("submit", { ...form.value });
  // 重置表單
  form.value = {
    type: "expense",
    amount: 0,
    category: "其他",
    description: "",
    date: new Date().toISOString().split("T")[0],
    recorder: '',
    paymentStatus: "pending",
  };
};
</script>
