<script setup lang="ts">
import type {UIRoute} from '../models'
interface props {
    route: UIRoute
}

defineProps<props>()
</script>

<template>
    <div class="card">
        <header>
            <span :class="['request-method', 'request-method-' + route.method]">
                {{ route.method }}
            </span>
            <span class="title">
                {{ route.title }}
            </span>
        </header>
        <footer>
            <button>Disable</button>
            <button>Delete</button>
        </footer>
    </div>
</template>

<style scoped>
.card {
    border-radius: var(--border-radius);
    border: 1px solid var(--color-scheme-primary);
    padding: 1em;
    width: 300px;
    word-wrap: break-word;
    margin-top: 1em;

    &:hover {
        cursor: pointer;
        background-color: var(--color-scheme-primary);
        > header {
            color: var(--color-scheme-primary-accent);
            font-weight: bold;
        }
    }

    > header {
        color: var(--color-scheme-primary);
        > .request-method {
            float: left;
        }
    }
}
</style>