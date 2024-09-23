## 获取请求url中的参数

```js
const searchParams = location.search.slice(1);

const params = new URLSearchParams(searchParams);

const urlParams = Object.fromEntries(params.entries())


//  fromEntries 把数组转化为对象 [[a:1],[b:2]] => {a:1,b:2}
```