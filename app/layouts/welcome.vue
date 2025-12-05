<template>
    <div class="welcome-layout">
        <MainHeader :is-welcome="true" />
        <MainSnackbar />
        <section class="welcome-layout-content">
            <slot />
        </section>
    </div>
</template>
<style lang="scss" scoped>
.welcome-layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    &-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: $spacing-xxl $spacing-md;
    }
}
</style>
