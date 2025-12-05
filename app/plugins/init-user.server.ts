import { defineNuxtPlugin } from '#app'
import { useUserStore } from '~/stores/user'

export default defineNuxtPlugin(async (nuxtApp) => {
    const userStore = useUserStore()
    if (!userStore.isInitialized) {
        await userStore.initUser()
    }
})
