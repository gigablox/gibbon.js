
# state.js
Fast, minimal, native JavaScript framework.


## Why
You prefer writing native JavaScript over framework code but still want just enough help with complex state management. 

You value flexibility and portability and want to avoid running into walls that come with opinionated framework abstractions later on in the development lifecycle. 

You think the inter-module communication and data layer mediation depends on the shape of the application. You would rather roll your own.

## Sites that use it

[![https://eloot.gg](https://i.imgur.com/xdHTW2f.png)](https://eloot.gg)


## Key Concepts
A state describes a group of components that are constructed during your state instantiation.

A `target` is passed into the constructor of each component.

### target
A query selector. `document.querySelector(target)`

### template `<String>` (optional)
A HTML fragment appended to your `target`.  
Useful when child states or modules of your state need a unique layout.

### route `<String>` (optional)
A push state route bound to your state. `history.pushState(route)`

### resolves `<Array>` (optional)
An `Array` of `Function` that return a `Promise`. Useful when many modules depend on the same data.

### components `<Array>` (optional)
An `Array` of `Class` that are constructed during your state instantiation.  
A `target` is passed into the constructor of each module.


## Quick Start
```
var $state = new $State()

$state.define('app', {
  target: 'body',
  template: `
    <div id="app">
      <div class="content"></div>
    </div>
  `,
  components: [ Header ]
})

$state.define('app.home', {
  target: '#app > .content',
  route: '/home',
  components: [ Chat ]
})

$state.go('app.home')
```


## Components
```
class Header{
  constructor(target){
    this.handle = document.createElement('div')
    this.handle.id = 'header'
    target.appendChild(this.handle)
  }
}

class Chat{
  constructor(target){
    this.handle = document.createElement('div')
    this.handle.id = 'chat'
    target.appendChild(this.handle)
  }
  onDestroy(){
    //Optional - called during state transition.
  }
}
```


## Events

### `stateLoading`
Emits the `<State>` object being resolved during transition.

### `stateLoaded`
Emits the `<State>` object that has fully resolved.


### `<State>` object
  
```
{
  name: <String>,
  isChild: <Bool>,
  base: <String>,
  parent: <String>,
  children: <Object>,
  route: <String> || null,
  resolves: <Array>,
  components: <Array>,
  template: <String> || null,
  target: <String>,
  constructed: <Object> 
}
```


## Parallelism
```
$state.define('app1', {
  target: 'body',
  template: `<div id="app1"></div>`
})

$state.define('app2', {
  target: 'body',
  template: `<div id="app2"></div>`
})
```
