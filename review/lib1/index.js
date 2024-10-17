const throttle = (func, wait) => {
  console.log(234, 'throttle')
  let prevTime = 0;
  return function (...args) {
    let currentTime = Date.now()
    if (currentTime - prevTime >= wait) {
      prevTime = currentTime
      func.apply(this, args)
    }
  }
}

const debounce = (func, wait) => {
  let timerId = null;
  return function (...args) {
    const context = this;
    clearTimeout(timerId)
    timerId = setTimeout(() => {
      func.apply(this, args)
    }, wait);
  }
}

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
    if(this.asyncList.length > 0 && this.count < this.limit) {
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