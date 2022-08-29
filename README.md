# gibbon.js
![GibbonJS](https://github.com/gigablox/gibbon.js/raw/master/gibbon.jpg)  
Flexible JavaScript framework.

## Introduction
In application frameworks state management is used to instantiate and destroy a collection of components and services.

Many frameworks go further than this to enforce patterns for how you manage data, write components, declare your routing etc.

**Gibbon only provides a framework for state management.**

## Quick Start
```js
var gibbon = new Gibbon()

class Header{
  constructor(){
    this.handle = document.createElement(`div`)
    this.handle.id = `header`
    document.body.appendChild(this.handle)
  }
}

class About{
  constructor(){
    this.handle = document.createElement(`div`)
    this.handle.id = `about`
    this.handle.innerHTML = `<h1>Swing like noboby is watching.</h1>`
    document.body.appendChild(this.handle)
  }
}

gibbon.define('app', [ Header ])
gibbon.define('app.home', [ About ])

gibbon.go('app.home')
```

## API

### gibbon.define(name, components)
Defines a new state that can be instantiated.

#### Arguments

##### name `<String>`
The `name` argument is used to define a state. Compose child states using `.` as a separator.

##### components `<Array>`
The `components` argument is used to configure a state with an array of [Component](https://github.com/gigablox/gibbon.js/edit/master/README.md#component). 

#### Example
```js
gibbon.define('app', [ Header ])
gibbon.define('app.home', [ About ])
``` 

### gibbon.go(name)
Instantiates a defined state.

##### name `<String>`
The `name` argument is used to define a state.

## Component
A component is a JavaScript [Class](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes).

#### component.resolved `<Bool>`
The `resolved` property is used to indicate a component is asynchronous. 

The [State Lifecycle](https://github.com/gigablox/gibbon.js/edit/master/README.md#state-lifecycle) will wait to destroy components with a property `resolved` until it's set to `true`.

#### component.destroy `<Function>`
The `destroy` function is executed at the end of a [State Lifecycle](https://github.com/gigablox/gibbon.js/edit/master/README.md#state-lifecycle). 

Useful for cleaning up things like event listeners and intervals.

#### Example
```js
class Movies{
  constructor(){
    this.resolved = false
    this.init()
  }
  
  async init(){
    await this.getMovies()
    this.createHandle()
    this.updateMovies()
    this.createMoviesWorker()
    this.resolved = true
  }
  
  createHandle(){
    this.handle = document.createElement('div')
    this.handle.id = 'movies'
    document.body.appendChild(this.handle)
  }
  
  updateMovies(){
    this.handle.innerHTML = `<pre>${JSON.stringify(this.movies)}</pre>`
  }
  
  createMoviesWorker(){
    this.moviesWorker = setInterval(async () => {
      await this.getMovies()
      this.updateMovies()
    }, 10000)
  }
  
  getMovies(){
    this.movies = await fetch('http://example.com/movies.json')
  }
  
  destroy(){
    clearInterval(this.moviesWorker)
  }
}
```

## State Lifecycle
When a state is instansiated is constructs each [Component](https://github.com/gigablox/gibbon.js/edit/master/README.md#component) from the [components array](https://github.com/gigablox/gibbon.js/edit/master/README.md#components-array).

States and their components are automatically destroyed after each transition to the next state.

#### Example
```js
gibbon.define('app', [ Header ])
gibbon.define('app.home', [ About ])
gibbon.define('app.contact', [ EmailForm ])

gibbon.go('app.home')
gibbon.go('app.contact') // 'app.home' is destroyed.
```

This includes top level state trees.

#### Example
```js
gibbon.define('app1', [ Header1 ])
gibbon.define('app1.home', [ About2 ])
gibbon.define('app2', [ Header1 ])
gibbon.define('app2.home', [ About2 ])

gibbon.go('app1.home')
gibbon.go('app2.home') // 'app1' and all its children are destroyed.
```

The same state can be instansiated multiple times in parallel. This is useful when one instance of a state is waiting to be destroyed while another is being created. For example, when a user toggles back and forth between the same pages that have asynchronous dependencies.

#### Example
```js
gibbon.define('app', [ Header ])
gibbon.define('app.home', [ About ])
gibbon.define('app.movies', [ Movies ]) // Movies is an asynchronous component

gibbon.go('app.home')
gibbon.go('app.movies') // This 'app.movies' state has an instance ID of 'e465a2'
gibbon.go('app.home')   // Instance 'e465a2' is still loading and has not yet been destroyed.
gibbon.go('app.movies') // This 'app.movies' state has an instance ID of 'cb198a'. 

// 100ms later
// Instance 'e465a2' has finished loading and is destroyed.
// Instance 'cb198a' has finished loading and is the active state.
```


## Events

### `stateChange`
Emits the `<State>` object that has fully resolved.


## License

[MIT](https://opensource.org/licenses/MIT)

Copyright (c) 2019-present, Daniel Kanze