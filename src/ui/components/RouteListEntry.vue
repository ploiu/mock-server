<script setup lang="ts">
import type { UIRoute } from '../models'
import Card from 'primevue/card';
import InputSwitch from 'primevue/inputswitch';
import Button from 'primevue/button';
import { ref } from 'vue';

interface props {
    route: UIRoute
}

const props = defineProps<props>()

const enabled = ref(props.route.isEnabled);
</script>

<template>
    <Card>
        <template #title><span :class="['request-method', `request-method-${route.method.toLowerCase()}`]">{{
            route.method }}</span> {{ route.title }}</template>
        <template #content>
            <div class="row">
                <div class="col-3 enable-toggle-group">
                    <span>enabled</span>
                    <InputSwitch v-model="enabled" :value="enabled"
                        @change="value => enabled = value.currentTarget.checked" />
                </div>
                <div class="col-9 button-container">
                    <Button label="Delete" severity="danger" />
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
</style>