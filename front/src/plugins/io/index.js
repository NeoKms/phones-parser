import SocketIO from "socket.io-client";
import {useMessagesStore} from "@/stores/messages";

const socket = SocketIO(envConfig.WS_URL, {
    transports: ["websocket"],
    reconnection: true,
});
socket.on("connect_error", function () {
    console.info("WS ошибка подключения");
});
socket.on("connect", function () {
    console.info("WS подключен к " + envConfig.WS_URL);
});
socket.on("disconnect", function () {
    console.info("WS отключен");
});

console.log("подключение к каналу all");
socket.on(
    "all",
    function ({ type, data }) {
        const msgStore = useMessagesStore();
        console.log("сообщение в канале all", type, data);
        switch (type) {
            case "messages:create": {
                if (msgStore.filterData.options.page!==1) return;
                msgStore.checkCurrentFilter(data) && msgStore.list.unshift(data);
                break;
            }
            case "messages:update": {
                const inListInd = msgStore.list.findIndex(e=>e.id===data.id);
                if (inListInd>=0) {
                    msgStore.list[inListInd] = data;
                }
                if (data?.data?.requestId) {
                    const inListInd = msgStore.codeReqList.findIndex(e=>e.id===data.id);
                    if (inListInd>=0) {
                        if (data?.data?.code) {
                            msgStore.codeReqList.splice(inListInd,1);
                        } else {
                            msgStore.codeReqList[inListInd] = data;
                        }
                    } else {
                        msgStore.codeReqList.unshift(data)
                    }
                }
                break;
            }
        }
    }
);

export default socket;
