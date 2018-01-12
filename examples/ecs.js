if (typeof module !== 'undefined' && module.exports) {
  require('../')
}
var game = jm.game()
var area = game.createArea()
var em = area.em
var player = em.createEntity('player')

console.info('game: %j', game)
console.info('em: %j', em)
console.info('area: %j', area)
console.info('player: %j', player)
