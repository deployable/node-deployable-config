const debug = require('debug')('dply:test:unit:config')
const path = require('path')
const Config = require('../lib/config')


describe('Unit::Config', function () {

  describe('Error', function () {

    let err = null
    beforeEach(function(){
      err = new Config.ConfigError('some error')
    })

    it('should create an instance of Error', function(){
      expect( err ).to.be.a.instanceOf( Config.ConfigError )
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

  })

  describe('Config class instance', function(){

    let cfg = null
    let cfg_path = path.join(__dirname, 'fixture')

    before(function(){
      cfg = new Config({path: cfg_path})
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

  })


})
