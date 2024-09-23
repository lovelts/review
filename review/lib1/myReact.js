function render(element, container) {
  const dom = element.type === 'text' ? document.createTextNode("") : document.createElement(element.type)
  console.log(123, Object.keys(element.props)?.filter(item => item !== 'children'))
  Object.keys(element.props)?.filter(item => item !== 'children').forEach(item => {
    dom[item] = element.props[item]
  })
  element.props.children?.forEach(child => render(child, dom))
  container.appendChild(dom)
}

function createElement() {

}

function createTextElement() {

}

const myReact = {
  createElement,
  render
}

const element = {
  type: 'div',
  props: {
    id: 'id1',
    children: [
      {
        type: 'text',
        props: {
          "nodeValue": "Hello World1",
          children: []
        }
      }
    ]
  }
}

myReact.render(element, document.getElementById('root'))