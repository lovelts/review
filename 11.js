

class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(key, func) {
    this.events = {
      ...this.events,
      [key]: {
        ...this.events[key],
        [func]: func
      }
    }
  }
  emit(key, params) {
    for (const myKey in this.events[key]) {
      if (Object.prototype.hasOwnProperty.call(this.events[key], myKey)) {
        const element = this.events[key][myKey];
        element(params)
      }
    }
  }
  off(key, func) {
    const funcObj = this.events[key]
    if (!funcObj) {
      if (funcObj[func]) {
        delete funcObj[func]
      }
    }
  }
}


// let a = new EventEmitter();
// function aa(x) {
//   console.log(x);
// }
// a.on("kak", aa)
// a.on("kak", (data) => {
//   console.log("1", data);
// })
// a.emit('kak', 'hahahah');
// a.off('kak', aa);
// a.emit('kak', 'hahahah');

// 样例输入：s = "3[a2[c]]"
// 样例输出：accaccacc
function decodeString(s) {
  let stack = [];
  let currentNum = 0;
  let currentString = '';

  for (let char of s) {
      if (!isNaN(char)) { // 数字
          currentNum = currentNum * 10 + parseInt(char);
      } else if (char === '[') { // 左括号
          stack.push(currentString);
          stack.push(currentNum);
          currentString = '';
          currentNum = 0;
      } else if (char === ']') { // 右括号
          let num = stack.pop();
          let prevString = stack.pop();
          currentString = prevString + currentString.repeat(num);
      } else { // 字母
          currentString += char;
      }
  }

  return currentString;
}

console.log(
  decodeString("3[a2[c]]")
)

