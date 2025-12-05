<template>
    <nuxt-link :to="link" class="btn">
        <slot name="icon" />
        <span>{{ label }}</span>
    </nuxt-link>
</template>

<script setup>
defineProps({
    link: {
        type: [String, Object],
        default: null,
        required: false,
    },
    label: {
        type: String,
        required: true,
    },
})
</script>

<style lang="scss" scoped>
.btn {
    width: fit-content;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-sm;
    padding: $spacing-sm $spacing-md;
    border-radius: $border-radius-md;
    color: $color-text-primary;
    border: 1px solid $color-text-primary;
    background-color: $color-text-primary;
    color: $background-color-primary;
    cursor: pointer;
    font-size: pxToRem(14px);
    transition: opacity 0.2s ease-in-out;
    &:hover {
        opacity: 0.7;
    }
}
</style>
