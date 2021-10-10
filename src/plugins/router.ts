import Vue from 'vue'
import VueRouter, {RouteConfig} from 'vue-router'
import GameIntro from "@/views/home/GameIntro.vue";

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
    {
        path: '/',
        name: 'Home',
        component: GameIntro,
    },
    {
        path: '/play',
        name: 'Game',
        component: () => import('../views/home/Game.vue')
    },
    {
        path: '/result',
        name: 'GameResult',
        component: () => import('../views/home/GameResult.vue')
    },
    {
        path: '/settings',
        name: 'Settings',
        component: () => import('../views/Settings.vue')
    },
]

const router = new VueRouter({
    routes
})

export default router
