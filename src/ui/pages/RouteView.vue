<script setup lang="ts">
  import { store } from '../store';
  import RouteListEntry from '../components/RouteListEntry.vue';
</script>

<template>
  <RouteListEntry v-for="route in store.routes" :route="route" :key="route.url"/>
</template>

<style scoped>

</style>
