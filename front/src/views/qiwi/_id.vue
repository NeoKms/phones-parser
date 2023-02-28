<script setup>
import QiwiCard from "@/components/qiwi/QiwiCard.vue";
import {useRoute} from "vue-router";
import {computed, ref} from "vue";
import {errVueHandler} from "@/plugins/errorResponser";
import {useQiwiStore} from "@/stores/qiwi";

const route = useRoute();
const qiwiStore = useQiwiStore()

const loading = ref(true);
const apiCall = () => {
  loading.value = true;
  return qiwiStore.fetchById(route.params.id)
      .then(res => errVueHandler(res))
      .finally(() => loading.value = false);
}
const byId = computed(() => qiwiStore.byId);
apiCall();
</script>
<template>
  <v-row justify="center" v-if="loading">
    <v-progress-circular indeterminate size="100">Загрузка</v-progress-circular>
  </v-row>
  <qiwi-card v-else :obj="byId"/>
</template>



<style scoped>

</style>
