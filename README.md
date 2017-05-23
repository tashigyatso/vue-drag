### use:
``` html
<draggable v-model="array">
   <div v-for="element in array">{{element.name}}</div>
</draggable>
```
### vue:
``` js
  import draggable from 'vue-sortablejs'
  export default {
  ...
      components: {
          draggable,
      },
  ...
  }
```

### transition-group:
``` html
<draggable v-model="array">
    <transition-group>
        <div v-for="element in array" :key="element.id">
            {{element.name}}
        </div>
    </transition-group>
</draggable>
```