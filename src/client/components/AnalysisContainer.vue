<template>
  <div class="analysis-container">
    <!-- Tab 切換 -->
    <div class="flex justify-center mb-8">
      <div class="bg-gray-100 rounded-2xl p-1">
        <UButton
          :color="activeTab === 'monthly' ? 'primary' : 'gray'"
          :variant="activeTab === 'monthly' ? 'solid' : 'ghost'"
          class="rounded-xl px-6 py-2"
          @click="activeTab = 'monthly'"
        >
          月度分析
        </UButton>
        <UButton
          :color="activeTab === 'yearly' ? 'primary' : 'gray'"
          :variant="activeTab === 'yearly' ? 'solid' : 'ghost'"
          class="rounded-xl px-6 py-2"
          @click="activeTab = 'yearly'"
        >
          年度分析
        </UButton>
      </div>
    </div>

    <!-- 內容區域 -->
    <div class="transition-all duration-300">
      <MonthlySummary
        v-if="activeTab === 'monthly'"
        :account-id="accountId"
        @claim-all="handleClaimAll"
      />
      <YearlyAnalysis
        v-else
        :account-id="accountId"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject } from "vue";
import type { Recorder } from "~/types/accounting";

const props = defineProps<{
  accountId: string;
}>();

const emit = defineEmits<{
  (e: "claimAll", recorder: Recorder): void;
}>();

// 使用注入的共享月度交易實體
const monthlyTransactionsInstance = inject('monthlyTransactions') as ReturnType<typeof useMonthlyTransactions> | undefined;

const activeTab = ref<'monthly' | 'yearly'>('monthly');

const handleClaimAll = (recorder: Recorder) => {
  emit("claimAll", recorder);
};
</script> 