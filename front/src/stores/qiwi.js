import {defineStore} from 'pinia';
import axios from "@/plugins/axios";
import {errRequestHandler} from "@/plugins/errorResponser";

export const useQiwiStore = defineStore('qiwi', {
    state: () => ({
        list: [],
        byId: null,
    }),
    getters: {
        activeListWhtiNull: (store) => store.list.filter(el=>el.is_active).map(el=>({...el,title: el.description||el.token})).concat([{id: -1, title: "Любой доступный"}]),
    },
    actions: {
        fetchById(id) {
            return axios.get(`${envConfig.API_URL}/qiwi/${id}`)
                .then(res => {
                    const resdata = res.data;
                    if (
                        Object.prototype.hasOwnProperty.call(resdata, "message") &&
                        resdata.message === "ok"
                    ) {
                        this.byId = resdata.result;
                        return true;
                    } else {
                        return resdata.message || resdata.error || -1;
                    }
                })
                .catch(errRequestHandler)
        },
        fetchList() {
            return axios.get(`${envConfig.API_URL}/qiwi`)
                .then(res => {
                    const resdata = res.data;
                    if (
                        Object.prototype.hasOwnProperty.call(resdata, "message") &&
                        resdata.message === "ok"
                    ) {
                        this.list = resdata.result.data;
                        return true;
                    } else {
                        return resdata.message || resdata.error || -1;
                    }
                })
                .catch(errRequestHandler)
        },
        update(data) {
            return axios.patch(`${envConfig.API_URL}/qiwi/${data.id}`, data)
                .then(res => {
                    const resdata = res.data;
                    if (
                        Object.prototype.hasOwnProperty.call(resdata, "message") &&
                        resdata.message === "ok"
                    ) {
                        return true;
                    } else {
                        return resdata.message || resdata.error || -1;
                    }
                })
                .catch(errRequestHandler)
        },
        activate(id) {
            return axios.get(`${envConfig.API_URL}/qiwi/${id}/activate`)
                .then(res => {
                    const resdata = res.data;
                    if (
                        Object.prototype.hasOwnProperty.call(resdata, "message") &&
                        resdata.message === "ok"
                    ) {
                        this.list.forEach(el=>{
                            if (el.id===id) {
                                el.is_active = true
                            }
                        })
                        return true;
                    } else {
                        return resdata.message || resdata.error || -1;
                    }
                })
                .catch(errRequestHandler)
        },
        deactivate(id) {
            return axios.get(`${envConfig.API_URL}/qiwi/${id}/deactivate`)
                .then(res => {
                    const resdata = res.data;
                    if (
                        Object.prototype.hasOwnProperty.call(resdata, "message") &&
                        resdata.message === "ok"
                    ) {
                        this.list.forEach(el=>{
                            if (el.id===id) {
                                el.is_active = false
                            }
                        })
                        return true;
                    } else {
                        return resdata.message || resdata.error || -1;
                    }
                })
                .catch(errRequestHandler)
        },
        createToken(data) {
            return axios.post(`${envConfig.API_URL}/qiwi`, data)
                .then(res => {
                    const resdata = res.data;
                    if (
                        Object.prototype.hasOwnProperty.call(resdata, "message") &&
                        resdata.message === "ok"
                    ) {
                        return true;
                    } else {
                        return resdata.message || resdata.error || -1;
                    }
                })
                .catch(errRequestHandler)
        }
    }
})
