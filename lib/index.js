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

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

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
      if (!em.entityType('area')) {
        em.addEntityType('area', {
          components: {
            area: {}
          }
        });
      }
      if (!em.entityType('player')) {
        em.addEntityType('player', {
          components: {
            player: {}
          }
        });
      }
      var e = em.createEntity('area', opts);
      areas.push(e);
      em.area = e;
      this.emit('addArea', e, opts);
      e.on('remove', function () {
        this.emit('removeArea', e);
        _lodash2.default.pull(this.areas, e);
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
      return _lodash2.default.find(this.areas, { id: id });
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