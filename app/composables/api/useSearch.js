export const useSearch = () => {
    const supabase = useSupabaseClient()

    const search = async (searchTerm) => {
        if (!searchTerm || searchTerm.trim() === '') {
            return { success: true, chatroom: null, existingChatroom: false }
        }

        let existingChatroom = false
        let { data: chatroom, error } = await supabase
            .from('chatrooms')
            .select('*')
            .eq('name', searchTerm)
            .maybeSingle()

        if (error) {
            console.error('Error retrieving chatroom:', error)
            return { success: false, error }
        }

        if (chatroom) {
            existingChatroom = true
        } else {
            existingChatroom = false
            chatroom = null
        }

        return { success: true, chatroom, existingChatroom }
    }

    const createChatroom = async (searchTerm) => {
        if (!searchTerm || searchTerm.trim() === '') {
            return { success: false, error: 'Search term is required' }
        }

        const { data: newChatroom, error: newChatroomError } = await supabase
            .from('chatrooms')
            .insert({ name: searchTerm })
            .select()
            .single()

        if (newChatroomError) {
            return { success: false, error: newChatroomError }
        }

        return { success: true, chatroom: newChatroom }
    }

    return {
        search,
        createChatroom,
    }
}
