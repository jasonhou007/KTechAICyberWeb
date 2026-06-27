<template>
  <a :href="to"><slot /></a>
</template>

<script setup lang="ts">
defineProps({
  to: {
    type: [String, Object],
    required: true
  }
})
</script>
