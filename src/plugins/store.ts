import Vue from 'vue'
import Vuex from 'vuex'
//@ts-ignore
import {io, Socket} from "socket.io-client";
//@ts-ignore
import Swal from "sweetalert2";

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        socket: null as null | Socket,
        url: 'ws://localhost:5000',
        errorShown: false,
        connected: false,
    },
    mutations: {
        socket: (state, socket) => state.socket = socket,
        url: (state, url) => state.url = url,
        errorShown: (state, errorShown) => state.errorShown = errorShown,
        connected: (state, value) => state.connected = value,
    },
    actions: {
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
    },
    modules: {}
})
