<script setup>
import PhonesCard from "@/components/phones/PhonesCard.vue";
import {ref} from "vue";
import {errVueHandler} from "@/plugins/errorResponser";
import {usePasswordsStore} from "@/stores/passwords";
import {useQiwiStore} from "@/stores/qiwi";

const loading = ref(true);
const passStore = usePasswordsStore();
const qiwiStore = useQiwiStore();
const apiCall = () => {
  loading.value = true;
  return Promise.allSettled([
      passStore.fetchList(),
      qiwiStore.fetchList(),
  ])
      .then((resArr)=>{
        if (resArr.map((data) => errVueHandler(data.value ?? data)).find(v => v === false) ?? true) {
          loading.value = false;
        }
      })
}
apiCall()
</script>
<template>
  <v-row justify="center" v-if="loading">
    <v-progress-circular indeterminate size="100">Загрузка</v-progress-circular>
  </v-row>
  <phones-card v-else/>
</template>


<style scoped>

</style>
