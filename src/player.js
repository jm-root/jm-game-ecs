import ECS from 'jm-ecs'

class C extends ECS.C {
  constructor (e, opts) {
    super(e, opts)

    opts.id && (e.id = opts.id)

    e.toJSON = function () {
      let o = {
        type: this.type,
        entityId: this.entityId,
        id: this.id
      }
      this.emit('toJSON', o)
      return o
    }
  }

  get className () {
    return C.className || C.name
  }
}

C.className = 'player'
C.singleton = true

export default C
