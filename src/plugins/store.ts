import Vue from 'vue'
import Vuex from 'vuex'
import {io, Socket} from "socket.io-client";
import Swal from "sweetalert2";
import VuexPersistence from "vuex-persist";
import {ModelStat, TestResult} from "@/ts/types";
import {defaultUrl} from "@/ts/utils";

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
        url: defaultUrl ,
        errorShown: false,
        connected: false,
        sessionDuration: 10,
        countries: [] as { [countryCode: string]: string }[],
        learnResults: {} as {
            [subsetId: string]: TestResult
        },
        testResults: {} as {
            [subsetId: string]: TestResult
        },
        modelStats: {} as {
            [flag: string]: ModelStat[],
        },
        randomFlags: [] as string[],
        factCount: 1,
        propagationSubsetId: 0,
    },
    mutations: {
        learnResults: (state, learnResults) => state.learnResults = learnResults,
        setLearnResult: (state, {subsetId, learnResult}) => Vue.set(state.learnResults, subsetId, learnResult),
        testResults: (state, testResults) => state.testResults = testResults,
        setTestResult: (state, {subsetId, testResult}) => Vue.set(state.testResults, subsetId, testResult),
        modelStats: (state, modelStats) => state.modelStats = modelStats,
        setModelStat: (state, {subsetId, modelStats}) => Vue.set(state.modelStats, subsetId, modelStats),

        factCount: (state, factCount) => state.factCount = factCount,
        randomFlags: (state, randomFlags) => state.randomFlags = randomFlags,
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
        async downloadResults({state}) {
            const download = (filename: string, data: string) => {
                const blob = new Blob([data], {type: 'text/csv'});
                //@ts-ignore
                if (window.navigator.msSaveOrOpenBlob) {
                    window.navigator.msSaveBlob(blob, filename);
                } else {
                    const elem = window.document.createElement('a');
                    elem.href = window.URL.createObjectURL(blob);
                    elem.download = filename;
                    document.body.appendChild(elem);
                    elem.click();
                    document.body.removeChild(elem);
                }
            }
            download(`exp-result-${(new Date).toISOString()}.json`, JSON.stringify({
                test: state.testResults,
                learn: state.learnResults,
                model: state.modelStats,
            }));
            console.log(state, 'd');
        },
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
        async getSubsetFlags({state}, subsetId) {
            return new Promise<void>((resolve) => {
                state.socket?.emit('get_subset_flags', subsetId, resolve);
            });
        },
        async getStats({state}) {
            let stats: any = await new Promise<void>((resolve) => {
                state.socket?.emit('get_stats', resolve);
            });
            return Object.entries(stats).map(([key, values]) => {
                let [a, rof] = values as (string | number)[];
                let activation;
                if (a === 'inf')
                    activation = Infinity;
                else if (a === '-inf')
                    activation = -Infinity;
                else
                    activation = +a;
                return {key, activation, rof: +rof};
            }).filter(i => i.activation !== -Infinity)
                .sort((a, b) => b.activation - a.activation);
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
            commit('testResults', {});
            commit('learnResults', {});
            commit('modelStats', {});
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
