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