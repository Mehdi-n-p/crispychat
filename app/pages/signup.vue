<template>
    <div class="signup-page">
        <h1>Signup</h1>

        <form @submit.prevent="signUp">
            <input type="text" v-model="displayName" placeholder="Display name" required />
            <input type="email" v-model="email" placeholder="Email" required />
            <input
                type="password"
                v-model="password"
                placeholder="Password (min. 6 characters)"
                minlength="6"
                required
            />
            <button type="submit" :disabled="isLoading">
                {{ isLoading ? 'Signup...' : 'Signup' }}
            </button>
        </form>

        <p v-if="errorMessage" style="color: red">{{ errorMessage }}</p>
        <p v-if="successMessage" style="color: green">{{ successMessage }}</p>

        <p>
            Already have an account ?
            <NuxtLink to="/login"> Login</NuxtLink>
        </p>
    </div>
</template>

<script setup>
const supabase = useSupabaseClient()
import { useUserStore } from '@/stores/user'
const userStore = useUserStore()
const router = useRouter()

const displayName = ref('')
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)

const signUp = async () => {
    errorMessage.value = ''
    successMessage.value = ''
    isLoading.value = true

    try {
        const { data: existingDisplayName } = await supabase
            .from('users_extended')
            .select('display_name')
            .eq('display_name', displayName.value)
            .single()

        if (existingDisplayName) {
            errorMessage.value = 'This display name is already used'
            isLoading.value = false
            return
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email.value,
            password: password.value,
        })

        if (authError) {
            console.error('Signup error:', authError)
            errorMessage.value = authError.message
            isLoading.value = false
            return
        }

        if (!authData.user) {
            errorMessage.value = 'Error creating account'
            isLoading.value = false
            return
        }

        const { error: profileError } = await supabase.from('users_extended').insert({
            id: authData.user.id,
            display_name: displayName.value,
            avatar_url: null,
        })

        if (profileError) {
            console.error('Error creating profile:', profileError)
            errorMessage.value = 'Error creating profile: ' + profileError.message
            isLoading.value = false
            return
        }

        successMessage.value = 'Signup successful! Redirecting...'
        await userStore.setUser(authData.user)

        setTimeout(() => {
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
        }, 1000)
    } catch (err) {
        console.error('Unexpected error:', err)
        errorMessage.value = 'An unexpected error occurred'
    } finally {
        isLoading.value = false
    }
}
</script>

<style lang="scss" scoped>
.signup-page {
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
