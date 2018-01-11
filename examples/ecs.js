if (typeof module !== 'undefined' && module.exports) {
  require('../')
}
var ecs = jm.game.ecs()
var area = ecs.createArea()
var em = area.em
var player = em.createEntity('player')

console.info('ecs: %j', ecs)
console.info('em: %j', em)
console.info('area: %j', area)
console.info('player: %j', player)
