<template>
    <div class="header-search">
        <IconSearch class="search-icon" />
        <input
            type="text"
            placeholder="Create or join a chatroom"
            @keypress.space.prevent
            @input="searchTerm = searchTerm.replace(/\s+/g, '').trim()"
            v-model="searchTerm"
        />
        <button class="button-with-icon" @click="goToChatroom" :disabled="!searchTerm">
            {{ existingChatroom ? 'Join' : 'Create' }}
            <IconPlus v-if="!existingChatroom" />
            <IconArrowRight v-else />
        </button>
    </div>
</template>

<script setup>
import { useSearch } from '~/composables/api/useSearch'

const searchTerm = ref('')
const resultChatroom = ref(null)
const existingChatroom = ref(false)
const router = useRouter()
const { search, createChatroom } = useSearch()

const getResults = async () => {
    if (!searchTerm.value || searchTerm.value.trim() === '') {
        resultChatroom.value = null
        existingChatroom.value = false
        return
    }

    try {
        const apiResults = await search(searchTerm.value)

        resultChatroom.value = apiResults.chatroom
        existingChatroom.value = apiResults.existingChatroom
    } catch (error) {
        console.error('Error searching:', error)
        resultChatroom.value = null
        existingChatroom.value = false
    }
}

watch(
    () => searchTerm.value,
    () => {
        getResults()
    }
)

const goToChatroom = async () => {
    if (!searchTerm.value || searchTerm.value.trim() === '') {
        return
    }

    if (resultChatroom.value && existingChatroom.value) {
        router.push(`/chatroom/${resultChatroom.value.name}`)
        return
    }

    try {
        const createResult = await createChatroom(searchTerm.value)
        if (createResult.success) {
            router.push(`/chatroom/${createResult.chatroom.name}`)
        } else {
            console.error('Error creating chatroom:', createResult.error)
        }
    } catch (error) {
        console.error('Error creating chatroom:', error)
    }
}
</script>

<style lang="scss" scoped>
.header-search {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: pxToRem(14px);
    background-color: $input-color;
    border-radius: $border-radius-md;
    border: 1px solid $color-border-grey;
    padding-left: $spacing-sm;
    button.button-with-icon {
        border: none;
        border-left: 1px solid $color-border-grey;
        border-radius: 0 $border-radius-md $border-radius-md 0;
        background-color: transparent;
        width: 100px;
        transition: all 0.2s ease-in-out;
        &:hover {
            background-color: #010203;
        }
        svg {
            padding-top: 1px;
        }
    }
    .search-icon {
        transform: scale(1.3);
    }
    input {
        background-color: $input-color;
        padding: $spacing-sm;
        min-width: 300px;
        height: 40px;
        @media (max-width: $mq-xs) {
            min-width: 200px;
        }
        &::placeholder {
            color: $color-text-secondary;
        }
    }
}
</style>
