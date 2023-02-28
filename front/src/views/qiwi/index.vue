<script setup>

import {useQiwiStore} from "@/stores/qiwi";
import {computed, ref} from "vue";
import {errVueHandler} from "@/plugins/errorResponser";
import DataTable from "@/components/dataTable.vue";
import copyTextToClipboard from "@/plugins/copyToBuffer";
import {useRouter} from "vue-router";

const qiwiStore = useQiwiStore();
const loading = ref(false);
const router = useRouter();
const apiCall = () => {
  loading.value = true;
  return qiwiStore.fetchList()
      .then(res => errVueHandler(res))
      .finally(() => loading.value = false);
}
const list = computed(() => qiwiStore.list);
const headers = ref([
  {text: "Токен", value: "token"},
  {text: "Описание", value: "description"},
  {text: "Баланс", value: "balance"},
  {text: "Лимит в месяц", value: "limit"},
  {text: "Активность", value: "is_active"},
  {text: "Действия", value: "actions"},
]);
apiCall();
const loadingArr = ref(new Set());
const changeStatus = async ({id, is_active}) => {
  loadingArr.value.add(id);
  if (!is_active) {
    await qiwiStore.activate(id)
        .then(res => errVueHandler(res));
  } else {
    await qiwiStore.deactivate(id)
        .then(res => errVueHandler(res));
  }
  loadingArr.value.delete(id);
}
</script>
<template>
  <v-row class="pa-4">
    <v-chip label >Управление QIWI</v-chip>
    <v-spacer />
    <v-btn color="blue" @click="router.push('/qiwi_tokens/create')">Создать</v-btn>
  </v-row>
  <v-row>
    <v-col>
      <data-table sticky-head class="qiwi-t" :items="list" :headers="headers" :loading="loading">
        <template v-slot:item.is_active="{item}">
          <v-btn :loading="loadingArr.has(item.id)" @click="changeStatus(item)" flat v-if="item.is_active" v-tooltip.auto="'Деактивировать'" color="green">
            <v-icon>mdi-power-plug-off</v-icon>
          </v-btn>
          <v-btn :loading="loadingArr.has(item.id)" @click="changeStatus(item)" flat color="red" v-else v-tooltip.auto="'Активировать'">
            <v-icon>mdi-power-plug</v-icon>
          </v-btn>
        </template>
        <template v-slot:item.balance="{item}">
          {{ item.balance }}<span v-if="item.balance">₽</span>
        </template>
        <template v-slot:item.limit="{item}">
          {{ item.limit }}<span v-if="item.limit">₽</span>
        </template>
        <template v-slot:item.actions="{item}">
          <v-btn icon flat v-tooltip.auto="'Скопировать токен'" @click="copyTextToClipboard(item.token)">
            <v-icon>mdi-content-copy</v-icon>
          </v-btn>
          <v-btn icon flat v-tooltip.auto="'Редактировать'" @click="router.push('/qiwi_tokens/'+item.id)">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
        </template>
      </data-table>
    </v-col>
  </v-row>
</template>

<style lang="scss">
.qiwi-t {
  .v-table__wrapper {
    height: calc(100vh - 335px);
  }
}
</style>