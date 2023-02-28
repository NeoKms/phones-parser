import {defineStore} from 'pinia';
import axios from "@/plugins/axios";
import {errRequestHandler} from "@/plugins/errorResponser";

export const useMessagesStore = defineStore('messages', {
    state: () => (
        {
            list: [],
            filterData: {
                allCount: 0,
                maxPages: 1,
                options: {
                    page: 1,
                    itemsPerPage: 20,
                    sortBy: ["created_at"],
                    sortDesc: [true],
                },
                filter: {},
                select: [],
            },
            codeReqList: [],
            needPayAccept: false,
        }),
    getters: {
        getList() {
            let list = this.list;
            list = list.filter(el=>this.checkCurrentFilter(el));
            list = list.splice(0,this.filterData.options.itemsPerPage);
            if (this.filterData?.options?.sortBy?.length && this.filterData?.options?.sortBy[0]==="created_at") {
                list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            } else {
                list.sort((a, b) => b.id - a.id)
            }
            return list;
        }
    },
    actions: {
        checkNeedPayAccept() {
            return axios.get(`${envConfig.API_URL}/messages/checkNeedPayAccept`)
                .then(res => {
                    const resdata = res.data;
                    if (
                        Object.prototype.hasOwnProperty.call(resdata, "message") &&
                        resdata.message === "ok"
                    ) {
                        this.needPayAccept = resdata.result;
                        return true;
                    } else {
                        return resdata.message || resdata.error || -1;
                    }
                })
                .catch(errRequestHandler)
        },
        sendCancel(id) {
            return axios.get(`${envConfig.API_URL}/messages/${id}/cancel`)
                .then(res => {
                    const resdata = res.data;
                    if (
                        Object.prototype.hasOwnProperty.call(resdata, "message") &&
                        resdata.message === "ok"
                    ) {
                        this.list.forEach(el=>{
                            if (el.id===id) {
                                el.status = 4;
                            }
                        })
                        return true;
                    } else {
                        return resdata.message || resdata.error || -1;
                    }
                })
                .catch(errRequestHandler)
        },
        sendToPay(id) {
            return axios.get(`${envConfig.API_URL}/messages/${id}/pay`)
                .then(res => {
                    const resdata = res.data;
                    if (
                        Object.prototype.hasOwnProperty.call(resdata, "message") &&
                        resdata.message === "ok"
                    ) {
                        this.list.forEach(el=>{
                            if (el.id===id) {
                                el.data.auto = true;
                            }
                        })
                        return true;
                    } else {
                        return resdata.message || resdata.error || -1;
                    }
                })
                .catch(errRequestHandler)
        },
        checkCurrentFilter(data) {
            if (this.filterData.filter.hasOwnProperty("action_type") &&
                this.filterData.filter.action_type !== null &&
                data?.action_type!==this.filterData.filter.action_type) {
                return false;
            }
            if (this.filterData.filter.hasOwnProperty(">=created_at") &&
                (data?.created_at<this.filterData.filter[">=created_at"] ||
                data?.created_at>=this.filterData.filter["<created_at"])
            ) {
                return false;
            }
            if (this.filterData.filter.hasOwnProperty("status") &&
                this.filterData.filter.status !== null &&
                data.status!==this.filterData.filter.status) {
                return false;
            }
            if (this.filterData.filter.hasOwnProperty("%phone") &&
                this.filterData.filter["%phone"] !== null &&
                data.phone.indexOf(this.filterData.filter["%phone"])) {
                return false;
            }
            return true;
        },
        setFilterSettings(val) {
            this.filterData = val;
        },
        fetchList() {
            return axios.post(`${envConfig.API_URL}/messages/list`, this.filterData)
                .then(res => {
                    const resdata = res.data;
                    if (
                        Object.prototype.hasOwnProperty.call(resdata, "message") &&
                        resdata.message === "ok"
                    ) {
                        this.list = resdata.result.data;
                        this.filterData.options.page = resdata.result.page;
                        this.filterData.allCount = resdata.result.allCount;
                        this.filterData.maxPages = resdata.result.maxPages;
                        return true;
                    } else {
                        return resdata.message || resdata.error || -1;
                    }
                })
                .catch(errRequestHandler)
        },
        fetchCodeRequests() {
            return axios.get(`${envConfig.API_URL}/messages/codeRequests`)
                .then(res => {
                    const resdata = res.data;
                    if (
                        Object.prototype.hasOwnProperty.call(resdata, "message") &&
                        resdata.message === "ok"
                    ) {
                        this.codeReqList = resdata.result.data;
                        return true;
                    } else {
                        return resdata.message || resdata.error || -1;
                    }
                })
                .catch(errRequestHandler)
        },
        setCode({id,code}) {
            return axios.post(`${envConfig.API_URL}/messages/${id}/setCode`,{code})
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
