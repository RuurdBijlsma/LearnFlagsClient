<template>
    <div class="home" :style="{
        alignItems:  $vuetify.breakpoint.mobile ? 'stretch' : 'flex-start',
    }">
        <v-card elevation="2" class="left-card"
                :class="$vuetify.breakpoint.width > 1300 ? 'rounded-xl' : ''">
            <v-card-title>Session results</v-card-title>
            <div class="flags">
                <v-img :key="flag" v-for="flag in randomFlags" :aspect-ratio="3/2" :src="flag"/>
            </div>
            <v-card-text class="results">
                <h3>Answer accuracy over time</h3>
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
                    auto-draw
                ></v-sparkline>
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
    }),
    async mounted() {
        await this.$store.dispatch('initRandomFlags');
        console.log(this.result);
        if (!this.result) {
            console.warn("No known game result, redirecting to homepage");
            return await this.$router.push('/');
        }
    },
    methods: {},
    computed: {
        accuracyHistory(): number[] {
            return this.result?.history.map((h: any) => h.accuracy) ?? [];
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
</style>
