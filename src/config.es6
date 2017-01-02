// # Config

// A place to store config

// Meant to be extended by your app

const debug = require('debug')('dply::config')
const process = require('process')
const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const _ = require('lodash')

class ConfigError extends require('deployable-errors').ExtendedError {}


// ## class Config

// `Config.instance` - Get the default config instance
// `Config.createInstance` - Create a named Config instance
// `Config.getInstance` - Get a named Config instance

module.exports = class Config {

  // Are we in a production like environment
  static productionLikeEnv() {
    switch(process.env.NODE_ENV){
      case 'production':
      case 'staging':
      case 'load':
      case 'testproduction':
        return true
      case 'development':
      case 'test':
      default: 
        return false
    }
  }

  static testEnv() {
    switch(process.env.NODE_ENV){
      case 'test':
      case 'testproduction':
        return true
      default: 
        return false
    }
  }
  
  // ### Instance

  constructor ( options = {} ) {

    // A label for this environment
    this.label = options.label || process.env.NODE_ENV ||  'production'

    // A File, normally just the label
    this.file = options.file || `${this.label}.yml`
  
    // A path, where you store config files
    this.path = options.path || path.resolve( path.join(__dirname, '..', 'config') )

    // A validation function, for reading config
    this.validate = options.validate

    // A tranform function, for reading and writing config
    this.transform = options.transform

    this.loadFile()

  }

  loadFile () {
    let file_path = path.join( this.path, this.file )
    let config = {}
    try {
      config = require( file_path )
      debug('required json from file',file_path)
    } catch (err) {
      try { 
        config = yaml.load( fs.readFileSync(file_path, 'utf8') )
        debug('loaded yaml from file',file_path)

      } catch (err) {
        logger.error(err)
        throw new ConfigError(`Can't load config - ${file_path}`)
      }
    }
    debug('read config', file_path, config)
    return this.config = config
  }

  // Get a config key
  get (key) {
    debug('get %s %s', this.label, key)
    return _.get(this._config, key)
  }

  // Set a config key
  set (key, value) {
    debug('set %s %s', this.label, key, value)
    return _.set(this._config, key)
  }

  get config () {
    return this._config
  }
  set config (conf) {
    // Validation
    this._config = conf
  }

  productionLikeEnv() {
    this.constructor.productionLikeEnv()
  }

  testEnv() {
    this.constructor.testEnv()
  }


}

module.exports.ConfigError = ConfigError
