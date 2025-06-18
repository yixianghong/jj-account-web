<template>
  <UNavigationMenu color="primary" :items="items" class="w-full px-4" />
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
        onSelect: () => handleLogout()
      }
    ])
  } 
  return baseItems
})
</script> 