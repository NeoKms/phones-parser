import {useNotificationsStore} from "@/stores/notifications";

export const errVueHandler = (res, errText = "") => {
  if (res === true) {
    return true;
  }
  const nofitStore = useNotificationsStore();
  console.log(res,"res");
  nofitStore.addMessage({
    name: errText
        ? errText
        : (res === "" || res === false ? "Неизвестная ошибка" : res).toString(),
    type: 'error',
    time: 0,
    rightButton: 'OK',
  });
  return false;
};

export const errRequestHandler = (err) => {
  console.error(err);
  if (Object.prototype.hasOwnProperty.call(err, "response") && err.response) {
    if ([400, 404].includes(err.response?.status)) {
      let text =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.response?.data?.errors ||
        (err.response?.status === 404
          ? "404 не найдено"
          : "Неизвестная ошибка");
      if (Array.isArray(text)) {
        text = text?.map((el) => el.message).join("\n");
      }
      if (err?.response?.data?.statusCode) {
        if (Array.isArray(err.response?.data?.message)) {
          text = err.response?.data?.message.join("\n");
        } else {
          text = err.response?.data?.message;
        }
      }
      return text;
    } else if (err.response?.status === 401) {
      return -1;
    } else if (err.response?.status === 403) {
      return 403;
    }
  } else {
    return err.message;
  }
  return false;
};
