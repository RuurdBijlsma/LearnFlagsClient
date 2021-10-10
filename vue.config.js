module.exports = {
    transpileDependencies: [
        'vuetify'
    ],
    publicPath: '/learning-flags',
    pwa: {
        name: 'Learning Flags',
        themeColor: '#1fa767',
        msTileColor: "#c9e4ef",
        manifestOptions: {
            "short_name": "Flags!",
            "name": "Learning Flags!",
            "lang": "en",
            "description": "Learn country flags.",
            "start_url": "./",
            "theme_color": "#1fa767",
            "background_color": "#c9e4ef",
            "dir": "ltr",
            "display": "standalone",
        },
    },
}
