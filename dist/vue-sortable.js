(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

// 删除元素节点
function removeElement(ele) {
  ele.parentNode.nodeType === 1 ? ele.parentNode.removeChild(ele) : null;
}

// 插入元素节点
function insertElement(fatherElement, ele, location) {
  location < fatherElement.children.length
    ? fatherElement.insertBefore(ele, fatherElement.children[location])
    : fatherElement.appendChild(ele);
}

// 计算元素索引
function computeEleIndex(nodes, ele) {
  return nodes.map(function (elt) { return elt.elm; }).indexOf(ele)
}

// 计算所有索引
function computeIndices(slots, children) {
  return (!slots) ? [] : Array.prototype.map.call(children, function (ele) { return computeEleIndex(slots, ele); })
}

// 通知
function emit(eveName, eveData) {
  this.$emit(eveName.toLowerCase(), eveData);
}

// 添加事件
function delegate(eveName) {
  var this$1 = this;

  return function (eveData) {
    if (this$1.realList !== null) {
      this$1['onDrag' + eveName](eveData);
    }
    emit.call(this$1, eveName, eveData);
  }
}

function buildDrag(Sortable) {
  var dragElement = null;
  var eventsList = ['Add', 'Start', 'Update', 'End', 'Remove'];
  var eventsEmit = ['Choose', 'Sort', 'Filter', 'Clone'];
  var eventsContent = ['Move' ].concat( eventsList, eventsEmit).map(function (ele) { return 'on' + ele; });

  var props = {
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
      default: function (primary) {
        return primary
      }
    },
    element: {
      type: String,
      default: 'div'
    }
  };

  var dragComponent = {
    props: props,

    data: function data(){
      return {
        transitionFlag: false
      }
    },

    render: function render(h){
      //->是否为transition-group
      if (this.$slots.default && this.$slots.default.length === 1) {
        var child = this.$slots.default[0];
        if (child.componentOptions && child.componentOptions.tag === "transition-group") {
          this.transitionFlag = true;
        }
      }
      return h(this.element, null, this.$slots.default)
    },

    mounted: function mounted(){
      var this$1 = this;

      var additiveOptions = {};
      eventsList.forEach(function (ele) {
        additiveOptions['on' + ele] = delegate.call(this$1, ele);
      });

      eventsEmit.forEach(function (ele) {
        additiveOptions['on' + ele] = emit.bind(this$1, ele);
      });

      var options = Object.assign({}, this.options, additiveOptions, {
        onMove: function (event) {
          return this$1.onDragMove(event)
        }
      });
      // 构建Sortable
      this._sortable = new Sortable(this.rootContainer, options);
      this.computeIndexes();
    },

    beforeDestroy: function beforeDestroy(){
      // 销毁sortablejs
      this._sortable.destroy();
    },

    computed: {
      // 根内容
      rootContainer: function rootContainer(){
        return this.transitionFlag ? this.$el.children[0] : this.$el
      },

      // 节点列表
      realList: function realList(){
        return this.list
      }
    },

    watch: {
      options: function options(newOptionValue){
        var this$1 = this;

        for (var property in newOptionValue) {
          if (eventsContent.indexOf(property) === -1) {
            this$1._sortable.option(property, newOptionValue[property]);
          }
        }
      },

      realList: function realList(){
        this.computeIndexes();
      }
    },

    methods: {
      // 子元素
      getChildren: function getChildren (){
        var rawNodes = this.$slots.default;
        return this.transitionFlag ? rawNodes[0].child.$slots.default : rawNodes
      },

      // 计算元素索引
      computeIndexes: function computeIndexes (){
        var this$1 = this;

        this.$nextTick(function () {
          this$1.vIndices = computeIndices(this$1.getChildren(), this$1.rootContainer.children);
        });
      },

      // 获取元素目标位置
      getDomElement: function getDomElement (htmlElement){
        var index = computeEleIndex(this.getChildren(), htmlElement);
        var element = this.realList[index];
        return {index: index, element: element}
      },

      // 获取拖拽组件
      getDragElementComponent: function getDragElementComponent (ref){
        var __vue__ = ref.__vue__;

        if (!__vue__ || !__vue__.$options || __vue__.$options._componentTag !== "transition-group") {
          return __vue__
        }
        return __vue__.$parent
      },

      // 通知改变
      emitChanges: function emitChanges (moved){
        var this$1 = this;

        this.$nextTick(function () {
          this$1.$emit('change', moved);
        });
      },

      // 更新列表
      changeList: function changeList (onList){
        onList(this.list);
      },

      // 更新位置
      updateLocation: function updateLocation (oldIndex, newIndex){
        var updateLocation = function (list) { return list.splice(newIndex, 0, list.splice(oldIndex, 1)[0]); };
        this.changeList(updateLocation);
      },

      // 上下文
      getRelatedContext: function getRelatedContext (ref){
        var to = ref.to;
        var related = ref.related;

        var component = this.getDragElementComponent(to);
        if (!component) {
          return {component: component}
        }
        var realList = component.realList;
        var context = {realList: realList, component: component};
        if (to !== related && realList && component.getDomElement) {
          var destination = component.getDomElement(related);
          return Object.assign(destination, context)
        }

        return context
      },

      // 获取元素索引
      getDomIndex: function getDomIndex (index){
        var indices = this.vIndices;
        var sumIndices = indices.length;
        return (index > sumIndices - 1) ? sumIndices : indices[index]
      },

      // 拖动起始
      onDragStart: function onDragStart (event){
        this.context = this.getDomElement(event.item);
        event.item._underlying_vm_ = this.clone(this.context.element);
        dragElement = event.item;
      },

      // 拖动更新
      onDragUpdate: function onDragUpdate (event){
        removeElement(event.item);
        insertElement(event.from, event.item, event.oldIndex);
        var oldIndex = this.context.index;
        var newIndex = this.getDomIndex(event.newIndex);
        this.updateLocation(oldIndex, newIndex);
        var moved = {element: this.context.element, oldIndex: oldIndex, newIndex: newIndex};
        this.emitChanges({moved: moved});
      },

      // 目标索引
      computeDestinationIndex: function computeDestinationIndex (relatedContext, event){
        if (!relatedContext.element) {
          return false
        }
        var htmlChildren = [].concat( event.to.children );
        var currentElementIndex = htmlChildren.indexOf(event.related);
        var currentIndex = relatedContext.component.getDomIndex(currentElementIndex);
        var isInList = htmlChildren.indexOf(dragElement) != -1;
        return isInList ? currentIndex : currentIndex + 1
      },

      // 拖拽移动
      onDragMove: function onDragMove (event){
        var onMove = this.move;
        if (!onMove || !this.realList) {
          return true
        }

        var relatedContext = this.getRelatedContext(event);
        var draggedContext = this.context;
        var destinationIndex = this.computeDestinationIndex(relatedContext, event);
        Object.assign(draggedContext, {destinationIndex: destinationIndex});
        Object.assign(event, {relatedContext: relatedContext, draggedContext: draggedContext});
        return onMove(event)
      },

      // 拖拽结束
      onDragEnd: function onDragEnd (){
        dragElement = null;
      }
    }
  };
  return dragComponent
}

if (window && window.Vue && window.Sortable) {
  var draggable = buildDrag(window.Sortable);
  Vue.component('draggable', draggable);
} else if (typeof exports == "object") {
  var Sortable = require("sortablejs");
  module.exports = buildDrag(Sortable);
}

})));
