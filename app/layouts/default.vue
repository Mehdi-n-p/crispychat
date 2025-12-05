<template>
    <div>
        <MainHeader />
        <MainSnackbar />
        <section class="content">
            <slot />
        </section>
    </div>
</template>

<script>
export default {}
</script>

<style lang="scss" scoped>
.content {
    max-width: $mq-sm;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    padding: calc($header-height + $spacing-xxl) $spacing-md $spacing-xxl $spacing-md;
    gap: $spacing-lg;
    min-height: 70vh;
    @media (max-width: $mq-xs) {
        padding: calc($header-height-xs + $spacing-xxl) $spacing-sm $spacing-xxl $spacing-sm;
    }
}
</style>
