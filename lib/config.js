// # Config

// A place to store config

// Meant to be extended by your app

const debug = require('debug')('dply::config')
const process = require('process')
const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const _ = require('lodash')


// ## class ConfigError

class ConfigError extends require('deployable-errors').ExtendedError {

  constructor( message, options = {} ){
    super(message, options)
    this.status = options.status || 500
  }

}


// ## class Config

// `Config.singleton` - Get the default config instance
// `Config.createInstance(path, name)` - Create a named Config instance
// `Config.getInstance(name)` - Get a named Config instance

module.exports = class Config {

  // Singleton might get messy if multiple apps share the same config install. 
  // Works via npm `require` caching returning the same instance.
  static get singleton () {
    if ( ! this._instances ) this._instances = {}
    if ( ! this._instances.default ) this._instances.default = new this()
    return this._instances.default
  }

  static newInstance ( name, ...args) {
    if ( ! this._instances ) this._instances = {}
    return this._instances[name] = new this(...args)
  }

  static createInstance ( name, ...args ) {
    if ( this._instances && this._instances[name] ) throw new ConfigError(`Config already exists [${name}]`)
    return this.newInstance( name, ...args )
  }

  static getInstance ( name ) {
    if ( ! this._instances ) this._instances = {}
    return this._instances[name]
  }

  // Get existing or create instance
  static fetchInstance ( name, ...args ) {
    let instance = this.getInstance(name)
    if ( ! instance ) instance = this.createInstance( name, ...args )
    return instance
  }

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
    
    debug('Creating new Config instance with', options)

    // A label for this environment
    this.label = options.label || process.env.NODE_ENV ||  'production'

    // A file to read from, normally the label
    this.file = options.file || `${this.label}.yml`
  
    // A path, where you store config files
    // Defaults to looking above in `config` above `node_modules/deployable-config`. The default 
    // won't always work if the module is shared between multiple npm apps in different locations
    this.path = options.path || path.resolve( path.join(__dirname, '..', '..', 'config') )

    // A validation function, for reading config
    this.validate = options.validate

    // A tranform function, for reading and writing config
    this.transform = options.transform
  
    // A logger, defaults to console
    this.logger = options.logger || console

    this.loadFile()

  }

  // Read a yaml `file` from `path`
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
        this.logger.error(err)
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

  // Return all config
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

