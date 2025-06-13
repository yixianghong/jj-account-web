<template>
  <nav class="bg-white shadow">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex">
          <div class="flex-shrink-0 flex items-center">
            <NuxtLink to="/" class="text-xl font-bold text-indigo-600">
              記帳本
            </NuxtLink>
          </div>
        </div>

        <div class="flex items-center">
          <div v-if="user" class="flex items-center space-x-4">
            <span class="text-gray-700">{{ user.email }}</span>
            <button
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              @click="handleLogout"
            >
              登出
            </button>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
defineOptions({
  name: 'AppNavbar'
})

const { user, logout } = useAuth()
const router = useRouter()

const handleLogout = async () => {
  try {
    await logout()
    router.push('/login')
  } catch (e) {
    console.error('登出失敗：', e)
  }
}
</script> 