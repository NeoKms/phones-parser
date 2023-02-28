<script setup>
import {usePasswordsStore} from "@/stores/passwords";
import {computed, ref} from "vue";
import {errVueHandler} from "@/plugins/errorResponser";
import {useRoute} from "vue-router";
import PasswordCard from "@/components/passwords/PasswordCard.vue";
import PhonesCard from "@/components/phones/PhonesCard.vue";
import {useQiwiStore} from "@/stores/qiwi";
import {usePhonesStore} from "@/stores/phones";

const passStore = usePasswordsStore();
const phoneStore = usePhonesStore();
const qiwiStore = useQiwiStore();
const route = useRoute();

const loading = ref(true);
const apiCall = () => {
  loading.value = true;
  Promise.allSettled([
    passStore.fetchList(),
    qiwiStore.fetchList(),
    phoneStore.fetchByPhone(route.params.id)
  ])
      .then((resArr)=>{
        if (resArr.map((data) => errVueHandler(data.value ?? data)).find(v => v === false) ?? true) {
          loading.value = false;
        } else {
          throw new Error("400")
        }
      })
}
const byPhone = computed(() => phoneStore.byPhone);
apiCall();
</script>
<template>
  <v-row justify="center" v-if="loading">
    <v-progress-circular indeterminate size="100">Загрузка</v-progress-circular>
  </v-row>
  <phones-card v-else :obj="byPhone" />
</template>

<style scoped>

</style>
