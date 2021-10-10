<template>
    <div class="home" :style="{
        alignItems:  $vuetify.breakpoint.mobile ? 'stretch' : 'flex-start',
    }">
        <v-card elevation="2" class="left-card mb-3"
                :class="$vuetify.breakpoint.width > 1300 ? 'rounded-xl' : ''">
            <v-card-title>Session results</v-card-title>
            <div class="flags">
                <v-img :key="flag" v-for="flag in randomFlags" :aspect-ratio="3/2" :src="flag"/>
            </div>
            <v-card-text class="results">
                <div>
                    Session duration: <b>{{ toHms(result.duration) }}</b>
                    <br>
                    Overall accuracy: <b>{{ Math.round(correctPercentage * 100) }}%</b>
                    <br>
                    Answers given: <b>{{result.history.length}}</b>
                    <br>
                    Flags encountered: <b>{{ result.encounteredFlags.size }}</b>
                    <v-divider class="mb-3 mt-3"/>
                </div>
                <h3 class="mb-4">Answer accuracy over time</h3>
                <v-divider class="mb-3 mt-3"/>
                <div class="sparkline mt-4">
                    <div class="min-max">
                        <span>{{ Math.round(maxAccuracy * 100) }}%</span>
                        <span>{{ Math.round(minAccuracy * 100) }}%</span>
                    </div>
                    <v-divider class="ml-2" vertical/>
                    <v-sparkline
                        :value="accuracyHistory"
                        :gradient="lineConfig.gradient"
                        :smooth="lineConfig.radius || false"
                        :padding="lineConfig.padding"
                        :line-width="lineConfig.width"
                        :stroke-linecap="lineConfig.lineCap"
                        :gradient-direction="lineConfig.gradientDirection"
                        :fill="lineConfig.fill"
                        :type="lineConfig.type"
                        :auto-line-width="lineConfig.autoLineWidth"
                        auto-draw/>
                </div>
                <v-divider class="mb-3 mt-3"/>
                <h3 class="mt-4 mb-4">Best known flags</h3>
                <v-divider class="mb-3 mt-3"/>
                <div class="flag-grid">
                    <v-img v-for="fact in factActivations" :key="fact.key"
                           width="300" height="180"
                           class="item-img"
                           :src="$store.getters.flagUrl(fact.key)"
                           gradient="to top right, rgba(50,62,100,.5), rgba(25,32,72,0)">
                        <div class="item-text">{{ countries[fact.key] }}</div>
                        <div class="item-text2">{{ Math.round(fact.activation * 10) / 10 }}</div>
                    </v-img>
                </div>
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

const gradients = [
    ['#222'],
    ['#42b3f4'],
    ['red', 'orange', 'yellow'],
    ['purple', 'violet'],
    ['#00c6ff', '#F0F', '#FF0'],
    ['#1feaea', '#ffd200', '#f72047'],
]

export default Vue.extend({
    name: 'GameResult',
    data: () => ({
        lineConfig: {
            width: 2,
            radius: 10,
            padding: 8,
            lineCap: 'round',
            gradient: gradients[5],
            gradientDirection: 'top',
            gradients,
            fill: false,
            type: 'trend',
            autoLineWidth: false,
        },
        factActivations: null as null | { key: string, activation: number, rof: number }[],
    }),
    async mounted() {
        console.log(this.result);
        if (!this.result) {
            console.warn("No known game result, redirecting to homepage");
            return await this.$router.push('/');
        }
        let [, stats] = await Promise.all([
            this.$store.dispatch('initRandomFlags'),
            this.$store.dispatch('getStats')
        ]);
        //
        this.factActivations = Object.entries(stats).map(([key, [a, rof]]) => {
            let activation;
            if (a === 'inf')
                activation = Infinity;
            else if (a === '-inf')
                activation = -Infinity;
            else
                activation = +a;

            return {key, activation, rof};
        }).filter(i => i.activation !== -Infinity).sort((a, b) => b.activation - a.activation);
        console.log(this.factActivations);
    },
    methods: {
        toHms(s: number) {
            return secondsToHms(s);
        },
    },
    computed: {
        accuracyHistory(): number[] {
            return this.result?.history.map((h: any) => h.accuracy) ?? [];
        },
        minAccuracy(): number {
            return Math.min(...this.accuracyHistory);
        },
        maxAccuracy(): number {
            return Math.max(...this.accuracyHistory);
        },
        result(): null | {
            duration: number,
            history: { accuracy: number, correct: boolean, countryCode: string, userAnswer: string, responseTime: number }[],
            encounteredFlags: Set<string>,
        } {
            return this.$store.state.gameResult;
        },
        countries(): { [key: string]: string }[] {
            return this.$store.state.countries;
        },
        randomFlags(): string[] {
            return this.$store.state.randomFlags;
        },
        correctPercentage(): number {
            if (!this.result.history.length) return 0;
            console.log('result history', this.result.history);
            let correctCount = this.result.history.reduce((a, b) => a + (b.correct ? 1 : 0), 0);
            return correctCount / this.result.history.length;
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

.item-text, .item-text2 {
    position: absolute;
    bottom: 30px;
    width: 100%;
    text-align: center;
    color: white;
    font-weight: bolder;
    font-size: 14px;
    text-shadow: 0 0 15px black;
}

.item-text2 {
    bottom: 10px;
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
