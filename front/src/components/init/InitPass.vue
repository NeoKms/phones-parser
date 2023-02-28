<script setup>
import {usePasswordsStore} from "@/stores/passwords";
import {computed, onMounted, ref} from "vue";
import {errVueHandler} from "@/plugins/errorResponser";
import {useNotificationsStore} from "@/stores/notifications";

const passStore = usePasswordsStore();
const notifStore = useNotificationsStore();
const emit = defineEmits(["loading:start", "loading:end", "continue"]);

const loadingStart = () => {
  loading.value = true;
  emit("loading:start");
}
const loadingEnd = () => {
  loading.value = false;
  emit("loading:end");
}

const loading = ref(false);

const list = ref(JSON.parse(JSON.stringify(passStore.list)));

const apiCall = () => {
  loadingStart();
  return passStore.fetchList()
      .then(res => errVueHandler(res))
      .then(() => list.value = JSON.parse(JSON.stringify(passStore.list)))
      .then(() => {
        if (!list.value.find(pass => pass.value === "7777")) {
          emit("continue")
        }
      })
      .finally(loadingEnd)
}
apiCall();
const savePass = () => {
  if (list.value.find(pass => pass.value === "7777")) {
    notifStore.addMessage({
      name: "Замените все дефолтные пароли (7777)",
      type: 'warning',
      time: 3000,
      rightButton: 'OK',
    })
  } else {
    loadingStart();
    return Promise.allSettled(list.value.map(pass => passStore.update({
      id: pass.id,
      value: pass.value,
    })))
        .then(resArr => {
          resArr.map(data => errVueHandler(data.value || data))
        })
        .then(apiCall)
        .finally(loadingEnd)
  }
}

</script>

<template>
  <v-row class="justify-center">
    <h3>Задайте пароли</h3>
  </v-row>
  <v-row class="justify-center" v-for="pass in list" :key="pass.id">
    <v-col lg="2" md="2" sm="2" xs="2">
      {{ pass.description }}
    </v-col>
    <v-col lg="2" md="2" sm="2" xs="2">
      <v-text-field label="пароль" v-model="pass.value"/>
    </v-col>
  </v-row>
  <v-row class="justify-center">
    <v-btn class="bg-green-lighten-2" @click="savePass">Сохранить</v-btn>
  </v-row>
</template>

<style scoped>

</style>
