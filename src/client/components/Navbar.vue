<template>
  <nav class="sticky top-0 left-0 right-0 z-50 px-4 py-2 flex items-center justify-between bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
    <!-- LOGO/APP名稱 -->
    <div class="flex items-center gap-2 cursor-pointer" @click="router.push('/accounts')">
      <img src="@/assets/imgs/icon.png" alt="Logo" class="w-8 h-8 rounded-lg" />
      <span class="text-xl font-extrabold tracking-tight text-primary-700">記帳夥伴</span>
    </div>
    <!-- 使用者區塊 -->
    <div class="flex items-center gap-3">
      <template v-if="user">
        <div class="flex items-center gap-2 px-2 py-1 rounded-full bg-gray-50 border border-gray-200">
          <div class="w-8 h-8 rounded-full bg-primary-200 flex items-center justify-center text-primary-800 font-bold text-lg">
            {{ user.displayName?.[0] || user.email?.[0] || 'U' }}
          </div>
          <span class="font-medium text-gray-700 max-w-[100px] truncate">{{ user.displayName || user.email }}</span>
          <UDropdownMenu :items="userMenuItems" :popper="{ placement: 'bottom-end' }">
            <UButton icon="i-lucide-chevron-down" variant="ghost" size="xs" class="ml-1" />
          </UDropdownMenu>
        </div>
      </template>
      <template v-else>
        <UButton color="primary" to="/">登入</UButton>
      </template>
    </div>
  </nav>
</template>

<script setup>
defineOptions({
  name: 'AppNavbar'
})

const { user, logout } = useAuth()
const router = useRouter()

const handleLogout = async () => {
  try {
    await logout()
    router.push('/')
  } catch (e) {
    console.error('登出失敗：', e)
  }
}

const navItems = [
  [
    {
      label: '首頁',
      icon: 'i-lucide-book-open',
      to: '/accounts'
    }
  ]
]

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