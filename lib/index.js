
const { Config, State, ConfigError, ConfigKeyError  } = require('./config')

const VERSION = require('../package.json').version

module.exports = { Config, State, ConfigError, ConfigKeyError, VERSION  }
