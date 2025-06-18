export default defineNuxtRouteMiddleware((to) => {
    const { user, loading } = useAuth()

    // 如果正在載入中，等待載入完成
    if (loading.value) {
        return
    }

    // 如果使用者未登入且不是前往登入頁面，則重定向到登入頁面
    if (!user.value && to.path !== '/') {
        return navigateTo('/')
    }

    // 如果使用者已登入且前往登入頁面，則重定向到首頁
    if (user.value && to.path === '/') {
        return navigateTo('/')
    }
}) 