<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold">記帳本管理</h1>
      <UButton
        color="primary"
        @click="showNewBookForm = true"
      >
        新增記帳本
      </UButton>
    </div>

    <div class="grid gap-4">
      <UCard
        v-for="book in accountBooks"
        :key="book.id"
        class="w-full"
      >
        <div class="flex justify-between items-center">
          <div class="flex items-center space-x-4">
            <h3 class="text-lg font-semibold">{{ book.name }}</h3>
            <UBadge color="neutral" variant="subtle">
              {{ book.transactions.length }} 筆記錄
            </UBadge>
          </div>
          <div class="flex items-center space-x-2">
            <UButton
              color="primary"
              variant="ghost"
              icon="i-heroicons-pencil"
              @click="handleEdit(book)"
            />
            <UButton
              color="error"
              variant="ghost"
              icon="i-heroicons-trash"
              @click="handleDelete(book)"
            />
          </div>
        </div>
        <div class="mt-2 text-sm text-gray-600">
          <div>建立時間：{{ new Date(book.createdAt).toLocaleString() }}</div>
          <div>最後更新：{{ new Date(book.updatedAt).toLocaleString() }}</div>
        </div>
      </UCard>
    </div>

    <!-- 新增/編輯記帳本表單 -->
    <UModal
      v-model:open="showNewBookForm"
      :title="editingBook ? '編輯記帳本' : '新增記帳本'"
    >
      <template #body>
        <UInput
          v-model="bookForm.name"
          type="text"
          placeholder="記帳本名稱"
          class="mb-4"
        />
      </template>
      <template #footer>
        <UButton
          color="neutral"
          variant="outline"
          @click="showNewBookForm = false"
        >
          取消
        </UButton>
        <UButton
          color="primary"
          @click="handleSubmit"
        >
          {{ editingBook ? '儲存' : '建立' }}
        </UButton>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { AccountBook } from "~/types/accounting";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

const { $firebase } = useNuxtApp();
const accountBooks = ref<AccountBook[]>([]);
const showNewBookForm = ref(false);
const editingBook = ref<AccountBook | null>(null);
const bookForm = ref({
  name: "",
});

// 載入記帳本資料
const loadAccountBooks = async () => {
  try {
    const booksRef = collection($firebase.db, 'accountBooks');
    const q = query(booksRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    accountBooks.value = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AccountBook[];
  } catch (error) {
    console.error('載入記帳本失敗：', error);
  }
};

// 處理編輯
const handleEdit = (book: AccountBook) => {
  editingBook.value = book;
  bookForm.value.name = book.name;
  showNewBookForm.value = true;
};

// 處理刪除
const handleDelete = async (book: AccountBook) => {
  if (confirm(`確定要刪除記帳本「${book.name}」嗎？此操作無法復原。`)) {
    try {
      const bookRef = doc($firebase.db, 'accountBooks', book.id);
      await deleteDoc(bookRef);
      accountBooks.value = accountBooks.value.filter((b) => b.id !== book.id);
    } catch (error) {
      console.error('刪除記帳本失敗：', error);
    }
  }
};

// 處理表單提交
const handleSubmit = async () => {
  if (!bookForm.value.name.trim()) return;

  try {
    if (editingBook.value) {
      // 編輯現有記帳本
      const bookRef = doc($firebase.db, 'accountBooks', editingBook.value.id);
      await updateDoc(bookRef, {
        name: bookForm.value.name.trim(),
        updatedAt: new Date().toISOString(),
      });

      const index = accountBooks.value.findIndex((b) => b.id === editingBook.value?.id);
      if (index !== -1) {
        accountBooks.value[index] = {
          ...accountBooks.value[index],
          name: bookForm.value.name.trim(),
          updatedAt: new Date().toISOString(),
        };
      }
    } else {
      // 新增記帳本
      const newBook: Omit<AccountBook, 'id'> = {
        name: bookForm.value.name.trim(),
        transactions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection($firebase.db, 'accountBooks'), newBook);
      accountBooks.value.unshift({
        id: docRef.id,
        ...newBook
      });
    }

    showNewBookForm.value = false;
    editingBook.value = null;
    bookForm.value.name = "";
  } catch (error) {
    console.error('儲存記帳本失敗：', error);
  }
};

// 初始化載入記帳本
onMounted(() => {
  loadAccountBooks();
});
</script> 