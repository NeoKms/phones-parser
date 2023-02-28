<script setup>
import {useDefaultStore} from "@/stores/default";
import {computed, ref} from "vue";
import {errVueHandler} from "@/plugins/errorResponser";

const defaultStore = useDefaultStore();

const loadingSystem = ref(false);
const systemStatus = computed(() => defaultStore.working);
const startSystem = () => {
  loadingSystem.value = true;
  return defaultStore.startSystem()
      .then(res => errVueHandler(res))
      .finally(() => loadingSystem.value = false)
};
const stopSystem = () => {
  loadingSystem.value = true;
  return defaultStore.stopSystem()
      .then(res => errVueHandler(res))
      .finally(() => loadingSystem.value = false)
}
</script>
<template>
  <div v-if="systemStatus" class="ssy">
    <v-chip label size="x-large" v-if="systemStatus" color="green">Система работает</v-chip>
    <v-spacer/>
    <v-btn class="ml-2 bg-red-lighten-2" v-tooltip.auto="'Остановить'" @click="stopSystem">
      <v-icon>mdi-pause</v-icon>
    </v-btn>
  </div>
  <div v-else class="ssy">
    <v-chip label size="x-large" color="red">Система остановлена</v-chip>
    <v-spacer/>
    <v-btn :loading="loadingSystem" class="ml-2 bg-green-lighten-2" v-tooltip.auto="'Запустить'" @click="startSystem">
      <v-icon>mdi-play</v-icon>
    </v-btn>
  </div>
</template>


<style scoped>
.ssy {
  display: flex;
  flex-wrap: nowrap;
  align-content: center;
  justify-content: center;
  align-items: center;
}
</style>
