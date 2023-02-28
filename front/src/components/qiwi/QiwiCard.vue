<script setup>

import {ref} from "vue";
import {useRoute, useRouter} from "vue-router";
import {useQiwiStore} from "@/stores/qiwi";
import {useNotificationsStore} from "@/stores/notifications";
import {errVueHandler} from "@/plugins/errorResponser";

const route = useRoute();
const router = useRouter();
const qiwiStore = useQiwiStore();
const notifStore = useNotificationsStore();
const props = defineProps({
  obj: {
    type: Object,
    default: () => ({
      token: "",
      limit: null,
      description: "",
    }),
  }
});

const loading = ref(false);
const item = ref(JSON.parse(JSON.stringify(props.obj)));
const savedContent = JSON.stringify(props.obj);
const save = () => {
  if (savedContent === JSON.stringify(item.value)) {
    return notifStore.addMessage({
      type: "warning",
      time: 2000,
      name: "Нет изменений",
    })
  }
  if (!parseInt(item.value.limit) > 0 && item.value.limit !== null && item.value.limit !== "") {
    return notifStore.addMessage({
      type: "warning",
      time: 2000,
      name: "Лимит - положительное число",
    })
  }
  loading.value = true;
  if (route.params.id) {
    return qiwiStore.update({
      id: item.value.id,
      description: item.value.description || "",
      limit: item.value.limit || null
    })
        .then(res => {
          if (errVueHandler(res)) {
            router.push("/qiwi_tokens");
          }
        })
        .finally(() => loading.value = false)
  } else {
    return qiwiStore.createToken(item.value)
        .then(res => {
          if (errVueHandler(res)) {
            router.push("/qiwi_tokens");
          }
        })
        .finally(() => loading.value = false)
  }
}
</script>
<template>
  <v-row justify="center" class="mt-5">
    <v-card width="600" class="pa-5" elevation="10" :loading="loading">
      <v-card-title>
        <span v-if="item.id">Редактирование</span>
        <span v-else>Создание</span>
      </v-card-title>
      <v-card-text class="mt-5">
        <v-row>
          <v-text-field :disabled="!!item.id||loading" variant="underlined" v-model="item.token" label="Токен"/>
        </v-row>
        <v-row>
          <v-textarea :disabled="loading" variant="underlined" v-model="item.description" label="Описание"/>
        </v-row>
        <v-row>
          <v-text-field :disabled="loading" variant="underlined" clearable v-model.number="item.limit"
                        label="Лимит в месяц"/>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-btn :disabled="loading" color="red" @click="$router.push('/qiwi_tokens')">Отменить</v-btn>
        <v-btn :disabled="loading" color="green" @click="save">Сохранить</v-btn>
      </v-card-actions>
    </v-card>
  </v-row>
</template>


<style scoped>

</style>
