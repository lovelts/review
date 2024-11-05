# React 探秘（四）：手撸 mini-react
## 背景
前文中学习了 `react` 中核心的 `fiber` 架构，时间切片，双缓存等，接下来这篇文章实操实现一个 `mini-react`，巩固我们学习的这些知识。
## 实现能力

+ `fiber` 架构
+ 时间切片
+ 双缓存
+ 调和 `create/diff` `fiber`
+ `hooks-useState`

## 手撸开始

## demo
我们以一个简单的 `Counter` 函数组件为例进行分析：
```js
function Counter() {
  const [state, setState] = Didact.useState(2);
  return (
    <h1 onClick={() => { setState(c => c + 1) }} style="user-select: none">
      Count: {state}
    </h1>
  );
}
const element = <Counter />;
const container = document.getElementById("root");
MiniReact.render(element, container);
```

### 流程拆解
+ 入口 render 函数
+ + 初始化 workInProgress 
+ + 开启 workLoop
+ workLoop 函数
+ + 时间切片切分任务
+ + vdom 转化为 fiber 节点
+ + create/diff  fiber node
+ commit 阶段
+ + 处理 fiber 中不同类型的节点同步真实 dom


### 实现 render 函数
`render` 为我们的入口函数，传入组件和根节点，根据这两个数据初始化初始化我们的 `workInProgress`, 在 `commit` 完成之后才会进行 `current` 替换。

```js
let workInProgress = null;
let currentRoot= null;
let deletions = null;
let nextUnitOfWork = null;

// 此处的 element 为 { type：function Counter() }
function render(element, container) {
  workInProgress = {
    dom: container,
    props: {
      children: [element]
    },
    alternate: currentRoot
  };
  deletions = [];
  // 开启工作单元
  nextUnitOfWork = workInProgress;
}
```
### 构建 fiber 树
根据上面得到的 `fiber` 根节点，构建 `fiberNode`，构建过程需要把 vdom 转化为 fiber ， 其中进行 `create/diff`，子元素通过 `child` 连接，兄弟节点通过 `sibling` 连接， `return` 记录父节点用作遍历。

> 本文 jsx 转化，采用简单方式带过

每个 `fiberNode` 为一个工作单元，循环构建 `fiberNode`，直到没有`fiberNode`，处理完所有的工作单元之后，进入 `commit` 阶段。

```js
/*
 * 两种实现方式
 * 1. 采用 requestIdleCallback 模拟
 * 2. 宏任务实现 schedule 
 *
*/
// requestIdleCallback 时间切片
function workLoop() {
  while (nextUnitOfWork) {
    // 得到下一个工作单元
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }
  // 没有fiber并且wip存在
  if (!nextUnitOfWork && workInProgress) {
    commitRoot();
  }
}
requestIdleCallback(workLoop)

//  2. 宏任务时间切片
//  参考文章 https://juejin.cn/post/7428168209709449268
function workLoop() {
    // 执行 shouldYieldToHost 来判断本次宏任务的 高频（短间隔）5ms 时间切片是否用尽
    while (!shouldYieldToHost() && nextUnitOfWork) {
        performUnitOfWork();
    }
    if (nextUnitOfWork) {
        console.log(`开启下一个宏任务继续执行剩余任务`);
        return true;
    } else {
        return false;
    }
}
```

### 处理工作单元
performUnitOfWork 为核心处理方法, 分为两个步骤：
+ fiber 节点的构建
+ + create fiber
+ + diff fiber
+ Counter 组件的执行
+ + 得到 vdom
+ + 初始化 hooks

```js
function performUnitOfWork(fiber) {
  // beginWork
  const isFunctionComponent = fiber.type instanceof Function;
  if (isFunctionComponent) {
    // Counter 组件的执行
    updateFunctionComponent(fiber);
  } else {
    // fiberNode的构建
    updateHostComponent(fiber);
  }
  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  // fiber 的循环操作 父-子-兄
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.return;
  }
}
// Counter 组件的执行
function updateFunctionComponent(fiber) {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}
// fiberNode的构建
function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  reconcileChildren(fiber, fiber.props.children);
}
```
第一次先构建根节点，构建完成后 放入 `wipFiber.child` 中，然后进行下一个工作循环，此时 `type` 为 `Counter` 的 `fucntion` 执行该方法初始化 `hooks` 的值和得到 `vdom` 进行调和，完成该 `fiber` 节点的构建，一直复该动作直到没有其他节点.

#### 实现 create fiber
接下来我们实现一下核心的调和的过程:
首先是 create fiber，通过elements（vdom）生成我们的 fiber 结构，并打上 `PLACEMENT` 表示新增
```js
function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let prevSibling = null;
  while (index < elements.length) {
    const element = elements[index];
    let newFiber = null;
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        return: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT"
      };
    }
    if (index === 0) {
      wipFiber.child = newFiber;
    } else if (element) {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
    index++;
  }
}
```
#### 加入 diff fiber 的逻辑
create fiber 有了, 接下来我们实现一下 diff 的过程.

`diff` 首先找到旧的 `fiber` 判断，旧 `fiber` `type` 和 新的 `vdom` `type` 是否相同, 相同的话复则用 `dom` 信息, 打上 `UPDATE` 的标签。不同的话，创建新的 `fiber`，打上 `PLACEMENT` 标签。

如果 `old` `fiber` 存在, 但是 `type` 却不相同则把这个节点放入 `deletions` 数组，打上 `DELETION` 标签

```js
function reconcileChildren(wipFiber, elements) {
  console.log('reconcileChildren',elements);
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;
  // 循环构造 child 和 sibing  
  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    let newFiber = null;
    // 判断 type 是否相同
    const sameType = oldFiber && element && element.type == oldFiber.type;
    // 相同的话,复用 dom
    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        return: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE"
      };
    }

    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        return: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT"
      };
    }
    // 老节点塞入deletions
    if (oldFiber && !sameType) {
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber); 
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      wipFiber.child = newFiber;
    } else if (element) {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    // 遍历 props.children 数组节点
    index++;
  }
}
```


### commit 阶段
在得到 fiber 树之后,进入我们的同步真实dom的过程.
这个阶段是不可暂停的, 采用递归的方式完成 fiber 的同步.

```js
function commitRoot() {
  deletions.forEach(commitWork);
  commitWork(workInProgress.child);
  // 渲染完成后, 双缓存树的替换
  currentRoot = workInProgress;
  workInProgress = null;
}

// 下面为核心代码
function commitWork(fiber) {
  // 根据type 判断执行 
  if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    commitDeletion(fiber, domParent);
  }
  // 递归操作 fiber 树 
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

```

### hooks 实现
https://github.com/facebook/react/blob/v18.3.1/packages/react-reconciler/src/ReactFiberHooks.new.js

根据之前对 fiber 学习我们知道 hooks 在 fiber 上的存储也是以链表的数据结构存储，存储在 memoizedState 上。

`const [state, setState] = useState(0)` 根据用法我们可以推断出:
+ 该方法返回值 return [state, setState] state 是一个状态，setState是改变状态的方法。
+ 根据特性 state 变更组件会 reRender 的特性推测出，setState 在计算出最新的值后会重启 workLoop。

```js

function useState(initial) {
  // setState 后初始化 oldHook
  if (!oldHook) {
    oldHook = wipFiber.alternate?.memoizedState
  }
  // 每次进入重新构建 hook
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
    next: oldHook ? oldHook.next : null,
  };
  // 拿到当前 hook 的任务队列
  const actions = oldHook ? oldHook.queue : [];
  // 计算最新的 state 
  actions.forEach(action => {
    hook.state = action(hook.state);
  });
  // 构建 hook 链表
  if (!workInProgressHook) {
    workInProgressHook = hook
    wipFiber.memoizedState = workInProgressHook;
  } else {
    workInProgressHook = workInProgressHook.next = hook
  }
  // 获取下一个 hook 
  oldHook = oldHook && oldHook.next

  const setState = action => {
    hook.queue.push(action);
    // 重新构建 workInProgress
    workInProgress = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot
    };
    oldHook = null
    workInProgressHook = null
    // 设置下一个工作单元 reRender
    nextUnitOfWork = workInProgress;
    deletions = [];
  };
  return [hook.state, setState];
}
```
## 源码地址
gihub https://github.com/lovelts/mini-react/tree/master

## 参考文章

https://pomb.us/build-your-own-react/