<script setup>
import {computed, ref, watch} from "vue";

const props = defineProps({
  stickyHead: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false
  },
  items: {
    type: Array,
    default: () => [],
    required: true,
  },
  headers: {
    type: Array,
    default: () => [],
    required: true,
  },
  pageCountExternal: {
    type: Number,
    default: () => null,
  },
  totalCountExternal: {
    type: Number,
    default: () => null,
  },
  options: {
    type: Object,
    default: () => ({
      page: 1,
      itemsPerPage: 20,
      sortBy: [],
      sortDesc: []
    })
  }
});
const emits = defineEmits(["update:options"])
const optionsInternal = ref(JSON.parse(JSON.stringify(props.options)));
const totalItems = computed(() => props.totalCountExternal || props.items.length);
const pageCount = computed(() => props.pageCountExternal || parseInt(totalItems.value / optionsInternal.value.itemsPerPage) + ((totalItems.value % optionsInternal.value.itemsPerPage) > 0 ? 1 : 0));
const filtredItems = computed(() => {
  let itemsCopy = JSON.parse(JSON.stringify(props.items));
  if (props.totalCountExternal >= 0) {
    itemsCopy = itemsCopy.splice(0, optionsInternal.value.itemsPerPage);
  } else {
    itemsCopy = itemsCopy.splice((optionsInternal.value.page - 1) * optionsInternal.value.itemsPerPage, optionsInternal.value.itemsPerPage);
  }
  return itemsCopy;
});
const changeItemsPerPage = (val) => {
  optionsInternal.value.itemsPerPage = val;
}
watch(optionsInternal, () => {
  emits("update:options", JSON.parse(JSON.stringify(optionsInternal.value)))
}, {deep: true});
const isSort = ({value}) => {
  return optionsInternal.value.sortBy.includes(value);
}
const isSortDesc = ({value}) => {
  const index = optionsInternal.value.sortBy.findIndex(e => e === value);
  if (index >= 0) {
    return optionsInternal.value.sortDesc[index];
  } else {
    return null;
  }
};
const changeSort = (h) => {
  if (isSort(h)) {
    const index = optionsInternal.value.sortBy.findIndex(e => e === h.value);
    optionsInternal.value.sortDesc[index] = !optionsInternal.value.sortDesc[index]
  } else {
    optionsInternal.value.sortBy[0] = h.value;
    optionsInternal.value.sortDesc[0] = false;
  }
}
</script>
<template>
  <v-container>
    <v-row>
      <v-col>
        <v-table class="c-data-table">
          <thead :class="{'sticky-head':stickyHead}">
          <tr>
            <template v-for="h in headers">
              <v-hover v-slot="{ isHovering, props }">
                <th class="text-left" :class="{'font-weight-bold text-black':isHovering||isSort(h)}"
                    :key="h.value" v-bind="props"
                    @click="changeSort(h)"
                    style="cursor: pointer"
                >
                  <span>
                    {{ h.text }}
                  </span>
                  <v-icon v-if="(isHovering||isSort(h)) && !isSortDesc(h)" style="font-size: 18px">mdi-arrow-up</v-icon>
                  <v-icon v-if="isSortDesc(h)" style="font-size: 18px">mdi-arrow-down</v-icon>
                </th>
              </v-hover>
            </template>
          </tr>
          </thead>
          <tbody style="position: relative">
          <template v-if="loading">
            <v-progress-circular
                indeterminate size="100" color="orange" class="loader-posts lposabs"
                :class="{'lposabs': filtredItems.length}">
              Загрузка...
            </v-progress-circular>
          </template>
          <template v-if="!filtredItems.length">
            <tr>
              <th :colspan="headers.length" class="text-center">
                <span>Нет данных</span>
              </th>
            </tr>
          </template>
          <template v-else>
            <tr
                v-for="(v,ind) in filtredItems"
                :key="ind"
            >
              <td v-for="h in headers">
                <slot :name="'item.'+h.value" :item="v" :header="h">
                  {{ v[h.value] }}
                </slot>
              </td>
            </tr>
          </template>
          </tbody>
        </v-table>
      </v-col>
    </v-row>
    <v-row class="text-center pt-2" v-if="filtredItems.length">
      <v-col>
        <v-pagination
            :disabled="loading"
            v-model="optionsInternal.page"
            :length="pageCount"
            :total-visible="7"
        ></v-pagination>
        <v-btn-toggle dense multiple class="custom-pagination">
          <v-btn :disabled="loading" small rounded outlined
                 @click="(optionsInternal.itemsPerPage-10)<1?changeItemsPerPage(1):changeItemsPerPage(optionsInternal.itemsPerPage-10)">
            -10
          </v-btn>
          <v-btn :disabled="loading" small rounded outlined @click="changeItemsPerPage(10)">10</v-btn>
          <v-btn :disabled="loading" small rounded outlined style="font-weight: 900">
            Элементов:
            {{
              (optionsInternal.page - 1) * optionsInternal.itemsPerPage + 1
            }}-{{
              optionsInternal.page * optionsInternal.itemsPerPage > totalItems ? totalItems : optionsInternal.page * optionsInternal.itemsPerPage
            }}/{{ totalItems }}
          </v-btn>
          <v-btn :disabled="loading||pageCount===1" small rounded outlined
                 @click="changeItemsPerPage(totalItems)">Все
          </v-btn>
          <v-btn :disabled="loading||pageCount===1" small rounded outlined
                 @click="optionsInternal.itemsPerPage+10>totalItems?changeItemsPerPage(totalItems):changeItemsPerPage(optionsInternal.itemsPerPage+10)">
            +10
          </v-btn>
        </v-btn-toggle>
      </v-col>
    </v-row>
  </v-container>
</template>

<style lang="scss">
.c-data-table table {
  min-height: 200px;
}

.custom-pagination {
  .v-btn--active {
    .v-btn__overlay {
      opacity: 0 !important;
    }
  }

  .v-btn--active:hover {
    .v-btn__overlay {
      opacity: 0.1 !important;
    }
  }
}

.loader-posts.v-progress-circular > svg {
  width: auto !important;
  height: 40% !important;
}
</style>
<style scoped>
.sticky-head {
  position: sticky;
  top: 0;
  z-index: 2;
  background-color: white;
}

.loader-posts {
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  width: 100% !important;
  height: 100% !important;
  background: #eaeaea;
  z-index: 2;
}

.loader-posts.lposabs {
  position: absolute !important;
}
</style>
