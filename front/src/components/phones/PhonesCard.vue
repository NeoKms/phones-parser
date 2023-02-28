<script setup>
import {computed, ref} from "vue";
import {useRoute, useRouter} from "vue-router";
import {errVueHandler} from "@/plugins/errorResponser";
import {useNotificationsStore} from "@/stores/notifications";
import {usePhonesStore} from "@/stores/phones";
import {usePasswordsStore} from "@/stores/passwords";
import {useQiwiStore} from "@/stores/qiwi";

const props = defineProps({
  obj: {
    type: Object,
    default: () => ({
      phone: "",
      password_id: null,
      min_value: null,
      comment: null,
      sip: null,
      qiwi_token_id: -1,
      auto_pay: false,
    }),
  }
})
const route = useRoute();
const router = useRouter();
const phonesStore = usePhonesStore();
const notifStore = useNotificationsStore();
const passStore = usePasswordsStore();
const qiwiStore = useQiwiStore();

const passList = computed(() => passStore.list);
const qiwiList = computed(() => qiwiStore.activeListWhtiNull);
const loading = ref(false);
const item = ref(JSON.parse(JSON.stringify(props.obj)));
const savedContent = JSON.stringify(props.obj);
const save = async () => {
  if (savedContent === JSON.stringify(item.value)) {
    return notifStore.addMessage({
      type: "warning",
      time: 2000,
      name: "Нет изменений",
    })
  }
  const {valid} = await form.value.validate();
  if (valid) {
    loading.value = true;
    if (route.params.id) {
      return phonesStore.update({
        phone: item.value.phone,
        auto_pay: item.value.auto_pay,
        password_id: item.value.password_id,
        min_value: parseInt(item.value.min_value ?? 0),
        comment: item.value.comment ?? "",
        sip: item.value.sip ?? "",
        qiwi_token_id: item.value.qiwi_token_id,
      })
          .then(res => {
            if (errVueHandler(res)) {
              router.push("/phones");
            }
          })
          .finally(() => loading.value = false)
    } else {
      return phonesStore.create({
        phone: item.value.phone,
        auto_pay: item.value.auto_pay,
        password_id: item.value.password_id,
        min_value: parseInt(item.value.min_value ?? 0),
        comment: item.value.comment ?? "",
        sip: item.value.sip ?? "",
        qiwi_token_id: item.value.qiwi_token_id,
      })
          .then(res => {
            if (errVueHandler(res)) {
              router.push("/phones");
            }
          })
          .finally(() => loading.value = false)
    }
  } else {
    return notifStore.addMessage({
      type: "warning",
      time: 2000,
      name: "Перепроверьте данные формы",
    })
  }
}

const isEdit = computed(() => route.path.indexOf("/create") === -1);
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
const form = ref(null)
</script>

<template>
  <v-row justify="center" class="mt-5">
    <v-card width="600" class="pa-5" elevation="10" :loading="loading">
      <v-card-title>
        <span v-if="item.phone">Редактирование</span>
        <span v-else>Создание</span>
      </v-card-title>
      <v-card-text class="mt-5">
        <v-form ref="form" :disabled="loading">
          <v-row>
            <v-text-field :rules="[rules.required,rules.number,rules.signed,rules.phone, rules.min(10),rules.max(20)]"
                          :disabled="isEdit" label="Номер формата 9521234567" v-model="item.phone"/>
          </v-row>
          <v-row>
            <v-select clearable label="Пароль" v-model="item.password_id" :items="passList" item-title="description"
                      item-value="id"/>
          </v-row>
          <v-row>
            <v-select clearable label="QIWI токен" v-model="item.qiwi_token_id" :items="qiwiList" item-title="title"
                      item-value="id"/>
          </v-row>
          <v-row>
            <v-text-field :rules="[rules.required, rules.number]" label="Требуемый баланс" v-model="item.min_value"/>
          </v-row>
          <v-row>
            <v-text-field label="sip" v-model.trim="item.sip"/>
          </v-row>
          <v-row>
            <v-switch label="Автооплата" v-model="item.auto_pay" :false-value="0" :true-value="1" color="success"
                      value="success"/>
          </v-row>
          <v-row>
            <v-textarea label="Коммент" v-model.trim="item.comment"/>
          </v-row>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-btn :disabled="loading" color="red" @click="$router.push('/phones')">Отменить</v-btn>
        <v-btn :disabled="loading" color="green" @click="save">Сохранить</v-btn>
      </v-card-actions>
    </v-card>
  </v-row>
</template>

<style scoped>

</style>
