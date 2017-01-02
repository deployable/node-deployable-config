
describe('Unit::deployable-config::module', function(){

  describe('deployable-config should load', function(){
  
    let {Config} = require('../')

    it('should do load module from package.json entry point', function(){
      expect( Config ).to.be.ok
    })

  })

})
