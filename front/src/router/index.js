import {createRouter, createWebHistory} from 'vue-router'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'dashboard',
            meta: {name: 'Главная'},
            component: () => import('@/views/dashboard/index.vue')
        },
        {
            path: '/qiwi_tokens',
            name: 'qiwi_tokens',
            meta: {name: 'Управление токенами QIWI'},
            component: () => import('@/views/qiwi/index.vue')
        },
        {
            path: '/qiwi_tokens/create',
            name: 'qiwi_tokens-create',
            meta: {name: 'Управление токенами QIWI | Создание'},
            component: () => import('@/views/qiwi/create.vue')
        },
        {
            path: '/qiwi_tokens/:id',
            name: 'qiwi_tokens-id',
            meta: {name: 'Управление токенами QIWI | Редактирование'},
            component: () => import('@/views/qiwi/_id.vue')
        },
        {
            path: '/phones',
            name: 'phones',
            meta: {name: 'Управление телефонами'},
            component: () => import('@/views/phones/index.vue')
        },
        {
            path: '/phones/create',
            name: 'phones-create',
            meta: {name: 'Управление телефонами | Создание'},
            component: () => import('@/views/phones/create.vue')
        },
        {
            path: '/phones/:id',
            name: 'phones-id',
            meta: {name: 'Управление телефонами | Редактирование'},
            component: () => import('@/views/phones/_id.vue')
        },
        {
            path: '/passwords',
            name: 'passwords',
            meta: {name: 'Управление паролями'},
            component: () => import('@/views/passwords/index.vue'),
        },
        {
            path: '/passwords/create',
            name: 'passwords-create',
            meta: {name: 'Управление паролями | Создание'},
            component: () => import('@/views/passwords/create.vue'),
        },
        {
            path: '/passwords/:id',
            name: 'passwords-id',
            meta: {name: 'Управление паролями | Редактирование'},
            component: () => import('@/views/passwords/_id.vue'),
        },
        {
            path: "/404",
            name: "404",
            component: () => import("@/views/404/index.vue"),
        },
        {
            path: "/:pathMatch(.*)*",
            name: "404",
            component: () => import("@/views/404/index.vue"),
        },
    ]
})

export default router
