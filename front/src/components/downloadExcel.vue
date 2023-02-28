<script setup>

import {useDefaultStore} from "@/stores/default";
import {ref} from "vue";
import {errVueHandler} from "@/plugins/errorResponser";

const defaultStore = useDefaultStore();


const loadingExcel = ref(false);
const downloadExcel = () => {
  loadingExcel.value = true;
  return defaultStore.downloadExcel()
      .then(res => errVueHandler(res))
      .finally(()=>loadingExcel.value=false)
}
</script>

<template>
  <v-btn :loading="loadingExcel" @click="downloadExcel" color="green" icon flat><v-icon>mdi-cloud-download</v-icon></v-btn>
</template>



<style scoped>

</style>
