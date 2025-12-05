import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useSnackbarStore = defineStore('snackbar', () => {
    const show = ref(false)
    const color = ref('')
    const message = ref('')
    const timeout = ref(3000)
    const canBeClosed = ref(true)

    const getShow = computed(() => show.value)
    const getColor = computed(() => color.value)
    const getMessage = computed(() => message.value)
    const getTimeout = computed(() => timeout.value)
    const getCanBeClosed = computed(() => canBeClosed.value)

    function hideSnackbar() {
        show.value = false
    }

    function showSnackbar(param) {
        color.value = param.color
        message.value = param.message
        timeout.value = param.timeout || 3000
        show.value = true
        canBeClosed.value = param.canBeClosed
    }

    return {
        show,
        color,
        message,
        timeout,
        canBeClosed,
        getShow,
        getColor,
        getMessage,
        getTimeout,
        getCanBeClosed,
        hideSnackbar,
        showSnackbar,
    }
})
