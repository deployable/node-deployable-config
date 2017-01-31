/* global expect */
//const debug = require('debug')('dply:test:unit:config')
const path = require('path')
const {Config, ConfigError, ConfigKeyError } = require('../')


describe('Unit::Config', function () {


  describe('Error', function () {

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


  describe('Config class statics', function(){

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


    describe('fresh class instance', function(){

      beforeEach(function(){
        Config.clearInstances()
      })

      it('populates instance via get', function(){
        Config.getInstance()
        expect( Config._instances ).to.eql( {} )
      })

      xit('populates instance via singleton', function(){
        let fn = () => Config.singleton
        expect( fn ).to.throw
        expect( Config._instances ).to.eql( {} )
      })

    })

  })


  describe('Config class instance', function(){

    let cfg = null
    let cfg_path = path.join(__dirname, 'fixture')

    before(function(){
      cfg = new Config('fixture', {path: cfg_path})
    })

    it('should create an instance', function(){
      expect( cfg ).to.be.a.instanceOf( Config )
    })

    it('should have the test label', function(){
      expect( cfg.label ).to.equal( 'test' )
    })

    it('should have a default file of test.yml', function(){
      expect( cfg.file ).to.equal( 'test.yml' )
    })

    it('should have a default path of ../config', function(){
      //expect( cfg.path ).to.equal( path.resolve(path.join(__dirname,'..','config')) )
      expect( cfg.path ).to.equal( path.resolve(__dirname, 'fixture') )
    })

    xit('should have a config ../config', function(){
      expect( cfg.path ).to.equal( path.resolve(__dirname, '..', 'config') )
    })

    it('should get the test key', function(){
      expect( cfg.get('key') ).to.equal( 'value' )
    })

    it('should fail to get an unknown key', function(){
      let fn = () => cfg.get('key-no')
      expect( fn ).to.throw( ConfigKeyError, /Unknown config key/ )
    })

    it('should fetch the test key', function(){
      expect( cfg.fetch('key') ).to.equal( 'value' )
    })

    it('should fetch an unkown ', function(){
      expect( cfg.fetch('key-no') ).to.be.undefined
    })

    it('should have a nested key', function(){
      expect( cfg.get('nested_key.one') ).to.equal( 1 )
      expect( cfg.get('nested_key.two') ).to.equal( 2 )
    })

    it('should set a key `nested_key.three`', function(){
      expect( cfg.set('nested_key.three', 3) ).to.be.ok
      expect( cfg.get('nested_key.three') ).to.equal( 3 )
    })

    it('should get the config blob', function(){
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


    describe('Default Config files', function(){

      describe('with a default file', function(){

        let path_fixture = path.join(__dirname, 'fixture', 'withdefault')

        it('loads the default config', function(){
          let cfg = new Config('withdefault', { path: path_fixture })
          expect( cfg.get('default') ).to.be.true
        })

        it('merges the default and test config', function(){
          let cfg = new Config('withdefault', { path: path_fixture })
          expect( cfg.get('default') ).to.be.true
          expect( cfg.get('test') ).to.be.true
        })

      })

      describe('without a default file', function(){

        let path_fixture = path.join(__dirname, 'fixture', 'withoutdefault')

        it('should load', function(){
          let cfg = new Config('withdefault', { path: path_fixture })
          expect( cfg.get('test') ).to.be.true
        })

      })

      describe('without any files', function(){

        let path_fixture = path.join(__dirname, 'fixture', 'withnothing')

        it('should throw', function(){
          let fn = () => new Config('withnothing', { path: path_fixture })
          expect( fn ).to.throw( ConfigError, /No files were loaded from/ )
        })

      })

    })


    describe('Bad Config file', function(){

      it('throws', function(){
        let fn = () => new Config('throws', { path: cfg_path, label: 'bad' })
        expect( fn ).to.throw(/Can't load config/)
      })

    })

    describe('Package info', function(){
      it('should load package from constructor', function(){
        let path_fixture = path.join(__dirname, 'fixture')
        let cfg = new Config('', { package: { test: true }, path: path_fixture })
        expect( cfg.get('package.test') ).to.be.true
      })
    })

  })



})
