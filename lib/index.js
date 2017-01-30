
const { Config, State, ConfigError, ConfigKeyError  } = require('./config')

// Export a function for quick setup
//     const config = require('deployable-config')('id', { package: true })

module.exports = function(name, opts){
  return Config.fetchInstance(name, opts)
}

// And export all the things on the function
module.exports.Config = Config
module.exports.State = State
module.exports.ConfigError = ConfigError
module.exports.ConfigKeyError = ConfigKeyError
module.exports.VERSION = require('../package.json').version
