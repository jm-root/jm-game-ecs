import ECS from 'jm-ecs'

class Player extends ECS.C {
  constructor (e, opts) {
    super(e, opts)
  }
}

Player.class = 'player'

export default Player
