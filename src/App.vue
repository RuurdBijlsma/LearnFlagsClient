<template>
    <v-app :style="{background: $vuetify.theme.themes[theme].background}">
        <v-app-bar app color="primary" dark v-if="!$vuetify.breakpoint.mobile">
            <div class="app-bar-center">
                <v-app-bar-title class="app-bar-text">
                    Learning Flags
                </v-app-bar-title>
                <div class="links">
                    <v-btn plain to="/" exact>Home</v-btn>
                    <v-btn plain to="/experiment">Experiment</v-btn>
                    <v-btn plain to="/settings" exact>Settings</v-btn>
                </div>
            </div>
        </v-app-bar>
        <v-main>
            <router-view/>
        </v-main>

        <v-bottom-navigation app color="primary" v-if="$vuetify.breakpoint.mobile" shift grow>
            <v-btn to="/" exact :style="{height: 'inherit !important'}">
                <span>Home</span>
                <v-icon>mdi-home</v-icon>
            </v-btn>
            <v-btn to="/experiment" :style="{height: 'inherit !important'}">
                <span>Experiment</span>
                <v-icon>mdi-school</v-icon>
            </v-btn>
            <v-btn to="/settings" exact :style="{height: 'inherit !important'}">
                <span>Settings</span>
                <v-icon>mdi-cog</v-icon>
            </v-btn>
        </v-bottom-navigation>
    </v-app>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
    name: 'App',
    data: () => ({}),
    async mounted() {
        console.log(this.$store);
    },
    computed: {
        theme() {
            return (this.$vuetify.theme.dark) ? 'dark' : 'light'
        }
    },
});
</script>
<style>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap');

html, body {
    font-family: 'Montserrat', 'Roboto', sans-serif !important;
    background-color: skyblue;
    overflow-y: auto !important;
    overflow-x: hidden !important;
}

.v-application {
    font-family: 'Montserrat', 'Roboto', Arial, sans-serif !important;
}

.roboto {
    font-family: 'Roboto', Arial, sans-serif !important;
}

.app-bar-center {
    width: 100%;
    max-width: 1300px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.app-bar-text {
    width: 250px !important;
}

.v-app-bar-title__content {
    width: auto !important;
}


a[no-style] {
    text-decoration: none;
    color: inherit !important;
}

a[no-style]:hover {
    text-decoration: underline;
}

.links {
    display: flex;
    width: 100%;
    max-width: 320px;
    justify-content: space-between;
}
</style>
