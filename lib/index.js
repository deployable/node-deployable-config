
const { Config, State, ConfigError, ConfigKeyError} = require('./config')

module.exports = function deployableConfig(name, options){
  return Config.fetchInstance(name, options)
}

// Exports the rest on the function
module.exports.Config = Config
module.exports.State = State
module.exports.ConfigError = ConfigError
module.exports.ConfigKeyError = ConfigKeyError
