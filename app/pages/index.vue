<template>
    <div class="home-page">
        <img src="@/assets/img/logo.svg" alt="CrispyChat" />
        <p class="home-page-baseline">Discover and participate in awesome discussions</p>
        <div class="home-page-search-container">
            <MainSearchBar />
        </div>
    </div>
</template>

<script setup>
definePageMeta({
    layout: 'welcome',
})
</script>

<style lang="scss" scoped>
.actions {
    position: fixed;
    top: 0;
    right: $spacing-xl;
    z-index: 1000;
    display: flex;
    gap: $spacing-sm;
    margin-top: $spacing-xl;
}
.home-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    width: 100%;
    max-width: 800px;
    margin: 0 auto;

    img {
        width: 25vw;
        height: auto;
        @media (max-width: $mq-xs) {
            width: 60vw;
        }
    }

    &-baseline {
        font-size: 2.5vw;
        color: rgba(255, 255, 255, 0.8);
        margin-top: $spacing-xl;
        @media (max-width: $mq-sm) {
            font-size: 5vw;
        }
    }

    &-search-container {
        width: 100%;
        display: flex;
        justify-content: center;
        margin: $spacing-xl 0;
    }

    &-actions {
        display: flex;
        gap: $spacing-sm;
        margin-top: $spacing-lg;
    }
}
</style>
