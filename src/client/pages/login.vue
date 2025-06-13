<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <UCard v-if="!loading" class="max-w-md w-full">
      <template #header>
        <h2 class="text-center text-3xl font-extrabold text-gray-900">
          {{ isLogin ? '登入帳號' : '註冊帳號' }}
        </h2>
      </template>

      <form class="space-y-6" @submit.prevent="handleSubmit">
        <UFormField label="電子郵件">
          <UInput
            v-model="email"
            type="email"
            placeholder="請輸入電子郵件"
            required
            class="w-full"
          />
        </UFormField>

        <UFormField label="密碼">
          <UInput
            v-model="password"
            type="password"
            placeholder="請輸入密碼"
            required
            class="w-full"
          />
        </UFormField>

        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          :title="error"
        />

        <div class="space-y-4">
          <UButton
            type="submit"
            color="primary"
            block
            :loading="loading"
          >
            {{ isLogin ? '登入' : '註冊' }}
          </UButton>

          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300"/>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-gray-50 text-gray-500">或</span>
            </div>
          </div>

          <UButton
            color="neutral"
            variant="outline"
            block
            :loading="loading"
            @click="handleGoogleLogin"
          >
            <template #leading>
              <img
                class="h-5 w-5"
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google logo"
              >
            </template>
            使用 Google 登入
          </UButton>
        </div>

        <div class="text-center">
          <UButton
            color="neutral"
            variant="link"
            @click="isLogin = !isLogin"
          >
            {{ isLogin ? '還沒有帳號？點此註冊' : '已有帳號？點此登入' }}
          </UButton>
        </div>
      </form>
    </UCard>

    <div v-else class="text-center">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary-600" />
      <p class="mt-2 text-gray-600">載入中...</p>
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
    router.push('/')
  }
}, { immediate: true })

const handleSubmit = async () => {
  try {
    if (isLogin.value) {
      await login(email.value, password.value)
    } else {
      await register(email.value, password.value)
    }
    router.push('/')
  } catch (e) {
    console.error('認證失敗：', e)
  }
}

const handleGoogleLogin = async () => {
  try {
    await loginWithGoogle()
    router.push('/')
  } catch (e) {
    console.error('Google 登入失敗：', e)
  }
}
</script> 