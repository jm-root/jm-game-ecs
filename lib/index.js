'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _area = require('./area');

var _area2 = _interopRequireDefault(_area);

var _player = require('./player');

var _player2 = _interopRequireDefault(_player);

var _jmEcs = require('jm-ecs');

var _jmEcs2 = _interopRequireDefault(_jmEcs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var $ = function $(opts) {
  var ecs = new _jmEcs2.default().uses([{ class: _area2.default }, { class: _player2.default }]);

  var areas = {};
  ecs.areas = areas;

  ecs.start = function () {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    var interval = opts.interval || 100;
    this.stop();
    this.updateTime = Date.now();
    this.timer = setInterval(function () {
      var t = Date.now();
      var nDelta = t - this.updateTime;
      var fDelta = nDelta / 1000;
      this.updateTime = t;
      for (var id in areas) {
        var e = areas[id];
        e.em.emit('update', fDelta, nDelta);
      }
    }.bind(this), interval);
  };

  ecs.stop = function () {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  };

  ecs.start();

  ecs.createArea = function (opts) {
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
    areas[e.entityId] = e;
    return e;
  };

  ecs.findArea = function (entityId) {
    return areas[entityId];
  };

  ecs.findPlayer = function (entityId) {
    for (var id in areas) {
      var e = areas[id];
      var player = e.players[entityId];
      if (player) return player;
    }
    return null;
  };

  ecs.findPlayerById = function (id) {
    for (var i in areas) {
      var players = areas[i].players;
      for (var j in players) {
        var player = players[j];
        if (player.id === id) return player;
      }
    }
    return null;
  };

  ecs.getPlayers = function () {
    var players = {};
    for (var i in areas) {
      var v = areas[i].players;
      for (var j in v) {
        players[j] = v[j];
      }
    }
    return players;
  };

  return ecs;
}; /**
    * 为了简单，设计上 em 与 area 一对一， 即每个 em 只有一个 area，保证了每个 em 中的实体都是 area 或者 属于 area 的实体
    *
    */


if (typeof global !== 'undefined' && global) {
  !global.jm && (global.jm = {});
  !global.jm.game && (global.jm.game = {});
  global.jm.game.ecs = $;
}

exports.default = $;
module.exports = exports['default'];