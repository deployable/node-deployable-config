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

const { KeyError, ExtendedError } = require('deployable-errors')

// ## class ConfigError

class ConfigKeyError extends KeyError {}
class ConfigError extends ExtendedError {

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
      case 'test':
      case 'development':
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

    // A file to read from, defaults to using {label}.ext (yml, yaml or json)
    this.file = options.file

    // The base path for the app
    // Default to looking above `node_modules/deployable-config/lib` which would normally
    // be right but might not, best to specify a `path`
    this.path = ( options.path )
      ? options.path
      : path.resolve(__dirname, '..', '..', '..', 'config')

    // A path, where you store config files
    // Defaults to looking in a `config` dir in the base `path`.
    this.config_path = options.config_path || path.join(this.path, 'config')

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

  // Initialise the config
  initConfig(){
    this.config = {}
    this.set('path.base', this.path)
    return this
  }

  // Load info from package.json
  loadPackage(){
    this.package = require(path.join(this.path, 'package.json'))
    this.set('app.version', this.package.version)
    this.set('app.description', this.package.description)
    this.set('package', this.package)
    return this
  }

  // Read a config file in, either json or default to yaml
  readFile ( file_path, label = '' ) {
    let config = {}

    try {
      let data = fs.readFileSync(file_path, 'utf8')
      let extension = path.extname(file_path)
      if ( extension === '.json' ) {
        debug('readFile reading json file', file_path)
        config = JSON.parse( data )
      } else {
        debug('readFile reading yaml file', file_path)
        config = yaml.load( data )
      }
      this.debug('readFile loaded yaml from file', file_path)

    } catch (err) {
      this.logger.error(err)
      throw new ConfigError(`Can't load config ${label} - ${file_path}`)
    }

    this.debug('readFile got config', file_path, config)
    return config
  }

  // Load a single file into `this`
  loadFile( file_path, options = {} ){
    if ( ! fs.existsSync(file_path) ) {
      if (options.fail) throw new ConfigError(`Load failed. File doesn't exist: ${file_path}`)
      else return false
    }
    let config = this.readFile(file_path, this.label)

    if ( config.path === null )
      throw new ConfigError('Load failed. The `path` key must not be null')

    if ( isNumber(config.path) || isString(config.path)
       || isArray(config.path) || isBoolean(config.path) )
      throw new ConfigError('Load failed. The `path` key must be a plain object')

    this.mergeConfig( config )
    this.loaded = true

    return true
  }

  // Load all the file known types for a file prefix
  loadFileTypesForPrefix( file_path_prefix, options = {} ){
    let json = this.loadFile(`${file_path_prefix}.json`, options)
    let yml = this.loadFile(`${file_path_prefix}.yml`, options)
    let yaml = this.loadFile(`${file_path_prefix}.yaml`, options)
    return json || yml || yaml
  }

  // Load a config directory of files
  loadFiles () {
    this.initConfig()
    this.loadFileTypesForPrefix(this.configPath('default'))

    if ( this.file ) {
      // User set a specific file
      this.loadFile(this.configPath(this.file))
      this.debug('loadFiles merged config', this.config_path, this.file, this.config)
    } else {
      // Load the all file types for the label
      this.loadFileTypesForPrefix(this.configPath(this.label))
      this.debug('loadFiles merged config', this.config_path, this.label, this.config)
    }

    if ( ! this.loaded ) throw new ConfigError(`No files were loaded from ${this.config_path}`)
  }

  // Merge a new config blob into `this`
  mergeConfig ( new_config ) {
    return merge(this.config, new_config)
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

  // Delete a config key
  delete (key) {
    this.debug('%s - delete %s', this.label, key)
    return unset(this._config, key)
  }

  // Set a `path.x` value from `path.base`
  setLocalPath(key, ...dirs) {
    if ( ! isString(key) ) throw new ConfigKeyError('Invalid key', { key: key, status: 404 })
    if ( key.length <= 0) throw new ConfigKeyError('Invalid key length', { key: key, status: 404 })
    return this.set(`path.${key}`, path.join(this.get('path.base'), ...dirs))
  }

  // Return all config
  get config () {
    return this._config
  }
  set config (conf) {
    // Validation?
    this._config = conf
  }


  get path(){
    return this._path
  }

  // Sets the config `base.path` as well
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

