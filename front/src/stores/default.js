import {defineStore} from 'pinia';
import axios from "@/plugins/axios";
import {errRequestHandler} from "@/plugins/errorResponser";
import FileDownload from "js-file-download";

export const useDefaultStore = defineStore('default', {
    state: () => ({
        isInitPasswords: false,
        isInitPhones: false,
        isInitQiwi: false,
        working: false,
        excelList: {
            fail: [],
            success: [],
        },
    }),
    getters: {
        systemIsActive: (state) => state.isInitPasswords && state.isInitPhones && state.isInitQiwi,
    },
    actions: {
        checkInitSystem() {
            return axios.get(`${envConfig.API_URL}/checkInitSystem`)
                .then(res => {
                    const resdata = res.data;
                    if (
                        Object.prototype.hasOwnProperty.call(resdata, "message") &&
                        resdata.message === "ok"
                    ) {
                        this.isInitPasswords = resdata.result.isInitPasswords;
                        this.isInitPhones = resdata.result.isInitPhones;
                        this.isInitQiwi = resdata.result.isInitQiwi;
                        this.working = resdata.result.working;
                        return true;
                    } else {
                        return resdata.message || resdata.error || -1;
                    }
                })
                .catch(errRequestHandler);
        },
        parseExcel({file, insert = 0}) {
            let formData = new FormData()
            formData.append("insert", insert.toString())
            formData.append("file", file)
            return axios.post(`${envConfig.API_URL}/parseExcel`, formData, {
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
                    'Access-Control-Allow-Origin': '*',
                }
            })
                .then(res => {
                    const resdata = res.data;
                    if (
                        Object.prototype.hasOwnProperty.call(resdata, "message") &&
                        resdata.message === "ok"
                    ) {
                        this.excelList = resdata.result;
                        return true;
                    } else {
                        return resdata.message || resdata.error || -1;
                    }
                })
                .catch(errRequestHandler)
        },
        startSystem() {
            return axios.get(`${envConfig.API_URL}/start`)
                .then(res => {
                    const resdata = res.data;
                    if (
                        Object.prototype.hasOwnProperty.call(resdata, "message") &&
                        resdata.message === "ok"
                    ) {
                        this.working = true;
                        return true;
                    } else {
                        return resdata.message || resdata.error || -1;
                    }
                })
                .catch(errRequestHandler);
        },
        stopSystem() {
            return axios.get(`${envConfig.API_URL}/stop`)
                .then(res => {
                    const resdata = res.data;
                    if (
                        Object.prototype.hasOwnProperty.call(resdata, "message") &&
                        resdata.message === "ok"
                    ) {
                        this.working = false;
                        return true;
                    } else {
                        return resdata.message || resdata.error || -1;
                    }
                })
                .catch(errRequestHandler);
        },
        downloadExcel() {
            return axios.get(`${envConfig.API_URL}/excel`,{ responseType: 'blob' })
                .then(response=>{
                    FileDownload(response.data, `Выгрузка телефонов.xlsx`);
                    return true
                })
                .catch(e=>errRequestHandler(e))
        }
    }
})
