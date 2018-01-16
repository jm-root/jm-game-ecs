if (typeof module !== 'undefined' && module.exports) {
  require('../')
}
var game = jm.game()
console.info('game: %s', JSON.stringify(game))

game.createArea()
  .then(function (area) {
    console.info('area: %j', JSON.stringify(area))
    return area.createPlayer()
  })
  .then(function (player) {
    console.info('player: %j', JSON.stringify(player))
  })
