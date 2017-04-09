import buble from 'rollup-plugin-buble'

export default {
    entry: './src/main.js',
    dest: './dist/vue-sortable.js',
    format: 'umd',
    moduleName: 'vue-sortable',
    plugins: [
        buble()
    ]
}
