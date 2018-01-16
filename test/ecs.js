import Game from '../src'
import log from 'jm-logger'
import { utils } from 'jm-utils'
import _ from 'lodash'

let game = new Game({interval: 100})
let logger = log.getLogger('game')

let area = null
let player = null

function init () {
  if (area && player) return Promise.resolve()
  return Promise.resolve()
    .then(function () {
      return game.createArea()
    })
    .then(function (_area) {
      area = _area
      area.id = 1
      return area.createPlayer()
    })
    .then(function (_player) {
      player = _player
      player.id = 2
      return player
    })
}

describe('game', function () {
  it('area.toJSON', function (done) {
    init()
      .then(function () {
        logger.info(utils.formatJSON(area.toJSON()))
        done()
      })
  })

  it('player.remove', function (done) {
    init()
      .then(function () {
        player.removeFromParent()
        logger.info(utils.formatJSON(area.toJSON()))
        done()
      })
  })

  it('update', function (done) {
    init()
      .then(function () {
        let t = 0
        area.em.on('update', function (fDelta, nDelta) {
          t += nDelta
          logger.info('t: %j fDelta: %j nDelta: %j', t, fDelta, nDelta)
          if (t >= 1000) {
            done()
          }
        })
      })
  })

})
