
describe('Unit::deployable-config', function(){

  describe('package', function(){
  
    let {Config, ConfigError} = require('../')

    it('should do load module from package.json entry point', function(){
      expect( Config ).to.be.ok
    })

    it('should do load module from package.json entry point', function(){
      expect( ConfigError ).to.be.ok
    })

  })

})
