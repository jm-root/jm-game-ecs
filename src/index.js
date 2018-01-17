/**
 * 每个游戏管理多个 area
 *
 * 为了简单，设计上 em 与 area 一对一， 即每个 em 只有一个 area，保证了每个 em 中的实体都是 area 或者 属于 area 的实体
 *
 * area 和 player 都有唯一 id, 可以根据 id 搜索到
 *
 */
import Area from './area'
import Player from './player'
import ECS from 'jm-ecs'
import log from 'jm-logger'
import { utils } from 'jm-utils'

let logger = log.getLogger('jm-game-ecs')

const State = {
  closed: 0, // 关闭
  open: 1, // 开放
  paused: 2 // 暂停
}

/**
 * represent a game
 */
class Game extends ECS {
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
  constructor (opts = {}) {
    super()
    this.State = State
    this.state = State.closed
    this.areas = []
    this.uses([{class: Area}, {class: Player}])
    this.entityTypes = {
      area: {
        components: {
          area: {}
        }
      },
      player: {
        components: {
          player: {}
        }
      }
    }
    this.on('em', function (em) {
      em.addEntityTypes(this.entityTypes)
    }.bind(this))
    if (!opts.disableAutoOpen) {
      this.open(opts)
    }
    Object.defineProperty(this, 'players', {
      get: function (bJSON = false) {
        let areas = this.areas
        let players = []
        for (let i in areas) {
          let v = areas[i].players
          for (let j in v) {
            players.push(v[j])
          }
        }
        return players
      }.bind(this)
    })
  }

  /**
   * update the game
   * @param fDelta 单位秒
   * @param nDelta 单位毫秒
   */
  update (fDelta = 0, nDelta) {
    if (this.state !== State.open) return true
    nDelta || (nDelta = parseInt(fDelta * 1000))
    let areas = this.areas
    for (let i in areas) {
      let e = areas[i]
      e.em.emit('update', fDelta, nDelta)
    }
    return true
  }

  /**
   * open the game
   * @param opts
   * @returns {boolean}
   */
  open (opts = {}) {
    if (this.state !== State.closed) {
      logger.warn('game not in closed, can not be open')
      return false
    }
    this.state = State.open
    this.emit('open')
    logger.info('game open')
    let interval = opts.interval
    if (interval) {
      this._updateTime = Date.now()
      this._timer = setInterval(function () {
        let t = Date.now()
        let nDelta = t - this._updateTime
        let fDelta = nDelta / 1000
        this._updateTime = t
        this.update(fDelta, nDelta)
      }.bind(this), interval)
    }
    return true
  }

  /**
   * close the game
   * @returns {boolean}
   */
  close () {
    if (this.state !== State.open && this.state !== State.paused) {
      logger.warn('game not in open or paused, can not be close')
      return false
    }
    this.state = State.closed
    if (this._timer) {
      clearInterval(this._timer)
      this._timer = null
    }
    this.emit('close')
    logger.info('game closed')
    return true
  }

  /**
   * pause the game, stop update
   * @returns {boolean}
   */
  pause () {
    if (this.state !== State.open) {
      logger.warn('game not in open, can not be paused')
      return false
    }
    this.state = State.paused
    this.emit('pause')
    logger.info('game paused')
    return true
  }

  resume () {
    if (this.state !== State.paused) {
      logger.warn('game not in paused, can not be resume')
      return false
    }
    this.state = State.open
    this.emit('resume')
    logger.info('game resumed')
    return true
  }

  /**
   * create an area
   * @param opts
   * @returns {Promise}
   */
  createArea (opts = {}) {
    let areas = this.areas
    let em = this.em()
    let e = em.createEntity('area', opts)
    areas.push(e)
    em.area = e
    this.emit('addArea', e, opts)
    e.on('remove', function () {
      this.emit('removeArea', e)
      let idx = this.areas.indexOf(e)
      if (idx !== -1) this.areas.splice(idx, 1)
      logger.info('remove area: %s', utils.formatJSON(e.toJSON()))
    }.bind(this))
    return Promise.resolve()
      .then(function () {
        if (e.init) return e.init(opts)
        return e
      })
      .then(function () {
        logger.info('add area: %s', utils.formatJSON(e.toJSON()))
        return e
      })
  }

  /**
   * find area by area.id
   * @param id
   * @returns {*}
   */
  findArea (id) {
    for (let i in this.areas) {
      let area = this.areas[i]
      if (area.id === id) return area
    }
    return null
  }

  /**
   * find player by player.id
   * @param id
   * @returns {*}
   */
  findPlayer (id) {
    let areas = this.areas
    for (let i in areas) {
      let player = areas[i].findPlayer(id)
      if (player) return player
    }
    return null
  }
}

if (typeof global !== 'undefined' && global) {
  global.jm || (global.jm = {})
  let jm = global.jm
  if (!jm.game) {
    jm.Game = Game
    jm.game = (opts) => {
      return new Game(opts)
    }
  }
}

export default Game
