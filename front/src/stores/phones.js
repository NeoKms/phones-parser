import {defineStore} from 'pinia';
import axios from "@/plugins/axios";
import {errRequestHandler} from "@/plugins/errorResponser";

const defOpt = {
    page: 1,
    itemsPerPage: 20,
    sortBy: ["phone"],
    sortDesc: [true],
};
export const usePhonesStore = defineStore('phones', {
    state: () => ({
        list: [],
        byPhone: null,
        allCount: 0,
        maxPages: 0,
    }),
    getters: {},
    actions: {
        fetchList({options = defOpt, filter = {}, select = []}) {
            return axios.post(`${envConfig.API_URL}/phones/list`, {options, filter, select})
                .then(res => {
                    const resdata = res.data;
                    if (
                        Object.prototype.hasOwnProperty.call(resdata, "message") &&
                        resdata.message === "ok"
                    ) {
                        this.list = resdata.result.data;
                        this.allCount = resdata.result.allCount;
                        this.maxPages = resdata.result.maxPages;
                        return true;
                    } else {
                        return resdata.message || resdata.error || -1;
                    }
                })
                .catch(errRequestHandler)
        },
        fetchByPhone(phone) {
            return axios.get(`${envConfig.API_URL}/phones/${phone}`)
                .then(res => {
                    const resdata = res.data;
                    if (
                        Object.prototype.hasOwnProperty.call(resdata, "message") &&
                        resdata.message === "ok"
                    ) {
                        this.byPhone = resdata.result;
                        return true;
                    } else {
                        return resdata.message || resdata.error || -1;
                    }
                })
                .catch(errRequestHandler)
        },
        update(data) {
            return axios.patch(`${envConfig.API_URL}/phones/${data.phone}`, data)
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
            return axios.post(`${envConfig.API_URL}/phones`, data)
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
        activate(phone) {
            return axios.get(`${envConfig.API_URL}/phones/${phone}/activate`)
                .then(res => {
                    const resdata = res.data;
                    if (
                        Object.prototype.hasOwnProperty.call(resdata, "message") &&
                        resdata.message === "ok"
                    ) {
                        this.list.forEach(el => {
                            if (el.phone === phone) {
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
        deactivate(phone) {
            return axios.get(`${envConfig.API_URL}/phones/${phone}/deactivate`)
                .then(res => {
                    const resdata = res.data;
                    if (
                        Object.prototype.hasOwnProperty.call(resdata, "message") &&
                        resdata.message === "ok"
                    ) {
                        this.list.forEach(el => {
                            if (el.phone === phone) {
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
        changeAutoPay({phone, status}) {
            return axios.get(`${envConfig.API_URL}/phones/${phone}/auto_pay/${status}`)
                .then(res => {
                    const resdata = res.data;
                    if (
                        Object.prototype.hasOwnProperty.call(resdata, "message") &&
                        resdata.message === "ok"
                    ) {
                        this.list.forEach(el => {
                            if (el.phone === phone) {
                                el.auto_pay = status === "on" ? 1 : 0;
                            }
                        })
                        return true;
                    } else {
                        return resdata.message || resdata.error || -1;
                    }
                })
                .catch(errRequestHandler)
        },
    }
})
