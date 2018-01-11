/**
 * 为了简单，设计上 em 与 area 一对一， 即每个 em 只有一个 area，保证了每个 em 中的实体都是 area 或者 属于 area 的实体
 *
 */
import Area from './area'
import Player from './player'
import ECS from 'jm-ecs'

let $ = function (opts) {
  let ecs = new ECS()
    .uses([{class: Area}, {class: Player}])

  let areas = {}
  ecs.areas = areas

  ecs.start = function (opts = {}) {
    let interval = opts.interval || 100
    this.stop()
    this.updateTime = Date.now()
    this.timer = setInterval(function () {
      let t = Date.now()
      let nDelta = t - this.updateTime
      let fDelta = nDelta / 1000
      this.updateTime = t
      for (let id in areas) {
        let e = areas[id]
        e.em.emit('update', fDelta, nDelta)
      }
    }.bind(this), interval)
  }

  ecs.stop = function () {
    if (!this.timer) return
    clearInterval(this.timer)
    this.timer = null
  }

  ecs.start()

  ecs.createArea = function (opts) {
    let em = this.em()
    if (!em.entityType('area')) {
      em.addEntityType('area', {
        components: {
          area: {}
        }
      })
    }
    if (!em.entityType('player')) {
      em.addEntityType('player', {
        components: {
          player: {}
        }
      })
    }
    let e = em.createEntity('area', opts)
    areas[e.entityId] = e
    return e
  }

  ecs.findArea = function (entityId) {
    return areas[entityId]
  }

  ecs.findPlayer = function (entityId) {
    for (let id in areas) {
      let e = areas[id]
      let player = e.players[entityId]
      if (player) return player
    }
    return null
  }

  ecs.findPlayerById = function (id) {
    for (let i in areas) {
      let players = areas[i].players
      for (let j in players) {
        let player = players[j]
        if (player.id === id) return player
      }
    }
    return null
  }

  ecs.getPlayers = function () {
    let players = {}
    for (let i in areas) {
      let v = areas[i].players
      for (let j in v) {
        players[j] = v[j]
      }
    }
    return players
  }

  return ecs
}

if (typeof global !== 'undefined' && global) {
  !global.jm && (global.jm = {})
  !global.jm.game && (global.jm.game = {})
  global.jm.game.ecs = $
}

export default $
