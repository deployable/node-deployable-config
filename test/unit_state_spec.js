const debug = require('debug')('dply:test:unit:config')
const path = require('path')
const State = require('../lib/config').State


describe('Unit::State', function () {


  describe('State class instance', function(){

    let state = null

    before(function(){
      state = new State()
    })

    it('should create an instance', function(){
      expect( state ).to.be.a.instanceOf( State )
    })

    it('should set a value', function(){
      expect( state.set('a','b') ).to.eql({a: 'b'})
    })

    it('should get a value', function(){
      state.set('a', 'b')
      expect( state.get('a') ).to.equal('b')
    })

  })

  

})
