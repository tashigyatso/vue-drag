import {removeElement, insertElement, computeEleIndex, computeIndices, emit, delegate} from './utils'

export function buildDrag(Sortable) {
  let dragElement = null
  const eventsList = ['Add', 'Start', 'Update', 'End', 'Remove']
  const eventsEmit = ['Choose', 'Sort', 'Filter', 'Clone']
  const eventsContent = ['Move', ...eventsList, ...eventsEmit].map(ele => 'on' + ele)

  const props = {
    options: Object,
    list: {
      type: Array,
      required: false,
      default: null
    },
    move: {
      type: Function,
      default: null
    },
    clone: {
      type: Function,
      default: (primary) => {
        return primary
      }
    },
    element: {
      type: String,
      default: 'div'
    }
  }

  const dragComponent = {
    props,

    data(){
      return {
        transitionFlag: false
      }
    },

    render(h){
      //->是否为transition-group
      if (this.$slots.default && this.$slots.default.length === 1) {
        const child = this.$slots.default[0]
        if (child.componentOptions && child.componentOptions.tag === "transition-group") {
          this.transitionFlag = true
        }
      }
      return h(this.element, null, this.$slots.default)
    },

    mounted(){
      let additiveOptions = {}
      eventsList.forEach(ele => {
        additiveOptions['on' + ele] = delegate.call(this, ele)
      })

      eventsEmit.forEach(ele => {
        additiveOptions['on' + ele] = emit.bind(this, ele)
      })

      const options = Object.assign({}, this.options, additiveOptions, {
        onMove: event => {
          return this.onDragMove(event)
        }
      })
      // 构建Sortable
      this._sortable = new Sortable(this.rootContainer, options)
      this.computeIndexes()
    },

    beforeDestroy(){
      // 销毁sortablejs
      this._sortable.destroy()
    },

    computed: {
      // 根内容
      rootContainer(){
        return this.transitionFlag ? this.$el.children[0] : this.$el
      },

      // 节点列表
      realList(){
        return this.list
      }
    },

    watch: {
      options(newOptionValue){
        for (var property in newOptionValue) {
          if (eventsContent.indexOf(property) === -1) {
            this._sortable.option(property, newOptionValue[property])
          }
        }
      },

      realList(){
        this.computeIndexes()
      }
    },

    methods: {
      // 子元素
      getChildren (){
        const rawNodes = this.$slots.default
        return this.transitionFlag ? rawNodes[0].child.$slots.default : rawNodes
      },

      // 计算元素索引
      computeIndexes (){
        this.$nextTick(() => {
          this.vIndices = computeIndices(this.getChildren(), this.rootContainer.children)
        })
      },

      // 获取元素目标位置
      getDomElement (htmlElement){
        const index = computeEleIndex(this.getChildren(), htmlElement)
        const element = this.realList[index]
        return {index, element}
      },

      // 获取拖拽组件
      getDragElementComponent ({__vue__}){
        if (!__vue__ || !__vue__.$options || __vue__.$options._componentTag !== "transition-group") {
          return __vue__
        }
        return __vue__.$parent
      },

      // 通知改变
      emitChanges (moved){
        this.$nextTick(() => {
          this.$emit('change', moved)
        });
      },

      // 更新列表
      changeList (onList){
        onList(this.list)
      },

      // 更新位置
      updateLocation (oldIndex, newIndex){
        const updateLocation = list => list.splice(newIndex, 0, list.splice(oldIndex, 1)[0])
        this.changeList(updateLocation)
      },

      // 上下文
      getRelatedContext ({to, related}){
        const component = this.getDragElementComponent(to)
        if (!component) {
          return {component}
        }
        const realList = component.realList
        const context = {realList, component}
        if (to !== related && realList && component.getDomElement) {
          const destination = component.getDomElement(related)
          return Object.assign(destination, context)
        }

        return context
      },

      // 获取元素索引
      getDomIndex (index){
        const indices = this.vIndices
        const sumIndices = indices.length
        return (index > sumIndices - 1) ? sumIndices : indices[index]
      },

      // 拖动起始
      onDragStart (event){
        this.context = this.getDomElement(event.item)
        event.item._underlying_vm_ = this.clone(this.context.element)
        dragElement = event.item
      },

      // 拖动更新
      onDragUpdate (event){
        removeElement(event.item)
        insertElement(event.from, event.item, event.oldIndex)
        const oldIndex = this.context.index
        const newIndex = this.getDomIndex(event.newIndex)
        this.updateLocation(oldIndex, newIndex)
        const moved = {element: this.context.element, oldIndex, newIndex}
        this.emitChanges({moved})
      },

      // 目标索引
      computeDestinationIndex (relatedContext, event){
        if (!relatedContext.element) {
          return false
        }
        const htmlChildren = [...event.to.children]
        const currentElementIndex = htmlChildren.indexOf(event.related)
        const currentIndex = relatedContext.component.getDomIndex(currentElementIndex)
        const isInList = htmlChildren.indexOf(dragElement) != -1
        return isInList ? currentIndex : currentIndex + 1
      },

      // 拖拽移动
      onDragMove (event){
        const onMove = this.move
        if (!onMove || !this.realList) {
          return true
        }

        const relatedContext = this.getRelatedContext(event)
        const draggedContext = this.context
        const destinationIndex = this.computeDestinationIndex(relatedContext, event)
        Object.assign(draggedContext, {destinationIndex})
        Object.assign(event, {relatedContext, draggedContext})
        return onMove(event)
      },

      // 拖拽结束
      onDragEnd (){
        dragElement = null
      }
    }
  }
  return dragComponent
}
