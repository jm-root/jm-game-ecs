import ECS from 'jm-ecs'
import log from 'jm-logger'
import {utils} from 'jm-utils'
import _ from 'lodash'

let logger = log.getLogger('area')

const State = {
  closed: 0, // 关闭
  open: 1,   // 开放
  paused: 2   // 暂停
}

class C extends ECS.C {
  constructor (e, opts = {}) {
    super(e, opts)

    opts.id && (e.id = opts.id)
    e.State = State
    e.maxPlayers = opts.maxPlayers || 5 // 最大玩家数上限
    e.runTime = 0 // 运行时间
    e.ticks = 0 // 更新次数
    e.players = {} // 所有玩家
    e.state = State.closed

    Object.defineProperty(e, 'entities', {
      get: function (bJSON = false) {
        let v = this.em.entities
        let ret = []
        for (let key in v) {
          let o = v[key]
          if (o === this) continue
          if (bJSON) {
            ret.push(o.toJSON())
          } else {
            ret.push(o)
          }
        }
        return ret
      }.bind(e)
    })
    Object.defineProperty(e, 'totalPlayers', {
      get: function () {
        return Object.keys(this.players).length
      }.bind(e)
    })
    Object.defineProperty(e, 'full', {
      get: function () {
        return this.maxPlayers && this.totalPlayers >= this.maxPlayers
      }.bind(e)
    })
    Object.defineProperty(e, 'empty', {
      get: function () {
        return this.totalPlayers === 0
      }.bind(e)
    })

    e.em.on('addEntity', function (o) {
      o.area = this
      if (o.type === 'player') {
        let players = this.players
        let entityId = o.entityId
        if (players[entityId]) {
          logger.warn('add player twice! player: %s', utils.formatJSON(o.toJSON()))
          return
        }
        players[entityId] = o
        this.emit('addPlayer', o)
        logger.debug('add player: %s', utils.formatJSON(o.toJSON()))
      }
    }.bind(e))

    e.em.on('removeEntity', function (o) {
      if (o.type === 'player') {
        let players = this.players
        let entityId = o.entityId
        if (!players[entityId]) {
          logger.warn('remove player not exists! player: %s', utils.formatJSON(o.toJSON()))
          return
        }
        delete players[entityId]
        this.emit('removePlayer', o)
        logger.debug('remove player: %s', utils.formatJSON(o.toJSON()))
      }
    }.bind(e))

    e.em.on('update', function (fDelta, nDelta) {
      if (this.state !== State.open) return
      this.runTime += nDelta
      this.ticks++
    }.bind(e))

    e.copyPlayers = function (bJSON = false) {
      let v = this.players
      let ret = []
      for (let key in v) {
        let o = v[key]
        if (bJSON) {
          ret.push(o.toJSON())
        } else {
          ret.push(o)
        }
      }
      return ret
    }

    /**
     * remove entities
     * @param v
     */
    e.removeEntities = function (v) {
      for (let i in v) {
        v[i].removeFromParent()
      }
    }

    /**
     * remove entities by type
     * @param type
     */
    e.removeEntitiesByType = function (type) {
      let v = this.entities
      for (let i in v) {
        let o = v[i]
        if (o.type === type) {
          o.removeFromParent()
        }
      }
    }

    e.findPlayerById = function (id) {
      return _.find(this.players, {id})
    }

    e.open = function () {
      if (this.state === State.open) {
        logger.warn('area is already open')
        return false
      }
      this.runTime = 0
      this.ticks = 0
      this.state = State.open
      this.emit('open')
      logger.debug('area %j open', this.id)
      return true
    }

    e.close = function () {
      if (this.state === State.closed) {
        logger.warn('area is already closed')
        return false
      }
      this.state = State.closed
      this.clear()
      this.emit('close')
      logger.debug('area %j closed', this.id)
      return true
    }

    e.pause = function () {
      if (this.state === State.paused) {
        logger.warn('area is already paused')
        return false
      }
      if (this.state === State.closed) {
        logger.warn('area is closed, can not be pause')
        return false
      }
      this.state = State.paused
      this.emit('pause')
      logger.debug('area %j paused', this.id)
      return true
    }

    e.resume = function () {
      if (this.state !== State.paused) {
        logger.warn('area is not paused, can not be resume')
        return false
      }
      this.state = State.open
      this.emit('resume')
      logger.debug('area %j resumed', this.id)
      return true
    }

    e.clear = function () {
      let entities = this.entities
      for (let id in entities) {
        let o = entities[id]
        o.removeFromParent()
      }
    }

    e.toJSON = function () {
      let o = {
        type: this.type,
        entityId: this.entityId, // 实体id
        id: this.id,
        state: this.state, // 当前状态
        runTime: this.runTime, // 运行时间
        totalPlayers: this.totalPlayers, // 当前房间玩家数
        maxPlayers: this.maxPlayers, // 房间最大人数上限
        players: this.copyPlayers(true) // 玩家列表
      }
      this.emit('toJSON', o)
      return o
    }
  }

  get className () {
    return C.className || C.name
  }
}

C.className = 'area'
C.singleton = true
export default C
