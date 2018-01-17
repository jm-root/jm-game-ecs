(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _jmEcs = require('jm-ecs');

var _jmEcs2 = _interopRequireDefault(_jmEcs);

var _jmLogger = require('jm-logger');

var _jmLogger2 = _interopRequireDefault(_jmLogger);

var _jmUtils = require('jm-utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var logger = _jmLogger2.default.getLogger('area');

var State = {
  closed: 0, // 关闭
  open: 1, // 开放
  paused: 2 // 暂停
};

var C = function (_ECS$C) {
  _inherits(C, _ECS$C);

  function C(e) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, C);

    var _this = _possibleConstructorReturn(this, (C.__proto__ || Object.getPrototypeOf(C)).call(this, e, opts));

    opts.id && (e.id = opts.id);
    e.State = State;
    e.maxPlayers = opts.maxPlayers || 5; // 最大玩家数上限
    e.runTime = 0; // 运行时间
    e.ticks = 0; // 更新次数
    e.players = []; // 所有玩家
    e.state = State.closed;

    Object.defineProperty(e, 'entities', {
      get: function () {
        var v = this.em.entities;
        var ret = [];
        for (var key in v) {
          var o = v[key];
          if (o === this) continue;
          ret.push(o.toJSON());
        }
        return ret;
      }.bind(e)
    });
    Object.defineProperty(e, 'totalPlayers', {
      get: function () {
        return this.players.length;
      }.bind(e)
    });
    Object.defineProperty(e, 'full', {
      get: function () {
        return this.maxPlayers && this.totalPlayers >= this.maxPlayers;
      }.bind(e)
    });
    Object.defineProperty(e, 'empty', {
      get: function () {
        return this.totalPlayers === 0;
      }.bind(e)
    });

    e.em.on('update', function (fDelta, nDelta) {
      if (this.state !== State.open) return;
      this.runTime += nDelta;
      this.ticks++;
    }.bind(e));

    e.createPlayer = function () {
      var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var player = this.em.createEntity('player', opts);
      this.emit('addPlayer', player, opts);
      this.players.push(player);
      player.on('remove', function () {
        this.emit('removePlayer', player);
        var idx = this.players.indexOf(player);
        if (idx !== -1) this.players.splice(idx, 1);
        logger.debug('remove player: %s', _jmUtils.utils.formatJSON(player.toJSON()));
      }.bind(this));
      return Promise.resolve().then(function () {
        if (player.init) return player.init(opts);
        return player;
      }).then(function () {
        logger.debug('add player: %s', _jmUtils.utils.formatJSON(player.toJSON()));
        return player;
      });
    };

    e.findPlayer = function (id) {
      for (var i in this.players) {
        var player = this.players[i];
        if (player.id === id) return player;
      }
      return null;
    };

    e.open = function () {
      if (this.state !== State.closed) {
        logger.warn('area not in closed, can not be open');
        return false;
      }
      this.runTime = 0;
      this.ticks = 0;
      this.state = State.open;
      this.emit('open');
      logger.info('area %s open', this.id);
      return true;
    };

    e.close = function () {
      if (this.state !== State.open && this.state !== State.paused) {
        logger.warn('area not in open or paused, can not be closed');
        return false;
      }
      this.state = State.closed;
      this.clear();
      this.emit('close');
      logger.info('area %s closed', this.id);
      return true;
    };

    e.pause = function () {
      if (this.state !== State.open) {
        logger.warn('area not in open, can not be paused');
        return false;
      }
      this.state = State.paused;
      this.emit('pause');
      logger.info('area %s paused', this.id);
      return true;
    };

    e.resume = function () {
      if (this.state !== State.paused) {
        logger.warn('area not in paused, can not be resume');
        return false;
      }
      this.state = State.open;
      this.emit('resume');
      logger.info('area %s resumed', this.id);
      return true;
    };

    e.clear = function () {
      var entities = this.entities;
      for (var id in entities) {
        var o = entities[id];
        o.removeFromParent();
      }
    };

    e.toJSON = function () {
      var o = {
        type: this.type,
        entityId: this.entityId, // 实体id
        id: this.id,
        state: this.state, // 当前状态
        runTime: this.runTime, // 运行时间
        totalPlayers: this.totalPlayers, // 当前房间玩家数
        maxPlayers: this.maxPlayers, // 房间最大人数上限
        players: this.players // 玩家列表
      };
      this.emit('toJSON', o);
      return o;
    };
    return _this;
  }

  _createClass(C, [{
    key: 'className',
    get: function get() {
      return C.className || C.name;
    }
  }]);

  return C;
}(_jmEcs2.default.C);

C.className = 'area';
C.singleton = true;
exports.default = C;
module.exports = exports['default'];
},{"jm-ecs":10,"jm-logger":20,"jm-utils":21}],2:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _area = require('./area');

var _area2 = _interopRequireDefault(_area);

var _player = require('./player');

var _player2 = _interopRequireDefault(_player);

var _jmEcs = require('jm-ecs');

var _jmEcs2 = _interopRequireDefault(_jmEcs);

var _jmLogger = require('jm-logger');

var _jmLogger2 = _interopRequireDefault(_jmLogger);

var _jmUtils = require('jm-utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * 每个游戏管理多个 area
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * 为了简单，设计上 em 与 area 一对一， 即每个 em 只有一个 area，保证了每个 em 中的实体都是 area 或者 属于 area 的实体
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * area 和 player 都有唯一 id, 可以根据 id 搜索到
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


var logger = _jmLogger2.default.getLogger('jm-game-ecs');

var State = {
  closed: 0, // 关闭
  open: 1, // 开放
  paused: 2 // 暂停


  /**
   * represent a game
   */
};
var Game = function (_ECS) {
  _inherits(Game, _ECS);

  /**
   * create a game
   *
   * @param {Object} opts
   * @example
   * opts: {
   *  disableAutoOpen: (可选) 是否禁止自动开放 game , 默认不禁止
   *  interval: (可选) 内部 update 周期，单位 ms, 默认 0 表示不启用内部 update )
   * }
   */
  function Game() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Game);

    var _this = _possibleConstructorReturn(this, (Game.__proto__ || Object.getPrototypeOf(Game)).call(this));

    _this.State = State;
    _this.state = State.closed;
    _this.areas = [];
    _this.uses([{ class: _area2.default }, { class: _player2.default }]);
    _this.entityTypes = {
      area: {
        components: {
          area: {}
        }
      },
      player: {
        components: {
          player: {}
        }
      }
    };
    _this.on('em', function (em) {
      em.addEntityTypes(this.entityTypes);
    }.bind(_this));
    if (!opts.disableAutoOpen) {
      _this.open(opts);
    }
    Object.defineProperty(_this, 'players', {
      get: function () {
        var bJSON = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

        var areas = this.areas;
        var players = [];
        for (var i in areas) {
          var v = areas[i].players;
          for (var j in v) {
            players.push(v[j]);
          }
        }
        return players;
      }.bind(_this)
    });
    return _this;
  }

  /**
   * update the game
   * @param fDelta 单位秒
   * @param nDelta 单位毫秒
   */


  _createClass(Game, [{
    key: 'update',
    value: function update() {
      var fDelta = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var nDelta = arguments[1];

      if (this.state !== State.open) return true;
      nDelta || (nDelta = parseInt(fDelta * 1000));
      var areas = this.areas;
      for (var i in areas) {
        var e = areas[i];
        e.em.emit('update', fDelta, nDelta);
      }
      return true;
    }

    /**
     * open the game
     * @param opts
     * @returns {boolean}
     */

  }, {
    key: 'open',
    value: function open() {
      var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      if (this.state !== State.closed) {
        logger.warn('game not in closed, can not be open');
        return false;
      }
      this.state = State.open;
      this.emit('open');
      logger.info('game open');
      var interval = opts.interval;
      if (interval) {
        this._updateTime = Date.now();
        this._timer = setInterval(function () {
          var t = Date.now();
          var nDelta = t - this._updateTime;
          var fDelta = nDelta / 1000;
          this._updateTime = t;
          this.update(fDelta, nDelta);
        }.bind(this), interval);
      }
      return true;
    }

    /**
     * close the game
     * @returns {boolean}
     */

  }, {
    key: 'close',
    value: function close() {
      if (this.state !== State.open && this.state !== State.paused) {
        logger.warn('game not in open or paused, can not be close');
        return false;
      }
      this.state = State.closed;
      if (this._timer) {
        clearInterval(this._timer);
        this._timer = null;
      }
      this.emit('close');
      logger.info('game closed');
      return true;
    }

    /**
     * pause the game, stop update
     * @returns {boolean}
     */

  }, {
    key: 'pause',
    value: function pause() {
      if (this.state !== State.open) {
        logger.warn('game not in open, can not be paused');
        return false;
      }
      this.state = State.paused;
      this.emit('pause');
      logger.info('game paused');
      return true;
    }
  }, {
    key: 'resume',
    value: function resume() {
      if (this.state !== State.paused) {
        logger.warn('game not in paused, can not be resume');
        return false;
      }
      this.state = State.open;
      this.emit('resume');
      logger.info('game resumed');
      return true;
    }

    /**
     * create an area
     * @param opts
     * @returns {Promise}
     */

  }, {
    key: 'createArea',
    value: function createArea() {
      var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var areas = this.areas;
      var em = this.em();
      var e = em.createEntity('area', opts);
      areas.push(e);
      em.area = e;
      this.emit('addArea', e, opts);
      e.on('remove', function () {
        this.emit('removeArea', e);
        var idx = this.areas.indexOf(e);
        if (idx !== -1) this.areas.splice(idx, 1);
        logger.info('remove area: %s', _jmUtils.utils.formatJSON(e.toJSON()));
      }.bind(this));
      return Promise.resolve().then(function () {
        if (e.init) return e.init(opts);
        return e;
      }).then(function () {
        logger.info('add area: %s', _jmUtils.utils.formatJSON(e.toJSON()));
        return e;
      });
    }

    /**
     * find area by area.id
     * @param id
     * @returns {*}
     */

  }, {
    key: 'findArea',
    value: function findArea(id) {
      for (var i in this.areas) {
        var area = this.areas[i];
        if (area.id === id) return area;
      }
      return null;
    }

    /**
     * find player by player.id
     * @param id
     * @returns {*}
     */

  }, {
    key: 'findPlayer',
    value: function findPlayer(id) {
      var areas = this.areas;
      for (var i in areas) {
        var player = areas[i].findPlayer(id);
        if (player) return player;
      }
      return null;
    }
  }]);

  return Game;
}(_jmEcs2.default);

if (typeof global !== 'undefined' && global) {
  global.jm || (global.jm = {});
  var jm = global.jm;
  if (!jm.game) {
    jm.Game = Game;
    jm.game = function (opts) {
      return new Game(opts);
    };
  }
}

exports.default = Game;
module.exports = exports['default'];
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./area":1,"./player":3,"jm-ecs":10,"jm-logger":20,"jm-utils":21}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _jmEcs = require('jm-ecs');

var _jmEcs2 = _interopRequireDefault(_jmEcs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var C = function (_ECS$C) {
  _inherits(C, _ECS$C);

  function C(e, opts) {
    _classCallCheck(this, C);

    var _this = _possibleConstructorReturn(this, (C.__proto__ || Object.getPrototypeOf(C)).call(this, e, opts));

    opts.id && (e.id = opts.id);

    e.toJSON = function () {
      var o = {
        type: this.type,
        entityId: this.entityId,
        id: this.id
      };
      this.emit('toJSON', o);
      return o;
    };
    return _this;
  }

  _createClass(C, [{
    key: 'className',
    get: function get() {
      return C.className || C.name;
    }
  }]);

  return C;
}(_jmEcs2.default.C);

C.className = 'player';
C.singleton = true;

exports.default = C;
module.exports = exports['default'];
},{"jm-ecs":10}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _obj = require('./obj');

var _obj2 = _interopRequireDefault(_obj);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * component
 */
var C = function (_Obj) {
  _inherits(C, _Obj);

  /**
   * create a component
   * @param {E} e entity
   * @param {Object} opts
   */
  function C(e, opts) {
    _classCallCheck(this, C);

    var _this = _possibleConstructorReturn(this, (C.__proto__ || Object.getPrototypeOf(C)).call(this, opts));

    _this._entity = e;
    _this.active = true;
    return _this;
  }

  _createClass(C, [{
    key: 'toJSON',
    value: function toJSON() {
      return {
        className: this.className
      };
    }
  }, {
    key: 'entity',
    get: function get() {
      return this._entity;
    }
  }, {
    key: 'className',
    get: function get() {
      return C.className || C.name;
    }
  }, {
    key: 'singleton',
    get: function get() {
      return C.singleton;
    }
  }, {
    key: 'name',
    get: function get() {
      return this._name || this.className;
    },
    set: function set(v) {
      if (C.nameReadOnly) return;
      this._name = v;
    }
  }]);

  return C;
}(_obj2.default);

C.className = 'component';
C.singleton = false;
C.nameReadOnly = false;

exports.default = C;
module.exports = exports['default'];
},{"./obj":11}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var BaseErrCode = 800;

exports.default = {
  Err: {
    InvalidComponent: {
      err: BaseErrCode++,
      msg: 'invalid component ${name}'
    },
    SingletonComponent: {
      err: BaseErrCode++,
      msg: 'singleton component ${name} already exists'
    }
  }
};
module.exports = exports['default'];
},{}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _jmErr = require('jm-err');

var _jmErr2 = _interopRequireDefault(_jmErr);

var _jmLogger = require('jm-logger');

var _jmLogger2 = _interopRequireDefault(_jmLogger);

var _obj = require('./obj');

var _obj2 = _interopRequireDefault(_obj);

var _component = require('./component');

var _component2 = _interopRequireDefault(_component);

var _em = require('./em');

var _em2 = _interopRequireDefault(_em);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var logger = _jmLogger2.default.getLogger('jm-ecs');

/**
 * entity component system
 */

var ECS = function (_Obj) {
  _inherits(ECS, _Obj);

  /**
   * create an entity component system
   * @param opts
   */
  function ECS(opts) {
    _classCallCheck(this, ECS);

    var _this = _possibleConstructorReturn(this, (ECS.__proto__ || Object.getPrototypeOf(ECS)).call(this, opts));

    _this._components = {};
    _this.use(_component2.default);
    return _this;
  }

  /**
   * use module
   * @param {Object} C
   * @param name
   * @return {ECS}
   */


  _createClass(ECS, [{
    key: 'use',
    value: function use(C, name) {
      if (!C) throw _jmErr2.default.err(_jmErr2.default.Err.FA_PARAMS);
      name || (name = C.className || C.name);
      if (!name) throw _jmErr2.default.err(_jmErr2.default.Err.FA_PARAMS);
      var components = this._components;
      if (components[name]) {
        logger.warn('use Compoent already exists for ' + name + ', replaced.');
      }
      components[name] = C;
      this.emit('use', name, C);
      return this;
    }

    /**
     * use modules
     * uses({class:C, name: 'components'})
     * uses(['Component1', 'Component2', {name: 'components3', class:'C'}...'Factory1', 'Factory2'])
     * uses({class: C, name: 'component'}, 'Component2'...'Factory1', 'Factory2')
     * @param opts
     * @return {ECS}
     */

  }, {
    key: 'uses',
    value: function uses() {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = args[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var opts = _step.value;

          if (Array.isArray(opts)) {
            this.uses.apply(this, _toConsumableArray(opts));
          } else if ((typeof opts === 'undefined' ? 'undefined' : _typeof(opts)) === 'object') {
            this.use(opts.class, opts.name);
          } else {
            this.use(opts);
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return this;
    }
  }, {
    key: 'unuse',
    value: function unuse(name) {
      var components = this._components;
      var C = components[name];
      if (C) {
        this.emit('unuse', name, C);
      }
      delete components[name];
      return this;
    }
  }, {
    key: 'component',
    value: function component(name) {
      return this._components[name];
    }
  }, {
    key: 'em',
    value: function em(opts) {
      var o = new _em2.default(this, opts);
      this.emit('em', o);
      return o;
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      return { components: this.components };
    }
  }, {
    key: 'components',
    get: function get() {
      return this._components;
    }
  }]);

  return ECS;
}(_obj2.default);

ECS.EM = _em2.default;
ECS.C = _component2.default;
ECS.Obj = _obj2.default;

exports.default = ECS;
module.exports = exports['default'];
},{"./component":4,"./em":7,"./obj":11,"jm-err":12,"jm-logger":16}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _jmUtils = require('jm-utils');

var _obj = require('./obj');

var _obj2 = _interopRequireDefault(_obj);

var _entity = require('./entity');

var _entity2 = _interopRequireDefault(_entity);

var _factory = require('./factory');

var _factory2 = _interopRequireDefault(_factory);

var _jmLogger = require('jm-logger');

var _jmLogger2 = _interopRequireDefault(_jmLogger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var logger = _jmLogger2.default.getLogger('jm-ecs');

/**
 * entity manager
 */

var EM = function (_Obj) {
  _inherits(EM, _Obj);

  /**
   * create an entity manager
   * @param {Object} ecs
   * @param {Object} opts
   */
  function EM(ecs) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, EM);

    var _this = _possibleConstructorReturn(this, (EM.__proto__ || Object.getPrototypeOf(EM)).call(this, opts));

    _this._ecs = ecs;
    _this._entityTypes = {};
    _this._pools = {};
    _this._entities = {};
    _this._entitiesByName = {};
    _this._entitiesByTag = {};
    _this.f = new _factory2.default(_this);
    return _this;
  }

  _createClass(EM, [{
    key: 'e',
    value: function e(opts) {
      return new _entity2.default(this, opts);
    }
  }, {
    key: 'addEntityType',
    value: function addEntityType(type, opts) {
      if (this._entityTypes[type]) {
        logger.warn('add entityType already exists for ' + type + ', replaced.');
      }

      this._entityTypes[type] = opts;
      return this;
    }
  }, {
    key: 'addEntityTypes',
    value: function addEntityTypes(opts) {
      for (var type in opts) {
        this.addEntityType(type, opts[type]);
      }
      return this;
    }
  }, {
    key: 'entityType',
    value: function entityType(type) {
      return this._entityTypes[type];
    }
  }, {
    key: '__createEntityFromPool',
    value: function __createEntityFromPool(type, opts, parent) {
      if (!this._entityTypes[type].poolable) return null;
      if (parent) return null;
      if (opts && opts.parent) return null;
      // 如果可池化, 先从池里取
      if (this._pools[type]) {
        var e = this._pools[type].shift();
        if (e) {
          e.emit('reuse', opts);
          this.addEntity(e);
          return e;
        }
      }
      return null;
    }
  }, {
    key: 'createEntity',
    value: function createEntity(type, opts, parent) {
      var e = null;
      e = this.__createEntityFromPool(type, opts, parent);
      if (e) return e;

      var _opts = opts;
      opts = {};
      opts = _jmUtils.utils.cloneDeep(this._entityTypes[type]);
      if (_opts) {
        opts = _jmUtils.utils.merge(opts, _jmUtils.utils.cloneDeep(_opts));
      }

      if (parent) opts.parent = parent;
      e = this.f.create(opts);
      if (!e) {
        return null;
      }

      e.type = type;
      e.addTag(type);
      opts.tags && e.addTags(opts.tags);
      this.addEntity(e);

      this.createEntityChildren(e, opts);

      return e;
    }
  }, {
    key: 'createEntityChildren',
    value: function createEntityChildren(e, opts) {
      // create Children
      for (var i in opts.children) {
        var info = opts.children[i];
        if (!info) continue;
        var o = null;
        var className = info.className || 'jm.Entity';
        if (className === 'jm.Entity') {
          var type = info.type;
          o = this.createEntity(type, info, e);
        }
        if (!e.children) {
          e.children = [];
        }
        e.children.push(o);
      }
    }
  }, {
    key: 'addEntity',
    value: function addEntity(e, tag) {
      if (!e || !e.entityId) {
        return this;
      }

      if (tag) {
        e.addTag(tag);
      }

      this._entities[e.entityId] = e;
      if (e.name) {
        this._entitiesByName[e.name] = e;
      }

      e.emit('add', this);
      this.emit('addEntity', e);

      return this;
    }
  }, {
    key: '__removeEntityToPool',
    value: function __removeEntityToPool(e) {
      var type = e.type;
      if (!this._entityTypes[type].poolable) return false;
      if (e.parent) return false;
      // 如果可池化, 存到池里
      if (!this._pools[type]) this._pools[type] = [];
      var pool = this._pools[type];
      e.emit('unuse');
      pool.push(e);
      return true;
    }
  }, {
    key: 'clearPool',
    value: function clearPool(type) {
      var pool = this._pools[type];
      if (!pool) return;
      this._pools[type] = [];
      pool.forEach(function (e) {
        e.destroy();
      });
      return this;
    }
  }, {
    key: 'clearPools',
    value: function clearPools() {
      for (var type in this._pools) {
        this.clearPool(type);
      }
      return this;
    }
  }, {
    key: 'removeEntity',
    value: function removeEntity(entityId) {
      var e = void 0;
      if ((typeof entityId === 'undefined' ? 'undefined' : _typeof(entityId)) === 'object') {
        e = entityId;
      } else {
        e = this._entities[entityId];
      }
      if (!e) {
        return this;
      }

      this.removeEntityChildren(e);

      e.emit('remove', this);
      this.emit('removeEntity', e);
      delete this._entities[e.entityId];

      if (e.name) {
        delete this._entitiesByName[e.name];
      }

      if (this.__removeEntityToPool(e)) {
        return this;
      } else {
        e.destroy();
      }

      return this;
    }
  }, {
    key: 'removeEntityChildren',
    value: function removeEntityChildren(e) {
      var v = e.children;
      for (var i in v) {
        var _e = v[i];
        this.removeEntity(_e.entityId);
      }
      return this;
    }
  }, {
    key: 'removeEntities',
    value: function removeEntities(v) {
      for (var i in v) {
        this.removeEntity(v[i]);
      }
      return this;
    }
  }, {
    key: 'removeEntitiesByType',
    value: function removeEntitiesByType(type) {
      var v = [];
      for (var i in this._entities) {
        var e = this._entities[i];
        if (e.type === type) v.push(e);
      }
      this.removeEntities(v);
      return this;
    }

    //    getEntities('render')
    //    getEntities('render move tag1')  and
    //    getEntities('render, move, tag1')   or

  }, {
    key: 'getEntities',
    value: function getEntities(selector) {
      var entities = this._entities;
      if (!selector) return entities;
      var v = {};
      // select entities by tags
      if (typeof selector === 'string') {
        var and = false; // flags for multiple
        var or = false;
        var rlist = /\s*,\s*/;
        var rspace = /\s+/;
        var del = void 0;
        // multiple components OR
        if (selector.indexOf(',') !== -1) {
          or = true;
          del = rlist;
        } else if (selector.indexOf(' ') !== -1) {
          and = true;
          del = rspace;
        }
        if (!and && !or) {
          return this._entitiesByTag[selector];
        }
        var tags = selector.split(del);
        var e = void 0;
        for (var entityId in entities) {
          e = entities[entityId];
          if (and) {
            if (!e.hasTagAll(tags)) continue;
          } else if (or) {
            if (!e.hasTagAny(tags)) continue;
          }
          v[entityId] = e;
        }
      }

      return v;
    }
  }, {
    key: 'getEntity',
    value: function getEntity(selector) {
      var v = this.getEntities(selector);
      for (var i in v) {
        return v[i];
      }
      return null;
    }
  }, {
    key: 'update',
    value: function update(opts) {
      this.emit('update', opts);
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      return {
        ecs: this.ecs,
        entities: this.entities
      };
    }
  }, {
    key: 'ecs',
    get: function get() {
      return this._ecs;
    }
  }, {
    key: 'entityTypes',
    get: function get() {
      return this._entityTypes;
    }
  }, {
    key: 'pools',
    get: function get() {
      return this._pools;
    }
  }, {
    key: 'entities',
    get: function get() {
      return this._entities;
    }
  }, {
    key: 'entitiesByName',
    get: function get() {
      return this._entitiesByName;
    }
  }, {
    key: 'entitiesByTag',
    get: function get() {
      return this._entitiesByTag;
    }
  }]);

  return EM;
}(_obj2.default);

exports.default = EM;
module.exports = exports['default'];
},{"./entity":8,"./factory":9,"./obj":11,"jm-logger":16,"jm-utils":19}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _jmUtils = require('jm-utils');

var _jmTag = require('jm-tag');

var _jmTag2 = _interopRequireDefault(_jmTag);

var _jmErr = require('jm-err');

var _jmErr2 = _interopRequireDefault(_jmErr);

var _obj = require('./obj');

var _obj2 = _interopRequireDefault(_obj);

var _consts = require('./consts');

var _consts2 = _interopRequireDefault(_consts);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Err = _consts2.default.Err;

var guid = 1;

function isEmptyObject(e) {
  for (var t in e) {
    return false;
  }
  return true;
}

function without(v, o) {
  if (!v) return;
  var idx = v.indexOf(o);
  if (idx === -1) return;
  v.splice(idx, 1);
}

var E = function (_Obj) {
  _inherits(E, _Obj);

  function E(em, opts) {
    _classCallCheck(this, E);

    var _this = _possibleConstructorReturn(this, (E.__proto__ || Object.getPrototypeOf(E)).call(this, opts));

    _jmTag2.default.enableTag(_this);

    _this._em = em;
    _this._ecs = em.ecs;
    _this._components = {};
    _this._componentsByClass = {};
    _this._componentGUID = 1;

    _this.active = true;
    _this.entityId = guid++;

    _this.on('addTag', function (tag) {
      em._entitiesByTag[tag] || (em._entitiesByTag[tag] = {});
      em._entitiesByTag[tag][_this.entityId] = _this;
    });

    _this.on('removeTag', function (tag) {
      var o = em._entitiesByTag[tag];
      if (!o) return;
      delete o[_this.entityId];
      if (isEmptyObject(o)) {
        delete em._entitiesByTag[tag];
      }
    });
    return _this;
  }

  _createClass(E, [{
    key: 'destroy',
    value: function destroy() {
      _get(E.prototype.__proto__ || Object.getPrototypeOf(E.prototype), 'destroy', this).call(this);
      this.removeAllComponents();
      this.removeAllTags();
    }
  }, {
    key: 'use',
    value: function use(C, opts, name) {
      var ecs = this.ecs;
      if (typeof C === 'string') {
        name || (name = C);
        C = ecs.component(C);
        if (!C) throw _jmErr2.default.err(Err.InvalidComponent, { name: C });
      }
      if (!C) throw _jmErr2.default.err(_jmErr2.default.Err.FA_PARAMS);

      var c = new C(this, opts);

      var components = this._components;
      var componentsByClass = this._componentsByClass;
      name || (name = c.className);
      var cClassName = c.className;

      var bUsedName = name in components;
      if (bUsedName) {
        if (C.singleton) throw _jmErr2.default.err(Err.SingletonComponent, { name: name });
        name = cClassName + this._componentGUID++;
      }

      componentsByClass[cClassName] || (componentsByClass[cClassName] = {});
      var vByClass = componentsByClass[cClassName];

      components[name] = c;
      vByClass[name] = c;
      this[name] = c;
      this.addTag(cClassName);
      if (C.alias) this.addTag(C.alias);

      c.emit('use', this);
      this.emit('use', c);

      return this;
    }
  }, {
    key: 'unuse',
    value: function unuse(C_or_name) {
      var components = this._components;
      var componentsByClass = this._componentsByClass;
      var c = C_or_name;
      var name = void 0;
      if (typeof c === 'string') {
        name = c;
        c = components[c];
      }
      if (!c) return this;

      name || (name = c.name);
      var cClassName = c.className;
      var v = componentsByClass[cClassName];
      delete components[name];
      delete v[name];
      delete this[name];
      if (!v.length) this.removeTag(cClassName);

      c.emit('unuse', this);
      this.emit('unuse', c);
      c.destroy();
      return this;
    }
  }, {
    key: 'removeChild',
    value: function removeChild(e) {
      this.em.removeEntity(e.entityId);
      this.children = without(this.children, e);
      e.destroy();
    }
  }, {
    key: 'removeFromParent',
    value: function removeFromParent() {
      if (this.parent) {
        this.parent.removeChild(this);
      } else {
        this.em.removeEntity(this.entityId);
      }
    }
  }, {
    key: 'removeComponents',
    value: function removeComponents(className) {
      var v = this.getComponents(className);
      for (var i in v) {
        this.unuse(i);
      }
      delete this._componentsByClass[className];
      this.emit('removeComponents', className);
      return this;
    }
  }, {
    key: 'removeAllComponents',
    value: function removeAllComponents() {
      var v = this._components;
      for (var i in v) {
        this.unuse(i);
      }
      this.emit('removeAllComponents');
      return this;
    }
  }, {
    key: 'getComponent',
    value: function getComponent(name) {
      return this._components[name];
    }
  }, {
    key: 'getComponents',
    value: function getComponents(className) {
      return this._componentsByClass[className];
    }

    /**
     * 去掉entityType中已经定义的相同部分
     */

  }, {
    key: '_clip',
    value: function _clip(origin, target) {
      if (!origin) {
        return;
      }
      for (var key in target) {
        var t = target[key];
        var o = origin[key];
        if ((typeof t === 'undefined' ? 'undefined' : _typeof(t)) === 'object') {
          if (o) {
            this._clip(o, t);
          }
          if (isEmptyObject(t)) {
            delete target[key];
          }
          continue;
        }

        if (t === o) {
          delete target[key];
        }
      }
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      var type = this.type;

      var opts = {
        type: type,
        tags: [],
        components: {}
      };

      opts.tags = _jmUtils.utils.cloneDeep(this.tags);
      opts.tags = without(opts.tags, type);

      var cs = opts.components;
      var v = this.components;
      for (var i in v) {
        var c = v[i];
        cs[i] = c.toJSON();
        opts.tags = without(opts.tags, i);
        opts.tags = without(opts.tags, c.className);
        if (i === cs[i].className) delete cs[i].className;
      }

      var et = this.em.entityType(type);

      if (et) {
        for (var _i in et.tags) {
          opts.tags = without(opts.tags, et.tags[_i]);
        }
        // 去掉entityType中已经定义的相同部分
        this._clip(et, opts);
      }
      if (opts.tags && !opts.tags.length) delete opts.tags;
      v = this.children;
      for (var _i2 in v) {
        var e = v[_i2];
        if (!opts.children) opts.children = [];
        opts.children.push(e.toJSON());
      }
      return opts;
    }
  }, {
    key: 'em',
    get: function get() {
      return this._em;
    }
  }, {
    key: 'ecs',
    get: function get() {
      return this._ecs;
    }
  }, {
    key: 'components',
    get: function get() {
      return this._components;
    }
  }, {
    key: 'componentsByClass',
    get: function get() {
      return this._componentsByClass;
    }
  }]);

  return E;
}(_obj2.default);

exports.default = E;
module.exports = exports['default'];
},{"./consts":5,"./obj":11,"jm-err":12,"jm-tag":17,"jm-utils":19}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _obj = require('./obj');

var _obj2 = _interopRequireDefault(_obj);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * factory
 */
var F = function (_Obj) {
  _inherits(F, _Obj);

  /**
   * create a factory
   * @param {EM} em - entity manager
   * @param {Object} opts
   */
  function F(em, opts) {
    _classCallCheck(this, F);

    var _this = _possibleConstructorReturn(this, (F.__proto__ || Object.getPrototypeOf(F)).call(this, opts));

    _this.em = em;
    return _this;
  }

  _createClass(F, [{
    key: 'create',
    value: function create() {
      var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var em = this.em;
      var e = em.e();
      if (!opts.components) return e;
      if (opts.parent) {
        e.parent = opts.parent;
      }

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = Object.keys(opts.components)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var name = _step.value;

          var info = opts.components[name];
          var C = info.className || name;
          info.className && delete info.className;
          e.use(C, info, name);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      this.emit('create', e);
      return e;
    }
  }]);

  return F;
}(_obj2.default);

exports.default = F;
module.exports = exports['default'];
},{"./obj":11}],10:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _ecs = require('./ecs');

var _ecs2 = _interopRequireDefault(_ecs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

if (typeof global !== 'undefined' && global) {
  if (global.jm) {
    global.jm.ECS = _ecs2.default;
    global.jm.ecs = function (opts) {
      return new _ecs2.default(opts);
    };
  }
}

exports.default = _ecs2.default;
module.exports = exports['default'];
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./ecs":6}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _jmEvent = require('jm-event');

var _jmEvent2 = _interopRequireDefault(_jmEvent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * object
 */
var Obj = function (_event$EventEmitter) {
  _inherits(Obj, _event$EventEmitter);

  /**
   * create an object
   * @param {Object} opts
   */
  function Obj(opts) {
    _classCallCheck(this, Obj);

    var _this = _possibleConstructorReturn(this, (Obj.__proto__ || Object.getPrototypeOf(Obj)).call(this));

    if (opts) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = Object.keys(opts)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var key = _step.value;

          _this[key] = opts[key];
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
    return _this;
  }

  /**
   * destroy
   */


  _createClass(Obj, [{
    key: 'destroy',
    value: function destroy() {
      this.emit('destroy', this);
    }
  }]);

  return Obj;
}(_jmEvent2.default.EventEmitter);

exports.default = Obj;
module.exports = exports['default'];
},{"jm-event":15}],12:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _locale = require('./locale');

var _locale2 = _interopRequireDefault(_locale);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * common error defines
 *
 */
var Err = {
  SUCCESS: {
    err: 0,
    msg: 'Success'
  },

  FAIL: {
    err: 1,
    msg: 'Fail'
  },

  FA_SYS: {
    err: 2,
    msg: 'System Error'
  },

  FA_NETWORK: {
    err: 3,
    msg: 'Network Error'
  },

  FA_PARAMS: {
    err: 4,
    msg: 'Parameter Error'
  },

  FA_BUSY: {
    err: 5,
    msg: 'Busy'
  },

  FA_TIMEOUT: {
    err: 6,
    msg: 'Time Out'
  },

  FA_ABORT: {
    err: 7,
    msg: 'Abort'
  },

  FA_NOTREADY: {
    err: 8,
    msg: 'Not Ready'
  },

  FA_NOTEXISTS: {
    err: 9,
    msg: 'Not Exists'
  },

  FA_EXISTS: {
    err: 8,
    msg: 'Already Exists'
  },

  OK: {
    err: 200,
    msg: 'OK'
  },

  FA_BADREQUEST: {
    err: 400,
    msg: 'Bad Request'
  },

  FA_NOAUTH: {
    err: 401,
    msg: 'Unauthorized'
  },

  FA_NOPERMISSION: {
    err: 403,
    msg: 'Forbidden'
  },

  FA_NOTFOUND: {
    err: 404,
    msg: 'Not Found'
  },

  FA_INTERNALERROR: {
    err: 500,
    msg: 'Internal Server Error'
  },

  FA_UNAVAILABLE: {
    err: 503,
    msg: 'Service Unavailable'
  }
}; /**
    * err module.
    * @module err
    */

Err.t = _locale2.default;

/**
 * return message from template
 *
 * ```javascript
 * errMsg('sampe ${name} ${value}', {name: 'jeff', value: 123});
 * // return 'sample jeff 123'
 * ```
 *
 * @param {String} msg message template
 * @param {Object} opts params
 * @return {String} final message
 */
var errMsg = function errMsg(msg, opts) {
  if (opts) {
    for (var key in opts) {
      msg = msg.split('${' + key + '}').join(opts[key]);
    }
  }
  return msg;
};

/**
 * return an Error Object
 * @param {Object|String} E Err object or a message template
 * @param {Object} [opts] params
 * @return {Error}
 */
var err = function err(E, opts) {
  if (typeof E === 'string') {
    E = {
      msg: E
    };
  }
  var msg = errMsg(E.msg, opts);
  var e = new Error(msg);
  E.err && (e.code = E.err);
  return e;
};

/**
 * enable Err Object, errMsg and err function for obj
 * @param {Object} obj target object
 * @param {String} [name] name to bind
 * @return {boolean}
 */
var enableErr = function enableErr(obj) {
  var name = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'Err';

  if (obj[name]) return false;
  obj[name] = Err;
  obj.err = err;
  obj.errMsg = errMsg;
  return true;
};

/**
 * disable Err Object, errMsg and err function for obj
 * @param {Object} obj target object
 * @param {String} [name] name to bind
 */
var disableErr = function disableErr(obj) {
  var name = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'Err';

  if (!obj[name]) return;
  delete obj[name];
  delete obj.err;
  delete obj.errMsg;
};

var $ = {
  Err: Err,
  errMsg: errMsg,
  err: err,
  enableErr: enableErr,
  disableErr: disableErr
};

if (typeof global !== 'undefined' && global) {
  global.jm || (global.jm = {});
  var jm = global.jm;
  if (!jm.enableErr) {
    enableErr(jm);
    for (var key in $) {
      jm[key] = $[key];
    }
  }
}

exports.default = $;
module.exports = exports['default'];
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./locale":13}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (msg, lng) {
  if (!lng || !lngs[lng]) return null;
  return lngs[lng][msg];
};

var _zh_CN = require('./zh_CN');

var _zh_CN2 = _interopRequireDefault(_zh_CN);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var lngs = {
  zh_CN: _zh_CN2.default

  /**
   * translate
   * @param {string} msg - msg to be translate
   * @param {string} lng - language
   * @return {String | null}
   */
};;
module.exports = exports['default'];
},{"./zh_CN":14}],14:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = {
  'Success': '成功',
  'Fail': '失败',
  'System Error': '系统错误',
  'Network Error': '网络错误',
  'Parameter Error': '参数错误',
  'Busy': '忙',
  'Time Out': '超时',
  'Abort': '中止',
  'Not Ready': '未准备好',
  'Not Exists': '不存在',
  'Already Exists': '已存在',
  'OK': 'OK',
  'Bad Request': '错误请求',
  'Unauthorized': '未验证',
  'Forbidden': '无权限',
  'Not Found': '未找到',
  'Internal Server Error': '服务器内部错误',
  'Service Unavailable': '无效服务'
};
module.exports = exports['default'];
},{}],15:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * event module.
 * @module event
 */

/**
 * Class representing an eventEmitter.
 *
 * ```javascript
 * // es6
 * let eventEmitter = new EventEmitter();
 * eventEmitter.on('test', (info) => {
 *      console.log(info);
 * });
 * eventEmitter.once('test', (info) => {
 *      // this will be called only one time
 *      console.log(info);
 * });
 * eventEmitter.one('test', (info) => {
 *      // this will be called first
 *      console.log(info);
 * }, true);
 *
 * eventEmitter.emit('test', 'hello eventEmitter');
 * eventEmitter.off('test');
 * ```
 */
var EventEmitter = function () {
  /**
     * Create an eventEmitter.
     */
  function EventEmitter() {
    _classCallCheck(this, EventEmitter);

    this._events = {};
  }

  /**
     * Adds the listener function to the end of the listeners array for the event named eventName.
     * No checks are made to see if the listener has already been added.
     * Multiple calls passing the same combination of eventName and listener will result in the listener being added, and called, multiple times.
     *
     * @param {*} eventName - event name
     * @param {Function} fn - listener function
     * @param {boolean} [prepend] - Adds to the beginning of the listeners array if true
     * @return {EventEmitter} - for chaining
     */


  _createClass(EventEmitter, [{
    key: 'on',
    value: function on(eventName, fn, prepend) {
      this._events[eventName] || (this._events[eventName] = []);
      if (prepend) {
        this._events[eventName].unshift(fn);
      } else {
        this._events[eventName].push(fn);
      }
      return this;
    }

    /**
       * Adds a one time listener function for the event named eventName.
       * The next time eventName is triggered, this listener is removed and then invoked.
       *
       * @param {*} eventName - event name
       * @param {Function} fn - listener function
       * @param {boolean} [prepend] - Adds to the beginning of the listeners array if true
       * @return {EventEmitter} - for chaining
       */

  }, {
    key: 'once',
    value: function once(eventName, fn, prepend) {
      var _this = this;

      var on = function on(arg1, arg2, arg3, arg4, arg5) {
        _this.off(eventName, on);
        fn(arg1, arg2, arg3, arg4, arg5);
      };
      return this.on(eventName, on, prepend);
    }

    /**
       * Removes a listener for the event named eventName.
       * Removes all listeners from the listener array for event named eventName if fn is null
       * Removes all listeners from the listener array if eventName is null
       *
       * @param {*} [eventName] - event name
       * @param {Function} [fn] - listener function
       * @return {EventEmitter} - for chaining
       */

  }, {
    key: 'off',
    value: function off(eventName, fn) {
      if (!fn) {
        if (eventName === undefined) {
          this._events = {};
        } else if (this._events && this._events[eventName]) {
          delete this._events[eventName];
        }
      } else if (this._events && this._events[eventName]) {
        var list = this._events[eventName];
        for (var i = 0; i < list.length; i++) {
          if (fn === list[i]) {
            list.splice(i, 1);
            if (!list.length) {
              delete this._events[eventName];
            }
            break;
          }
        }
      }
      return this;
    }

    /**
       * Synchronously calls each of the listeners registered for the event named eventName,
       * in the order they were registered, passing the supplied arguments to each.
       *
       * to break the calls, just return false on listener function.
       * ```javascript
       * // es6
       * let eventEmitter = new EventEmitter();
       * eventEmitter.on('test', (info) => {
       *      // this will be called
       *      console.log(info);
       * });
       * eventEmitter.on('test', (info) => {
       *      // this will be called
       *      return false;  // this break the calls
       * });
       * eventEmitter.on('test', (info) => {
       *      // this will not be called.
       *      console.log(info);
       * });
       * eventEmitter.emit('test', 'hello eventEmitter');
       * ```
       * tip: use arg1...arg5 instead of arguments for performance consider.
       *
       * @param {*} eventName - event name
       * @param {*} arg1
       * @param {*} arg2
       * @param {*} arg3
       * @param {*} arg4
       * @param {*} arg5
       * @return {EventEmitter} - for chaining
       */

  }, {
    key: 'emit',
    value: function emit(eventName, arg1, arg2, arg3, arg4, arg5) {
      // using a copy to avoid error when listener array changed
      var listeners = this.listeners(eventName);
      for (var i = 0; i < listeners.length; i++) {
        var fn = listeners[i];
        if (fn(arg1, arg2, arg3, arg4, arg5) === false) break;
      }
      return this;
    }

    /**
       * Returns an array listing the events for which the emitter has registered listeners.
       * The values in the array will be strings or Symbols.
       * @return {Array}
       */

  }, {
    key: 'eventNames',
    value: function eventNames() {
      return Object.keys(this._events);
    }

    /**
       * Returns a copy of the array of listeners for the event named eventName.
       * @param {*} eventName - event name
       * @return {Array} - listener array
       */

  }, {
    key: 'listeners',
    value: function listeners(eventName) {
      var v = this._events[eventName];
      if (!v) return [];
      var listeners = new Array(v.length);
      for (var i = 0; i < v.length; i++) {
        listeners[i] = v[i];
      }
      return listeners;
    }
  }]);

  return EventEmitter;
}();

var prototype = EventEmitter.prototype;
var EM = {
  _events: {},
  on: prototype.on,
  once: prototype.once,
  off: prototype.off,
  emit: prototype.emit,
  eventNames: prototype.eventNames,
  listeners: prototype.listeners
};

var enableEvent = function enableEvent(obj) {
  if (obj.emit !== undefined) return false;
  for (var key in EM) {
    obj[key] = EM[key];
  }
  obj._events = {};
  return true;
};

var disableEvent = function disableEvent(obj) {
  if (obj.emit === undefined) return;
  for (var key in EM) {
    delete obj[key];
  }
};

var moduleEvent = function moduleEvent() {
  var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'event';

  var obj = this;
  obj.enableEvent = enableEvent;
  obj.disableEvent = disableEvent;

  return {
    name: name,
    unuse: function unuse() {
      delete obj.enableEvent;
      delete obj.disableEvent;
    }
  };
};

var $ = {
  EventEmitter: EventEmitter,
  enableEvent: enableEvent,
  disableEvent: disableEvent,
  moduleEvent: moduleEvent
};

if (typeof global !== 'undefined' && global) {
  global.jm || (global.jm = {});
  var jm = global.jm;
  if (!jm.EventEmitter) {
    for (var key in $) {
      jm[key] = $[key];
    }
  }
}

exports.default = $;
module.exports = exports['default'];
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],16:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
/**
 * logger module.
 * @module logger
 */

var getLogger = function getLogger(loggerCategoryName) {
    console.debug || (console.debug = console.log);
    return console;
};

var moduleLogger = function moduleLogger() {
    var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'logger';

    var obj = this;
    obj.getLogger = getLogger;
    obj.logger = getLogger();
    return {
        name: name,
        unuse: function unuse() {
            delete obj.logger;
            delete obj.getLogger;
        }
    };
};

var $ = {
    logger: getLogger(),
    getLogger: getLogger,
    moduleLogger: moduleLogger
};

if (typeof global !== 'undefined' && global) {
    global.jm || (global.jm = {});
    var jm = global.jm;
    if (!jm.logger) {
        for (var key in $) {
            jm[key] = $[key];
        }
    }
}

exports.default = $;
module.exports = exports['default'];
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],17:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _jmEvent = require('jm-event');

var _jmEvent2 = _interopRequireDefault(_jmEvent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * tag module.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @module tag
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */

var EventEmitter = _jmEvent2.default.EventEmitter;
var enableEvent = _jmEvent2.default.enableEvent;
var disableEvent = _jmEvent2.default.disableEvent;

/**
 * Object with tag enabled
 */

var TagObject = function (_EventEmitter) {
    _inherits(TagObject, _EventEmitter);

    /**
     * create a tagObject
     */
    function TagObject() {
        _classCallCheck(this, TagObject);

        var _this = _possibleConstructorReturn(this, (TagObject.__proto__ || Object.getPrototypeOf(TagObject)).call(this));

        _this._tags = [];
        Object.defineProperty(_this, 'tags', {
            value: _this._tags,
            writable: false
        });
        return _this;
    }

    /**
     * destroy, remove all tags
     */


    _createClass(TagObject, [{
        key: 'destroy',
        value: function destroy() {
            this.emit('destroy', this);
            this.removeAllTags();
        }

        /**
         * check if has a tag
         * @param {String} tag
         * @return {boolean}
         */

    }, {
        key: 'hasTag',
        value: function hasTag(tag) {
            var tags = this._tags;
            return tags.indexOf(tag) != -1;
        }

        /**
         * check if has any one of tags
         * @param  {String[]} tags
         * @return {boolean}
         */

    }, {
        key: 'hasTagAny',
        value: function hasTagAny(tags) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = tags[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var t = _step.value;

                    if (this.hasTag(t)) return true;
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            return false;
        }

        /**
         * check if has any all of tags
         * @param {String[]} tags
         * @return {boolean}
         */

    }, {
        key: 'hasTagAll',
        value: function hasTagAll(tags) {
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = tags[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var t = _step2.value;

                    if (!this.hasTag(t)) return false;
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }

            return true;
        }

        /**
         * add a tag
         * @param {String} tag
         * @return {TagObject}
         */

    }, {
        key: 'addTag',
        value: function addTag(tag) {
            var tags = this._tags;
            if (this.hasTag(tag)) return this;
            tags.push(tag);
            this.emit('addTag', tag);
            return this;
        }

        /**
         * add tags
         * @param {String[]} tags
         * @return {TagObject}
         */

    }, {
        key: 'addTags',
        value: function addTags(tags) {
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = tags[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var t = _step3.value;

                    this.addTag(t);
                }
            } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion3 && _iterator3.return) {
                        _iterator3.return();
                    }
                } finally {
                    if (_didIteratorError3) {
                        throw _iteratorError3;
                    }
                }
            }

            return this;
        }

        /**
         * remove a tag
         * @param {String} tag
         * @return {TagObject}
         */

    }, {
        key: 'removeTag',
        value: function removeTag(tag) {
            var tags = this._tags;
            var idx = tags.indexOf(tag);
            if (idx >= 0) {
                tags.splice(idx, 1);
            }
            this.emit('removeTag', tag);
            return this;
        }

        /**
         * remove tags
         * @param {String[]} tags
         * @return {TagObject}
         */

    }, {
        key: 'removeTags',
        value: function removeTags(tags) {
            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = tags[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var t = _step4.value;

                    this.removeTag(t);
                }
            } catch (err) {
                _didIteratorError4 = true;
                _iteratorError4 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion4 && _iterator4.return) {
                        _iterator4.return();
                    }
                } finally {
                    if (_didIteratorError4) {
                        throw _iteratorError4;
                    }
                }
            }

            return this;
        }

        /**
         * remove all tags
         * @return {TagObject}
         */

    }, {
        key: 'removeAllTags',
        value: function removeAllTags() {
            var v = this._tags;
            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = v[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var t = _step5.value;

                    this.emit('removeTag', t);
                }
            } catch (err) {
                _didIteratorError5 = true;
                _iteratorError5 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion5 && _iterator5.return) {
                        _iterator5.return();
                    }
                } finally {
                    if (_didIteratorError5) {
                        throw _iteratorError5;
                    }
                }
            }

            this._tags = [];
            this.emit('removeAllTags');
            return this;
        }
    }]);

    return TagObject;
}(EventEmitter);

var prototype = TagObject.prototype;
var Tag = {
    _tags: [],
    hasTag: prototype.hasTag,
    hasTagAny: prototype.hasTagAny,
    hasTagAll: prototype.hasTagAll,
    addTag: prototype.addTag,
    addTags: prototype.addTags,
    removeTag: prototype.removeTag,
    removeTags: prototype.removeTags,
    removeAllTags: prototype.removeAllTags
};

var enableTag = function enableTag(obj) {
    if (obj._tags != undefined) return false;
    var _iteratorNormalCompletion6 = true;
    var _didIteratorError6 = false;
    var _iteratorError6 = undefined;

    try {
        for (var _iterator6 = Object.keys(Tag)[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
            var key = _step6.value;

            obj[key] = Tag[key];
        }
    } catch (err) {
        _didIteratorError6 = true;
        _iteratorError6 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion6 && _iterator6.return) {
                _iterator6.return();
            }
        } finally {
            if (_didIteratorError6) {
                throw _iteratorError6;
            }
        }
    }

    obj._tags = [];
    Object.defineProperty(obj, 'tags', {
        value: obj._tags,
        writable: false
    });
    enableEvent(obj);
    return true;
};

var disableTag = function disableTag(obj) {
    var _iteratorNormalCompletion7 = true;
    var _didIteratorError7 = false;
    var _iteratorError7 = undefined;

    try {
        for (var _iterator7 = Object.keys(Tag)[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
            var key = _step7.value;

            delete obj[key];
        }
    } catch (err) {
        _didIteratorError7 = true;
        _iteratorError7 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion7 && _iterator7.return) {
                _iterator7.return();
            }
        } finally {
            if (_didIteratorError7) {
                throw _iteratorError7;
            }
        }
    }

    disableEvent(obj);
};

var moduleTag = function moduleTag($) {
    var name = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'tag';

    $.enableTag = enableTag;
    $.disableTag = disableTag;

    return {
        name: name,
        unuse: function unuse() {
            delete $.enableTag;
            delete $.disableTag;
        }
    };
};

var $ = {
    TagObject: TagObject,
    enableTag: enableTag,
    disableTag: disableTag,
    moduleTag: moduleTag
};

if (typeof global !== 'undefined' && global) {
    global.jm || (global.jm = {});
    var jm = global.jm;
    if (!jm.TagObject) {
        for (var key in $) {
            jm[key] = $[key];
        }
    }
}

exports.default = $;
module.exports = exports['default'];
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"jm-event":18}],18:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * event module.
 * @module event
 */

/**
 * Class representing an eventEmitter.
 *
 * ```javascript
 * // es6
 * let eventEmitter = new EventEmitter();
 * eventEmitter.on('test', (info) => {
 *      console.log(info);
 * });
 * eventEmitter.once('test', (info) => {
 *      // this will be called only one time
 *      console.log(info);
 * });
 * eventEmitter.one('test', (info) => {
 *      // this will be called first
 *      console.log(info);
 * }, true);
 *
 * eventEmitter.emit('test', 'hello eventEmitter');
 * eventEmitter.off('test');
 * ```
 */
var EventEmitter = function () {

    /**
     * Create an eventEmitter.
     */
    function EventEmitter() {
        _classCallCheck(this, EventEmitter);

        this._events = {};
    }

    /**
     * Adds the listener function to the end of the listeners array for the event named eventName.
     * No checks are made to see if the listener has already been added.
     * Multiple calls passing the same combination of eventName and listener will result in the listener being added, and called, multiple times.
     *
     * @param {*} eventName - event name
     * @param {Function} fn - listener function
     * @param {boolean} [prepend] - Adds to the beginning of the listeners array if true
     * @return {EventEmitter} - for chaining
     */


    _createClass(EventEmitter, [{
        key: 'on',
        value: function on(eventName, fn, prepend) {
            this._events[eventName] || (this._events[eventName] = []);
            if (prepend) {
                this._events[eventName].unshift(fn);
            } else {
                this._events[eventName].push(fn);
            }
            return this;
        }

        /**
         * Adds a one time listener function for the event named eventName.
         * The next time eventName is triggered, this listener is removed and then invoked.
         *
         * @param {*} eventName - event name
         * @param {Function} fn - listener function
         * @param {boolean} [prepend] - Adds to the beginning of the listeners array if true
         * @return {EventEmitter} - for chaining
         */

    }, {
        key: 'once',
        value: function once(eventName, fn, prepend) {
            var _this = this;

            var on = function on(arg1, arg2, arg3, arg4, arg5) {
                _this.off(eventName, on);
                fn(arg1, arg2, arg3, arg4, arg5);
            };
            return this.on(eventName, on, prepend);
        }

        /**
         * Removes a listener for the event named eventName.
         * Removes all listeners from the listener array for event named eventName if fn is null
         * Removes all listeners from the listener array if eventName is null
         *
         * @param {*} [eventName] - event name
         * @param {Function} [fn] - listener function
         * @return {EventEmitter} - for chaining
         */

    }, {
        key: 'off',
        value: function off(eventName, fn) {
            if (!fn) {
                if (eventName === undefined) {
                    this._events = {};
                } else if (this._events && this._events[eventName]) {
                    delete this._events[eventName];
                }
            } else if (this._events && this._events[eventName]) {
                var list = this._events[eventName];
                for (var i = 0; i < list.length; i++) {
                    if (fn === list[i]) {
                        list.splice(i, 1);
                        if (!list.length) {
                            delete this._events[eventName];
                        }
                        break;
                    }
                }
            }
            return this;
        }

        /**
         * Synchronously calls each of the listeners registered for the event named eventName,
         * in the order they were registered, passing the supplied arguments to each.
         *
         * to break the calls, just return false on listener function.
         * ```javascript
         * // es6
         * let eventEmitter = new EventEmitter();
         * eventEmitter.on('test', (info) => {
         *      // this will be called
         *      console.log(info);
         * });
         * eventEmitter.on('test', (info) => {
         *      // this will be called
         *      return false;  // this break the calls
         * });
         * eventEmitter.on('test', (info) => {
         *      // this will not be called.
         *      console.log(info);
         * });
         * eventEmitter.emit('test', 'hello eventEmitter');
         * ```
         * tip: use arg1...arg5 instead of arguments for performance consider.
         *
         * @param {*} eventName - event name
         * @param {*} arg1
         * @param {*} arg2
         * @param {*} arg3
         * @param {*} arg4
         * @param {*} arg5
         * @return {EventEmitter} - for chaining
         */

    }, {
        key: 'emit',
        value: function emit(eventName, arg1, arg2, arg3, arg4, arg5) {
            // using a copy to avoid error when listener array changed
            var listeners = this.listeners(eventName);
            for (var i = 0; i < listeners.length; i++) {
                var fn = listeners[i];
                if (fn(arg1, arg2, arg3, arg4, arg5) === false) break;
            }
            return this;
        }

        /**
         * Returns an array listing the events for which the emitter has registered listeners.
         * The values in the array will be strings or Symbols.
         * @return {Array}
         */

    }, {
        key: 'eventNames',
        value: function eventNames() {
            return Object.keys(this._events);
        }

        /**
         * Returns a copy of the array of listeners for the event named eventName.
         * @param {*} eventName - event name
         * @return {Array} - listener array
         */

    }, {
        key: 'listeners',
        value: function listeners(eventName) {
            var v = this._events[eventName];
            if (!v) return [];
            var listeners = new Array(v.length);
            for (var i = 0; i < v.length; i++) {
                listeners[i] = v[i];
            }
            return listeners;
        }
    }]);

    return EventEmitter;
}();

var prototype = EventEmitter.prototype;
var EM = {
    _events: {},
    on: prototype.on,
    once: prototype.once,
    off: prototype.off,
    emit: prototype.emit,
    eventNames: prototype.eventNames,
    listeners: prototype.listeners
};

var enableEvent = function enableEvent(obj) {
    if (obj.emit !== undefined) return false;
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = Object.keys(EM)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var key = _step.value;

            obj[key] = EM[key];
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    obj._events = {};
    return true;
};

var disableEvent = function disableEvent(obj) {
    if (obj.emit === undefined) return;
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
        for (var _iterator2 = Object.keys(EM)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var key = _step2.value;

            delete obj[key];
        }
    } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
            }
        } finally {
            if (_didIteratorError2) {
                throw _iteratorError2;
            }
        }
    }
};

var moduleEvent = function moduleEvent(obj) {
    var name = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'event';

    obj.enableEvent = enableEvent;
    obj.disableEvent = disableEvent;

    return {
        name: name,
        unuse: function unuse() {
            delete obj.enableEvent;
            delete obj.disableEvent;
        }
    };
};

var $ = {
    EventEmitter: EventEmitter,
    enableEvent: enableEvent,
    disableEvent: disableEvent,
    moduleEvent: moduleEvent
};

if (typeof global !== 'undefined' && global) {
    global.jm || (global.jm = {});
    var jm = global.jm;
    if (!jm.EventEmitter) {
        for (var key in $) {
            jm[key] = $[key];
        }
    }
}

exports.default = $;
module.exports = exports['default'];
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],19:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var cloneDeep = function cloneDeep(obj) {
  if ((typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) !== 'object' || !obj) return obj;
  if (Array.isArray(obj)) {
    var _ret = [];
    obj.forEach(function (item) {
      _ret.push(cloneDeep(item));
    });
    return _ret;
  }
  var ret = {};
  var keys = Object.keys(obj);
  keys.forEach(function (key) {
    ret[key] = cloneDeep(obj[key]);
  });
  return ret;
};

var merge = function merge(obj1, obj2) {
  if ((typeof obj1 === 'undefined' ? 'undefined' : _typeof(obj1)) !== 'object' || !obj1) return obj1;
  if (Array.isArray(obj1)) {
    obj2.forEach(function (item) {
      if (obj1.indexOf(item) === -1) {
        obj1.push(item);
      }
    });
    return obj1;
  }
  var keys = Object.keys(obj2);
  keys.forEach(function (key) {
    if (obj1[key] && _typeof(obj1[key]) === 'object' && _typeof(obj2[key]) === 'object') {
      merge(obj1[key], obj2[key]);
    } else {
      obj1[key] = obj2[key];
    }
  });
  return obj1;
};

var utils = {
  // 高效slice
  slice: function slice(a, start, end) {
    start = start || 0;
    end = end || a.length;
    if (start < 0) start += a.length;
    if (end < 0) end += a.length;
    var r = new Array(end - start);
    for (var i = start; i < end; i++) {
      r[i - start] = a[i];
    }
    return r;
  },

  formatJSON: function formatJSON(obj) {
    return JSON.stringify(obj, null, 2);
  },

  getUriProtocol: function getUriProtocol(uri) {
    if (!uri) return null;
    return uri.substring(0, uri.indexOf(':'));
  },

  getUriPath: function getUriPath(uri) {
    var idx = uri.indexOf('//');
    if (idx === -1) return '';
    idx = uri.indexOf('/', idx + 2);
    if (idx === -1) return '';
    uri = uri.substr(idx);
    idx = uri.indexOf('#');
    if (idx === -1) idx = uri.indexOf('?');
    if (idx !== -1) uri = uri.substr(0, idx);
    return uri;
  },

  cloneDeep: cloneDeep,

  merge: merge
};

var moduleUtils = function moduleUtils() {
  var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'utils';

  var app = this;
  app[name] = utils;

  return {
    name: name,
    unuse: function unuse() {
      delete app[name];
    }
  };
};

var $ = {
  utils: utils,
  moduleUtils: moduleUtils
};

if (typeof global !== 'undefined' && global) {
  global.jm || (global.jm = {});
  var jm = global.jm;
  if (!jm.utils) {
    for (var key in $) {
      jm[key] = $[key];
    }
  }
}

exports.default = $;
module.exports = exports['default'];
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],20:[function(require,module,exports){
module.exports=require(16)
},{}],21:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
var utils = {
    // 高效slice
    slice: function slice(a, start, end) {
        start = start || 0;
        end = end || a.length;
        if (start < 0) start += a.length;
        if (end < 0) end += a.length;
        var r = new Array(end - start);
        for (var i = start; i < end; i++) {
            r[i - start] = a[i];
        }
        return r;
    },

    formatJSON: function formatJSON(obj) {
        return JSON.stringify(obj, null, 2);
    },

    getUriProtocol: function getUriProtocol(uri) {
        if (!uri) return null;
        return uri.substring(0, uri.indexOf(':'));
    },

    getUriPath: function getUriPath(uri) {
        var idx = uri.indexOf('//');
        if (idx == -1) return '';
        idx = uri.indexOf('/', idx + 2);
        if (idx == -1) return '';
        uri = uri.substr(idx);
        idx = uri.indexOf('#');
        if (idx == -1) idx = uri.indexOf('?');
        if (idx != -1) uri = uri.substr(0, idx);
        return uri;
    }
};

var moduleUtils = function moduleUtils() {
    var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'utils';

    var app = this;
    app[name] = utils;

    return {
        name: name,
        unuse: function unuse() {
            delete app[name];
        }
    };
};

var $ = {
    utils: utils,
    moduleUtils: moduleUtils
};

if (typeof global !== 'undefined' && global) {
    global.jm || (global.jm = {});
    var jm = global.jm;
    if (!jm.utils) {
        for (var key in $) {
            jm[key] = $[key];
        }
    }
}

exports.default = $;
module.exports = exports['default'];
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[2])