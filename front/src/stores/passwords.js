import {defineStore} from 'pinia';
import axios from "@/plugins/axios";
import {errRequestHandler} from "@/plugins/errorResponser";

export const usePasswordsStore = defineStore('passwords', {
    state: () => ({
        list: [],
        byId: null,
    }),
    getters: {},
    actions: {
        fetchById(id) {
            return axios.get(`${envConfig.API_URL}/passwords/${id}`)
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
            return axios.get(`${envConfig.API_URL}/passwords`)
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
            return axios.patch(`${envConfig.API_URL}/passwords/${data.id}`, data)
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
        create(data) {
            return axios.post(`${envConfig.API_URL}/passwords`, data)
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
