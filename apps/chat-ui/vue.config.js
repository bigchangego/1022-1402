const { defineConfig } = require('@vue/cli-service')
process.env.VUE_APP_FUNCTIONCAT_SYSTEM_URL = process.env.FUNCTIONCAT_SYSTEM_URL || 'http://localhost:50001'
module.exports = defineConfig({
  transpileDependencies: true
})
