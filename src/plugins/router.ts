import Vue from 'vue'
import VueRouter, {RouteConfig} from 'vue-router'
import GameIntro from "@/views/game/GameIntro.vue";
import ExperimentIntro from "@/views/experiment/ExperimentIntro.vue";

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
    {
        path: '/experiment',
        name: 'Experiment',
        component: ExperimentIntro,
    },
    {
        path: '/experiment/learn/:subsetId',
        name: 'ExperimentLearn',
        component: () => import('../views/experiment/Experiment.vue')
    },
    {
        path: '/experiment/learn-intro/:subsetId',
        name: 'ExperimentLearnIntro',
        component: () => import('../views/experiment/ExperimentLearnIntro.vue')
    },
    {
        path: '/experiment/test-intro/:subsetId',
        name: 'ExperimentTestIntro',
        component: () => import('../views/experiment/ExperimentTestIntro.vue')
    },
    {
        path: '/experiment/test/:subsetId',
        name: 'ExperimentTest',
        component: () => import('../views/experiment/ExperimentTest.vue')
    },
    {
        path: '/experiment/result',
        name: 'ExperimentResult',
        component: () => import('../views/experiment/ExperimentResult.vue')
    },
    {
        path: '/',
        name: 'Home',
        component: GameIntro,
    },
    {
        path: '/play',
        name: 'Game',
        component: () => import('../views/game/Game.vue')
    },
    {
        path: '/result',
        name: 'GameResult',
        component: () => import('../views/game/GameResult.vue')
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
