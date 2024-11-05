const arr = [
  { id: 1 },
  { id: 2, parentId: 1 },
  { id: 3, parentId: 1 },
  { id: 4, parentId: 2 },
  { id: 5, parentId: 3 },
  { id: 6, parentId: 4 },
]

let root = arr.filter(item => !item.parentId)
let obj = {}
arr.forEach(item => {
  obj[item.id] = { ...item, children: [] }
})
arr.forEach(item => {
  if (obj[item.parentId]) {
    obj[item.parentId].children.push(item)
  }
})



console.log(2222, JSON.stringify(obj[root.id]))
// {
//   "id": 1,
//     "children": [
//       {
//         "id": 2,
//         "children": [
//           {
//             "id": 4,
//             "children": [
//               {
//                 "id": 6,
//                 "children": []
//               }]
//           }]
//       },
//       {
//         "id": 3,
//         "children": [{
//           "id": 5,
//           "children": []
//         }]
//       }]
// }

const trans = (arr) => {

  let obj = arr.find(item => !item.parentId)

  const dfs = (data, arr) => {
    const list = arr.filter(item => data.id !== item.id && item.parentId === data.id)
    return list.map(item => {
      return {
        id: item.id,
        children: dfs(item, arr)
      }
    })
    // return arr
  }
  const tempList = arr.filter(item => obj.id !== item.id && item.parentId === obj.id)
  obj.children = tempList.map(item => {
    return {
      id: item.id,
      children: dfs(item, arr)
    }
  })
  return obj
}

console.log(2222, JSON.stringify(trans(arr)))