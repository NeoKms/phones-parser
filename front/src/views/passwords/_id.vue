<script setup>
import {usePasswordsStore} from "@/stores/passwords";
import {computed, ref} from "vue";
import {errVueHandler} from "@/plugins/errorResponser";
import {useRoute} from "vue-router";
import PasswordCard from "@/components/passwords/PasswordCard.vue";

const passStore = usePasswordsStore();
const route = useRoute();

const loading = ref(true);
const apiCall = () => {
  loading.value = true;
  return passStore.fetchById(route.params.id)
      .then(res => errVueHandler(res))
      .finally(() => loading.value = false);
}
const byId = computed(() => passStore.byId);
apiCall();
</script>
<template>
  <v-row justify="center" v-if="loading">
    <v-progress-circular indeterminate size="100">Загрузка</v-progress-circular>
  </v-row>
  <password-card v-else :obj="byId" />
</template>

<style scoped>

</style>
