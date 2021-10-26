<template>
    <v-card class="settings rounded-xl" elevation="2">
        <v-card-title>Settings</v-card-title>
        <v-text-field v-model="socketUrl"
                      class="mt-4"
                      label="Server URL"
                      outlined hide-details/>
    </v-card>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
    name: 'Settings',
    data: () => ({}),
    async mounted() {
    },
    computed: {
        socketUrl: {
            get(): string {
                return this.$store.state.url;
            },
            set(v: string) {
                this.$store.commit('socketUrl', v);
            },
        },
    },
});
</script>
<style scoped>
.settings {
    display: block;
    padding: 20px;
    max-width: 1300px;
    margin: 20px auto 0;
}
</style>

