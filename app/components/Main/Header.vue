<template>
    <header>
        <div class="header-container" :class="{ 'welcome-header': isWelcome }">
            <div v-if="!isWelcome" class="header-logo">
                <NuxtLink to="/">
                    <img :src="logoUrl" alt="CrispyChat" />
                </NuxtLink>
            </div>
            <MainSearchBar v-if="!isWelcome" />
            <div class="right-menu">
                <ClientOnly>
                    <div v-if="user.isLoggedIn" class="header-profile">
                        <div class="header-profile-user">
                            <h4>{{ user.displayName }}</h4>
                            <div class="header-profile-user-avatar"></div>
                            <div class="header-profile-user-menu">
                                <nav class="header-profile-user-menu-nav">
                                    <h4>{{ user.displayName }}</h4>
                                    <NuxtLink to="/" @click="logout">Logout</NuxtLink>
                                </nav>
                            </div>
                        </div>
                    </div>
                    <MainButton v-else link="/login" label="Login" />
                    <MainButton v-if="!user.isLoggedIn" link="/signup" label="Signup" />
                </ClientOnly>
            </div>
        </div>
    </header>
</template>

<script setup>
import { useUserStore } from '@/stores/user'
import logoUrl from '~/assets/img/logo.svg'

const user = useUserStore()
const props = defineProps({
    isWelcome: {
        type: Boolean,
        default: false,
    },
})
const logout = async () => {
    await user.logout()
}
</script>

<style lang="scss" scoped>
header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    background-color: $background-color-primary;
    height: $header-height;
    .header-container {
        width: 100%;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 100%;
        padding: 0 $spacing-md;

        .header-logo {
            img {
                width: 150px;
                height: auto;
            }
        }

        .right-menu {
            display: flex;
            align-items: center;
            gap: 10px;
            justify-content: space-between;

            .header-profile {
                display: flex;
                align-items: center;
                gap: 10px;
                position: relative;

                &-user:hover {
                    .header-profile-user-menu {
                        visibility: visible;
                        opacity: 1;
                    }
                }
                &-user {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    &-avatar {
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        border: 1px solid $color-border-grey;
                        background-color: $color-border-grey;
                    }
                    &-menu {
                        visibility: hidden;
                        position: absolute;
                        top: 100%;
                        right: 0;
                        opacity: 0;
                        transition: $transition-fade;
                        &-nav {
                            min-width: 200px;
                            display: flex;
                            flex-direction: column;
                            gap: 10px;
                            margin-top: $spacing-sm;
                            border: 1px solid $color-border-grey;
                            border-radius: $border-radius-md;
                            padding: $spacing-md;
                            background-color: $background-color-primary;
                            box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
                        }
                    }
                }
            }
        }
        @media (max-width: $mq-xs) {
            padding-top: $spacing-md;
            height: $header-height-xs;
            flex-direction: column;
            align-items: center;
            gap: $spacing-sm;
        }

        &.welcome-header {
            justify-content: flex-end;
        }
    }
}
</style>
