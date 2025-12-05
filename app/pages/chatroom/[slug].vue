<template>
    <div>
        <div class="chatroom">
            <section class="chatroom-header">
                <div class="chatroom-header-left">
                    <IconTalk />
                    <h1>{{ chatroom?.name }}</h1>
                </div>
                <button
                    class="toggle-users-btn"
                    @click="showUsers = !showUsers"
                    :class="{ active: showUsers }"
                >
                    <IconPeople />
                    <span>{{ connectedUsers.length }}</span>
                </button>
            </section>
            <section v-if="!showUsers" class="chatroom-body" ref="chatroomBodyRef">
                <div class="messages-wrapper">
                    <div
                        class="message"
                        :class="{
                            user: [user.AnonymousUser?.name, user.displayName].includes(
                                message?.username
                            ),
                        }"
                        v-for="message in chatroom?.messages"
                        :key="message?.id"
                    >
                        <div class="message-avatar">
                            <span>{{ getFirstLetterOfName(message?.username) }}</span>
                        </div>
                        <div class="message-content">
                            <div class="message-content-header">
                                <p>{{ message?.username }}</p>
                            </div>
                            <div class="message-content-text">
                                <p>{{ message?.content }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section v-else class="chatroom-body users-list">
                <div class="users-list-header">
                    <h2>Connected users ({{ connectedUsers.length }})</h2>
                </div>
                <div class="users-list-content">
                    <div
                        v-for="connectedUser in connectedUsers"
                        :key="connectedUser.id"
                        class="users-list-content-item"
                    >
                        <div class="user-main-info">
                            <div class="user-avatar">
                                <span>{{ getFirstLetterOfName(connectedUser.name) }}</span>
                            </div>
                            <div class="user-info">
                                <div class="user-name-row">
                                    <p class="user-name">{{ connectedUser.name }}</p>
                                    <span v-if="connectedUser.is_admin" class="admin-badge"
                                        >Admin</span
                                    >
                                </div>
                                <p class="user-status">En ligne</p>
                            </div>
                        </div>
                        <button
                            v-if="currentUserIsAdmin && !connectedUser.is_admin"
                            class="kick-btn"
                            @click="handleKick(connectedUser.id)"
                            title="Kick user"
                        >
                            Kick
                        </button>
                    </div>
                    <div v-if="connectedUsers.length === 0" class="no-users">
                        <p>No connected users</p>
                    </div>
                </div>
            </section>
            <section class="chatroom-input">
                <div class="chatroom-input-content">
                    <textarea placeholder="Message" v-model="newMessage"></textarea>
                    <ClientOnly>
                        <template #default>
                            <p>
                                Post as
                                {{ user.isAnonymous ? user.AnonymousUser?.name : user.displayName }}
                            </p>
                        </template>
                        <template #fallback>
                            <p></p>
                        </template>
                    </ClientOnly>
                </div>
                <button
                    @click="addNewMessage"
                    :disabled="!newMessage || (!user.isAnonymous && !user.isLoggedIn)"
                >
                    <IconPaperPlane />
                </button>
            </section>
        </div>
    </div>
</template>

<script setup>
import { useChatrooms } from '@/composables/api/useChatrooms'
import { usePresence } from '@/composables/api/usePresence'
import { useUserStore } from '@/stores/user'
import { getFirstLetterOfName } from '@/utils'
const user = useUserStore()
const route = useRoute()
const { getChatroom, addMessage, addChatUser, subscribeToMessages, unsubscribeFromMessages } =
    useChatrooms()
const {
    connectedUsers,
    currentUserIsAdmin,
    subscribeToPresence,
    unsubscribeFromPresence,
    kickUser,
} = usePresence()

const chatroom = ref(null)
const newMessage = ref('')
const chatroomBodyRef = ref(null)
const showUsers = ref(false)

const scrollToBottom = () => {
    nextTick(() => {
        if (chatroomBodyRef.value) {
            chatroomBodyRef.value.scrollTop = chatroomBodyRef.value.scrollHeight
        }
    })
}

onMounted(async () => {
    try {
        const chatroomData = await getChatroom(route?.params?.slug)
        if (chatroomData?.success) {
            chatroom.value = chatroomData?.data
            if (!user.isInitialized) {
                await user.initUser()
            }
            let authUserId = user.isLoggedIn ? user.id : null
            let anonymousName = user.isAnonymous ? user.AnonymousUser?.name : null
            await addChatUser(chatroom.value?.id, authUserId, anonymousName)

            subscribeToPresence(chatroom.value?.id)

            subscribeToMessages(chatroom.value?.id, (newMessage) => {
                if (chatroom.value?.messages) {
                    const messageExists = chatroom.value.messages.some(
                        (msg) => msg.id === newMessage.id
                    )
                    if (!messageExists) {
                        chatroom.value.messages.push(newMessage)
                        scrollToBottom()
                    }
                }
            })

            scrollToBottom()
        }
    } catch (error) {
        console.error('Error retrieving chatroom:', error.message)
    }
})

onUnmounted(() => {
    unsubscribeFromPresence()
    unsubscribeFromMessages()
})

watch(
    () => chatroom.value?.messages?.length,
    () => {
        scrollToBottom()
    }
)

const addNewMessage = async () => {
    let authUserId = user.isLoggedIn ? user.id : null
    let anonymousName = user.isAnonymous ? user.AnonymousUser?.name : null
    const messageData = await addMessage(
        chatroom.value?.id,
        authUserId,
        user.displayName,
        anonymousName,
        newMessage.value
    )
    if (messageData?.success) {
        chatroom.value?.messages?.push(messageData?.message)
        newMessage.value = ''
        scrollToBottom()
    }
}

const handleKick = async (userId) => {
    const result = await kickUser(userId)
    if (result?.success) {
    } else {
        console.error('Error kicking user:', result?.error)
    }
}
</script>

<style lang="scss" scoped>
.chatroom {
    width: 100%;
    height: 80vh;
    max-height: 700px;
    display: flex;
    flex-direction: column;
    border: 1px solid $color-border-grey;
    border-radius: $border-radius-md;
    overflow: hidden;
    background-color: $content-color-primary;
    position: relative;
    &-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        z-index: 10;
        gap: $spacing-md;
        padding: $spacing-md;
        border-bottom: 1px solid $color-border-grey;
        background-color: rgba(13, 24, 50, 0.4);
        backdrop-filter: blur(10px);
        &-left {
            display: flex;
            align-items: center;
            gap: $spacing-md;
            svg {
                padding-top: 5px;
                transform: scale(1.3);
            }
        }
        .toggle-users-btn {
            display: flex;
            align-items: center;
            gap: $spacing-xs;
            padding: $spacing-xs $spacing-sm;
            background-color: $color-border-grey;
            border: 1px solid $color-border-grey;
            border-radius: $border-radius-md;
            cursor: pointer;
            transition: all 0.2s;
            font-size: pxToRem(14px);
            &:hover {
                opacity: 0.8;
            }
            &.active {
                background-color: $color-text-primary;
                color: $content-color-primary;
            }
            span {
                font-weight: 600;
            }
        }
    }
    &-body {
        flex: 1;
        overflow-y: auto;
        padding: $spacing-md 0;
        .messages-wrapper {
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            gap: $spacing-md;
            min-height: 100%;
        }
        .message {
            display: flex;
            flex-direction: row;
            gap: $spacing-md;
            margin: 0 $spacing-md;
            @media (max-width: $mq-xs) {
                gap: $spacing-sm;
            }
            &-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background-color: #7c9df0;
                overflow: hidden;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: pxToRem(16px);
                font-weight: 600;
                color: $color-text-primary;
            }
            &-content {
                display: flex;
                flex-direction: column;
                gap: $spacing-md;
                flex: 0.8;
                background: linear-gradient(45deg, #121132, #081122);
                border: 1px solid $color-border-grey-dark;
                border-radius: $border-radius-md;
                padding: $spacing-sm $spacing-md $spacing-md $spacing-md;
                @media (max-width: $mq-xs) {
                    flex: 1;
                }
                &-header {
                    display: flex;
                    flex-direction: row;
                    gap: $spacing-md;
                    p {
                        font-size: pxToRem(14px);
                        color: $color-text-secondary;
                    }
                }
                &-text {
                    display: flex;
                    flex-direction: row;
                    gap: $spacing-md;
                }
            }
            &.user {
                flex-direction: row-reverse;
                .message-content {
                    background: linear-gradient(45deg, #1c1626, #081122);
                    border: 1px solid $color-border-grey-dark;
                }
            }
        }
    }
    .users-list {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        &-header {
            padding: $spacing-md;
            border-bottom: 1px solid $color-border-grey;
            h2 {
                font-size: pxToRem(18px);
                font-weight: 600;
                color: $color-text-primary;
            }
        }
        &-content {
            padding: $spacing-md;
            display: flex;
            flex-direction: column;
            gap: $spacing-md;
            &-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: $spacing-md;
                padding: $spacing-sm;
                border-radius: $border-radius-md;
                background-color: $color-border-grey;
                .user-main-info {
                    display: flex;
                    align-items: center;
                    gap: $spacing-md;
                    flex: 1;
                }
                .user-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background-color: $content-color-primary;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: pxToRem(16px);
                    font-weight: 600;
                    color: $color-text-primary;
                }
                .user-info {
                    display: flex;
                    flex-direction: column;
                    gap: $spacing-xs;
                    flex: 1;
                    .user-name-row {
                        display: flex;
                        align-items: center;
                        gap: $spacing-xs;
                        .user-name {
                            font-size: pxToRem(14px);
                            font-weight: 600;
                            color: $color-text-primary;
                        }
                        .admin-badge {
                            font-size: pxToRem(10px);
                            font-weight: 600;
                            padding: 2px $spacing-xs;
                            background-color: $color-text-primary;
                            color: $content-color-primary;
                            border-radius: $border-radius-sm;
                            text-transform: uppercase;
                        }
                    }
                    .user-status {
                        font-size: pxToRem(12px);
                        color: $color-text-primary;
                        opacity: 0.7;
                    }
                }
                .kick-btn {
                    padding: $spacing-xs $spacing-sm;
                    background-color: transparent;
                    border: 1px solid $color-text-primary;
                    border-radius: $border-radius-sm;
                    color: $color-text-primary;
                    font-size: pxToRem(12px);
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    &:hover {
                        background-color: $color-text-primary;
                        color: $content-color-primary;
                    }
                }
            }
        }
        .no-users {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: $spacing-lg;
            p {
                color: $color-text-primary;
                opacity: 0.5;
            }
        }
    }
    &-input {
        padding: $spacing-md;
        border-top: 1px solid $color-border-grey;
        display: flex;
        gap: $spacing-sm;
        &-content {
            display: flex;
            flex-direction: column;
            gap: $spacing-xs;
            flex: 1;
            textarea {
                width: 100%;
                height: 40px;
                border: 1px solid $color-border-grey;
                border-radius: $border-radius-md;
                padding: $spacing-sm;
                background-color: $input-color;
                resize: none;
                &::placeholder {
                    color: $color-text-secondary;
                }
            }
            p {
                font-size: pxToRem(12px);
                color: $color-text-primary;
                padding-left: $spacing-sm;
                color: $color-text-secondary;
            }
        }

        button {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            background-color: #5e2bff;
            border-radius: $border-radius-md;
            cursor: pointer;
            transition: all 0.2s ease-in-out;
            &:hover {
                background-color: #451f9d;
            }
            &:disabled {
                background-color: $color-border-grey;
                cursor: not-allowed;
            }
        }
    }
}
</style>
