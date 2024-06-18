<script lang="ts" setup>
import { onUnmounted } from 'vue'

import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';
import { store } from '../store';
import { isSuccess, isError } from '../models/UILogEntry.ts';
import { fetchLogs } from '../service/LogService.ts';

const routePullInterval = setInterval(() => {
    fetchLogs().then(logs => store.logs = [...store.logs, ...logs]);
}, 1_000)
onUnmounted(() => clearInterval(routePullInterval))

const formatDate = (timestamp: number) => new Date(timestamp).toISOString()
</script>

<template>
    <section id="logSection">
        <article v-for="log in store.logs" :key="log.message + log.timestamp + log.url">
            <accordion-element v-if="isSuccess(log)">
                <div class="ploiu-accordion-title">
                    <span class="method">{{ log.method }}</span>
                    <span class="url">{{ log.url }}</span>
                    <span class="date">{{ formatDate(log.timestamp) }}</span>
                </div>
            </accordion-element>
        </article>
    </section>
</template>

<style scoped>
    #logSection {
        margin-left: 2em;
    }
</style>