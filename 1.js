let a = new EventEmitter();
function aa(x) {
  console.log(x);
}
a.on("kak", aa)
a.on("kak", (data) => {
  console.log("1", data);
})
a.emit('kak', 'hahahah');
a.off('kak', aa);
a.emit('kak', 'hahahah');

class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(key, func) {
    this.events = {
      ...this.events,
      [key]: func
    }
  }
  emit(key, params) {
    this.events[key](params)
  }
  off(key) {
    if(!this.events[key]) {
      delete this.events[key]
    }
  }
}






