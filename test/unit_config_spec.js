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


  describe('Config class', function(){

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
