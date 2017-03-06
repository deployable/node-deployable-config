/* global expect */
const debug = require('debug')('dply:test:unit:config:config')
const path = require('path')
const { Config, ConfigError, ConfigKeyError } = require('../lib/config')


describe('Unit::Config', function () {


  describe('Error:', function () {

    let err = null

    beforeEach(function(){
      err = new ConfigError('some error')
    })

    it('should create an instance of Error', function(){
      expect( err ).to.be.a.instanceOf( ConfigError )
    })

    it('should have the right error message', function(){
      expect( err.message ).to.equal( 'some error' )
    })

    it('should have default status code of 500', function(){
      expect( err.status ).to.equal( 500 )
    })

  })


  describe('class statics:', function(){

    let path_fixture = path.join(__dirname, 'fixture')

    it('should create a new instance', function(){
      Config.newInstance('default', { path: path_fixture })
    })

    it('should create an instance', function(){
      Config.createInstance('createInstance', { path: path_fixture })
    })

    it('should note create an existing instance', function(){
      let fn = () => Config.createInstance('createInstance', { path: path_fixture })
      expect( fn ).to.throw('Config already exists')
    })

    it('should fetch and create a new instance', function(){
      Config.fetchInstance('notdefault', { path: path_fixture })
    })

    it('should fetch an existing instance', function(){
      let config = Config.fetchInstance('notdefault', { path: 'bad_path' })
      expect( config ).to.have.property('path')
      expect( config.path ).to.equal( path_fixture )
    })

    it('should get the singleton `default` instance', function(){
      Config.singleton
    })


    describe('A fresh class instance', function(){

      beforeEach('clear instances', function(){
        Config.clearInstances()
      })

      it('should populates an instance via get', function(){
        Config.getInstance()
        expect( Config._instances ).to.eql( {} )
      })

      xit('should populate an instance via singleton', function(){
        let fn = () => Config.singleton
        expect( fn ).to.throw
        expect( Config._instances ).to.eql( {} )
      })

    })

  })


  describe('A class instance', function(){

    let cfg = null
    let cfg_path = path.join(__dirname, 'fixture')

    before(function(){
      cfg = new Config('fixture', {path: cfg_path})
    })

    it('should create an instance of Config', function(){
      expect( cfg ).to.be.a.instanceOf( Config )
    })

    it('should have a label of test', function(){
      expect( cfg.label ).to.equal( 'test' )
    })

    it('should have a default file of test.yml', function(){
      expect( cfg.file ).to.be.undefined
    })

    it('should have a default path of ../config', function(){
      //expect( cfg.path ).to.equal( path.resolve(path.join(__dirname,'..','config')) )
      expect( cfg.path ).to.equal( path.resolve(__dirname, 'fixture') )
    })

    xit('should have a config ../config', function(){
      expect( cfg.path ).to.equal( path.resolve(__dirname, '..', 'config') )
    })

    it('should get the test_key from fixture file', function(){
      expect( cfg.get('test_key') ).to.equal( 'value' )
    })

    it('should fail to get an unknown key', function(){
      let fn = () => cfg.get('key-no')
      expect( fn ).to.throw( ConfigKeyError, /Unknown config key/ )
    })

    it('should fetch the test_key from fixture file', function(){
      expect( cfg.fetch('test_key') ).to.equal( 'value' )
    })

    it('should fetch an unkown key', function(){
      expect( cfg.fetch('key-no') ).to.be.undefined
    })

    it('should have be able get to nested keys from file', function(){
      expect( cfg.get('nested_key.one') ).to.equal( 1 )
      expect( cfg.get('nested_key.two') ).to.equal( 2 )
    })

    it('should set a nested key `nested_key.three`', function(){
      expect( cfg.set('nested_key.three', 3) ).to.be.ok
      expect( cfg.get('nested_key.three') ).to.equal( 3 )
    })

    it('should delete a key `whatever`', function(){
      expect( cfg.set('whatever', 3) ).to.be.ok
      expect( cfg.get('whatever') ).to.equal( 3 )
      expect( cfg.delete('whatever') ).to.be.ok
      let fn = () => cfg.get('whatever')
      expect( fn ).to.throw(/Unknown config key - whatever/)
    })

    it('should delete a nested key `whatever`', function(){
      expect( cfg.set('whatever.four', 3) ).to.be.ok
      expect( cfg.get('whatever.four') ).to.equal( 3 )
      expect( cfg.delete('whatever.four') ).to.be.ok
      let fn = () => cfg.get('whatever.four')
      expect( fn ).to.throw(/Unknown config key - whatever.four/)
    })

    it('should set a local path value', function(){
      expect( cfg.setLocalPath('pathtest1', 'one') ).to.be.ok
      expect( cfg.get('path.pathtest1') ).to.match(/fixture\/one$/)
    })

    it('should set a local path with multiple directories', function(){
      expect( cfg.setLocalPath('pathtest2', 'one', 'two') ).to.be.ok
      expect( cfg.get('path.pathtest2') ).to.match(/fixture\/one\/two$/)
    })

    it('should not set an emtpy local path', function(){
      let fn = () => cfg.setLocalPath('')
      expect( fn ).to.throw(/Invalid key length/)
    })

    it('should not set an undefined local path', function(){
      let fn = () => cfg.setLocalPath()
      expect( fn ).to.throw(/Invalid key/)
    })

    it('should get the entire config blob', function(){
      expect( cfg.config ).to.be.ok
      expect( cfg.config ).to.be.an('object')
    })


    describe('environment', function(){

      let original_env = null

      before(function(){
        original_env = process.env.NODE_ENV
      })

      after(function(){
        process.env.NODE_ENV = original_env
      })

      it('production should be a prod like env', function(){
        process.env.NODE_ENV = 'production'
        expect( cfg.productionLikeEnv() ).to.be.true
      })

      it('development should not be a prod like env', function(){
        process.env.NODE_ENV = 'development'
        expect( cfg.productionLikeEnv() ).to.be.false
      })

      it('test should be a test env', function(){
        process.env.NODE_ENV = 'test'
        expect( cfg.testEnv() ).to.be.true
      })

      it('dev should not be a test env', function(){
        process.env.NODE_ENV = 'development'
        expect( cfg.testEnv() ).to.be.false
      })

      it('should return the env test', function(){
        expect( cfg.env() ).to.equal( process.env.NODE_ENV )
      })

    })


    describe('default config', function(){

      describe('with a default file', function(){

        let path_fixture = path.join(__dirname, 'fixture', 'withdefault')

        it('loads the default config', function(){
          let cfg = new Config('withdefault', { config_path: path_fixture })
          expect( cfg.get('default') ).to.be.true
        })

        it('merges the default and test config', function(){
          let cfg = new Config('withdefault', { config_path: path_fixture })
          expect( cfg.get('default') ).to.be.true
          expect( cfg.get('test') ).to.be.true
        })

      })

      describe('without a default file', function(){

        let path_fixture = path.join(__dirname, 'fixture', 'withoutdefault')

        it('should load', function(){
          let cfg = new Config('withdefault', { config_path: path_fixture })
          expect( cfg.get('test') ).to.be.true
        })
      })

      describe('with a json default file', function(){

        let path_fixture = path.join(__dirname, 'fixture', 'withjsondefault')

        it('should load', function(){
          let cfg = new Config('withjsondefault', { config_path: path_fixture })
          expect( cfg.get('mine') ).to.equal( 1 )
        })
      })

      describe('with an {environment}.json file', function(){

        let path_fixture = path.join(__dirname, 'fixture', 'withjsontest')

        it('should load and overide', function(){
          let cfg = new Config('withjsontest', { config_path: path_fixture })
          expect( cfg.get('minetest') ).to.equal( 1 )
          expect( cfg.get('minedefault') ).to.equal( 1 )
        })
      })

      describe('without a default.json file', function(){

        let path_fixture = path.join(__dirname, 'fixture', 'withjsonnodefault')

        it('should load the environment file', function(){
          let cfg = new Config('withjsonnodefault', { config_path: path_fixture })
          expect( cfg.get('minetest') ).to.equal( 1 )
          expect( ()=>cfg.get('minedefault') ).to.throw(/Unknown config key/)
        })
      })

      describe('without any files', function(){

        let path_fixture = path.join(__dirname, 'fixture', 'withnothing')

        it('should throw', function(){
          let fn = () => new Config('withnothing', { config_path: path_fixture })
          expect( fn ).to.throw( ConfigError, /No files were loaded from/ )
        })
      })

    })

    describe('with a default file containing a bad path', function(){

      let path_fixture = path.join(__dirname, 'fixture', 'withbadpath')

      it('should load', function(){
        let fn = () => new Config('withbadpath', { config_path: path_fixture })
        expect( fn ).to.throw(/key must not be null/)
      })

    })

    describe('Bad Config file', function(){

      it('throws when no files are available', function(){
        let fn = () => new Config('throws')
        expect( fn ).to.throw(/No files were loaded/)
      })

      it('throws when path is a string', function(){
        let path_fixture = path.join(__dirname, 'fixture', 'withstringpath')
        let fn = () => new Config('badstringpath', { config_path: path_fixture })
        expect( fn ).to.throw(/The `path` key must be a plain object/)
      })

      it('throws when yaml is badly formatted', function(){
        let path_fixture = path.join(__dirname, 'fixture', 'witherror')
        let fn = () => new Config('badformat', { config_path: path_fixture })
        expect( fn ).to.throw(/Can't load config/)
      })

      it('throws when loading a file that\'s missing', function(){
        let path_fixture = path.join(__dirname, 'fixture', 'withoutdefault')
        let cfg = new Config('nothere', { config_path: path_fixture })
        let fn = () => cfg.loadFile('not/here', {fail: true})
        expect( fn ).to.throw(/Load failed. File doesn't exist:/)
      })

    })

    describe('Package info', function(){
      it('should load package from constructor', function(){
        let path_fixture = path.join(__dirname, 'fixture')
        let cfg = new Config('', { package: true , path: path_fixture })
        expect( cfg.get('app.version') ).to.equal( '0.1.0' )
        expect( cfg.get('app.description') ).to.equal( 'yee' )
        expect( cfg.get('package.dependencies') ).to.be.ok
        expect( cfg.get('path.base') ).to.be.ok
      })
    })

  })



})
