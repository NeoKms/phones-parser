<script setup>
import {computed, ref, watch} from "vue";
import {useRoute} from "vue-router";
import SystemStatus from "@/components/systemStatus.vue";
import DownloadExcel from "@/components/downloadExcel.vue";
import * as IO from "@/plugins/io";

const route = useRoute();
const drawer = ref(document?.querySelector("body")?.offsetWidth >= 1500);
const items = computed(() => {
  let items = [];
  items.push({
    icon: 'mdi-view-dashboard',
    title: 'Главная',
    to: '/',
  })
  items.push({
    icon: 'mdi-cash-sync',
    title: 'Киви токены',
    to: '/qiwi_tokens',
  })
  items.push({
    icon: 'mdi-cellphone-text',
    title: 'Телефоны',
    to: '/phones',
  })
  items.push({
    icon: 'mdi-form-textbox-password',
    title: 'Пароли',
    to: '/passwords',
  })
  return items;
});
watch(route, () => {
  document.title = route.meta.name;
})
</script>

<template>
  <v-navigation-drawer
      v-model="drawer"
      elevation="2"
      permanent
  >
    <v-list nav>
      <v-list-item
          :active="'/'+route.path.split('/')[1]===item.to"
          v-for="(item, i) in items"
          :key="i"
          :value="item.to"
          active-color="primary"
          :to="item.to"
          nav
      >
        <template v-slot:prepend>
          <v-icon :icon="item.icon"></v-icon>
        </template>
        <v-list-item-title v-text="item.title"></v-list-item-title>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
  <v-app-bar
      :order="-1"
      class="overflow-y-hidden overflow-x-auto"
  >
    <v-app-bar-nav-icon @click.stop="drawer = !drawer"/>
    <div class="v-toolbar__title overflow-visible" v-text="route.meta.name"/>
    <v-spacer/>
    <v-card class="pa-4">
    <system-status/>
    </v-card>
    <v-card class="pa-4">
      Выгрузка в Excel
    <download-excel />
    </v-card>
    <v-spacer/>
  </v-app-bar>
  <v-main>
    <v-container>
      <RouterView/>
    </v-container>
  </v-main>
</template>

<style scoped>

</style>
