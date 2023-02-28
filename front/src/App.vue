<script setup>
import {computed, ref} from "vue";
import Loading from "@/layouts/Loading.vue";
import Default from "@/layouts/Default.vue";
import InitSystem from "@/layouts/InitSystem.vue";
import {useDefaultStore} from "@/stores/default";
import {errVueHandler} from "@/plugins/errorResponser";
import PushNotifications from "@/components/PushNotifications.vue";

const defaultStore = useDefaultStore();
const systemIsActive = computed(() => defaultStore.systemIsActive);

const loading = ref(true);

Promise.allSettled([defaultStore.checkInitSystem()]).then((resArr) => {
  if (resArr.map((data) => errVueHandler(data.value ?? data)).find(v => v === false) ?? true) {
    loading.value = false;
  }
});
</script>

<template>
  <push-notifications/>
  <v-layout>
    <loading v-if="loading"/>
    <init-system v-else-if="!systemIsActive"/>
    <default v-else/>
  </v-layout>
</template>

<style scoped>
</style>
