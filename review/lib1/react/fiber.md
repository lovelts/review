# React 探秘(一)：fiber 架构
## 背景
> 深入学习 react 肯定脱离不了对 fiber 的研究，因此这篇文章记录下 fiber 到底是什么？

## React 采用 fiber 主要为了解决哪些问题？

### **性能问题：**
+ 在 React 早期版本中，当渲染大量的 DOM 节点时，由于其同步渲染机制，会导致整个渲染过程阻塞浏览器主线程，使得用户界面变得不响应，甚至出现丢帧的问题。当状态更新导致组件重新渲染时，React 需要重新构建整个虚拟 DOM 树，并与之前的虚拟 DOM 树进行比较以找出差异（diff），然后将这些差异应用到实际的 DOM 上。如果这个过程非常耗时，那么在渲染期间用户将无法与应用交互。

### **用户体验问题：**

用户期望现代 Web 应用能够快速响应他们的操作。然而，在旧版 React 中，如果某个部分正在重新渲染，那么这段时间内用户无法得到任何反馈，这降低了用户体验。
为了应对这些问题，React 16 引入了 Fiber 架构，它改变了 React 的核心算法，带来了以下改进：
+ 异步渲染：Fiber 允许 React 将渲染工作分割成更小的片段，并且可以暂停、恢复这些片段，从而使得渲染工作不再是阻塞式的。这样，即使在渲染过程中，也可以让出执行权给浏览器去处理其他任务，如事件处理和绘制。
+ 优先级调度：通过引入优先级的概念，React 可以根据不同的情况决定哪些更新应该优先完成。例如，用户的直接交互通常会被赋予更高的优先级，而一些后台的更新则可以延迟。
+ 增量渲染：Fiber 还支持增量提交，这意味着 React 可以分批次地将更改应用到真实 DOM 上，而不是一次性地进行大规模的 DOM 更新，这样可以减少浏览器重排和重绘的成本。

## 为什么在 React 15 版本中性能会差：

### 浏览器绘制原理：

大家都知道，浏览器是多进程多线程的，主要进程包括主进程、渲染进程、插件进程和 GPU 进程。本次我们主要关注渲染进程，这是页面渲染、HTML 解析、CSS 解析和 JS 执行的地方。

在渲染进程中，有两个核心线程：

+ GUI 线程：负责浏览器界面的渲染，包括解析 HTML、CSS 以及布局绘制。
+ JS 线程：包含我们编写的 JS 代码的解析引擎，最著名的是 Google 的 V8。
需要注意的是，JS 引擎和 GUI 渲染是互斥的。JS 可能会更改 HTML 或 CSS 样式，如果同时执行会导致页面渲染混乱，因此当 JS 引擎执行时，GUI 渲染线程会被挂起，直到 JS 引擎执行完毕。

我们通常看到的动画和视频本质上是通过快速切换图片来欺骗人眼，让人感觉是连续的动画。每秒内的图片越多，动画越流畅，通常 60 帧每秒（FPS）就能让人感觉流畅。因此，Chrome 需要在 16 ms 内完成渲染任务，以避免掉帧。如果JS执行时间过长，用户会感觉到明显的卡顿，很影响用户体验。

### react 15 架构和问题
React 15 的架构主要分为 Reconciler（协调器） 和 Renderer（渲染器）。
+ Reconciler（协调器），VDOM 、diff，协调器主要负责根据自变量变化计算出UI变化。
+ Renderer（渲染器）， 渲染器主要负责把UI变化渲染到宿主环境中。

Reconciler 采用递归的方式创建、更新 vdom，递归一旦开始则不可中断和停止，如果执行比较**复杂的深层次的 vdom 递归运算**，则会导致 Reconciler 暂用大量时间，无法进行 Renderer 则会导致页面卡顿。

## 那么 fiber 怎么解决了这个问题？

首先我们先把问题抽象一下,不要带入 react 框架中，放入我们日常业务场景中，问题就可以转化为 ：

> 一个比较大的任务，一次性处理起来耗时很长，需要我们去优化。

既然一次性处理耗时太长，那么能不能分多次处理，可不可以只在浏览器空闲的时候处理，繁忙的时候先暂定处理。

### 任务“大”的问题
大任务的处理其实在日常开发中我们应该经常会遇到如：“大文件上传、加载”，“批量请求并发”等场景。我们经常会用到**切片**的思想，把一个大的任务拆分成一个个小任务按照一定顺序执行，这样我们就可以减少大任务的执行时间，让浏览器有 breathing time，让用户有更好的体验。

替换到我们的场景中，vdom 就是我们的”大任务“，然后我们要切分成每一个小任务就是 fiber 节点，每一个 fiber 节点关联起来就组成我们的 fiber 树。

### 递归、可中断的问题
解决了“大”的问题接下来就是递归的问题，之前 diff 是递归的不可中断，那我们怎么才能做到可中断呢？

原本 vdom 是一个树结构想要遍历只能采取递归的方式，我们要舍弃递归只能把树结构转化为另一种数据结构，react 采用了链表把每个 fiber 关联起来，然后进行遍历。然后再中断的时候记录下来当前指针，恢复时可以继续执行。


### 调度的问题
解决了“递归”的问题接下来就是调度的问题，我们怎么才能在浏览器空闲时间去调用呢?

这边引入一个比较新鲜的 api  `requestIdleCallback` 这个方法插入一个函数，这个函数将在浏览器空闲时期被调用。这使开发者能够在主事件循环上执行后台和低优先级工作，而不会影响延迟关键事件。这个 api 刚好就很契合我们的场景可以在浏览器空闲的时候去调用，我们执行某个 fiberNode 的时候，浏览器主线程被占用，这个时候就可以暂停 fiberNode 的继续执行，等浏览器空闲时，继续 nextUnitOfWork。这就实现了可暂停可继续。但是呢这 api 有限制：

+ 兼容性问题，有的浏览器不支持这个 API。
+ 这个方法任务执行优先级无法自定义，且并不符合 react 团队的预期

总之，react 最后自己封装了一个 Scheduler，提供更强大的事件优先级处理逻辑，取代了 idle 的功能。具体执行策略可以参考一下其他文章。

<!-- react 15 中采用的是递归的方式进行对比， -->
### fiber 架构

有了这些理论思想的加持，我们再看一下 fiber 架构。

+ Scheduler(调度器): 时间切片、调度任务的优先级
+ Reconciler（协调器），diff 过程，协调器主要负责根据自变量变化计算出UI变化。
+ Renderer（渲染器）， 渲染器主要负责把UI变化渲染到宿主环境中。

相比我们的 react 15 多了调度器的概念，这里调度器其实就是我们上面提到的时间分片机制，控制我们的 workLoop。

### fiberNode 数据结构

```js
function Counter() {
  const [state, setState] = React.useState(1);
  return (
      <h1 onClick={() => setState(state + 1)}>
        Count: {state}
      </h1>
  );
}
//  简单的 vdom 结构
{
  type: 'h1',
  props: {
    children: [
      {
        type: 'text',
        props: {
          "nodeValue": "Count",
          children: []
        }
      },
      {
        type: 'text',
        props: {
          "nodeValue": "1",
          children: []
        }
      }
    ]
  }
}
```

可以看到这是之前的 vdom 结构, 我们需要转化为 fiber 结构，按照我们上面切片的思想，元素结构需可以拆分成3个部分 `h1`、` count：`、`state`，得到如下3个片段：
```js
const fiber1 = {
  type: 'h1',
  props: {
    children: [
    ]
  }
}
const fiber2 = {
  type: 'text',
  props: {
    "nodeValue": "Count",
    children: []
  }
}
const fiber3 = {
  type: 'text',
  props: {
    "nodeValue": "1",
    children: []
  }
}
```
那怎么表示之间的关联关系呢? 我们这边可以通过链表的方式相互关联：
+ 父 -> 子: children
+ 子 -> 父: return
+ 兄 -> 弟: sibling

转化为如下结构（基础版的 fiber）：
```js
fiber1

const fiber1 = {
  type: 'h1',
  props: {
    children: fiber2
  }
}
const fiber2 = {
  type: 'text',
  props: {
    "nodeValue": "Count",
    children: null
  },
  sibling: fiber3,
  return : fiber1
}
const fiber3 = {
  type: 'text',
  props: {
    "nodeValue": "1",
    children: null
  },
  sibling: null,
  return : fiber1
}
```
现在我们已经得到了一个 fiber 的基本结构，以下为 react 源码中的 fiber 结构

```js
// react/packages/react-reconciler/src/ReactInternalTypes.js
export type Fiber = {|
  tag: WorkTag,
  key: null | string,
  elementType: any,
  type: any,
  stateNode: any,
  return: Fiber | null,
  child: Fiber | null,
  sibling: Fiber | null,
  index: number,
  ref:
    | null
    | (((handle: mixed) => void) & {_stringRef: ?string, ...})
    | RefObject,

  pendingProps: any,
  memoizedProps: any, // 状态
  updateQueue: mixed,
  memoizedState: any, // hooks
  dependencies: Dependencies | null,
  mode: TypeOfMode,
  flags: Flags,
  subtreeFlags: Flags,
  deletions: Array<Fiber> | null,
  nextEffect: Fiber | null,
  firstEffect: Fiber | null,
  lastEffect: Fiber | null,
  lanes: Lanes, // 优先级相关
  childLanes: Lanes, // 优先级相关
  alternate: Fiber | null, // 双缓存
  actualDuration?: number,
  actualStartTime?: number,
  selfBaseDuration?: number,
  treeBaseDuration?: number,
  _debugID?: number,
  _debugSource?: Source | null,
  _debugOwner?: Fiber | null,
  _debugIsCurrentlyTiming?: boolean,
  _debugNeedsRemount?: boolean,
  _debugHookTypes?: Array<HookType> | null,
|};

```
## 总结
**最后，那 fiber 是什么？**

fiber 是 react 用于提升性能和渲染效率的一种架构，同时也是一种贯穿在整个架构中运行的数据结构。

在日常业务开发中，可能会觉得框架源码层面的东西距离我们很遥远，但是当我们看透本质其实会发现这些问题我们也遇到过，复杂问题抛开原有特殊属性是不是就可以剥离成共性简单问题，这或许也是我们学习源码的意义。


## 问题
### fiber 数据结构为什么必须是链表，数组不行吗？
Fiber 采用链表数据结构的原因是因为链表可以方便地在列表的中间插入和删除元素。这在构建和更新用户界面时非常有用，因为可能会有大量的元素需要插入或删除。与数组相比，链表具有更好的插入和删除性能，因为在数组中执行这些操作通常需要移动大量元素，而在链表中只需要修改一些指针即可。

链表缺点：然而，链表的查找性能通常比数组差，因为需要遍历整个列表才能找到所需的元素。

尽管如此，Fiber 还是选择使用链表作为其数据结构，因为在构建和更新用户界面时插入和删除元素的需求要远远大于查找元素的需求。