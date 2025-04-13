<script setup lang="ts">
import type { UIRoute } from '../models'
import Card from 'primevue/card';
import ToggleSwitch from 'primevue/toggleswitch';
import Button from 'primevue/button';
import {ref} from 'vue';

interface RouteListEntryProps {
    route: UIRoute
}

const props = defineProps<RouteListEntryProps>();
const route = ref({...props.route});

// copy of the route so that we don't modify the original
const emit = defineEmits<{
    (e: 'change', value: UIRoute),
    (e: 'delete', value: UIRoute)
}>()

const toggleEnabled = (e: ChangeEvent) => {
    const updatedRoute = {...route.value, isEnabled: e.target.checked}
    emit('change', updatedRoute);
}

</script>

<template>
    <Card class="route-list-entry">
        <template #title><span :class="['request-method', `request-method-${route.method === '*' ? 'all' : route.method.toLowerCase()}`]">{{
            route.method }}</span> <span class="route-title">{{ route.title }}</span></template>
        <template #footer>
            <div class="row">
                <div class="col-3 enable-toggle-group">
                    <span>enabled</span>
                    <ToggleSwitch :modelValue="props.route.isEnabled" @change.stop="toggleEnabled" />
                </div>
                <div class="col-9 button-container">
                    <Button label="Delete" severity="danger" @click.stop="() => emit('delete', route)" />
                </div>
            </div>
        </template>
    </Card>
</template>

<style scoped>
.p-card {
    &:hover {
        cursor: pointer;
    }
}

:deep(.p-card-title) {
    font-size: larger;
    line-height: 1.5em;
}

:deep(.p-card-footer) {
    padding: 0.1em 0 0 0;
    font-size: smaller;
}

.button-container {
    margin-top: 1em;
}

:deep(.p-button) {
    font-size: smaller;
}

.enable-toggle-group {
    display: flex;
    flex-direction: column;
    align-items: center;

    >*:first-child {
        margin-bottom: 0.25em;
    }

    >.p-input-switch {
        float: left;
    }
}

.button-container>button {
    float: right;
}

span.request-method {
    padding: 4px;
    border-radius: var(--border-radius);
}

.route-title {
    word-wrap: break-word;
}
</style>