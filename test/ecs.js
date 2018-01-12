import Game from '../src'
import log from 'jm-logger'
import { utils } from 'jm-utils'
import _ from 'lodash'

let game = new Game({interval: 100})
let logger = log.getLogger('game')

let area = game.createArea()
area.id = 1
let em = area.em
let player = em.createEntity('player')
player.id = 2

describe('game', function () {
  it('area.toJSON', function (done) {
    logger.info(utils.formatJSON(area.toJSON()))
    done()
  })

  it('player.toJSON', function (done) {
    done()
  })

  it('player.remove', function (done) {
    player.removeFromParent()
    logger.info(utils.formatJSON(area.toJSON()))
    done()
  })

  it('update', function (done) {
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
