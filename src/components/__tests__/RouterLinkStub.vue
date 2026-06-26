<template>
  <a :href="typeof to === 'string' ? to : '#'"><slot /></a>
</template>

<script setup>
defineProps({
  to: {
    type: [String, Object],
    required: true
  }
})
</script>
