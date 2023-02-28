<script setup>
import {computed, ref} from "vue";
import {formatDateJS} from "@/plugins/dates";

defineEmits(["close"]);
const props = defineProps({
  item: {
    type: Object,
    required: true
  }
});
const tarifDateString = computed(() => {
  if (props.item.tariff_date > 0) {
    return formatDateJS(props.item.tariff_date, 'DD.MM.YYYY');
  }
  return "--/--/----";
})
const parseDateString = computed(() => {
  if (props.item.last_pars_timestamp > 0) {
    return formatDateJS(props.item.last_pars_timestamp, 'DD.MM.YYYY hh:mm:ss');
  }
  return "--/--/----";
})
const qiwiString = computed(() => {
  if (props.item.qiwi_token_id > 0) {
    return props.item.qiwi_token_descr || props.item.qiwi_token
  }
  return "Любой активный";
})
</script>

<template>
  <v-card style="align-self: center" width="1200" elevation="10">
    <v-card-text class="mt-5">
      <v-row dense class="sticky-top" justify="center">
        <h2>Просмотр информации о телефоне {{ item.phone }}</h2>
      </v-row>
      <v-row>
        <v-col lg="6">
          <v-card elevation="10">
            <v-card-title>
              <div style="display: flex;align-items: center;">
                <span>Общая информация</span>
                <v-spacer/>
                <v-switch hide-details readonly label="Активность" v-model="item.is_active" :false-value="0"
                          :true-value="1" color="success"
                          value="success"/>
              </div>
            </v-card-title>
            <v-card-text class="mt-5">
              <v-row dense>
                <v-col lg="4" md="4" sm="4" sx="12">
                  <v-text-field readonly label="Оператор" v-model="item.operator"/>
                </v-col>
                <v-col>
                  <v-text-field readonly label="ФИО" v-model="item.fio"/>
                </v-col>
              </v-row>
              <v-row dense>
                <v-col lg="4" md="4" sm="4" sx="12">
                  <v-text-field readonly label="Текущий баланс" v-model="item.balance"/>
                </v-col>
                <v-col lg="4" md="4" sm="4" sx="12">
                  <v-text-field readonly label="Требуемый баланс" v-model="item.min_value"/>
                </v-col>
                <v-col lg="4" md="4" sm="4" sx="12">
                  <v-switch hide-details readonly label="Автооплата" v-model="item.auto_pay" :false-value="0"
                            :true-value="1" color="success"
                            value="success"/>
                </v-col>
              </v-row>
              <v-row dense>
                <v-col>
                  <v-text-field readonly label="QIWI токен" v-model="qiwiString"/>
                </v-col>
              </v-row>
              <v-row dense>
                <v-col>
                  <v-text-field readonly label="сип" v-model="item.sip"/>
                </v-col>
              </v-row>
              <v-row dense>
                <v-col>
                  <v-textarea readonly label="Коммент" v-model="item.comment"/>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col lg="6">
          <v-row dense>
            <v-col>
              <v-card title="Тариф" elevation="10" class="pa-5">
                <v-card-text class="mt-5">
                  <v-row dense>
                    <v-col lg="6" md="6" sm="6" sx="12">
                      <v-text-field readonly label="Дата оплаты" v-model="tarifDateString"/>
                    </v-col>
                    <v-col lg="6" md="6" sm="6" sx="12">
                      <v-text-field readonly label="Стоимость тарифа" v-model="item.tariff_cost"/>
                    </v-col>
                  </v-row>
                  <v-row dense>
                    <v-col lg="6" md="6" sm="6" sx="12">
                      <v-text-field readonly label="ГБ в пакете" v-model="item.gb_packet"/>
                    </v-col>
                    <v-col lg="6" md="6" sm="6" sx="12">
                      <v-text-field readonly label="ГБ доступно" v-model="item.gb_available"/>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
          <v-row dense>
            <v-col>
              <v-card title="Парсинг" elevation="10" class="pa-5">
                <v-card-text class="mt-5">
                  <v-row dense>
                    <v-col lg="6">
                      <v-text-field readonly label="Дата последнего парсинга" v-model="parseDateString"/>
                    </v-col>
                    <v-col lg="6">
                      <v-text-field readonly label="Пароль лк" v-model="item.current_password"/>
                    </v-col>
                  </v-row>
                  <v-row dense class="pt-2">
                    <v-col>
                      <v-textarea label="Последняя ошибка" rows="2" v-model="item.last_error" readonly />
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
      <v-row dense class="sticky-bot" justify="center">
        <v-btn color="red" @click="$emit('close')">Закрыть</v-btn>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.sticky-bot {
  position: sticky;
  bottom: 10px;
  z-index: 2;
}

.sticky-top {
  position: sticky;
  top: 0;
  padding-top: 10px;
  padding-bottom: 10px;
  background: white;
  z-index: 2;
}
</style>
