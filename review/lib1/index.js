// 节流
// const throttle = (func, wait) => {
//   console.log(234, 'throttle')
//   let prevTime = 0;
//   return function (...args) {
//     let currentTime = Date.now()
//     if (currentTime - prevTime >= wait) {
//       prevTime = currentTime
//       func.apply(this, args)
//     }
//   }
// }
// 防抖
// const debounce = (func, wait) => {
//   let timerId = null;
//   return function (...args) {
//     const context = this;
//     clearTimeout(timerId)
//     timerId = setTimeout(() => {
//       func.apply(this, args)
//     }, wait);
//   }
// }



const isObject = obj => typeof obj === 'object' && obj !== null

const handler = {
  set: (target, key, value, receiver) => {
    const res = Reflect.set(target, key, value, receiver)
    return res
  },
  get: (target, key, receiver) => {
    const res = Reflect.get(target, key, receiver)
    console.log(234543, isObject(res) ? reactive(res) : res, key)
    return isObject(res) ? reactive(res) : res
  },
  deleteProperty(target, key) {
    const res = Reflect.deleteProperty(target, key)
    console.log(`删除${key}: ${res}`)
    return res
  }
}

const reactive = (obj) => {
  if (!isObject(obj)) {
    return obj
  }
  const proxy = new Proxy(obj, handler)
  return proxy
}
// 异步队列+并发控制
class queue {
  constructor(props) {
    this.limit = props.limit;
    this.asyncList = [];
    this.count = 0;
  }
  add(func) {
    new Promise((resolve, reject) => {
      this.asyncList.push({
        func,
        resolve,
        reject,
      })
    })
    this.exct()
  }
  exct() {
    if (this.asyncList.length > 0 && this.count < this.limit) {
      this.count++
      const first = this.asyncList.shift();
      first.func().then((res) => {
        this.count--;
        first.resolve(res)
        this.exct()
      }).catch((err) => {
        this.count--;
        first.reject(err)
        this.exct()
      })
    }
  }
}

// new Promise((resolve, reject) => {
//   console.log(1)
//   resolve(2)
//   new Promise((resolve) => {
//     console.log(5)
//     resolve(6)
//   }).then((res) => console.log(res))
//   console.log(3)
// }).then(res => console.log(res))

// console.log(4)


// console.log(1);

// setTimeout(() => {
//   console.log(2);
//   Promise.resolve().then(() => {
//     console.log(3);
//   })
// }, 0)

// setTimeout(() => {
//   console.log(7);
//   Promise.resolve().then(() => {
//     console.log(8);
//   })
// }, 0)


// Promise.resolve().then(() => {
//   console.log(4);
//   setTimeout(() => {
//     console.log(5)
//   }, 0)
// })


// console.log(6);
// 1 6 4 2 3 5

// call apply bind
function myCall (obj, ...args) {
  obj.temp = this
  obj.temp(...args)
  delete obj.temp
}

function myApply(obj, arr) {
  obj.temp = this
  obj.temp(arr)
  delete obj.temp
}

function myBind(obj, args) {
    const that = this;
    return function(prarms) {
      that.apply(obj, [...(args || []), ...(prarms || [])])
    }
}

Function.prototype.myApply = myApply
Function.prototype.myCall = myCall
Function.prototype.myBind = myBind
function test(a) {
  console.log(a, this.name)
}
const obj = { id: 1, name: 'zs' }
// console.log( test.myApply(obj, [1,2,3])) // 1, 'zs'
// console.log(test.myCall(obj, 1,2,3)) // [ 1, 2, 3 ] zs
// console.log(test.myBind(obj, [1,2,3])([4,5])) // 1, 'zs'

const arr = [Promise.resolve('success'), Promise.reject('error')]
const errorArr = [new Promise((a, b) => { setTimeout(() => { b('success') },500) }) , Promise.reject('reject'), Promise.reject('error2')]

// 有一个失败的就失败了
Promise.all(arr).then(res => {
  console.log('res', res)
}).catch(error => console.log('all', error))


// 第一个返回的 promise 的状态是成功整体状态就成功，是失败整体状态就失败
Promise.race(errorArr).then(res => {
  console.log('race', res)
}).catch(error => console.log('race', error))

// 会返回所有的状态
Promise.allSettled(arr).then(res => {
  console.log('allSettled', res)
}).catch(error => console.log('allSettled', error))

// 3,2,0,1,1,4

function func1(numStr) {
  // console.log(11122, numStr)
  const arr = numStr.split(',')
  // arr.split
  const dfs = (index) => {
    
  }
}