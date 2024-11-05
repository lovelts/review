## ts 泛型是什么：
不指定任何具体类型，类型可以再输入的时候确定。
```js
function strToArr(str: T): Array<T> {
    let res = [str]
    return res
}

strToArr(1)
```

## ts interface 和 type 的区别


## 断言
写法 
```js
let a
a as number
<number>a

```