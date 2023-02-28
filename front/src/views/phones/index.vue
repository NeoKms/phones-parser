<script setup>

import {computed, onMounted, ref, watch} from "vue";
import {usePhonesStore} from "@/stores/phones";
import DataTable from "@/components/dataTable.vue";
import {useRouter} from "vue-router";
import {errVueHandler} from "@/plugins/errorResponser";
import PhonesCardInfo from "@/components/phones/PhonesCardInfo.vue";
import {formatDateJS, getUnixTime} from "@/plugins/dates";

const loading = ref(true);
const phonesStore = usePhonesStore();
const list = computed(() => phonesStore.list);
const router = useRouter()

const options = ref({
  page: 1,
  itemsPerPage: 20,
  sortBy: ["phone"],
  sortDesc: [true],
});
const allCount = computed(()=>phonesStore.allCount);
const maxPages = computed(()=>phonesStore.maxPages);
const filter = ref({});
const select = ref([]);
const showFilters = ref(false);
const searchPhone = ref("");

const apiCall = () => {
  loading.value = true;
  return phonesStore.fetchList({
    options:options.value,
    filter: filter.value,
    select: select.value,
  })
      .then(res => errVueHandler(res))
      .finally(() => loading.value = false)
}
apiCall()
const headers = [
  {text: "Дата парсинга", value: "last_pars_timestamp"},
  {text: "Номер", value: "phone"},
  {text: "Оператор", value: "operator"},
  {text: "Коммент", value: "comment"},
  {text: "Автооплата", value: "auto_pay"},
  {text: "Активность", value: "is_active"},
  {text: "Действия", value: "actions"},
];
const loadingArr = ref(new Set());
const changeStatus = async ({phone, is_active}) => {
  loadingArr.value.add(phone);
  if (!is_active) {
    await phonesStore.activate(phone)
        .then(res => errVueHandler(res));
  } else {
    await phonesStore.deactivate(phone)
        .then(res => errVueHandler(res));
  }
  loadingArr.value.delete(phone);
}
const changeAutoPay = async ({phone, auto_pay}) => {
  loadingArr.value.add(phone);
  await phonesStore.changeAutoPay({phone, status: auto_pay ? "off" : "on"})
      .then(res => errVueHandler(res));
  loadingArr.value.delete(phone);
}
const modalInfo = ref(false);
const modalInfoData = ref({});
const openModalInfo = (item) => {
  modalInfoData.value = item;
  modalInfo.value = true;
}
watch(options, () => apiCall());
watch(searchPhone, () => {
  if (searchPhone.value && searchPhone.value.length) {
    filter.value["%phone"] = searchPhone.value;
  } else {
    delete filter.value["%phone"];
  }
  apiCall()
})
const autoPay = ref(null);
const autoPayItems = ref([{text:"Включена",value: 1},{text:"Выключена",value: 0}]);
watch(autoPay, () => {
  if ([0,1].includes(autoPay.value)) {
    filter.value["auto_pay"] = autoPay.value;
  } else {
    delete filter.value["auto_pay"];
  }
  apiCall()
})
const isActive = ref(null);
const isActiveItems = ref([{text:"Активен",value: 1},{text:"Не активен",value: 0}]);
watch(isActive, () => {
  if ([0,1].includes(isActive.value)) {
    filter.value["is_active"] = isActive.value;
  } else {
    delete filter.value["is_active"];
  }
  apiCall()
});
const dates = ref([]);
watch(dates, () => {
  if (dates.value && dates.value.length) {
    filter.value[">=last_pars_timestamp"] = getUnixTime(formatDateJS(dates.value[0].getTime()/1000,"YYYY-MM-DD", false)+" 00:00:00");
    filter.value["<last_pars_timestamp"] = getUnixTime(formatDateJS(dates.value[1].getTime()/1000,"YYYY-MM-DD", false)+" 23:59:59");
  } else {
    delete filter.value[">=last_pars_timestamp"];
    delete filter.value["<last_pars_timestamp"];
  }
  apiCall()
});
</script>
<template>
  <v-row class="pa-4">
    <v-chip label>Управление телефонами</v-chip>
    <v-spacer/>
    <v-btn color="blue" @click="router.push('/phones/create')">Создать</v-btn>
  </v-row>
  <v-row dense class="justify-center">
    <v-btn @click="showFilters=!showFilters">Фильтры [{{ Object.keys(filter).length }}]</v-btn>
  </v-row>
  <v-expand-transition>
    <v-row dense class="justify-center mt-2" v-if="showFilters">
      <v-col>
        <v-text-field label="Поиск по номеру телефона" v-model="searchPhone" clearable/>
      </v-col>
      <v-col>
        <v-select label="Автооплата" v-model="autoPay" clearable :items="autoPayItems" item-title="text" item-value="value"/>
      </v-col>
      <v-col>
        <v-select label="Активность" v-model="isActive" clearable :items="isActiveItems" item-title="text" item-value="value"/>
      </v-col>
      <v-col>
        Дата парсинга:
        <VueDatePicker v-model="dates" range multi-calendars locale="ru" cancelText="Отменить" selectText="Выбрать"/>
      </v-col>
    </v-row>
  </v-expand-transition>
  <v-row>
    <v-col>
      <data-table sticky-head class="ph-t"
                  :items="list" :headers="headers" :loading="loading"
                  v-model:options="options"
                  :page-count-external="maxPages"
                  :total-count-external="allCount"
      >

        <template v-slot:item.last_pars_timestamp="{item}">
          <span v-if="item.last_pars_timestamp">{{formatDateJS(item.last_pars_timestamp,"DD.MM.YYYY hh:mm:ss")}}</span>
        </template>
        <template v-slot:item.is_active="{item}">
          <v-btn :loading="loadingArr.has(item.phone)" @click="changeStatus(item)" flat v-if="item.is_active"
                 v-tooltip.auto="'Деактивировать'" color="green">
            <v-icon>mdi-power-plug-off</v-icon>
          </v-btn>
          <v-btn :loading="loadingArr.has(item.phone)" @click="changeStatus(item)" flat color="red" v-else
                 v-tooltip.auto="'Активировать'">
            <v-icon>mdi-power-plug</v-icon>
          </v-btn>
        </template>
        <template v-slot:item.auto_pay="{item}">
          <v-switch :disabled="loadingArr.has(item.phone)" :loading="loadingArr.has(item.phone)"
                    v-bind:model-value="item.auto_pay" @change="changeAutoPay(item)" :true-value="1" :false-value="0"
                    color="success" value="success"/>
        </template>
        <template v-slot:item.actions="{item}">
          <v-btn icon flat v-tooltip.auto="'Открыть карточку номера'" @click="openModalInfo(item)">
            <v-icon>mdi-eye</v-icon>
          </v-btn>
          <v-btn icon flat v-tooltip.auto="'Редактировать'" @click="router.push('/phones/'+item.phone)">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
        </template>
      </data-table>
    </v-col>
  </v-row>
  <v-dialog v-model="modalInfo">
    <phones-card-info v-if="modalInfo" :item="modalInfoData" @close="modalInfo=false;modalInfoData={};"/>
  </v-dialog>
</template>

<style lang="scss">
.ph-t {
  .v-table__wrapper {
    height: calc(100vh - 335px);
  }
}
</style>
