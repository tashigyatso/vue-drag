import {buildDrag} from './buildDrag'

if (window && window.Vue && window.Sortable) {
  let draggable = buildDrag(window.Sortable)
  Vue.component('draggable', draggable)
} else if (typeof exports == "object") {
  var Sortable = require("sortablejs")
  module.exports = buildDrag(Sortable)
}
