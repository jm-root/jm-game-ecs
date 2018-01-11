import chai from 'chai'
import _ecs from '../src'
import log from 'jm-logger'
import {utils} from 'jm-utils'

let expect = chai.expect
let ecs = _ecs()
let logger = log.getLogger('player')

let area = ecs.createArea()
area.id = 1
let em = area.em
let player = em.createEntity('player')
player.id = 2

describe('ecs', function () {
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
