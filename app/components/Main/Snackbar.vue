<template>
    <transition name="fade">
        <div v-if="show" class="snackbar" :class="[color, { show: show }]" :timeout="timeout">
            <div class="snackbar-message" data-test-id="snackbar-message">
                <span v-html="message" />
            </div>
            <div class="snackbar-icon icon-close u-bg-white" @click="close" />
        </div>
    </transition>
</template>

<script setup>
import { useSnackbarStore } from '@/stores/snackbar'
const snackbarStore = useSnackbarStore()

const settledTimeout = ref(null)
const message = computed(() => snackbarStore.getMessage)
const color = computed(() => snackbarStore.getColor)
const timeout = computed(() => snackbarStore.getTimeout)
const show = computed(() => snackbarStore.getShow)

watch(
    () => show.value,
    (v) => {
        if (v) {
            settledTimeout.value = setTimeout(() => {
                close()
            }, timeout.value)
        }
    }
)

onBeforeUnmount(() => {
    if (settledTimeout.value !== null) {
        clearTimeout(settledTimeout.value)
    }
})

const close = () => {
    snackbarStore.hideSnackbar()
    clearTimeout(settledTimeout.value)
}
</script>

<style lang="scss">
.snackbar {
    position: fixed;
    bottom: $spacing-md;
    right: $spacing-md;
    z-index: 9999;

    display: flex;
    align-items: center;

    padding: $spacing-xs $spacing-md;
    border-radius: $spacing-xs;

    @media (max-width: $mq-md) {
        bottom: $spacing-md;
        right: $spacing-md;
        left: 50%;
        transform: translateX(-50%);
    }

    &-message {
        color: $color-text-primary;
    }

    &.success {
        background-color: green;
    }
    &.error {
        background-color: red;
    }

    &-icon:hover {
        cursor: pointer;
    }
}

.fade-enter-active,
.fade-leave-active {
    transition: all 0.2s ease;
}
</style>
