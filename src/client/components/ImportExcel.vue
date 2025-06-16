<template>
  <div class="import-excel">
    <UButton
      color="neutral"
      variant="soft"
      icon="i-heroicons-arrow-up-tray"
      @click="showImportModal = true"
    >
      匯入 Excel
    </UButton>

    <UModal v-model:open="showImportModal">
      <template #header>
        <h3 class="text-lg font-medium leading-6 text-gray-900">
          匯入 Excel 記帳資料
        </h3>
      </template>

      <template #body>
        <div class="space-y-4">
          <div class="text-sm text-gray-500">
            <p>請上傳 Excel 檔案，並設定欄位對應：</p>
          </div>

          <div class="mt-4">
            <UInput
              type="file"
              accept=".xlsx,.xls"
              @change="handleFileChange"
              :loading="isLoading"
            />
          </div>

          <div v-if="excelHeaders.length > 0" class="mt-4 space-y-4">
            <h4 class="font-medium">欄位對應設定</h4>
            <div class="grid grid-cols-2 gap-4">
              <div v-for="(field, index) in requiredFields" :key="index" class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">
                  {{ field.label }}
                </label>
                <USelect
                  v-model="fieldMapping[field.key]"
                  :items="excelHeaders.map(header => ({ label: header, value: header }))"
                  :placeholder="`選擇 ${field.label} 欄位`"
                />
              </div>
            </div>
          </div>

          <div v-if="previewData.length > 0" class="mt-4">
            <h4 class="font-medium mb-2">預覽資料（前 5 筆）</h4>
            <div class="border rounded-lg overflow-hidden">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">類型</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金額</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分類</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">描述</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">記帳人</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="(row, index) in previewData" :key="index">
                    <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{{ row.date }}</td>
                    <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{{ row.type === 'income' ? '收入' : '支出' }}</td>
                    <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{{ row.amount }}</td>
                    <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{{ row.category }}</td>
                    <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{{ row.description }}</td>
                    <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{{ row.recorder }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton
            color="neutral"
            variant="ghost"
            @click="showImportModal = false"
          >
            取消
          </UButton>
          <UButton
            color="primary"
            :loading="isLoading"
            :disabled="!previewData.length || !isFieldMappingComplete"
            @click="handleImport"
          >
            匯入
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import * as XLSX from 'xlsx';
import type { Transaction } from '~/types/accounting';

const emit = defineEmits<{
  (e: 'import', transactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[]): void;
}>();

const showImportModal = ref(false);
const isLoading = ref(false);
const previewData = ref<any[]>([]);
const fileData = ref<any[]>([]);
const excelHeaders = ref<string[]>([]);
const rawData = ref<any[]>([]);

const requiredFields = [
  { key: 'date', label: '日期' },
  { key: 'type', label: '類型' },
  { key: 'amount', label: '金額' },
  { key: 'category', label: '分類' },
  { key: 'description', label: '描述' },
  { key: 'recorder', label: '記帳人' }
];

const fieldMapping = ref<Record<string, string>>({});

const isFieldMappingComplete = computed(() => {
  return requiredFields.every(field => fieldMapping.value[field.key]);
});

const handleFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  isLoading.value = true;
  previewData.value = [];
  fileData.value = [];
  excelHeaders.value = [];
  rawData.value = [];
  fieldMapping.value = {};

  try {
    const file = input.files[0];
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length > 0) {
      // 取得 Excel 欄位名稱
      excelHeaders.value = Object.keys(jsonData[0] as Record<string, unknown>);
      rawData.value = jsonData;

      // 嘗試自動對應欄位
      excelHeaders.value.forEach(header => {
        const lowerHeader = header.toLowerCase();
        if (lowerHeader.includes('日期') || lowerHeader.includes('date')) {
          fieldMapping.value.date = header;
        } else if (lowerHeader.includes('類型') || lowerHeader.includes('type')) {
          fieldMapping.value.type = header;
        } else if (lowerHeader.includes('金額') || lowerHeader.includes('amount')) {
          fieldMapping.value.amount = header;
        } else if (lowerHeader.includes('分類') || lowerHeader.includes('category')) {
          fieldMapping.value.category = header;
        } else if (lowerHeader.includes('描述') || lowerHeader.includes('description')) {
          fieldMapping.value.description = header;
        } else if (lowerHeader.includes('記帳人') || lowerHeader.includes('recorder')) {
          fieldMapping.value.recorder = header;
        }
      });

      updatePreview();
    }
  } catch (error) {
    console.error('解析 Excel 檔案失敗：', error);
    alert('解析 Excel 檔案失敗，請確認檔案格式是否正確');
  } finally {
    isLoading.value = false;
  }
};

const updatePreview = () => {
  if (!rawData.value.length || !isFieldMappingComplete.value) return;

  const formattedData = rawData.value.map((row: any) => ({
    date: formatDate(row[fieldMapping.value.date]),
    type: row[fieldMapping.value.type]?.includes('收入') ? 'income' : 'expense',
    amount: Number(row[fieldMapping.value.amount]),
    category: row[fieldMapping.value.category],
    description: row[fieldMapping.value.description] || '',
    recorder: row[fieldMapping.value.recorder],
    paymentStatus: row[fieldMapping.value.type]?.includes('收入') ? 'paid' : 'pending'
  }));

  fileData.value = formattedData;
  previewData.value = formattedData.slice(0, 5);
};

// 監聽欄位對應變化
watch(fieldMapping, () => {
  updatePreview();
}, { deep: true });

const handleImport = () => {
  if (fileData.value.length > 0) {
    emit('import', fileData.value);
    showImportModal.value = false;
    previewData.value = [];
    fileData.value = [];
    excelHeaders.value = [];
    rawData.value = [];
    fieldMapping.value = {};
  }
};

const formatDate = (date: any): string => {
  if (!date) return '';
  
  // 如果是日期物件
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  
  // 如果是 Excel 數字日期（從 1900/1/1 開始的天數）
  if (typeof date === 'number') {
    const excelDate = new Date((date - 25569) * 86400 * 1000);
    return excelDate.toISOString().split('T')[0];
  }
  
  // 如果是字串，嘗試轉換
  const dateStr = String(date);
  if (dateStr.includes('/')) {
    const [year, month, day] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return dateStr;
};
</script> 