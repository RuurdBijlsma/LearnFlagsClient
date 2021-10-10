<template>
    <div class="home" :style="{
        flexDirection: $vuetify.breakpoint.mobile ? 'column' : 'row',
        alignItems:  $vuetify.breakpoint.mobile ? 'stretch' : 'flex-start',
    }">
        <v-card elevation="2" class="left-card"
                :class="$vuetify.breakpoint.width > 1300 ? 'rounded-xl' : ''">
            <template v-if="game.started">
                <v-card-title>What flag is this?</v-card-title>
                <v-divider/>
                <v-sheet color="lightBackground" class="flag" v-if="game.fact">
                    <v-img contain :src="flagUrl(game.fact.fact_id)"/>
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
            </template>
            <template v-else>
                <v-card-title>Learn country flags!</v-card-title>
                <div class="flags">
                    <v-img :key="flag" v-for="flag in randomFlags" :aspect-ratio="3/2" :src="flag"/>
                </div>
                <v-card-actions>
                    <v-btn rounded color="primary"
                           :loading="loading.connection"
                           @click="newGame">
                        <span class="ml-4 mr-4">Start learning</span>
                    </v-btn>
                </v-card-actions>
            </template>
        </v-card>
        <v-card :style="{
            marginLeft: $vuetify.breakpoint.mobile ? '0' : '30px',
            width: $vuetify.breakpoint.mobile ? '100%' : '300px',
        }" elevation="2" class="right-card" v-if="game.started"
                :class="$vuetify.breakpoint.width > 1300 ? 'rounded-xl' : ''">
            <v-card-title>Session progress</v-card-title>
            <v-card-text>
                <v-progress-linear class="mb-4" :value="50"/>
                <p>{{ game.encounteredFlags.size }} / {{ flagList.length }} flags encountered</p>
                <p>{{ Math.round(correctPercentage * 100) }}% correct</p>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn rounded color="primary"
                       @click="stopGame">
                    <span class="ml-4 mr-4">Stop session</span>
                </v-btn>
            </v-card-actions>
        </v-card>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
    name: 'Home',
    components: {},
    data: () => ({
        loading: {
            connection: false,
            fact: false,
            answer: false,
        },
        countries: null as null | { [key: string]: string },
        game: {
            started: false,
            fact: null as null | { fact_id: string, answer: string, question: string },
            userAnswer: '',
            factShownTimestamp: 0,
            correctAnswer: false,
            showFeedback: false,
            answerHistory: [] as { correct: boolean, countryCode: string, userAnswer: string, responseTime: number }[],
            encounteredFlags: new Set(),
        },
        randomFlags: [] as string[],
    }),
    beforeDestroy() {
        document.removeEventListener('keypress', this.handleKey);
    },
    async mounted() {
        this.countries = await fetch('flags/countries.json').then(r => r.json());
        console.log(this.countries);
        let randomFlags = [] as string[];
        while (randomFlags.length < 3 * Math.min(1500, window.innerWidth) / 1000) {
            let url = this.randomFlagUrl();
            if (!randomFlags.includes(url))
                randomFlags.push(url)
        }
        this.randomFlags = randomFlags;
        console.log(randomFlags);
        document.addEventListener('keypress', this.handleKey, false);
    },
    methods: {
        handleKey(e: KeyboardEvent) {
            if (this.game.showFeedback && e.key === 'Enter') {
                this.nextFact();
            }
        },
        resetGame() {
            this.game = {
                started: false,
                fact: null,
                userAnswer: '',
                factShownTimestamp: 0,
                correctAnswer: false,
                showFeedback: false,
                answerHistory: [],
                encounteredFlags: new Set(),
            };
        },
        async newGame() {
            this.resetGame();
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
            this.game.started = true;
            await this.nextFact();
        },
        async stopGame() {
            this.resetGame();
        },
        async answerFact() {
            this.loading.answer = true;
            let responseTime = performance.now() - this.game.factShownTimestamp;
            let correct = await this.$store.dispatch('answerFact', {
                countryCode: this.game.fact?.fact_id,
                answer: this.game.userAnswer,
                responseTime,
            });
            this.game.answerHistory.push({
                countryCode: this.game.fact?.fact_id ?? '',
                correct,
                responseTime,
                userAnswer: this.game.userAnswer,
            });
            console.log("answered fact", {
                countryCode: this.game.fact?.fact_id,
                answer: this.game.userAnswer,
                responseTime,
                correct,
            })
            this.game.correctAnswer = correct;
            this.game.showFeedback = true;
            this.loading.answer = false;

        },
        async nextFact() {
            this.game.userAnswer = '';
            this.game.showFeedback = false;
            this.loading.fact = true;
            this.game.fact = await this.$store.dispatch('nextFact');
            this.game.encounteredFlags.add(this.game.fact?.fact_id);
            console.log({fact: this.game.fact});
            this.loading.fact = false;
            this.game.factShownTimestamp = performance.now();
            let userInput = this.$refs.userInput as any;
            userInput.focus();
        },
        flagUrl(countryCode: string) {
            return `flags/svg/${countryCode.toLowerCase()}.svg`
        },
        randomFlag() {
            return this.flagList[Math.floor(Math.random() * this.flagList.length)];
        },
        randomFlagUrl() {
            return this.flagUrl(this.randomFlag());
        },
    },
    computed: {
        connected() {
            return this.$store.state.connected;
        },
        flagList() {
            return Object.keys(this.countries ?? {});
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
    box-shadow: 0 5px 20px 0 rgba(0, 0, 0, 0.1) !important;
}

.flags {
    display: flex;
}

.flags > * {
    width: 10px;
}

.feedback {
    text-align: center;
}

.right-card {
    margin-left: 30px;
    width: 300px;
    box-shadow: 0 5px 20px 0 rgba(0, 0, 0, 0.1) !important;
}
</style>
