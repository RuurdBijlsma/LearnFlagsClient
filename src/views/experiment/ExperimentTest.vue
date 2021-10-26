<template>
    <div class="home" :style="{
        flexDirection: $vuetify.breakpoint.mobile ? 'column' : 'row',
        alignItems:  $vuetify.breakpoint.mobile ? 'stretch' : 'flex-start',
    }">
        <v-card elevation="2" class="left-card"
                :class="$vuetify.breakpoint.width > 1300 ? 'rounded-xl' : ''">
            <v-card-title>What flag is this?</v-card-title>
            <v-divider/>
            <v-sheet color="lightBackground" class="flag" v-if="game.fact">
                <v-img contain :src="$store.getters.flagUrl(game.fact.question)"/>
            </v-sheet>
            <v-divider/>
            <v-card-text>
                <v-text-field
                    ref="userInput"
                    @keypress.enter="answerFact"
                    outlined dense
                    hide-details
                    label="Answer"
                    placeholder="For example: 'Netherlands'"
                    v-model="game.userAnswer"/>
            </v-card-text>
            <v-card-actions>
                <v-spacer/>
                <v-btn rounded color="primary"
                       @click="answerFact">
                    <span class="ml-4 mr-4" v-if="game.userAnswer !== ''">Submit answer</span>
                    <span class="ml-4 mr-4" v-else>I don't know</span>
                </v-btn>
            </v-card-actions>
        </v-card>
        <v-card :style="{
            marginLeft: $vuetify.breakpoint.mobile ? '0' : '30px',
            width: $vuetify.breakpoint.mobile ? '100%' : '300px',
        }" elevation="2" class="right-card"
                :class="$vuetify.breakpoint.width > 1300 ? 'rounded-xl' : ''">
            <v-card-title>Session progress</v-card-title>
            <v-card-text>
                <p>{{ factIndex }} / {{ $store.state.factCount }} flags encountered</p>
            </v-card-text>
            <v-card-actions>
                <v-btn @click="stopGame"></v-btn>
            </v-card-actions>
        </v-card>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import {secondsToHms} from "@/ts/utils";
//@ts-ignore
import levenshtein from 'fast-levenshtein';
//@ts-ignore
import unidecode from 'unidecode';

export default Vue.extend({
    name: 'Game',
    components: {},
    data: () => ({
        flagList: [
            {question: 'DE', answer: 'Germany'},
            {question: 'NL', answer: 'Netherlands'},
            {question: 'HU', answer: 'Hungary'},
        ],
        factIndex: -1,
        game: {
            startTime: 0,
            userAnswer: '',
            fact: null as null | { question: string, answer: string },
            factShownTimestamp: 0,
            answerHistory: [] as {
                rollingAccuracy: number, accuracy: number, correct: boolean,
                countryCode: string, userAnswer: string, responseTime: number
            }[],
        },
    }),
    async mounted() {
        if (!this.connected)
            return await this.$router.push('/experiment');

        console.log(levenshtein.get('kazahkstan', 'kazakhstan'), 'editstiance')
        this.newGame();
    },
    methods: {
        newGame() {
            this.game.startTime = performance.now();
            this.nextFact();
        },
        async stopGame() {
            let elapsed = (performance.now() - this.game.startTime) / 1000;
            let experimentResult = {
                duration: elapsed,
                history: this.game.answerHistory,
            };
            console.log('committing game result', experimentResult);
            if (this.subsetId === 0) this.$store.commit('experimentResults', []);
            this.$store.commit('addExperimentResult', experimentResult);
            if (this.subsetId === 0) {
                await this.$router.push(`/experiment/learn-intro/1`)
            } else if (this.subsetId === 1) {
                await this.$router.push('/experiment/result');
            }
        },
        nextFact() {
            this.game.userAnswer = '';
            this.game.fact = this.flagList[++this.factIndex];
            console.log({fact: this.game.fact});
            this.game.factShownTimestamp = performance.now();
            let userInput = this.$refs.userInput as any;
            userInput.focus();
        },
        async answerFact() {
            const cleanAnswer = (v: string) => unidecode(v.replaceAll('.', '').toLowerCase());
            let correctAnswer = this.game.fact?.answer ?? '';
            let allowedMistakes = Math.floor(correctAnswer.length / 7)
            let correct = levenshtein.get(
                cleanAnswer(correctAnswer),
                cleanAnswer(this.game.userAnswer)
            ) <= allowedMistakes;
            let responseTime = performance.now() - this.game.factShownTimestamp;
            // calculate correct percentage including this last fact
            let correctHistory = [...this.game.answerHistory.map(a => a.correct), correct];
            let correctCount = correctHistory.reduce((a, b) => a + (b ? 1 : 0), 0) as number;
            let correctPercentage = correctCount / correctHistory.length;
            let rollSize = 5;
            let slicedHistory = correctHistory.slice(-rollSize);
            let rollCorrectCount = slicedHistory.reduce((a, b) => a + (b ? 1 : 0), 0) as number;
            let rollingAccuracy = rollCorrectCount / slicedHistory.length;
            // add to history
            this.game.answerHistory.push({
                rollingAccuracy,
                accuracy: correctPercentage,
                countryCode: this.game.fact?.question ?? '',
                correct,
                responseTime,
                userAnswer: this.game.userAnswer,
            });
            console.log("answered fact", {
                countryCode: this.game.fact?.question,
                answer: this.game.userAnswer,
                responseTime,
                correct,
            });
            if (this.factIndex === this.flagList.length - 1) {
                // last flag is answered
                await this.stopGame();
            } else {
                this.nextFact();
            }
        },
        toHms(s: number) {
            return secondsToHms(s);
        },
    },
    computed: {
        subsetId(): number {
            return +this.$route.params.subsetId;
        },
        countries(): { [key: string]: string }[] {
            return this.$store.state.countries;
        },
        sessionDuration() {
            return this.$store.state.sessionDuration;
        },
        connected() {
            return this.$store.state.connected;
        },
        correctPercentage() {
            if (this.game.answerHistory.length === 0) return 1;
            let correctCount = this.game.answerHistory.reduce((a, b) => a + (b.correct ? 1 : 0), 0);
            return correctCount / this.game.answerHistory.length;
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

.flag > * {
    max-height: 300px;
    box-shadow: inset 0 0 50px rgba(0, 0, 0, 0.1);
}

.left-card {
    flex-grow: 1;
}

.feedback {
    text-align: center;
}

.right-card {
    margin-left: 30px;
    width: 300px;
}

.time-container {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    font-weight: bolder;
}
</style>
