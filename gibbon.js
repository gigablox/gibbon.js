class Gibbon {
  constructor() {
    this.states = {}
    this.destroyWorker()
  }

  define(state, components) {
    var stateParts = state.split('.')
    var isChild = stateParts.length > 1
    var parent = isChild ? stateParts.slice(0, (stateParts.length - 1)).join('.') : null
    var base = isChild ? stateParts[0] : state

    this.states[state] = {
      name: state,
      base: base,
      parent: parent,
      children: {},
      instances: {},
      components: components || [],
    }

    if (isChild) {
      this.states[parent].children[state] = true
    }
  }

  go(targetState) {
    var targetStateParts = targetState.split('.')
    var baseState = targetStateParts[0]

    var destroyStates = () => {
      var childrenToDestroy = []
      var activeChildren = this.activeChildren(baseState)
      var targetStateParts = targetState.split('.')

      activeChildren.forEach((activeChild) => {
        var activeChildParts = activeChild.split('.')
        var matchCount = 0
        for (var i in activeChildParts) {
          matchCount = activeChildParts[i] === targetStateParts[i] ? matchCount + 1 : matchCount
        }
        if (activeChildParts.length !== matchCount) {
          childrenToDestroy.unshift(activeChild)
        }
        if (activeChild === targetState) {
          childrenToDestroy.unshift(activeChild)
        }
      })

      for (var i = 0; i < childrenToDestroy.length; i++) {
        this.states[childrenToDestroy[i]].active = false
      }

      this.destroyStates()
    }

    var pushStates = () => {
      var stateTree = this.stateTree(targetState)
      stateTree.forEach((treeState) => {
        var treeStateActive = this.states[treeState].active
        if (!treeStateActive) {
          this.create(treeState)
        }
      })
    }

    destroyStates()
    pushStates()
  }

  create(id) {
    const instanceId = this.createInstanceId()
    this.states[id].instances[instanceId] = {}
    this.states[id].instanceId = instanceId
    this.current = this.states[id]

    this.states[id].components.forEach((component) => {
      this.loadComponent(component, id)
    })

    this.stateChange(this.states[id])
  }

  createInstanceId() {
    const result = []
    let strLength = 6
    const charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    while (strLength--) { result.push(charSet.charAt(Math.floor(Math.random() * charSet.length))) }
    return result.join('')
  }

  destroyWorker() {
    this.destroyInterval = setInterval(() => {
      this.destroyStates()
    }, 100)
  }

  destroyStates(){
    for (const id in this.states) {
      for (const instanceId in this.states[id].instances) {
        if (this.states[id].instanceId !== instanceId || !this.states[id].active) {
          for (const componentName in this.states[id].instances[instanceId]) {
            const component = this.states[id].instances[instanceId][componentName]
            const isAsync = component.hasOwnProperty('resolved')

            if (!isAsync || (isAsync && component.resolved)) {
              component.destroy()
              delete this.states[id].instances[instanceId][componentName]
            }
          }
        }

        if (!Object.keys(this.states[id].instances[instanceId]).length) {
          delete this.states[id].instances[instanceId]
        }
      }
    }
  }

  loadComponent(constructor, id) {
    const component = new constructor()
    const name = component.constructor.name
    const instanceId = this.states[id].instanceId
    this.states[id].instances[instanceId][name] = component
  }

  isActive(state) {
    return this.states[state].active
  }

  dispatchEvent(event, state) {
    document.dispatchEvent(new CustomEvent(event, {
      detail: state
    }))
  }

  stateTree(targetState, arr) {
    arr = arr || []
    var parts = targetState.split('.')

    if (this.states[targetState]) {
      arr.unshift(targetState)
      parts.pop()
      return this.stateTree(parts.join('.'), arr)
    } else {
      return arr
    }
  }

  activeChildren(targetState, arr) {
    arr = arr || []

    if (this.states[targetState] && this.isActive(targetState)) {
      arr.push(targetState)
      var firstActiveChild
      var children = Object.keys(this.states[targetState].children)

      children.forEach((d) => {
        if (this.isActive(d)) {
          firstActiveChild = this.states[d].name
        }
      })

      if (firstActiveChild) {
        return this.activeChildren(firstActiveChild, arr)
      } else {
        return arr
      }
    } else {
      return arr
    }
  }

  stateChange(state) {
    this.states[state.name].active = true
    this.dispatchEvent('stateChange', state)
  }

  destroy(){
    if(this.destroyInterval){
      clearInterval(this.destroyInterval)
    }
  }
}
