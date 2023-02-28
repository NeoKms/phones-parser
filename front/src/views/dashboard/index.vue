<script setup>
import {computed, nextTick, onMounted, ref, watch} from "vue";
import {errVueHandler} from "@/plugins/errorResponser";
import {useMessagesStore} from "@/stores/messages";
import DataTable from "@/components/dataTable.vue";
import {formatDateJS, getUnixTime} from "@/plugins/dates";

const msgStore = useMessagesStore();
const loading = ref(false);
const nowSlider = ref(-1);
const items = ref(["Весь список событий", "Ввод кодов смс", "Подтверждения оплат"]);

const checkNeedPayAccept = () => {
  return msgStore.checkNeedPayAccept()
      .then(res => errVueHandler(res));
}

checkNeedPayAccept();
setTimeout(checkNeedPayAccept, 1000 * 60);

const list = computed(() => msgStore.getList);
const codeReqList = computed(() => msgStore.codeReqList);
const needPayAccept = computed(() => msgStore.needPayAccept);

const filterFields = ref({
  selectedAction: null,
  dates: [],
  statusSelected: null,
  searchPhone: null,
});
const loadingReqList = ref(new Set());
const apiCallReqList = () => {
  loading.value = true;
  return msgStore.fetchCodeRequests()
      .then(res => errVueHandler(res))
      .then(() => loading.value = false)
}
const filterSettings = computed({
  get() {
    return msgStore.filterData;
  },
  set(newVal) {
    msgStore.setFilterSettings(newVal);
  },
});
const apiCall = () => {
  loading.value = true;
  msgStore.fetchList()
      .then(res => errVueHandler(res))
      .finally(() => loading.value = false)
}
const headers = computed(() => {
  const headers = {
    0: [
      {text: "Статус", value: "status"},
      {text: "Дата создания", value: "created_at"},
      {text: "Дата завершения", value: "finished_at"},
      {text: "Телефон", value: "phone"},
      {text: "Ошибка", value: "error"},
      {text: "Назначение", value: "action_type"},
    ],
  }
  return [0,2].includes(nowSlider.value) ? headers[0] : []
});
watch(nowSlider, () => {
  filterSettings.value.filter = {};
  filterSettings.value.select = [];
  if (nowSlider.value === 2) {
    filterSettings.value.filter["&action_type"] = ["pay", "pay_tariff"];
    filterSettings.value.filter["~data"] = {
      path: "auto",
      sign: "=",
      num: "false",
    };
    filterSettings.value.filter["status"] = 0;
  }
  apiCall();
});
onMounted(() => {
  nowSlider.value = 0;
  apiCallReqList();
  apiCall();
});
const showFilters = ref(false);
watch(() => filterSettings.value.options, () => apiCall());
const statusFilter = ref([
  {text: "Создано", value: 0},
  {text: "В работе", value: 1},
  {text: "Завершено успешно", value: 2},
  {text: "Завершено с ошибкой", value: 3},
]);
const actionItems = ref([{t: "Изменение пароля", v: "password"}, {
  t: "Обновление данных",
  v: "parse"
}, {t: "Оплата минимума", v: "pay"}, {t: "Оплата тарифа", v: "pay_tariff"}]);
const rules = ref({
  required: value => !!((value ?? "") + '').trim().length || 'Обязательное поле',
  number: value => {
    if (value && (!!value.toString().match(/\D/gi)?.length || Number.isNaN(parseInt(value)))) {
      return 'Значение должно быть числом'
    } else {
      return true;
    }
  },
  phone: value => /^[0-9]|\.*$/.test(value) || 'Номер должен состоять из цифр',
  max: num => value => value.length <= num || `Не более ${num} символов`,
  signed: value => (rules.value.required(value) ? (typeof value === "number" ? value >= 0 : true) : true) || 'Число должно быть положительным',
  min: num => value => value ? (value.length >= num || `Не менее ${num} символов`) : true,
});
const sendCode = async (req) => {
  const {valid} = await forms.value[req.id].validate();
  if (valid) {
    loadingReqList.value.add(req.id);
    await msgStore.setCode({id: req.id, code: req.data.code})
        .then(res => errVueHandler(res));
    loadingReqList.value.delete(req.id);
  }
  await apiCallReqList();
  if (!codeReqList.value.length) {
    nowSlider.value = 0;
  }
}
const forms = ref({});
watch(filterFields, () => {
  filterSettings.value.filter = {};
  if (filterFields.value.selectedAction) {
    filterSettings.value.filter.action_type = filterFields.value.selectedAction
  }
  if (filterFields.value.dates && filterFields.value.dates.length) {
    filterSettings.value.filter[">=created_at"] = getUnixTime(formatDateJS(filterFields.value.dates[0].getTime() / 1000, "YYYY-MM-DD", false) + " 00:00:00");
    filterSettings.value.filter["<created_at"] = getUnixTime(formatDateJS(filterFields.value.dates[1].getTime() / 1000, "YYYY-MM-DD", false) + " 23:59:59");
  }
  if (filterFields.value.statusSelected !== null) {
    filterSettings.value.filter.status = filterFields.value.statusSelected
  }
  if (filterFields.value.searchPhone?.length) {
    filterSettings.value.filter["%phone"] = filterFields.value.searchPhone;
  }
  apiCall()
}, {deep: true});
const inLoadingPay = ref(new Set());
const sendToPay = ({id}) => {
  inLoadingPay.value.add(id);
  return msgStore.sendToPay(id)
      .then(res => errVueHandler(res))
      .finally(() => inLoadingPay.value.delete(id))
}
const sendCancel = ({id}) => {
  inLoadingPay.value.add(id);
  return msgStore.sendCancel(id)
      .then(res => errVueHandler(res))
      .finally(() => inLoadingPay.value.delete(id))
}
</script>

<template>
  <v-row class="justify-center elevation-10 pa-2">
    <v-slide-group
        :disabled="loading"
        v-model="nowSlider"
        show-arrows
    >
      <v-slide-group-item
          v-for="(item,ind) in items"
          :key="ind"
          v-slot="{ isSelected, toggle }"
      >
        <v-btn :disabled="(ind===1 && !codeReqList.length) || (ind===2 && !needPayAccept)" class="ma-2"
               @click="isSelected?null:toggle()" rounded :color="isSelected ? 'primary' : undefined"
               v-text="item"/>
      </v-slide-group-item>
    </v-slide-group>
  </v-row>
  <v-row class="justify-center">
    <template v-if="[0,2].includes(nowSlider)">
      <v-card width="100%" class="mt-5 pa-2">
        <v-row dense class="justify-center">
          <v-btn @click="showFilters=!showFilters">Фильтры [{{ Object.keys(filterSettings.filter).length }}]</v-btn>
        </v-row>
        <v-expand-transition>
          <v-row dense class="justify-center mt-2" v-if="showFilters">
            <v-col>
              <v-text-field clearable label="Поиск по номеру телефона" v-model="filterFields.searchPhone"/>
            </v-col>
            <v-col v-if="nowSlider!==2">
              <v-select clearable label="Статус" :items="statusFilter" item-value="value" item-title="text"
                        v-model="filterFields.statusSelected"/>
            </v-col>
            <v-col>
              Дата создания:
              <VueDatePicker v-model="filterFields.dates" range multi-calendars locale="ru" cancelText="Отменить"
                             selectText="Выбрать"/>
            </v-col>
            <v-col v-if="nowSlider!==2">
              <v-select clearable label="Назначение" :items="actionItems" item-value="v" item-title="t"
                        v-model="filterFields.selectedAction"/>
            </v-col>
          </v-row>
        </v-expand-transition>
        <v-row dense class="justify-center">
          <data-table
              :loading="loading" sticky-head
              :items="list" :headers="headers"
              v-model:options="filterSettings.options"
              :pageCountExternal="filterSettings.maxPages"
              :totalCountExternal="filterSettings.allCount"
          >
            <template v-slot:item.error="{item}">
              <v-textarea rows="2" v-if="item.error" v-bind:model-value="item.error"/>
            </template>
            <template v-slot:item.action_type="{item}">
              <span>{{ actionItems.find(el => el.v === item.action_type)?.t }}</span>
              <span v-if="['pay_tariff','pay'].includes(item.action_type)">&nbsp;({{ item.data.sum }}₽)</span>
            </template>
            <template v-slot:item.created_at="{item}">
              <span v-if="item.created_at">{{ formatDateJS(item.created_at, "DD.MM.YYYY hh:mm:ss") }}</span>
            </template>
            <template v-slot:item.finished_at="{item}">
              <span v-if="item.finished_at">{{ formatDateJS(item.finished_at, "DD.MM.YYYY hh:mm:ss") }}</span>
            </template>
            <template v-slot:item.status="{item}">
              <template v-if="item.status===0 && ['pay_tariff','pay'].includes(item.action_type) && !item.data?.auto">
                <v-btn color="blue" :loading="Array.from(inLoadingPay).includes(item.id)" size="x-small"
                       @click="sendToPay(item)">
                  Оплатить
                </v-btn>
                <v-btn color="orange" :loading="Array.from(inLoadingPay).includes(item.id)" size="x-small"
                       @click="sendCancel(item)">
                  Отменить
                </v-btn>
              </template>
              <v-chip v-else-if="item.status===0" color="blue">
                В очереди
              </v-chip>
              <v-img v-tooltip.auto="'Обрабатывается'" v-else-if="item.status===1" style="width: 28px;"
                     src="thirddots.svg"/>
              <v-img v-else-if="item.status===2" v-tooltip.auto="'Готово'" style="width: 28px;"
                     src="greenGalka.svg"/>
              <v-btn v-else-if="item.status===3" color="error" v-tooltip.auto="'Ошибка'">
                <v-icon style="font-size: 30px">mdi-alert-circle</v-icon>
              </v-btn>
              <v-chip v-else-if="item.status===4">
                Отменено
              </v-chip>
            </template>
          </data-table>
        </v-row>
      </v-card>
    </template>
    <template v-if="[1].includes(nowSlider)">
      <v-card width="100%" class="mt-5 pa-2">
        <v-row dense class="justify-center">
          <v-col lg="2">
            Телефон:
          </v-col>
          <v-col lg="2">
            Создано:
          </v-col>
          <v-col lg="2">
            Код:
          </v-col>
          <v-col lg="2">
            Действия:
          </v-col>
        </v-row>
        <template v-if="!loading">
          <v-form v-for="req in codeReqList" :key="req.id"
                  :ref="(el) => forms[req.id] = el"
                  :disabled="loadingReqList.has(req.id)">
            <v-row dense class="justify-center">
              <v-col lg="2">
                {{ req.phone }}
              </v-col>
              <v-col lg="2">
                <span v-if="req.created_at">{{ formatDateJS(req.created_at, "DD.MM.YYYY hh:mm:ss") }}</span>
              </v-col>
              <v-col lg="2">
                <v-text-field :rules="[rules.required,rules.min(4),rules.max(6)]" v-model="req.data.code"/>
              </v-col>
              <v-col lg="2">
                <v-btn :loading="loadingReqList.has(req.id)" @click="sendCode(req)">Отправить</v-btn>
              </v-col>
            </v-row>
          </v-form>
        </template>
      </v-card>
    </template>
  </v-row>
</template>
