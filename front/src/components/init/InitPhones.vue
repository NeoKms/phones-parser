<script setup>
import {computed, ref} from "vue";
import {useDefaultStore} from "@/stores/default";
import {errVueHandler} from "@/plugins/errorResponser";
import DataTable from "@/components/dataTable.vue";

const defaultStore = useDefaultStore();
const emit = defineEmits(["loading:start", "loading:end", "continue"]);

const excelList = computed(() => defaultStore.excelList);
const loadingStart = () => {
  loading.value = true;
  emit("loading:start");
}
const loadingEnd = () => {
  loading.value = false;
  emit("loading:end");
}

const loading = ref(false);
const fileInput = ref(null);

const changeFileInput = () => {
  loadingStart()
  defaultStore.parseExcel({
    file: fileInput.value.files[0]
  })
      .then(res => errVueHandler(res))
      .finally(loadingEnd);
};
const failHeader = ref([
  {text: "Номер", value: "phone"},
  {text: "Ошибка", value: "error"},
]);
const successHeader = ref([
  {text: "Номер", value: "phone"},
  {text: "Оператор", value: "operator"},
  {text: "Требуемый баланс", value: "min_value"},
  {text: "Активный", value: "is_active"},
]);
const savePhones = () => {
  loadingStart()
  defaultStore.parseExcel({
    file: fileInput.value.files[0],
    insert: 1,
  })
      .then(res => errVueHandler(res))
      .then(() => defaultStore.checkInitSystem())
      .finally(loadingEnd);
}
</script>

<template>
  <input type="file" ref="fileInput" style="display: none"
         accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
         @change="changeFileInput()">
  <v-row class="justify-center" v-if="!excelList.fail.length && !excelList.success.length">
    <v-col class="text-center">
      <v-row class="justify-center">
        <h3>Загрузите Excel для парсинга</h3>
      </v-row>
      <v-row class="justify-center">
        <v-btn
            :loading="loading"
            class="mx-2" fab dark small color="green"
            @click="$refs.fileInput.click()"
        >
          <v-icon dark>
            mdi-file-download
          </v-icon>
        </v-btn>

      </v-row>
    </v-col>
  </v-row>
  <v-row v-else class="justify-center">
    <v-col class="text-center">
      <v-row v-if="excelList.fail.length" class="justify-center">
        <h3>Номера, которые не удалось добавить в базу:</h3>
      </v-row>
      <span v-if="excelList.fail.length">* их вообще не будет в системе и надо будет добавлять отдельно</span>
      <v-row class="justify-center pt-2" v-if="excelList.fail.length">
        <data-table :items="excelList.fail" :headers="failHeader" style="width: 600px"/>
      </v-row>
      <v-row class="justify-center" v-if="excelList.success.length">
        <h3>Номера, которые будут добавлены в базу:</h3>
      </v-row>
      <v-row class="justify-center" v-if="excelList.success.length">
        <data-table :items="excelList.success" :headers="successHeader" style="width: 600px">
          <template v-slot:item.is_active="{item}">
            <v-chip label style="width: 100%" :color="item.is_active ? 'green' : 'red'">
              {{ item.is_active ? 'Да' : 'Нет' }}
            </v-chip>
          </template>
        </data-table>
      </v-row>
      <v-row v-if="excelList.success.length" class="justify-center" style="position: sticky;bottom: 10px">
        <v-btn :loading="loading" color="green" @click="savePhones">Сохранить номера и продолжить</v-btn>
      </v-row>
    </v-col>
  </v-row>
</template>

<style scoped>

</style>
