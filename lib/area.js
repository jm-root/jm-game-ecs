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