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

function throttleEnhanced(func, wait, immediate = false) {
  let lastCallTime = 0;
  let timeoutId;

  return function (...args) {
    const context = this;
    const now = Date.now();
    const elapsed = now - lastCallTime;

    if (immediate && !timeoutId) {
      func.apply(context, args);
      lastCallTime = now;
      return;
    }

    if (elapsed >= wait) {
      lastCallTime = now;
      func.apply(context, args);
    } else {
      if (!timeoutId) {
        timeoutId = setTimeout(() => {
          lastCallTime = Date.now();
          func.apply(context, args);
          timeoutId = null;
        }, wait - elapsed);
      }
    }
  };
}


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

const throttle = (func, wait) => {
  let prevTime = 0
  return function (...args) {
    const now = Date.now()
    if (now - prevTime >= wait) {
      func.apply(this, args)
      prevTime = now
    }
  }
}
const debounce = (func, wait) => {
  let timer = null
  return function (...args) {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      func.apply(this, args)
    }, wait)
  }
}

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
console.log( test.myApply(obj, [1,2,3])) // 1, 'zs'
// console.log(test.myCall(obj, 1,2,3)) // [ 1, 2, 3 ] zs
// console.log(test.myBind(obj, [1,2,3])([4,5])) // 1, 'zs'