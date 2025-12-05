<template>
    <div class="login-page">
        <h1>Login</h1>

        <form @submit.prevent="login">
            <input type="email" v-model="email" placeholder="Email" required />
            <input type="password" v-model="password" placeholder="Password" required />
            <button type="submit" :disabled="isLoading">
                {{ isLoading ? 'Login...' : 'Login' }}
            </button>
        </form>
        <p v-if="errorMessage" style="color: red">{{ errorMessage }}</p>

        <p>
            No account yet?
            <NuxtLink to="/signup">Signup</NuxtLink>
        </p>
    </div>
</template>

<script setup>
const supabase = useSupabaseClient()
import { useUserStore } from '@/stores/user'
const userStore = useUserStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)
const isLoadingGoogle = ref(false)

const login = async () => {
    errorMessage.value = ''
    isLoading.value = true

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.value,
            password: password.value,
        })

        if (error) {
            console.error('Supabase error:', error)
            errorMessage.value = error.message
        } else {
            await userStore.setUser(data.user)
            const route = useRoute()
            const redirectTo = route.query.redirect
            if (redirectTo) {
                router.push(redirectTo)
            } else {
                if (window.history.length > 1) {
                    router.back()
                } else {
                    router.push('/')
                }
            }
        }
    } catch (err) {
        console.error('Unexpected error:', err)
        errorMessage.value = 'An unexpected error occurred'
    } finally {
        isLoading.value = false
    }
}

const loginWithGoogle = async () => {
    errorMessage.value = ''
    isLoadingGoogle.value = true

    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })

        if (error) {
            console.error('Google login error:', error)
            errorMessage.value = error.message
            isLoadingGoogle.value = false
        }
    } catch (err) {
        console.error('Unexpected error:', err)
        errorMessage.value = 'An unexpected error occurred'
        isLoadingGoogle.value = false
    }
}
</script>

<style lang="scss" scoped>
.login-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
    h1 {
        margin-bottom: $spacing-lg;
    }
    form {
        display: flex;
        flex-direction: column;
        gap: $spacing-sm;
        width: 100%;
        align-items: flex-start;
        margin-bottom: $spacing-lg;
        input {
            background: $input-color;
            border: 1px solid $color-border-grey;
            border-radius: $border-radius-md;
            padding: $spacing-sm;
            color: $color-text-primary;
            width: 100%;
            &::placeholder {
                color: $color-text-secondary;
            }
        }
    }
    button {
        width: 100%;
        padding: $spacing-sm;
        border-radius: $border-radius-md;
        background: $color-text-primary;
        color: $background-color-primary;
        cursor: pointer;
    }
    .separator {
        margin: 20px 0;
        text-align: center;
        position: relative;
        &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            width: 100%;
            height: 1px;
            background: $color-border-grey;
        }

        & span {
            background: $background-color-primary;
            padding: 0 10px;
            position: relative;
            z-index: 1;
        }
    }
}
</style>
