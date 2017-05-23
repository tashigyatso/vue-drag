// 删除元素节点
export function removeElement(ele) {
  ele.parentNode.nodeType === 1 ? ele.parentNode.removeChild(ele) : null
}

// 插入元素节点
export function insertElement(fatherElement, ele, location) {
  location < fatherElement.children.length
    ? fatherElement.insertBefore(ele, fatherElement.children[location])
    : fatherElement.appendChild(ele)
}

// 计算元素索引
export function computeEleIndex(nodes, ele) {
  return nodes.map(elt => elt.elm).indexOf(ele)
}

// 计算所有索引
export function computeIndices(slots, children) {
  return (!slots) ? [] : Array.prototype.map.call(children, ele => computeEleIndex(slots, ele))
}

// 通知
export function emit(eveName, eveData) {
  this.$emit(eveName.toLowerCase(), eveData)
}

// 添加事件
export function delegate(eveName) {
  return (eveData) => {
    if (this.realList !== null) {
      this['onDrag' + eveName](eveData)
    }
    emit.call(this, eveName, eveData)
  }
}
