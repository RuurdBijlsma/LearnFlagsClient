<template>
    <div class="home" :style="{
        alignItems:  $vuetify.breakpoint.mobile ? 'stretch' : 'flex-start',
    }">
        <v-card elevation="2" class="left-card"
                :class="$vuetify.breakpoint.width > 1300 ? 'rounded-xl' : ''">
            <v-card-title>Experiment sessions</v-card-title>
            <div class="flags">
                <v-img :key="flag" v-for="flag in randomFlags" :aspect-ratio="3/2" :src="flag"/>
            </div>
            <div class="slider-container">
                <p class="body-1">Session duration</p>

                <v-col class="text-left mb-4">
                    <span class="text-h2 font-weight-light" v-text="sessionDuration"></span>
                    <span class="subheading font-weight-light mr-1">minutes per learning session</span>
                </v-col>
                <p class="body-1">This experiment is structured as follows:</p>
                <ol>
                    <li>Learn a subset of flags with/without our changes to the SlimStampen algorithm for 10 minutes.</li>
                    <li>Test your knowledge of the subset of flags.</li>
                    <li>Learn a different subset of flags with/without our changes to the SlimStampen algorithm for 10 minutes.</li>
                    <li>Test your knowledge of that subset of flags.</li>
                </ol>
            </div>
            <v-card-actions>
                <v-btn rounded color="primary"
                       :loading="loading.connection"
                       @click="newGame">
                    <span class="ml-4 mr-4">Start experiment</span>
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
            } catch (e) {
                return;
            } finally {
                this.loading.connection = false;
            }
            if (!this.connected)
                return;
            await this.$router.push('/experiment/learn-intro/0');
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
