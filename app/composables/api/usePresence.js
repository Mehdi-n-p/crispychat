export const usePresence = () => {
    const user = useUserStore()
    const snackbarStore = useSnackbarStore()

    const getSupabaseClient = () => {
        if (process.server) return null
        try {
            return useSupabaseClient()
        } catch (error) {
            console.error('Error getting Supabase client:', error)
            return null
        }
    }

    let channel = null
    const connectedUsers = ref([])
    let currentChatroomId = null
    const currentUserIsAdmin = ref(false)

    const subscribeToPresence = (chatroomId) => {
        if (process.server) {
            console.warn('Cannot subscribe to presence: server-side')
            return
        }

        const supabase = getSupabaseClient()
        if (!supabase) {
            console.warn('Cannot subscribe to presence: supabase not available')
            return
        }

        currentChatroomId = chatroomId
        if (!chatroomId) {
            console.warn('Cannot subscribe to presence: chatroomId is missing')
            return
        }

        if (channel) {
            unsubscribeFromPresence()
        }

        const userId = user.isLoggedIn ? user.id : user.AnonymousUser?.id
        const userName = user.isLoggedIn ? user.displayName : user.AnonymousUser?.name

        if (!userId || !userName) {
            console.warn(
                'Cannot subscribe to presence: user info missing. Waiting for user initialization...'
            )
            if (!user.isInitialized) {
                setTimeout(() => {
                    subscribeToPresence(chatroomId)
                }, 500)
            }
            return
        }

        channel = supabase.channel(`chatroom:${chatroomId}`, {
            config: {
                presence: {
                    key: userId,
                },
            },
        })

        const updateConnectedUsers = async () => {
            const state = channel.presenceState()
            const users = []

            Object.keys(state).forEach((key) => {
                const presences = state[key]
                if (Array.isArray(presences)) {
                    presences.forEach((presence) => {
                        if (!users.find((u) => u.id === presence.id)) {
                            users.push({
                                id: presence.id,
                                name: presence.name,
                                joinedAt: presence.joinedAt,
                            })
                        }
                    })
                }
            })

            if (users.length > 0 && currentChatroomId) {
                try {
                    const supabase = getSupabaseClient()
                    if (!supabase) return

                    const { data: chatUsers, error } = await supabase
                        .from('chat_users')
                        .select('id, auth_user_id, anonymous_name, is_admin')
                        .eq('chatroom_id', currentChatroomId)

                    if (!error && chatUsers) {
                        const currentUserId = user.isLoggedIn ? user.id : user.AnonymousUser?.id

                        users.forEach((userItem) => {
                            let chatUser = chatUsers.find((cu) => cu.auth_user_id === userItem.id)

                            if (!chatUser) {
                                chatUser = chatUsers.find(
                                    (cu) => cu.id === userItem.id && cu.anonymous_name
                                )
                            }

                            if (chatUser) {
                                userItem.is_admin = chatUser.is_admin || false

                                if (
                                    (user.isLoggedIn && chatUser.auth_user_id === currentUserId) ||
                                    (user.isAnonymous && chatUser.id === currentUserId)
                                ) {
                                    currentUserIsAdmin.value = chatUser.is_admin || false
                                }
                            } else {
                                userItem.is_admin = false
                            }
                        })
                    }
                } catch (err) {
                    console.error('Error fetching admin status:', err)
                    users.forEach((userItem) => {
                        userItem.is_admin = false
                    })
                }
            }

            connectedUsers.value = users
        }

        channel
            .on('presence', { event: 'sync' }, () => {
                updateConnectedUsers()
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                updateConnectedUsers()
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                updateConnectedUsers()
            })
            .on('broadcast', { event: 'kick' }, ({ payload }) => {
                const currentUserId = user.isLoggedIn ? user.id : user.AnonymousUser?.id
                if (payload.userId === currentUserId) {
                    if (process.client) {
                        snackbarStore.showSnackbar({
                            message: 'You have been kicked from the chatroom',
                            color: 'error',
                            timeout: 3000,
                        })
                        setTimeout(() => {
                            navigateTo('/')
                        }, 500)
                    }
                }
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        id: userId,
                        name: userName,
                        joinedAt: new Date().toISOString(),
                    })
                }
            })
    }

    const kickUser = async (userIdToKick) => {
        if (!channel || !currentUserIsAdmin.value) {
            console.warn('Cannot kick user: not admin or channel not available')
            return { success: false, error: 'Not authorized' }
        }

        try {
            await channel.send({
                type: 'broadcast',
                event: 'kick',
                payload: {
                    userId: userIdToKick,
                    timestamp: new Date().toISOString(),
                },
            })

            return { success: true }
        } catch (error) {
            console.error('Error kicking user:', error)
            return { success: false, error }
        }
    }

    const unsubscribeFromPresence = async () => {
        if (channel) {
            const supabase = getSupabaseClient()
            if (supabase) {
                await channel.untrack()
                await supabase.removeChannel(channel)
            }
            channel = null
            connectedUsers.value = []
            currentChatroomId = null
        }
    }

    return {
        connectedUsers,
        currentUserIsAdmin,
        subscribeToPresence,
        unsubscribeFromPresence,
        kickUser,
    }
}
