<template>
    <div class="home" v-if="result" :style="{
        alignItems:  $vuetify.breakpoint.mobile ? 'stretch' : 'flex-start',
    }">
        <v-card elevation="2" class="left-card mb-3"
                :class="$vuetify.breakpoint.width > 1300 ? 'rounded-xl' : ''">
            <v-card-title>Session results</v-card-title>
            <div class="flags">
                <v-img :key="flag" v-for="flag in randomFlags" :aspect-ratio="3/2" :src="flag"/>
            </div>
            <v-card-text class="results">
                <test-result-view :result="result" learn-result/>
            </v-card-text>
            <v-card-actions>
                <v-btn rounded color="primary" to="/">
                    <span class="ml-4 mr-4">Start new session</span>
                </v-btn>
            </v-card-actions>
        </v-card>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import {secondsToHms} from "@/ts/utils";
import {TestResult} from "@/ts/types";
import TestResultView from "@/components/TestResultView.vue";

export default Vue.extend({
    name: 'GameResult',
    components: {TestResultView},
    async mounted() {
        console.log(this.result);
        if (!this.result || this.result.history.length === 0) {
            console.warn("No known game result, redirecting to homepage");
            return await this.$router.push('/');
        }
        await this.$store.dispatch('initRandomFlags');
    },
    methods: {
        toHms(s: number) {
            return secondsToHms(s);
        },
    },
    computed: {
        result(): null | TestResult {
            //@ts-ignore
            return this.$store.state.learnResults[null] ?? null;
        },
        countries(): { [key: string]: string }[] {
            return this.$store.state.countries;
        },
        randomFlags(): string[] {
            return this.$store.state.randomFlags;
        },
        correctPercentage(): number {
            if (!this.result?.history.length) return 0;
            console.log('result history', this.result.history);
            let correctCount = this.result?.history.reduce((a, b) => a + (b.correct ? 1 : 0), 0);
            return correctCount / this.result?.history.length;
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

.flag-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: flex-start;
}

.item-img {
    min-width: 150px;
    width: 100%;
    height: 100%;
    border-radius: 10px;
}

.item-text {
    position: absolute;
    bottom: 10px;
    width: 100%;
    text-align: center;
    color: white;
    font-weight: bolder;
    font-size: 14px;
    text-shadow: 0 0 15px black;
}

.sparkline {
    display: flex;
}

.min-max {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

</style>
