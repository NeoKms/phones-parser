<script setup>
import {computed, ref} from "vue";
import {useQiwiStore} from "@/stores/qiwi";
import {errVueHandler} from "@/plugins/errorResponser";
import {useNotificationsStore} from "@/stores/notifications";

const notifStore = useNotificationsStore();
const qiwiStore = useQiwiStore();
const emit = defineEmits(["loading:start", "loading:end", "continue"]);

const tokens = computed(() => qiwiStore.list);
const newToken = ref("");
const loading = ref(false);

const loadingStart = () => {
  loading.value = true;
  emit("loading:start");
}
const loadingEnd = () => {
  loading.value = false;
  emit("loading:end");
}
const sendTokens = async () => {
  if (newToken.value.length < 15) {
    notifStore.addMessage({
      name: "Токен не может быть меньше 15 символов",
      type: 'warning',
      time: 3000,
      rightButton: 'OK',
    })
  } else {
    loadingStart();
    await qiwiStore.createToken({token: newToken.value})
        .then(res => errVueHandler(res))
        .then(apiCall)
        .finally(() => {
          loadingEnd();
          newToken.value = "";
        });
  }
}


const apiCall = () => {
  loadingStart();
  return qiwiStore.fetchList()
      .then(res => errVueHandler(res))
      .finally(loadingEnd)
}

</script>

<template>
  <v-row class="justify-center">
    <h3>Добавьте токены QIWI</h3>
  </v-row>
  <v-row class="justify-center">
    <v-text-field :disabled="loading" label="Введите токен + enter" v-model="newToken" variant="outlined"
                  @keydown.enter="sendTokens"/>
  </v-row>
  <v-row class="justify-center" v-if="tokens.length">
    Добавленные токены:
  </v-row>
  <v-row class="justify-center" v-for="tokenObject in tokens" :key="tv">
    <v-col class="text-center">
      <v-chip label>Токен:</v-chip>
      <v-chip label color="blue">{{ tokenObject.token }}</v-chip>
      <v-chip label>Баланс:</v-chip>
      <v-chip label color="green">{{ tokenObject.balance }}₽</v-chip>
    </v-col>
  </v-row>
  <v-row class="justify-center">
    <v-btn :loading="loading" class="bg-green-lighten-2" :disabled="!tokens.length||loading" @click="$emit('continue')">
      Продолжить
    </v-btn>
  </v-row>
</template>
<style scoped>

</style>
