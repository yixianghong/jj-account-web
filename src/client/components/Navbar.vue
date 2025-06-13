<template>
  <UNavigationMenu color="neutral" :items="items" class="w-full px-4" />
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

// 監聽路由變化
watch(() => router.currentRoute.value.path, (path) => {
  if (path === '/logout') {
    handleLogout()
  }
})

// 在組件掛載時檢查使用者狀態
onMounted(() => {
  // 等待下一個 tick，確保 user 狀態已初始化
  nextTick(() => {
    if (!user.value && router.currentRoute.value.path !== '/login') {
      router.push('/login')
    }
  })
})

const items = computed(() => {
  const baseItems = [
    [
      {
        label: '記帳本',
        icon: 'i-lucide-book-open',
        to: '/accounts'
      }
    ]
  ]

  if (user.value) {
    // 已登入狀態
    baseItems.push([
      {
        label: user.value.displayName || user.value.email || '使用者',
        icon: 'i-lucide-user',
        to: '/settings'
      },
      {
        label: '登出',
        icon: 'i-lucide-log-out',
        to: '/logout'
      }
    ])
  } 
  return baseItems
})
</script> 