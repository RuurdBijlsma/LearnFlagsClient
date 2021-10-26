<template>
    <div class="home" :style="{
        alignItems:  $vuetify.breakpoint.mobile ? 'stretch' : 'flex-start',
    }">
        <v-card elevation="2" class="left-card mb-3"
                :class="$vuetify.breakpoint.width > 1300 ? 'rounded-xl' : ''">
            <v-card-title>Learn phase</v-card-title>
            <div class="flags">
                <v-img :key="flag" v-for="flag in randomFlags" :aspect-ratio="3/2" :src="flag"/>
            </div>
            <v-card-text>
                <p>You will now start learning a set of flags for 10 minutes.</p>
            </v-card-text>
            <v-card-actions>
                <v-btn rounded color="primary" :to="`/experiment/learn/${subsetId}`">
                    <span class="ml-4 mr-4">Start learning</span>
                </v-btn>
            </v-card-actions>
        </v-card>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
    name: 'ExperimentLearnIntro',
    data: () => ({
    }),
    async mounted() {
        if (!this.connected)
            return await this.$router.push('/experiment');
    },
    computed: {
        connected() {
            return this.$store.state.connected;
        },
        randomFlags() {
            return this.$store.state.randomFlags;
        },
        subsetId(): number {
            return +this.$route.params.subsetId;
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
