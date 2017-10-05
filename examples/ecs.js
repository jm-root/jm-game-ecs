if (typeof module !== 'undefined' && module.exports) {
  require('../')
}
var ecs = jm.ecs()
var em = ecs.em()

// 手动创建实体
var e = em.e()
e.use('component', {value: 1})
e.use('component', {value: 2}, 'c2')
em.addEntity(e, 'test2')

// 通过entityType创建实体
em.addEntityType('test', {
  components: {
    component: {},
    c1: {
      className: 'component'
    }
  }
})
var e2 = em.createEntity('test')

console.info('ecs: %j', ecs)
console.info('em: %j', em)
console.info('e: %j', e)

em.update(0)
