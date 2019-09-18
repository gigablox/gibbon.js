class $State {
	
	constructor(){
		this.ques = {}
		this.states = {}
		this.routeMap = {}
		this.routeWrites = {}
    this.firstLoad = true
		this.bindStateLoadingEvent()
		this.bindStateLoadedEvent()
		this.startQue()
	}

	routeRewrite(route, newRoute){
    this.routeWrites[route] = newRoute
  }

  routeInterceptor (popState){
    var route = location.pathname
    var state = this.routeWrites[route] || this.routeMap[route] || null
    if(state && this.states[state]){
      this.go(state, {nonClickEvent: popState})
    }
  }

  routeUpdate (route){
    if(window.isCordova){
      return
    }
    if(this.firstLoad){
      window.history.replaceState(null, null, route)
      this.firstLoad = false
    }
    else{
      window.history.pushState(null, null, route)
    }
  }

  routeInit (){
    if(window.isCordova){
      return
    }
    setTimeout(() => {
      window.onpopstate = function(e) {
        this.routeInterceptor(true)
      }
    },100)
  }

	define(state, config){

		config = config || {}

		var stateParts = state.split(".")
		var isChild = stateParts.length > 1
		var parent = isChild ? stateParts.slice(0, (stateParts.length - 1)).join(".") : null
		var base = isChild ? stateParts[0] : state

		this.ques[base] = this.ques[base] || []

		this.states[state] = {
			name: state,
			isChild: isChild,
			base: base,
			parent: parent,
			children: {},
			route: config.route || null,
			resolves: config.resolves || [],
			components: config.components || [],
			template: config.template || null,
			target: config.target || null,
			constructed: {}
		}

		if(isChild){
			this.states[parent].children[state] = true
		}

		if(config.route){
			this.routeMap[config.route] = state
		}
	}
	
	startQue(){
		setInterval(() => {
			for(var i in this.ques){
				var que = this.ques[i]
				if(que[0] && !this.isLoading(que[0])){
					this.build(que[0])
				}
			}
		}, 100)
	}

	go(targetState, config){

		var config = config || {}
		var targetStateParts = targetState.split('.')
		var baseState = targetStateParts[0]

		this.dispatchEvent('stateGo', this.states[targetState])
		
		if(this.states[targetState].active){
			return
		}

		var routerUpdate = () => {
			if(this.states[targetState].route && !config.nonClickEvent){
				this.routeUpdate(this.states[targetState].route)
			}
		}

		var destroyStates = () => {
			var childrenToDestroy = []
			var activeChildren = this.activeChildren(baseState)
			activeChildren.forEach((d) => {
				if(!targetState.includes(d)){
					childrenToDestroy.unshift(d)
				}
			})
			for(var i = 0; i < childrenToDestroy.length; i++){
				this.destroy(childrenToDestroy[i])
			}
		}

		var cleanStates = () => {

			var statesWithEqualLength = []
			var statesWithLesserLength = []
			var statesWithGreaterLength = []
			var queParts = this.ques[baseState].map((d) => { return d.split('.').length })

			queParts.forEach((length, i) => {
				if(length < targetStateParts.length){
					statesWithLesserLength.push(this.ques[baseState][i])
				}
				if(length > targetStateParts.length){
					statesWithGreaterLength.push(this.ques[baseState][i])
				}
				if(length == targetStateParts.length){
					statesWithEqualLength.push(this.ques[baseState][i])
				}
			})

			statesWithLesserLength.forEach((state) => {
				var i = this.ques[baseState].indexOf(state)
				if(i === 0 && !targetState.includes(state)){
					this.states[this.ques[baseState][i]].clean = true
				}
				else{
					this.ques[baseState].splice(i,1)
				}
			})

			statesWithGreaterLength.forEach((state) => {
				var i = this.ques[baseState].indexOf(state)
				if(i === 0){
					this.states[this.ques[baseState][i]].clean = true
				}
				else{
					this.ques[baseState].splice(i,1)
				}
			})

			statesWithEqualLength.forEach((state) => {
				var i = this.ques[baseState].indexOf(state)
				if(i === 0){
					this.states[this.ques[baseState][i]].clean = (targetState !== state) ? true : false
				}
				else{
					this.ques[baseState].splice(i,1)
				}
			})
		}
		
		var pushStates = () => {
			var stateTree = this.stateTree(targetState)
			stateTree.forEach((treeState) => {
				var queHasTreeState = this.ques[baseState].includes(treeState)
				var treeStateLoading = this.states[treeState].loading
				var treeStateActive = this.states[treeState].active
				if(!queHasTreeState && !treeStateLoading && !treeStateActive){
					this.ques[baseState].push(treeState)
				}
			})
		}

		routerUpdate()
		destroyStates()
		cleanStates()
		pushStates()
	}

	build (state){

		var resolvePromises = []
		var id = state

		this.dispatchEvent('stateLoading', this.states[id])

		this.buildTemplate(id)

		this.states[id].resolves.forEach((_resolve) => {
			resolvePromises.push(_resolve())
		})

		return Promise.all(resolvePromises).then(() => {

			this.states[id].components.forEach((component) => {
				this.loadComponent(component, id)
			})

			this.dispatchEvent('stateLoaded', this.states[id])
		})
	}

	destroy(state){
		this.destroyComponents(state)
		this.destroyTemplate(state)
		this.states[state].active = false
		this.states[state].clean = false
	}

	loadComponent(constructor, id){
		var component = new constructor(document.querySelector(this.states[id].target))
		var name = component.constructor.name
		this.states[id].constructed[name] = component
	}

	destroyComponents(id){
		for(var i in this.states[id].constructed){
			var component = this.states[id].constructed[i]
			if(component.onDestroy){
				component.onDestroy()	
			}
			if(component.handle){
				component.handle.remove()	
			}
			delete this.states[id].constructed[i]
		}
	}

	buildTemplate(id){
		var target = document.querySelector(this.states[id].target)
		if(this.states[id].template){
			target.insertAdjacentHTML('beforeend', this.states[id].template)
			this.states[id].handle = target.lastElementChild
		}
	}

	destroyTemplate(id){
		if(this.states[id].handle){
			this.states[id].handle.remove()
		}
	}

	destroyAll(baseState){
		var activeChildren = (this.activeChildren(baseState)).reverse()
		for(var i = 0; i < activeChildren.length; i++){
			this.destroy(activeChildren[i])
		}
	}

	isLoading(state){
		return this.states[state].loading
	}

	isActive (state){
		return this.states[state].active
	}

	dispatchEvent (event, state){
	  document.dispatchEvent(new CustomEvent(event, { detail: state }))
	}

	stateTree (targetState, arr){
		
		arr = arr || []
		var parts = targetState.split(".")

		if(this.states[targetState]){
			arr.unshift(targetState)
			parts.pop()
			return this.stateTree(parts.join("."), arr)
		}
		else{
			return arr
		}
	}

	activeChildren(targetState, arr){
		
		arr = arr || []

		if(this.states[targetState] && this.isActive(targetState)){

			arr.push(targetState)
			var firstActiveChild
			var children = Object.keys(this.states[targetState].children)

			children.forEach((d) => {
				if(this.isActive(d)){
					firstActiveChild = this.states[d].name
					return
				}
			})

			if(firstActiveChild){
				return this.activeChildren(firstActiveChild, arr)
			}
			else{
				return arr
			}
		}
		else{
			return arr
		}
	}

	loadingChildren(targetState, arr){

		arr = arr || []
		var children = Object.keys(this.states[targetState].children)

		if(this.isLoading(targetState)){
			arr.push(targetState)
		}

		if(this.states[targetState] && children.length){
			children.forEach((d) => {
				this.loadingChildren(d, arr)
			})
		}

		return arr
	}

	bindStateLoadingEvent(){
		document.addEventListener("stateLoading", (event) => {
			var state = event.detail
			this.states[state.name].loading = true
		})
	}

	bindStateLoadedEvent(){
		document.addEventListener("stateLoaded", (event) => {

			var state = event.detail
			this.states[state.name].loading = false
			this.states[state.name].active = true
			this.ques[state.base].shift()

			if(this.states[state.name].clean){
				this.destroy(state.name)
			}
		})
	}
}