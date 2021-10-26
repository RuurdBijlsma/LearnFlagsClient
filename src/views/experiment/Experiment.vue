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
                    v-if="!game.showFeedback"
                    ref="userInput"
                    @keypress.enter="answerFact"
                    outlined dense
                    hide-details
                    label="Answer"
                    placeholder="For example: 'Netherlands'"
                    v-model="game.userAnswer"/>
                <div v-else class="feedback">
                    <h4 v-if="game.userAnswer !== ''">You answered "{{ game.userAnswer }}"</h4>
                    <template v-if="game.correctAnswer && game.fact">
                        <v-icon size="100" color="success">mdi-check</v-icon>
                        <h2>Correct! The answer was "{{ game.fact.answer }}"</h2>
                    </template>
                    <template v-else-if="game.fact">
                        <v-icon size="100" color="error">mdi-alert-circle-outline</v-icon>
                        <h2>
                            <span v-if="game.userAnswer !== ''">Wrong! </span>
                            The answer was "{{ game.fact.answer }}"</h2>
                    </template>
                </div>
            </v-card-text>
            <v-card-actions>
                <v-spacer/>
                <v-btn rounded color="primary"
                       :loading="loading.answer"
                       v-if="!game.showFeedback"
                       @click="answerFact">
                    <span class="ml-4 mr-4" v-if="game.userAnswer !== ''">Submit answer</span>
                    <span class="ml-4 mr-4" v-else>I don't know</span>
                </v-btn>
                <v-btn v-else rounded color="primary"
                       :loading="loading.fact"
                       @click="nextFact">
                    <span class="ml-4 mr-4">Next fact</span>
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
                <v-progress-linear :value="100 - game.timeLeft / game.duration * 100"/>
                <div class="time-container mb-4">
                    <span>{{ toHms(game.timeLeft) }}</span>
                    <span>{{ toHms(game.duration) }}</span>
                </div>
                <p>{{ game.encounteredFlags.size }} / {{ $store.state.factCount }} flags encountered</p>
                <p>{{ Math.round(correctPercentage * 100) }}% correct</p>
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
import {EncounterResult, TestResult} from "@/ts/types";

export default Vue.extend({
    name: 'Game',
    components: {},
    data: () => ({
        loading: {
            fact: false,
            answer: false,
        },
        game: {
            startTime: 0,
            duration: 0,
            timeLeft: 1,
            fact: null as null | { fact_id: number, answer: string, question: string },
            userAnswer: '',
            factShownTimestamp: 0,
            correctAnswer: false,
            showFeedback: false,
            answerHistory: [] as EncounterResult[],
            encounteredFlags: new Set() as Set<string>,
        },
        timerInterval: -1,
    }),
    beforeDestroy() {
        clearInterval(this.timerInterval);
        document.removeEventListener('keypress', this.handleKey);
    },
    async mounted() {
        if (!this.connected)
            return await this.$router.push('/experiment');
        await this.newGame();
        document.addEventListener('keypress', this.handleKey, false);
    },
    methods: {
        handleKey(e: KeyboardEvent) {
            if (this.game.showFeedback && e.key === 'Enter') {
                this.nextFact();
            }
        },
        async newGame() {
            await this.$store.dispatch('resetModel', {
                subsetId: this.subsetId,
                enablePropagation: this.subsetId === this.$store.state.propagationSubsetId,
            });
            this.game.duration = this.sessionDuration * 60;
            this.game.timeLeft = this.game.duration;
            this.game.startTime = performance.now();
            await this.nextFact();
            this.timerInterval = setInterval(() => {
                let elapsed = (performance.now() - this.game.startTime) / 1000;
                this.game.timeLeft = this.game.duration - elapsed;
                if (this.game.timeLeft <= 0) {
                    this.game.timeLeft = 0;
                    this.stopGame();
                }
            }, 1000);
        },
        async stopGame() {
            clearInterval(this.timerInterval);
            let elapsed = (performance.now() - this.game.startTime) / 1000;
            let learnResult: TestResult = {
                duration: Math.min(this.game.duration, elapsed),
                history: this.game.answerHistory,
                encounteredFlags: this.game.encounteredFlags,
            };
            console.log('committing game result', learnResult);
            let modelStats = await this.$store.dispatch('getStats');
            console.log({modelStats});
            this.$store.commit('setModelStat', {subsetId: this.subsetId, modelStats})
            this.$store.commit('setLearnResult', {subsetId: this.subsetId, learnResult});
            await this.$router.push(`/experiment/test-intro/${this.subsetId}`)
        },
        async nextFact() {
            this.game.userAnswer = '';
            this.game.showFeedback = false;
            this.loading.fact = true;
            this.game.fact = await this.$store.dispatch('nextFact');
            this.game.encounteredFlags.add(this.game.fact?.question ?? 'Unknown');
            console.log({fact: this.game.fact});
            this.loading.fact = false;
            this.game.factShownTimestamp = performance.now();
            let userInput = this.$refs.userInput as any;
            userInput.focus();
        },
        async answerFact() {
            this.loading.answer = true;
            let responseTime = performance.now() - this.game.factShownTimestamp;
            let correct = await this.$store.dispatch('answerFact', {
                countryCode: this.game.fact?.question,
                answer: this.game.userAnswer,
                responseTime,
            }) as boolean;
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
            })
            this.game.correctAnswer = correct;
            this.game.showFeedback = true;
            this.loading.answer = false;

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
