import { defineStore } from 'pinia'

export const useUserStore = defineStore('userStore', () => {
    const user = ref(null)
    const isInitialized = ref(false)
    const AnonymousUser = ref(null)
    const isAnonymous = computed(() => {
        return AnonymousUser.value !== null
    })
    const isLoggedIn = computed(() => {
        return user.value !== null
    })

    const isLoading = computed(() => {
        return !isInitialized.value
    })

    const getUser = computed(() => {
        return user.value
    })

    const displayName = computed(() => {
        return user.value?.display_name
    })
    const email = computed(() => {
        return user.value?.email
    })
    const id = computed(() => {
        return user.value?.id
    })

    const setUser = async (userData) => {
        if (process.server) {
            user.value = userData
            AnonymousUser.value = null
            return
        }

        const supabase = useSupabaseClient()
        if (!supabase) {
            console.error('Supabase client not available')
            user.value = userData
            AnonymousUser.value = null
            return
        }

        const { data, error } = await supabase
            .from('users_extended')
            .select('*')
            .eq('id', userData.id)
        if (error) {
            console.error('Retrieving user error:', error)
            return
        }
        user.value = data[0] || userData
        AnonymousUser.value = null
        if (process.client) {
            localStorage.removeItem('anonymousUser')
        }
    }

    const setAnonymousUser = async (id, name) => {
        AnonymousUser.value = {
            id: id,
            name: name,
        }
        if (process.client) {
            localStorage.setItem('anonymousUser', JSON.stringify(AnonymousUser.value))
        }
    }

    const initUser = async () => {
        if (process.server) {
            isInitialized.value = true
            user.value = null
            AnonymousUser.value = null
            return
        }

        const supabase = useSupabaseClient()
        if (!supabase) {
            console.error('Supabase client not available')
            isInitialized.value = true
            user.value = null
            AnonymousUser.value = null
            return
        }

        try {
            const {
                data: { session },
            } = await supabase.auth.getSession()

            if (session?.user) {
                console.log('Session found, user connected:', session.user)
                await setUser(session.user)
            } else {
                console.log('No session active')
                user.value = null
                if (process.client) {
                    const storedAnonymousUser = localStorage.getItem('anonymousUser')
                    if (storedAnonymousUser) {
                        try {
                            AnonymousUser.value = JSON.parse(storedAnonymousUser)
                            console.log(
                                'Anonymous user restored from localStorage:',
                                AnonymousUser.value
                            )
                        } catch (e) {
                            console.error('Error parsing anonymous user from localStorage:', e)
                            AnonymousUser.value = null
                        }
                    } else {
                        AnonymousUser.value = null
                    }
                } else {
                    AnonymousUser.value = null
                }
            }
        } catch (error) {
            console.error('Error initializing user:', error)
            user.value = null
            AnonymousUser.value = null
        }

        isInitialized.value = true

        if (supabase && supabase.auth) {
            supabase.auth.onAuthStateChange((event, session) => {
                console.log('Auth change:', event, session)
                if (event === 'SIGNED_IN' && session?.user) {
                    setUser(session.user)
                } else if (event === 'SIGNED_OUT') {
                    user.value = null
                    if (process.client) {
                        const storedAnonymousUser = localStorage.getItem('anonymousUser')
                        if (storedAnonymousUser) {
                            try {
                                AnonymousUser.value = JSON.parse(storedAnonymousUser)
                            } catch (e) {
                                console.error('Error parsing anonymous user from localStorage:', e)
                                AnonymousUser.value = null
                            }
                        } else {
                            AnonymousUser.value = null
                        }
                    }
                }
            })
        }
    }

    const logout = async () => {
        if (process.server) {
            user.value = null
            return
        }

        const supabase = useSupabaseClient()
        if (!supabase || !supabase.auth) {
            console.error('Supabase client not available')
            user.value = null
            return
        }

        const { error } = await supabase.auth.signOut()
        if (error) console.log(error)
        else user.value = null
    }

    return {
        user,
        getUser,
        displayName,
        email,
        id,
        isLoggedIn,
        isLoading,
        isInitialized,
        setUser,
        logout,
        initUser,
        setAnonymousUser,
        isAnonymous,
        AnonymousUser,
    }
})
