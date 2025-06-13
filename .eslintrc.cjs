module.exports = {
    root: true,
    extends: ['@nuxtjs/eslint-config-typescript', 'plugin:prettier/recommended'],
    rules: {
        'vue/multi-word-component-names': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
    },
}
