<template>
  <div class="mx-auto w-full max-w-2xl px-4 sm:px-6 py-6 sm:py-8 pb-20">
    <div>
      <h1 class="text-2xl font-extrabold tracking-tight mb-6">使用者設定</h1>

      <div class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm p-6">
        <h2 class="text-base font-bold mb-4 flex items-center gap-2">
          <UIcon name="i-lucide-user-round" class="w-4 h-4 text-primary-500" />個人資料
        </h2>

        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            電子郵件
          </label>
          <div class="text-gray-900 dark:text-gray-100">
            {{ user?.email }}
          </div>
        </div>

        <form class="space-y-4" @submit.prevent="handleUpdateDisplayName">
          <div>
            <label for="displayName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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

      <!-- 通知設定 -->
      <div class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm p-6 mt-5">
        <h2 class="text-base font-bold mb-4 flex items-center gap-2">
          <UIcon name="i-lucide-bell" class="w-4 h-4 text-primary-500" />通知設定
        </h2>

        <p v-if="!notifySupported" class="text-sm text-gray-500 leading-relaxed">
          此裝置或瀏覽器不支援推播通知。<br>
          iPhone 請先將網站「加入主畫面」，並從主畫面圖示開啟 App 後再回到此頁設定。
        </p>

        <template v-else>
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="font-medium text-gray-900 dark:text-gray-100">記帳推播通知</p>
              <p class="text-sm text-gray-500">有新的記帳時，於此裝置接收通知</p>
            </div>
            <USwitch
              :model-value="notifyEnabled"
              :disabled="notifyLoading || notifyBlocked"
              @update:model-value="onToggleNotify"
            />
          </div>
          <p v-if="notifyBlocked" class="mt-3 text-sm text-amber-600">
            通知已被封鎖。請至瀏覽器／系統設定的「通知」中允許此網站後，再重新整理開啟。
          </p>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user, updateDisplayName } = useAuth();
const { isSupported, permission, isRegistered, enableNotifications, disableNotifications } = useFcm();
const displayName = ref(user.value?.displayName || '');
const isUpdating = ref(false);

// 通知設定狀態
const notifySupported = ref(false);
const notifyEnabled = ref(false);
const notifyLoading = ref(false);
const notifyBlocked = ref(false);

onMounted(() => {
  notifySupported.value = isSupported();
  if (!notifySupported.value) return;
  notifyBlocked.value = permission() === 'denied';
  notifyEnabled.value =
    permission() === 'granted' && !!user.value && isRegistered(user.value.uid);
});

// 切換通知開關（開啟須由此使用者手勢觸發授權，iOS 才會跳出權限提示）
const onToggleNotify = async (value: boolean) => {
  if (!user.value) return;
  notifyLoading.value = true;
  try {
    if (value) {
      const result = await enableNotifications(user.value.uid);
      if (result === 'granted') {
        notifyEnabled.value = true;
        notifyBlocked.value = false;
        useToast().add({ title: '已開啟通知', description: '此裝置將接收記帳推播', color: 'success' });
      } else {
        notifyEnabled.value = false;
        notifyBlocked.value = permission() === 'denied';
        useToast().add({
          title: '無法開啟通知',
          description: result === 'unsupported' ? '此裝置不支援推播' : '請允許瀏覽器的通知權限',
          color: 'error',
        });
      }
    } else {
      await disableNotifications(user.value.uid);
      notifyEnabled.value = false;
      useToast().add({ title: '已關閉通知', description: '此裝置將不再接收推播', color: 'success' });
    }
  } catch (error) {
    console.error('切換通知失敗：', error);
    notifyEnabled.value = !value;
    useToast().add({ title: '操作失敗', description: '請稍後再試', color: 'error' });
  } finally {
    notifyLoading.value = false;
  }
};

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