import {defineStore} from 'pinia';

export const useNotificationsStore = defineStore('notifications', {
    state: () => ({
        messages: [],
    }),
    getters: {
        getMessages: (state) => state.messages
    },
    actions: {
        addMessage(msgData) {
            if (!msgData.type) {
                msgData.type = 'success'
            }
            if (!msgData.time && !msgData.rightButton) {
                msgData.time = 1000
            }
            msgData.id = new Date().getTime()
            this.messages.push(msgData)
            if (msgData.time > 0) {
                setTimeout(() => {
                    this.messages.splice(this.messages.findIndex(elem => elem.id === msgData.id), 1)
                }, msgData.time)
            }
        }
    }
})
