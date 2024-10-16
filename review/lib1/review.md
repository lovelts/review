   
##  react fiber
   
   react fiber react 原有架构 状态更新是，会重新计算整个vdom， 计算完成之后才进行re-render；如果计算量很大，则会阻塞js渲染，就会是页面显示的比较卡顿
   fiber 架构的出现让计算切片，分片计算 vdom ，渲染，切片渲染。问题：切片了怎么找到父节点、兄弟节点，计算vdom时候会添加 sibling 、children，return。

一次性往页面中插入几万个dom节点，页面会卡顿一下然后一次性展示出来，使用了 requestIdlerCallback 主线程空闲的时候去执行一批任务。

## react 代码执行流程

初始化：jsx 代码会经过 babel parse 阶段 经过词法、语法分析转化为 机器可以理解的 AST，然后transform阶段 经过 jsx 的 plugin 等 转化为一颗新的 AST 转化为 React.createElement 的调用，每个标签调用一次 createElement，每个标签调用一次 方法转化为 vdom；
渲染过程 ：react 16.8之后采用 fiber 架构来生成 vdom 并完成真实dom的渲染，把 vdom 转化成成一个个的fiber，通过链表的方式串联 return、child、sibing， 通过 requestIdlerCallback 实现利用线程空余时间执行任务，达到中断的效果，实现了workLoop，循环遍历每个fiber，给fiber打上标签 update、PLACEMENT、deletion，执行对应的操作，比如插入、删除、更新，这个过程叫做调和。所有工作单位都搞定后执行 commit 操作，把vdom变化同步到真实dom；

setState 之后开始执行的流程；初始化：会把所有的 hooks 存在顶层的 wipFiber 上，setState 方法触发之后会把当前state和执行方法存入队列当中，重新设置当前工作单位为 currentRoot，然后 workLoop 重新执行，组件重新渲染，重新执行useState函数 会从 wipFiber.alternate.hooks（双缓存中） 取出上一次的值，并且循环执行queue中的方法，完成 state 计算，对应vdom转化真实 dom

   
## vue 2 defineProperty 和 vue 3 proxy 

defineProperty 需要关心key
前者需要初始化所有的 key ，然后通过 defineProperty 监听，缺点：无法监听数组的变化，初始化key会影响速度。
```js
  proxy 拦截解决 defineProperty 无法监听数组的问题。 proxy 用法：

  new proxy(obj, {
    set: () {

    },
    get: () {

    },
    deleteProperty: () {}
  })
```
```js
const isObject = obj => typeof obj === 'object' && obj !== null

const handler = (obj) => {
  return {
    set: (target, key, value, receiver) => {
      const res = Reflect.set(target, key, value, receiver)
      return res
    },
    get: (target, key, receiver) => {
      const res = Reflect.get(target, key, receiver)
      return isObject(res) ? reactive(res) : res
    },
    deleteProperty(target, key) {
      const res = Reflect.deleteProperty(target, key)
      console.log(`删除${key}: ${res}`)
      return res
    }
  }
}

const reactive = (obj) => {
  if (!isObject(obj)) {
    return obj
  }
  const proxy = new Proxy(obj, handler(obj))
}


```
set、get方法中的receiver参数，更改主体 prototype 变更（继承关系变成）可以传入这个保证跟随变更。

其中 reflect 的作用，对对象进行操作可以知道是否成功，常用的方式 get, set , 报错了不会中断代码执行。例如 操作一个 Object.freeze 冻结的 obj 正常会报错中断后续执行。



uniapp 黑魔法：
怎么修改uniapp
vue 内置标签 如button swiper button 等

isReversedTag 




## js 原型链：
```js
const o = {
  a: 1,
  b: 2,
  // __proto__ 设置了 [[Prototype]]。它在这里被指定为另一个对象字面量。
  __proto__: {
    b: 3,
    c: 4,
    __proto__: {
      d: 5,
    },
  },
};

// { a: 1, b: 2 } ---> { b: 3, c: 4 } ---> { d: 5 } ---> Object.prototype ---> null

console.log(o.d); // 5


class Base {}
class Derived extends Base {}

const obj = new Derived();
// obj ---> Derived.prototype ---> Base.prototype ---> Object.prototype ---> null


// function 写法依然后构造器和class相同
function doSomething() {}
doSomething.prototype.foo = "bar"; // 向原型上添加一个属性
const doSomeInstancing = new doSomething();
doSomeInstancing.prop = "some value"; // 向该对象添加一个属性
console.log(doSomeInstancing);



进阶：
function doSomething() {}
doSomething.prototype.foo = "bar";
const doSomeInstancing = new doSomething();
doSomeInstancing.prop = "some value";
console.log("doSomeInstancing.prop:     ", doSomeInstancing.prop);
console.log("doSomeInstancing.foo:      ", doSomeInstancing.foo);
console.log("doSomething.prop:          ", doSomething.prop);
console.log("doSomething.foo:           ", doSomething.foo);
console.log("doSomething.prototype.prop:", doSomething.prototype.prop);
console.log("doSomething.prototype.foo: ", doSomething.prototype.foo);


doSomeInstancing.prop:      some value
doSomeInstancing.foo:       bar
doSomething.prop:           undefined
doSomething.foo:            undefined
doSomething.prototype.prop: undefined
doSomething.prototype.foo:  bar
```


### 使用不同的方法来创建对象和改变原型链

```js
const o = { a: 1 };
// 新创建的对象 o 以 Object.prototype 作为它的 [[Prototype]]
// Object.prototype 的原型为 null。
// o ---> Object.prototype ---> null

const b = ["yo", "whadup", "?"];
// 数组继承了 Array.prototype（具有 indexOf、forEach 等方法）
// 其原型链如下所示：
// b ---> Array.prototype ---> Object.prototype ---> null

function f() {
  return 2;
}
// 函数继承了 Function.prototype（具有 call、bind 等方法）
// f ---> Function.prototype ---> Object.prototype ---> null

const p = { b: 2, __proto__: o };
// 可以通过 __proto__ 字面量属性将新创建对象的
// [[Prototype]] 指向另一个对象。
// （不要与 Object.prototype.__proto__ 访问器混淆）
// p ---> o ---> Object.prototype ---> null

const d = Object.create(null);
// d ---> null（d 是一个直接以 null 为原型的对象）
Object.setPrototypeOf()
被所有现代引擎所支持。允许动态地修改对象的原型，甚至可以强制为使用 Object.create(null) 创建的无原型对象设置原型。

> 警告： Object.prototype.__proto__ 访问器是非标准的，且已被弃用。你几乎总是应该使用 Object.setPrototypeOf 来代替。

## 结论

了解原型继承模型是使用它编写复杂代码的重要基础。此外，要注意代码中原型链的长度，在必要时可以将其分解，以避免潜在的性能问题。此外，除非是为了与新的 JavaScript 特性兼容，否则永远不应扩展原生原型。


```

### 垃圾回收
引用计数法、这是最初级的垃圾收集算法。
此算法把“对象是否不再需要”简化定义为“对象有没有其他对象引用到它”。如果没有引用指向该对象（零引用），对象将被垃圾回收机制回收。
缺点不能判断循环引用 （过去式）、导致内存泄漏

标记 - 清除算法
这个算法假定设置一个叫做根（root）的对象（在 Javascript 里，根是全局对象）。垃圾回收器将定期从根开始，找所有从根开始引用的对象，然后找这些对象引用的对象……从根开始，垃圾回收器将找到所有可以获得的对象和收集所有不能获得的对象。



## 前端国际化

传统网上常见做法 把字符串转成变量、借助vue-in18n类似插件注册，提取不同语言文件，通过切换语言切换语言包。这种做法很麻烦，需要把需要多语言的字符串都提取出来，到语言包中。如果语言种类多、需要转换的文字多，维护起来很复杂。

开发提效方案：正常开发不做文字处理，在打包时 通过操作 AST ，把中文提取出来 替换为变量，把中文塞入语言包文件当中。


## 项目管理

敏捷开发，每日晨会对称，风险把控，重要节点分批提前验收，小黑屋高效协作，充分利用时间，先难后易，

## webpack loader 和 plugin 的区别
loader 的作用在于转化比如把.sass 转化为css文件

plugin 可以进行更广泛的自定义操作如代码压缩等

## webpack  babel babel-loader

### webpack
webpack 是一个现代 JavaScript 应用程序的静态模块打包器。（项目打包）

### loader

loader是打包方案，webpack不能识别非js结尾的模块，告知webpack某些特定文件如何打包。官网有loader，开源上也有很多优秀的loader可以使用

### babel

babel 是一个 JavaScript 转码编译器。（把（低版本）浏览器不认识的语法，编译成浏览器认识的语法。）

### babel-loader
用来连接webpack使用babel的加载器



