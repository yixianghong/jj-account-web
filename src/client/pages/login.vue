<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {{ isLogin ? '登入帳號' : '註冊帳號' }}
        </h2>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="email" class="sr-only">電子郵件</label>
            <input
              id="email"
              v-model="email"
              name="email"
              type="email"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="電子郵件"
            >
          </div>
          <div>
            <label for="password" class="sr-only">密碼</label>
            <input
              id="password"
              v-model="password"
              name="password"
              type="password"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="密碼"
            >
          </div>
        </div>

        <div v-if="error" class="text-red-500 text-sm text-center">
          {{ error }}
        </div>

        <div>
          <button
            type="submit"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            :disabled="loading"
          >
            {{ isLogin ? '登入' : '註冊' }}
          </button>
        </div>

        <div class="text-center">
          <button
            type="button"
            class="text-indigo-600 hover:text-indigo-500"
            @click="isLogin = !isLogin"
          >
            {{ isLogin ? '還沒有帳號？點此註冊' : '已有帳號？點此登入' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const { login, register, error, loading } = useAuth()

const email = ref('')
const password = ref('')
const isLogin = ref(true)

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
</script> 