<template>
    <div class="home" :style="{
        alignItems:  $vuetify.breakpoint.mobile ? 'stretch' : 'flex-start',
    }">
        <v-card elevation="2" class="left-card"
                :class="$vuetify.breakpoint.width > 1300 ? 'rounded-xl' : ''">
            <v-card-title>Learn country flags!</v-card-title>
            <div class="flags">
                <v-img :key="flag" v-for="flag in randomFlags" :aspect-ratio="3/2" :src="flag"/>
            </div>
            <div class="slider-container">
                <v-toolbar flat dense>
                    <v-toolbar-title>
                        <span class="subheading">Session duration</span>
                    </v-toolbar-title>
                </v-toolbar>

                <v-col class="text-left">
                    <span class="text-h2 font-weight-light" v-text="sessionDuration"></span>
                    <span class="subheading font-weight-light mr-1">minutes</span>
                </v-col>
                <div class="slider">
                    <span>5 min</span>
                    <v-slider step="5"
                              hide-details
                              ticks="always"
                              tick-size="4"
                              prepend-icon="mdi-clock-outline"
                              min="5" max="60"
                              v-model="sessionDuration">
                    </v-slider>
                    <span>60 min</span>
                </div>
            </div>
            <v-card-actions>
                <v-btn rounded color="primary"
                       :loading="loading.connection"
                       @click="newGame">
                    <span class="ml-4 mr-4">Start learning</span>
                </v-btn>
            </v-card-actions>
        </v-card>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
    name: 'GameIntro',
    components: {},
    data: () => ({
        loading: {
            connection: false,
        },
    }),
    beforeDestroy() {
        document.removeEventListener('keypress', this.handleKey);
    },
    async mounted() {
        await this.$store.dispatch('initRandomFlags');
        document.addEventListener('keypress', this.handleKey, false);
    },
    methods: {
        handleKey(e: KeyboardEvent) {
            if (e.key === 'Enter') {
                this.newGame();
            }
        },
        async newGame() {
            this.loading.connection = true;
            try {
                await this.$store.dispatch('initializeSocket');
                await this.$store.dispatch('resetModel', {subsetId: -1})
            } catch (e) {
                return;
            } finally {
                this.loading.connection = false;
            }
            if (!this.connected)
                return;
            await this.$router.push('/play');
        },
    },
    computed: {
        randomFlags() {
            return this.$store.state.randomFlags;
        },
        sessionDuration: {
            set(v: number) {
                this.$store.commit('sessionDuration', v);
            },
            get(): number {
                return this.$store.state.sessionDuration;
            }
        },
        countries: {
            set(v: number) {
                this.$store.commit('countries', v);
            },
            get(): number {
                return this.$store.state.countries;
            }
        },
        connected() {
            return this.$store.state.connected;
        },
    },
})
</script>

<style scoped>
.home {
    display: flex;
    width: 1300px;
    max-width: 100%;
    margin: 30px auto 0;
    align-items: flex-start;
}

@media (max-width: 1300px) {
    .home {
        margin-top: 0 !important;
    }
}

.left-card {
    flex-grow: 1;
}

.flags {
    display: flex;
    min-height: 100px;
}

.flags > * {
    width: 10px;
}

.slider-container {
    padding: 20px;
}

.slider {
    display: flex;
    gap: 20px;
    align-items: center;
}
</style>
