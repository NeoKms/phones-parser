<script setup>
import {useNotificationsStore} from "@/stores/notifications";
import {computed} from "vue";

const notifStore = useNotificationsStore();
const messages = computed(() => notifStore.getMessages);

function hideNotification(lastId) {
  let index = messages.value.findIndex(elem => elem.id === lastId);
  if (messages.value.length > 0 && messages.value[index].time > 0) {
    setTimeout(() => {
      messages.value.splice(messages.value.findIndex(elem => elem.id === lastId), 1);
    }, messages.value[index].time);
  }
}

const clickRight = (id) => {
  messages.value[messages.value.findIndex(elem => elem.id === id)].time = 1;
  hideNotification(id)
}
</script>

<template>
  <div class='PushNotifications'>
    <transition-group
        name="v-transition-animate"
        class="messages_list"
        tag="div"
    >
      <div
          class="PushNotifications__content"
          v-for="(message, index) in messages"
          :key="message.id"
          :class="message.type"
      >
        <div class="content__text">
          <span>{{ message.name }}</span>
        </div>
        <div class="content__buttons">
          <v-btn class="button right" outlined small text v-if="message.rightButton" @click="clickRight(message.id)">
            {{ message.rightButton }}
          </v-btn>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<style lang="scss">
.PushNotifications {
  position: fixed;
  bottom: 20px;
  right: 16px;
  z-index: 1000;

  &__messages_list {
    display: flex;
    flex-direction: column-reverse;
  }

  &__content {
    min-width: 300px;
    height: auto;
    min-height: 50px;
    padding: 5px 16px 5px 16px;
    border-radius: 4px;
    color: #ffffff;
    display: flex;
    justify-content: space-between;
    align-items: center;
    white-space: pre-wrap;
    margin-bottom: 16px;
    background: green;

    &.error {
      background: #ff5252;
    }

    &.warning {
      background: #fb8c00;
    }

    &.success {
      background: #4caf50;
    }

    &.info {
      background: #415cb1;
    }
  }

  .content {
    &__text {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    &__buttons {
      .button {
        cursor: pointer;
        margin-left: 4px;
        background: none;
        border-radius: 200px;
        padding: 6px;
      }

      .left {
        /*border: 2px solid green;*/
      }

      .right {
        /*border: 2px solid red;*/
      }
    }
  }
}

.v-transition-animate {
  &-enter {
    transform: translateX(120px);
    opacity: 0;
  }

  &-enter-active {
    transition: all .6s ease;
  }

  &-enter-to {
    opacity: 1;
  }

  &-leave {
    height: 50px;
    opacity: 1;
  }

  &-leave-active {
    transition: transform .6s ease, opacity .6s, height .6s .2s;
  }

  &-leave-to {
    height: 0;
    transform: translateX(120px);
    opacity: 0;
  }

  &-move {
    transition: transform .6s ease;
  }
}
</style>
