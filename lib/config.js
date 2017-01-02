'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// # Config

// A place to store config

// Meant to be extended by your app

var debug = require('debug')('dply::config');
var process = require('process');
var fs = require('fs');
var path = require('path');
var yaml = require('js-yaml');
var _ = require('lodash');

var ConfigError = function (_require$ExtendedErro) {
  _inherits(ConfigError, _require$ExtendedErro);

  function ConfigError() {
    _classCallCheck(this, ConfigError);

    return _possibleConstructorReturn(this, (ConfigError.__proto__ || Object.getPrototypeOf(ConfigError)).apply(this, arguments));
  }

  return ConfigError;
}(require('deployable-errors').ExtendedError);

// ## class Config

// `Config.instance` - Get the default config instance
// `Config.createInstance` - Create a named Config instance
// `Config.getInstance` - Get a named Config instance

module.exports = function () {
  _createClass(Config, null, [{
    key: 'productionLikeEnv',


    // Are we in a production like environment
    value: function productionLikeEnv() {
      switch (process.env.NODE_ENV) {
        case 'production':
        case 'staging':
        case 'load':
        case 'testproduction':
          return true;
        case 'development':
        case 'test':
        default:
          return false;
      }
    }
  }, {
    key: 'testEnv',
    value: function testEnv() {
      switch (process.env.NODE_ENV) {
        case 'test':
        case 'testproduction':
          return true;
        default:
          return false;
      }
    }

    // ### Instance

  }]);

  function Config() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Config);

    // A label for this environment
    this.label = options.label || process.env.NODE_ENV || 'production';

    // A File, normally just the label
    this.file = options.file || this.label + '.yml';

    // A path, where you store config files
    this.path = options.path || path.resolve(path.join(__dirname, '..', 'config'));

    // A validation function, for reading config
    this.validate = options.validate;

    // A tranform function, for reading and writing config
    this.transform = options.transform;

    this.loadFile();
  }

  _createClass(Config, [{
    key: 'loadFile',
    value: function loadFile() {
      var file_path = path.join(this.path, this.file);
      var config = {};
      try {
        config = require(file_path);
        debug('required json from file', file_path);
      } catch (err) {
        try {
          config = yaml.load(fs.readFileSync(file_path, 'utf8'));
          debug('loaded yaml from file', file_path);
        } catch (err) {
          logger.error(err);
          throw new ConfigError('Can\'t load config - ' + file_path);
        }
      }
      debug('read config', file_path, config);
      return this.config = config;
    }

    // Get a config key

  }, {
    key: 'get',
    value: function get(key) {
      debug('get %s %s', this.label, key);
      return _.get(this._config, key);
    }

    // Set a config key

  }, {
    key: 'set',
    value: function set(key, value) {
      debug('set %s %s', this.label, key, value);
      return _.set(this._config, key);
    }
  }, {
    key: 'productionLikeEnv',
    value: function productionLikeEnv() {
      this.constructor.productionLikeEnv();
    }
  }, {
    key: 'testEnv',
    value: function testEnv() {
      this.constructor.testEnv();
    }
  }, {
    key: 'config',
    get: function get() {
      return this._config;
    },
    set: function set(conf) {
      // Validation
      this._config = conf;
    }
  }]);

  return Config;
}();

module.exports.ConfigError = ConfigError;
//# sourceMappingURL=config.js.map