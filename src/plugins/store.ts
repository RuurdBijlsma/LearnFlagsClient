import Vue from 'vue'
import Vuex from 'vuex'
import {io, Socket} from "socket.io-client";
import Swal from "sweetalert2";
import VuexPersistence from "vuex-persist";

if (document.querySelectorAll(`head link[rel='manifest']`).length === 0) {
    let manifestLink = document.createElement('link');
    manifestLink.setAttribute('rel', 'manifest');
    manifestLink.setAttribute('href', './manifest.json');
    document.querySelector('head')?.appendChild?.(manifestLink);
}

const vuexLocal = new VuexPersistence({
    reducer: (state: any) => ({
        sessionDuration: state.sessionDuration,
        countries: state.countries,
        url: state.url,
    }),
    storage: window.localStorage,
})

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        socket: null as null | Socket,
        url: 'ws://localhost:5000',
        errorShown: false,
        connected: false,
        sessionDuration: 10,
        countries: [] as { [key: string]: string }[],
        gameResult: null as null | {
            duration: number,
            history: {
                rollingAccuracy: number, accuracy: number, correct: boolean,
                countryCode: string, userAnswer: string, responseTime: number
            }[],
            encounteredFlags: Set<string>,
        },
        experimentResults: [] as {
            duration: number,
            history: {
                rollingAccuracy: number, accuracy: number, correct: boolean,
                countryCode: string, userAnswer: string, responseTime: number
            }[],
        }[],
        randomFlags: [] as string[],
        factCount: 1,
        propagationSubsetId: 0,
    },
    mutations: {
        factCount: (state, factCount) => state.factCount = factCount,
        randomFlags: (state, randomFlags) => state.randomFlags = randomFlags,
        gameResult: (state, gameResult) => state.gameResult = gameResult,
        experimentResults: (state, experimentResults) => state.experimentResults = experimentResults,
        addExperimentResult: (state, experimentResult) => state.experimentResults.push(experimentResult),
        countries: (state, countries) => state.countries = countries,
        socketUrl: (state, socketUrl) => state.url = socketUrl,
        sessionDuration: (state, sessionDuration) => state.sessionDuration = sessionDuration,
        socket: (state, socket) => state.socket = socket,
        url: (state, url) => state.url = url,
        errorShown: (state, errorShown) => state.errorShown = errorShown,
        connected: (state, value) => state.connected = value,
        propagationSubsetId: (state, value) => state.propagationSubsetId = value,
    },
    getters: {
        flagList: state => Object.keys(state.countries ?? {}),
        flagUrl: () => (countryCode: string) => `flags/svg/${countryCode.toLowerCase()}.svg`,
        randomFlagUrl: (state, getters) => () => getters.flagUrl(getters.randomFlag()),
        randomFlag: (state, getters) => () => getters.flagList[Math.floor(Math.random() * getters.flagList.length)],
    },
    actions: {
        async initRandomFlags({state, getters, commit}) {
            console.log('flag list length', getters.flagList.length)
            if (getters.flagList.length === 0)
                commit('countries', await fetch('flags/countries.json').then(r => r.json()));
            console.log(state.countries);
            let randomFlags = [] as string[];
            while (randomFlags.length < 3 * Math.min(1500, window.innerWidth) / 1000) {
                let url = await getters.randomFlagUrl();
                if (!randomFlags.includes(url))
                    randomFlags.push(url)
            }
            commit('randomFlags', randomFlags);
        },
        async getStats({state}) {
            return new Promise<void>((resolve) => {
                state.socket?.emit('get_stats', resolve);
            });
        },
        async answerFact({state}, {countryCode = '', answer = '', responseTime = 0}) {
            return new Promise<void>((resolve) => {
                state.socket?.emit('register_response', countryCode, answer, responseTime, resolve);
            });
        },
        async nextFact({state}) {
            return new Promise<void>((resolve) => {
                state.socket?.emit('next_fact', '', resolve);
            });
        },
        async initializeSocket({commit, state}) {
            console.log("Called initializeSocket")
            commit('socket', io(state.url));
            return new Promise<void>((resolve, reject) => {
                if (state.socket === null) return;
                state.socket.on('connect', () => {
                    console.log("CONNECTED");
                    commit('propagationSubsetId', +(Math.random() > .5));
                    console.log(`Propagation is enabled for subset: ${state.propagationSubsetId}`);
                    commit('connected', true);
                    resolve();
                });
                state.socket.on('connect_error', (e: any) => {
                    console.warn(e.message);
                    if (!state.errorShown) {
                        commit('connected', false);
                        commit('errorShown', true);
                        Swal.fire({
                            title: `Can't connect to server, run the server before loading this page.`,
                            text: `Server IP ${state.url}`,
                            icon: 'error',
                        });
                        reject(e);
                    }
                });
            })
        },

        async resetModel({commit, state}, {subsetId, enablePropagation = true}) {
            return new Promise<void>((resolve) => {
                state.socket?.emit('reset_model', subsetId, enablePropagation, (factCount: number) => {
                    commit('factCount', factCount);
                    resolve();
                })
            })
        }
    },
    modules: {},
    plugins: [vuexLocal.plugin],
})
