<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-2xl mx-auto">
      <h1 class="text-3xl font-bold mb-8">使用者設定</h1>
      
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">個人資料</h2>
        
        <form class="space-y-4" @submit.prevent="handleUpdateDisplayName">
          <div>
            <label for="displayName" class="block text-sm font-medium text-gray-700 mb-1">
              暱稱
            </label>
            <UInput
              id="displayName"
              v-model="displayName"
              placeholder="請輸入暱稱"
              :disabled="isUpdating"
            />
          </div>
          
          <div class="flex justify-end">
            <UButton
              type="submit"
              :loading="isUpdating"
              :disabled="!displayName || displayName === user?.displayName"
            >
              更新暱稱
            </UButton>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user, updateDisplayName } = useAuth();
const displayName = ref(user.value?.displayName || '');
const isUpdating = ref(false);

// 監聽使用者狀態變化
watch(() => user.value?.displayName, (newDisplayName) => {
  if (newDisplayName) {
    displayName.value = newDisplayName;
  }
});

const handleUpdateDisplayName = async () => {
  if (!displayName.value || displayName.value === user.value?.displayName) return;
  
  try {
    isUpdating.value = true;
    await updateDisplayName(displayName.value);
    // 顯示成功訊息
    useToast().add({
      title: '更新成功',
      description: '暱稱已更新',
      color: 'success'
    });
  } catch (error) {
    console.error('更新暱稱失敗：', error);
    // 顯示錯誤訊息
    useToast().add({
      title: '更新失敗',
      description: '無法更新暱稱，請稍後再試',
      color: 'error'
    });
  } finally {
    isUpdating.value = false;
  }
};
</script> 