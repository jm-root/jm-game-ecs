import chai from 'chai'
import Player from '../src/player'

let expect = chai.expect
let e = {}
let opts = {
  abc: 123
}
let o = new Player(e, opts)
console.log('%j', Player)
console.log('%j', o)

describe('Player', function () {
  it('name', function (done) {
    expect(o.name === 'component').to.be.ok
    done()
  })

  it('toJSON', function (done) {
    expect(o.toJSON()).to.be.ok
    done()
  })

  it('destroy', function (done) {
    o.on('destroy', function (v) {
      expect(o === v).to.be.ok
      done()
    })
    o.destroy()
  })
})
