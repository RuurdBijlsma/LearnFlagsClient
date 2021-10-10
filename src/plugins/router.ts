import Vue from 'vue'
import VueRouter, {RouteConfig} from 'vue-router'
import Home from '../views/Home.vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
    {
        path: '/',
        name: 'Home',
        component: Home,
        children:[
            {
                path: '/',
                name: 'GameIntro',
                component: () => import('../views/Home/GameIntro.vue')
            },
            {
                path: '/play',
                name: 'Game',
                component: () => import('../views/Home/Game.vue')
            },
            {
                path: '/result',
                name: 'GameResult',
                component: () => import('../views/Home/GameResult.vue')
            },
        ]
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
