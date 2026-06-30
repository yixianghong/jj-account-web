<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-gray-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-12 px-4">
    <div v-if="!loading" class="w-full max-w-sm">
      <!-- 品牌區 -->
      <div class="flex flex-col items-center mb-8">
        <img src="@/assets/imgs/icon.png" alt="記帳夥伴" class="w-16 h-16 rounded-2xl shadow-lg mb-3">
        <h1 class="text-2xl font-extrabold tracking-tight text-primary-700 dark:text-primary-400">記帳夥伴</h1>
        <p class="text-sm text-gray-400 mt-1">和夥伴一起，輕鬆記帳對帳</p>
      </div>

      <div class="rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none p-6">
        <h2 class="text-lg font-bold mb-5">{{ isLogin ? '登入帳號' : '建立新帳號' }}</h2>

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <UFormField label="電子郵件">
            <UInput v-model="email" type="email" placeholder="請輸入電子郵件" required class="w-full" />
          </UFormField>

          <UFormField label="密碼">
            <UInput v-model="password" type="password" placeholder="請輸入密碼" required class="w-full" />
          </UFormField>

          <UAlert
            v-if="error"
            data-testid="login-error"
            color="error"
            variant="soft"
            :title="error"
          />

          <UButton type="submit" color="primary" block size="lg" :loading="loading">
            {{ isLogin ? '登入' : '註冊' }}
          </UButton>

          <div class="relative py-1">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-200 dark:border-gray-800" />
            </div>
            <div class="relative flex justify-center text-xs">
              <span class="px-2 bg-white dark:bg-gray-900 text-gray-400">或</span>
            </div>
          </div>

          <UButton color="neutral" variant="outline" block size="lg" :loading="loading" @click="handleGoogleLogin">
            <template #leading>
              <img class="h-5 w-5" src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo">
            </template>
            使用 Google 登入
          </UButton>
        </form>
      </div>

      <div class="text-center mt-5">
        <button
          type="button"
          class="text-sm text-gray-500 hover:text-primary-600 transition-colors"
          @click="isLogin = !isLogin"
        >
          {{ isLogin ? '還沒有帳號？點此註冊' : '已有帳號？點此登入' }}
        </button>
      </div>
    </div>

    <div v-else class="text-center">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary-600" />
      <p class="mt-2 text-gray-500">載入中...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  layout: 'blank'
})

const router = useRouter()
const { user, login, register, loginWithGoogle, error, loading } = useAuth()

const email = ref('')
const password = ref('')
const isLogin = ref(true)

// 監聽登入狀態
watch(user, (newUser) => {
  if (newUser) {
    router.push('/accounts')
  }
}, { immediate: true })

const handleSubmit = async () => {
  try {
    if (isLogin.value) {
      await login(email.value, password.value)
    } else {
      await register(email.value, password.value)
    }
    router.push('/accounts')
  } catch (e) {
    console.error('認證失敗：', e)
  }
}

const handleGoogleLogin = async () => {
  try {
    await loginWithGoogle()
    router.push('/accounts')
  } catch (e) {
    console.error('Google 登入失敗：', e)
  }
}
</script> 