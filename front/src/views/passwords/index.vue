<script setup>
import router from "@/router";
import {usePasswordsStore} from "@/stores/passwords";
import {computed, ref} from "vue";
import DataTable from "@/components/dataTable.vue";
import {errVueHandler} from "@/plugins/errorResponser";
import copyTextToClipboard from "@/plugins/copyToBuffer";

const passStore = usePasswordsStore();

const loading = ref(false);
const apiCall = () => {
  loading.value = true;
  return passStore.fetchList()
      .then(res => errVueHandler(res))
      .finally(() => loading.value = false);
}
const list = computed(() => passStore.list);
const headers = ref([
  {text: "Оператор", value: "operator"},
  {text: "Описание", value: "description"},
  {text: "Пароль", value: "value"},
  {text: "Действия", value: "actions"},
]);
apiCall();
</script>
<template>
  <v-row class="pa-4">
    <v-chip label >Управление паролями</v-chip>
    <v-spacer />
    <v-btn color="blue" @click="router.push('/passwords/create')">Создать</v-btn>
  </v-row>
  <v-row>
    <v-col>
      <data-table sticky-head class="pass-t" :items="list" :headers="headers" :loading="loading" >
        <template v-slot:item.value="{item}">
          <v-icon v-tooltip="item.value">mdi-eye</v-icon>
        </template>
        <template v-slot:item.actions="{item}">
          <v-btn icon flat v-tooltip.auto="'Скопировать пароль'" @click="copyTextToClipboard(item.value)">
            <v-icon>mdi-content-copy</v-icon>
          </v-btn>
          <v-btn icon flat v-tooltip.auto="'Редактировать'" @click="router.push('/passwords/'+item.id)">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
        </template>
      </data-table>
    </v-col>
  </v-row>
</template>

<style lang="scss">
.pass-t {
  .v-table__wrapper {
    height: calc(100vh - 335px);
  }
}
</style>
