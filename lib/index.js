'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _area = require('./area');

var _area2 = _interopRequireDefault(_area);

var _player = require('./player');

var _player2 = _interopRequireDefault(_player);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ecs = { Area: _area2.default, Player: _player2.default };
exports.default = ecs;
module.exports = exports['default'];