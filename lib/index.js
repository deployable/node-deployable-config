'use strict';

const Config = require('./config');

module.exports = {
  Config: Config,
  State: Config.State,
  ConfigError: Config.ConfigError,
  ConfigKeyError: Config.ConfigKeyError
}

