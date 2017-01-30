# [deployable-config](https://github.com/deployable/deployable-config)

Config manager

### Install
 
    npm install deployable-config --save

    yarn add deployable-config

### Usage

```javascript

const config = require('deployable-config')('myapp', { package: true })
config.get('path.base') // => Package root directory
config.get('app.version') // => package.json version
config.get('app.description') // => package.json description

config.set('whatever', 'james')
config.get('whatever') // => 'james'

```

### License

deployable-config is released under the MIT license.
Copyright 2016 Matt Hoyle - code at deployable.co

https://github.com/deployable/deployable-config

