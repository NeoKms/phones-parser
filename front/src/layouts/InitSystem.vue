<script setup>
import {useDefaultStore} from "@/stores/default";
import {computed, ref} from "vue";
import InitQiwi from "@/components/init/InitQiwi.vue";
import InitPass from "@/components/init/InitPass.vue";
import InitPhones from "@/components/init/InitPhones.vue";

const defaultStore = useDefaultStore();

const loading = ref(false);
const items = computed(() => {
  const items = [];
  if (!defaultStore.isInitQiwi) {
    items.push({
      name: "QIWI токены",
      component: InitQiwi,
    })
  }
  if (!defaultStore.isInitPasswords) {
    items.push({
      name: "Пароли",
      component: InitPass,
    })
  }
  if (!defaultStore.isInitPhones) {
    items.push({
      name: "Выгрузка Excel телефонов",
      component: InitPhones,
    })
  }
  return items;
})

const nowSlider = ref(0);

const continueInit = () => {
  loading.value = true;
  return defaultStore.checkInitSystem()
      .then(()=>loading.value=false);
}
</script>

<template>
  <v-main>
    <v-container>
      <v-row class="justify-center">
        <h2>Необходимо провести инициализацию системы</h2>
      </v-row>
      <v-row class="justify-center">
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
            <v-btn
                class="ma-2"
                rounded
                :color="isSelected ? 'primary' : undefined"
            >
              {{ item.name }}
            </v-btn>
          </v-slide-group-item>
        </v-slide-group>
      </v-row>
      <v-row class="justify-center" v-if="nowSlider>=0">
        <v-col class="text-center">
          <component
              @loading:start="loading=true"
              @loading:end="loading=false"
              @continue="continueInit"
              :is="items[nowSlider].component" />
        </v-col>
      </v-row>
      <v-row v-else class="justify-center">
        <h4>Выберите вкладку</h4>
      </v-row>
    </v-container>
  </v-main>
</template>

<style scoped>

</style>
