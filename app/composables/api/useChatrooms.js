export const useChatrooms = () => {
    const user = useUserStore()

    const getSupabaseClient = () => {
        if (process.server) return null
        try {
            return useSupabaseClient()
        } catch (error) {
            console.error('Error getting Supabase client:', error)
            return null
        }
    }

    const getChatroom = async (slug, creation = false) => {
        const supabase = getSupabaseClient()
        if (!supabase) {
            return { success: false, error: 'Supabase client not available' }
        }
        const { data, error } = await supabase.from('chatrooms').select('*').eq('name', slug)

        if (error) {
            console.error('Error retrieving chatroom:', error)
            return { success: false, error }
        } else {
            const { data: messages, error: messagesError } = await supabase
                .from('messages')
                .select('*')
                .eq('chatroom_id', data[0].id)
                .order('created_at', { ascending: false })
                .limit(10)
            if (messagesError) {
                console.error('Error retrieving messages:', messagesError)
                return { success: false, error: messagesError }
            } else {
                data[0].messages = messages.reverse()
            }
        }

        return { success: true, data: data[0] }
    }

    const addMessage = async (
        chatroomId,
        authUserId = null,
        displayName = null,
        anonymousName = null,
        message
    ) => {
        const orConditions = []
        if (authUserId) {
            orConditions.push(`auth_user_id.eq.${authUserId}`)
        }
        if (anonymousName) {
            orConditions.push(`anonymous_name.eq.${anonymousName}`)
        }

        const supabase = getSupabaseClient()
        if (!supabase) {
            return { success: false, error: 'Supabase client not available' }
        }

        let query = supabase.from('chat_users').select('id').eq('chatroom_id', chatroomId)

        if (orConditions.length > 0) {
            query = query.or(orConditions.join(','))
        }

        const { data: chatUserId, error: chatUserIdError } = await query.maybeSingle()

        let finalChatUserId = null
        if (chatUserIdError || !chatUserId) {
            const chatUserResult = await addChatUser(chatroomId, authUserId, anonymousName)
            if (!chatUserResult?.success) {
                console.error('Error adding chat user:', chatUserResult?.error)
                return { success: false, error: chatUserResult?.error }
            }
            finalChatUserId = chatUserResult.data.id
        } else {
            finalChatUserId = chatUserId.id
        }

        const { data: newMessage, error: newMessageError } = await supabase
            .from('messages')
            .insert({
                chatroom_id: chatroomId,
                username: displayName ? displayName : anonymousName,
                chat_user_id: finalChatUserId,
                content: message,
            })
            .select()
            .single()

        if (newMessageError) {
            console.error('Error adding message:', newMessageError)
            return { success: false, error: newMessageError }
        }
        return { success: true, message: newMessage }
    }

    const addChatUser = async (chatroomId, authUserId, anonymousName) => {
        const supabase = getSupabaseClient()
        if (!supabase) {
            return { success: false, error: 'Supabase client not available' }
        }

        let existingChatUser = null
        let existingChatUserError = null

        if (authUserId || anonymousName) {
            const orConditions = []
            if (authUserId) {
                orConditions.push(`auth_user_id.eq.${authUserId}`)
            }
            if (anonymousName) {
                orConditions.push(`anonymous_name.eq.${anonymousName}`)
            }

            const { data, error } = await supabase
                .from('chat_users')
                .select('*')
                .eq('chatroom_id', chatroomId)
                .or(orConditions.join(','))
                .single()

            existingChatUser = data
            existingChatUserError = error
        }

        if (existingChatUser && !existingChatUserError) {
            return { success: true, data: existingChatUser }
        }

        if (existingChatUserError && existingChatUserError.code !== 'PGRST116') {
            console.error('Error checking existing chat user:', existingChatUserError)
            return { success: false, error: existingChatUserError }
        }

        let finalAnonymousName = null
        if (!authUserId) {
            finalAnonymousName = anonymousName || `Guest-${Math.floor(Math.random() * 1000000)}`
        }

        const { count, error: countError } = await supabase
            .from('chat_users')
            .select('*', { count: 'exact', head: true })
            .eq('chatroom_id', chatroomId)

        if (countError) {
            console.error('Error checking chatroom users count:', countError)
            return { success: false, error: countError }
        }

        const isAdmin = count === 0

        const { data: newChatUser, error: newChatUserError } = await supabase
            .from('chat_users')
            .insert({
                chatroom_id: chatroomId,
                auth_user_id: authUserId || null,
                anonymous_name: !authUserId ? finalAnonymousName : null,
                is_admin: isAdmin,
            })
            .select()
            .single()

        if (newChatUserError) {
            console.error('Error creating chat user:', newChatUserError)
            return { success: false, error: newChatUserError }
        }

        if (!authUserId) {
            user.setAnonymousUser(newChatUser.id, newChatUser.anonymous_name)
        }

        return { success: true, data: newChatUser }
    }
    let messagesChannel = null

    const subscribeToMessages = (chatroomId, onNewMessage) => {
        if (process.server) {
            console.warn('Cannot subscribe to messages: server-side')
            return
        }

        const supabase = getSupabaseClient()
        if (!supabase) {
            console.warn('Cannot subscribe to messages: supabase not available')
            return
        }

        if (!chatroomId) {
            console.warn('Cannot subscribe to messages: chatroomId is missing')
            return
        }

        if (messagesChannel) {
            unsubscribeFromMessages()
        }

        const chatroomIdNum = typeof chatroomId === 'string' ? parseInt(chatroomId) : chatroomId

        messagesChannel = supabase
            .channel(`messages:${chatroomId}`, {
                config: {
                    broadcast: { self: false },
                },
            })
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `chatroom_id=eq.${chatroomIdNum}`,
                },
                (payload) => {
                    console.log('📨 New message received via Realtime:', payload)
                    if (onNewMessage && payload.new) {
                        onNewMessage(payload.new)
                    }
                }
            )
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`✅ Successfully subscribed to messages for chatroom ${chatroomId}`)
                } else if (status === 'CHANNEL_ERROR') {
                    console.error(
                        `❌ Error subscribing to messages for chatroom ${chatroomId}:`,
                        err
                    )
                    console.error(
                        '💡 Vérifiez que les publications Realtime sont activées pour la table "messages" dans Supabase'
                    )
                } else if (status === 'TIMED_OUT') {
                    console.warn(`⏱️ Timeout subscribing to messages for chatroom ${chatroomId}`)
                } else if (status === 'CLOSED') {
                    console.log(`🔒 Channel closed for chatroom ${chatroomId}`)
                } else {
                    console.log(`📡 Channel status: ${status} for chatroom ${chatroomId}`)
                }
            })

        return messagesChannel
    }

    const unsubscribeFromMessages = async () => {
        if (messagesChannel) {
            const supabase = getSupabaseClient()
            if (supabase) {
                await supabase.removeChannel(messagesChannel)
            }
            messagesChannel = null
        }
    }

    return {
        getChatroom,
        addMessage,
        addChatUser,
        subscribeToMessages,
        unsubscribeFromMessages,
    }
}
