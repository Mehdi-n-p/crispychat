// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: { enabled: true },
    css: ['~/assets/style/main.scss'],
    runtimeConfig: {
        public: {
            SUPABASE_URL: process.env.SUPABASE_URL,
            SUPABASE_KEY: process.env.SUPABASE_KEY,
        },
    },
    vite: {
        css: {
            preprocessorOptions: {
                scss: {
                    additionalData:
                        '@use "~/assets/style/variables.scss" as *; @use "~/assets/style/mixins.scss" as *;',
                },
            },
        },
    },
    modules: ['@pinia/nuxt', '@nuxtjs/supabase'],
    supabase: {
        redirect: false,
    },
})
