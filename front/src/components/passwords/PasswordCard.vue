<script setup>
import {ref} from "vue";
import {useRoute, useRouter} from "vue-router";
import {usePasswordsStore} from "@/stores/passwords";
import {errVueHandler} from "@/plugins/errorResponser";
import {useNotificationsStore} from "@/stores/notifications";

const props = defineProps({
  obj: {
    type: Object,
    default: () => ({
      value: "",
      description: "",
      operator: "megafon",
    }),
  }
})
const route = useRoute();
const router = useRouter();
const passStore = usePasswordsStore();
const notifStore = useNotificationsStore();

const loading = ref(false);
const item = ref(JSON.parse(JSON.stringify(props.obj)));
const operatorList = ref(["megafon", "mts", "tele2", "beeline"]);
const savedContent = JSON.stringify(props.obj);
const checkPass = (pass) => {
  if (!pass) {
   return "пароль не передан";
  }
  if (pass.length < 8) {
    return "в пароле меньше 8 знаков";
  }
  if (pass.match(/\s/gi)) {
    return "в пароле есть пробелы"
  }
  if (!pass.match(/\d/g)?.length) {
    return "в пароле нет цифры"
  }
  if (!pass.match(/[A-ZА-ЯЁ]/g)?.length) {
    return "в пароле нет заглавной буквы"
  }
  if (!pass.match(/[a-zа-яё]/g)?.length) {
    return "в пароле нет строчной буквы"
  }
  return true;
};
const save = () => {
  const isCorrect = checkPass(item.value.value);
  if (isCorrect!==true) {
    return notifStore.addMessage({
      type: "warning",
      time: 5000,
      name: isCorrect,
    })
  }
  if (savedContent === JSON.stringify(item.value)) {
    return notifStore.addMessage({
      type: "warning",
      time: 2000,
      name: "Нет изменений",
    })
  }
  loading.value = true;
  if (route.params.id) {
    return passStore.update({
      id: item.value.id,
      description: item.value.description,
      value: item.value.value
    })
        .then(res => {
          if (errVueHandler(res)) {
            router.push("/passwords");
          }
        })
        .finally(() => loading.value = false)
  } else {
    return passStore.create(item.value)
        .then(res => {
          if (errVueHandler(res)) {
            router.push("/passwords");
          }
        })
        .finally(() => loading.value = false)
  }
}
</script>

<template>
  <v-row justify="center" class="mt-5">
    <v-card v-if="route.params.id" title="Внимание" width="200" color="red" elevation="10">
      <v-card-text>
        При смене значения пароля для всех связанных номеров телефонов будет попытка замены пароля.
      </v-card-text>
      <v-card-actions>
        <v-chip label style="width: 100%; height: 100%">Привязано:<br> {{item.phones_cnt}} телефонов</v-chip>
      </v-card-actions>
    </v-card>
    <v-card width="600" class="pa-5" elevation="10" :loading="loading">
      <v-card-title>
        <span v-if="item.id">Редактирование</span>
        <span v-else>Создание</span>
      </v-card-title>
      <v-card-text class="mt-5">
        <v-row>
          <v-text-field  :disabled="loading" variant="underlined" v-model="item.value" label="Пароль"/>
        </v-row>
        <v-row>
          <v-textarea :disabled="loading" variant="underlined" v-model="item.description" label="Описание"/>
        </v-row>
        <v-row>
          <v-select label="Оператор" :disabled="!!item.id||loading" variant="underlined" outlined :items="operatorList"
                    v-model="item.operator"/>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-btn :disabled="loading" color="red" @click="$router.push('/passwords')">Отменить</v-btn>
        <v-btn :disabled="loading" color="green" @click="save">Сохранить</v-btn>
      </v-card-actions>
    </v-card>
  </v-row>
</template>

<style scoped>

</style>
