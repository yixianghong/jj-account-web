<template>
  <nav class="sticky top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-sm border-b border-gray-100 dark:border-gray-800" style="padding-top: env(safe-area-inset-top)">
    <div class="mx-auto w-full max-w-3xl h-14 px-4 sm:px-6 flex items-center justify-between">
    <!-- LOGO/APP名稱 -->
    <div class="flex items-center gap-2 cursor-pointer" @click="router.push('/accounts')">
      <img src="@/assets/imgs/icon.png" alt="Logo" class="w-8 h-8 rounded-lg" >
      <span class="text-xl font-extrabold tracking-tight text-primary-700 dark:text-primary-400">記帳夥伴</span>
    </div>
    <!-- 使用者區塊 -->
    <div class="flex items-center gap-2">
      <!-- 深色模式切換 -->
      <ClientOnly>
        <UButton
          :icon="isDark ? 'i-heroicons-sun' : 'i-heroicons-moon'"
          color="neutral"
          variant="ghost"
          size="sm"
          class="rounded-full"
          :aria-label="isDark ? '切換淺色模式' : '切換深色模式'"
          @click="toggleDark"
        />
        <template #fallback>
          <div class="w-8 h-8" />
        </template>
      </ClientOnly>

      <template v-if="user">
        <div class="flex items-center gap-2 px-2 py-1 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div class="w-8 h-8 rounded-full bg-primary-200 dark:bg-primary-900 flex items-center justify-center text-primary-800 dark:text-primary-200 font-bold text-lg">
            {{ user.displayName?.[0] || user.email?.[0] || 'U' }}
          </div>
          <span class="font-medium text-gray-700 dark:text-gray-200 max-w-[100px] truncate">{{ user.displayName || user.email }}</span>
          <UDropdownMenu :items="userMenuItems" :popper="{ placement: 'bottom-end' }">
            <UButton icon="i-lucide-chevron-down" variant="ghost" size="xs" class="ml-1" />
          </UDropdownMenu>
        </div>
      </template>
      <template v-else>
        <UButton color="primary" to="/">登入</UButton>
      </template>
    </div>
    </div>
  </nav>
</template>

<script setup>
defineOptions({
  name: 'AppNavbar'
})

const { user, logout } = useAuth()
const router = useRouter()

// 深色模式切換
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
const toggleDark = () => {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}

const handleLogout = async () => {
  try {
    await logout()
    router.push('/')
  } catch (e) {
    console.error('登出失敗：', e)
  }
}

const userMenuItems = [
  [
    {
      label: '個人設定',
      icon: 'i-lucide-user',
      to: '/settings'
    },
    {
      label: '登出',
      icon: 'i-lucide-log-out',
      onSelect: () => handleLogout()
    }
  ]
]
</script> 