// # Config

// A place to store config

// Meant to be extended by your app

const debug = require('debug')('dply:config')
const process = require('process')
const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const {
  merge,
  defaultTo,
  get,
  set,
  unset,
  hasIn,
  isString,
  isArray,
  isNumber,
  isBoolean
 } = require('lodash')


// ## class ConfigError

class ConfigKeyError extends require('deployable-errors').KeyError {}
class ConfigError extends require('deployable-errors').ExtendedError {

  constructor( message, options = {} ){
    super(message, options)
    this.status = options.status || 500
  }

}


class State {
  constructor(){
    this._state = {}
  }
  get(key){
    return get(this._state, key)
  }
  set(key, value){
    return set(this._state, key, value)
  }
  get state(){
    return this._state
  }
}
// ## class Config

// `Config.singleton` - Get the default config instance
// `Config.createInstance(path, name)` - Create a named Config instance
// `Config.getInstance(name)` - Get a named Config instance

class Config {

  // Singleton might get messy if multiple apps share the same config install.
  // Works via npm `require` caching returning the same instance.
  //static get singleton () {
    //if ( ! this._instances ) this._instances = {}
    //if ( ! this._instances.default ) this._instances.default = new this('default')
    //return this._instances.default
  //}

  static newInstance ( name, ...args) {
    if ( ! this._instances ) this._instances = {}
    return this._instances[name] = new this(name, ...args)
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

  static clearInstances () {
    this._instances = undefined
  }

  // ### Environment

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

  static env(){
    return process.env.NODE_ENV || 'production'
  }

  // ### Instance

  constructor ( name, options = {} ) {

    debug('Creating new Config instance "%s" with', name, options)
    this.name = name
    this.debug = require('debug')(`dply:config:[${this.name}]`)

    // Main config store
    this.initConfig()

    // A label for this environment
    this.label = defaultTo(options.name, this.env())

    // A file to read from, normally the label
    this.file = defaultTo(options.file, `${this.label}.yml`)

    // The base path for the app
    // Default to looking abobe `node_modules/deployable-config/lib` which would normally
    // be right but might not, best to specify a `path`
    this.path = ( options.path )
      ? options.path
      : path.resolve(__dirname, '..', '..', '..', 'config')

    // A path, where you store config files
    // Defaults to looking above in a `config` dir in `base`.
    this.config_path = defaultTo( options.config_path, path.join(this.path, 'config'))

    // flag to track if a config has been loaded
    this.loaded = false

    // A validation function, for reading config
    this.validate = options.validate

    // A tranform function, for reading and writing config
    this.transform = options.transform

    // A logger, defaults to console
    this.logger = options.logger || console

    this.loadFiles()
    if ( options.package ) this.loadPackage()

    this.state = new State()
  }

  initConfig(){
    this.config = {}
    this.set('path.base', this.path)
    return this
  }

  loadPackage(){
    this.package = require(path.join(this.path, 'package.json'))
    this.set('app.version', this.package.version)
    this.set('app.description', this.package.description)
    this.set('package', this.package)
  }

  // Read a yaml `file` from `path`
  loadFile ( config_path, ...files ) {
    let file_path = path.join( config_path, ...files )
    let config = {}

    try {
      config = yaml.load( fs.readFileSync(file_path, 'utf8') )
      this.debug('loaded yaml from file', file_path)

    } catch (err) {
      this.logger.error(err)
      throw new ConfigError(`Can't load config for ${this.label} - ${file_path}`)
    }

    if ( config.path === null )
      throw new ConfigError('The `path` key must not be null')

    if ( isNumber(config.path) || isString(config.path)
       || isArray(config.path) || isBoolean(config.path) )
      throw new ConfigError('The `path` key must be a plain object')

    this.debug('loadFile read config', file_path, config)
    return config
  }

  mergeConfig ( new_config ) {
    merge(this.config, new_config)
  }

  loadFiles () {
    this.initConfig()
    //if ( fs.existsSync(path.join(this.config_path, 'default.json')) ) config = _.merge(config, this.loadFile(this.config_path, 'default.json') )
    if ( fs.existsSync(this.configPath('default.yml')) ) {
      this.mergeConfig(this.loadFile(this.config_path, 'default.yml'))
      this.loaded = true
    }

    if ( fs.existsSync(this.configPath('default.yaml')) ) {
      this.mergeConfig(this.loadFile(this.config_path, 'default.yaml'))
      this.loaded = true
    }

    if ( fs.existsSync(this.configPath(this.file)) ) {
      this.mergeConfig(this.loadFile(this.config_path, this.file))
      this.loaded = true
    }

    this.debug('loadFiles merged config', this.config_path, this.file, this.config)

    if ( ! this.loaded ) throw new ConfigError(`No files were loaded from ${this.config_path}`)
  }

  configPath(...files){
    return path.join(this.config_path, ...files)
  }

  fetch (key) {
    return get(this.config, key)
  }

  // Get a config key
  get (key) {
    this.debug('%s get - %s', this.label, key)
    if ( !hasIn(this._config, key) ) throw new ConfigKeyError('Unknown config key', { key: key, status: 404 })
    return get(this._config, key)
  }

  // Set a config key
  set (key, value) {
    this.debug('%s - set %s', this.label, key, value)
    return set(this._config, key, value)
  }

  delete (key) {
    this.debug('%s - delete %s', this.label, key)
    return unset(this._config, key)
  }

  setLocalPath(key, ...dirs) {
    if ( ! isString(key) ) throw new ConfigKeyError('Invalid key', { key: key, status: 404 })
    if ( key.length <= 0) throw new ConfigKeyError('Invalid key length', { key: key, status: 404 })
    this.set(`path.${key}`, path.join(this.get('path.base'), ...dirs))
  }

  // Return all config
  get config () {
    return this._config
  }
  set config (conf) {
    // Validation
    this._config = conf
  }

  get path(){
    return this._path
  }

  set path(arg){
    if ( !(arg instanceof Array) ) arg = Array(arg)
    debug('config_path', arg)
    this._path = path.resolve(...arg)
    this.set('path.base', this._path)
  }

  get config_path(){
    return this._config_path
  }

  set config_path( arg ){
    if ( !(arg instanceof Array) ) arg = Array(arg)
    debug('config_path', arg)
    this._config_path = path.resolve(...arg)
  }

  env() {
    return this.constructor.env()
  }

  productionLikeEnv() {
    return this.constructor.productionLikeEnv()
  }

  testEnv() {
    return this.constructor.testEnv()
  }

}

module.exports = { Config, State, ConfigError, ConfigKeyError }

