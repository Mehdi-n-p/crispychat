export const useChatrooms = () => {
    const supabase = useSupabaseClient()
    const user = useUserStore()

    const getChatroom = async (slug, creation = false) => {
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
    return {
        getChatroom,
        addMessage,
        addChatUser,
    }
}
