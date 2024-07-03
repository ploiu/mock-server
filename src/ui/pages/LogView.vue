<script lang="ts" setup>
import { onUnmounted } from 'vue'

import { store } from '../store';
import { isSuccess, isError } from '../models/UILogEntry.ts';
import { fetchLogs } from '../service/LogService.ts';
import Button from 'primevue/button';

const routePullInterval = setInterval(() => {
    fetchLogs().then(logs => store.logs = [...store.logs, ...logs].sort((a, b) => a.timestamp - b.timestamp));
}, 1_000)
onUnmounted(() => clearInterval(routePullInterval))

const formatDate = (timestamp: number) => new Date(timestamp).toISOString()

const clearLogs = () => store.logs = [];
</script>

<template>
    <section id="logSection">
        <article v-for="log in store.logs" :key="log.message + log.timestamp + log.url">
            <accordion-element class="log-success" v-if="isSuccess(log)" data-group="0">
                <div class="ploiu-accordion-title">
                    <span :class="`request-method request-method-${log.method.toLowerCase()}`">{{ log.method }}</span>
                    <span class="url">{{ log.url }}</span>
                    <span class="date">{{ formatDate(log.timestamp) }}</span>
                </div>
                <div class="ploiu-accordion-body">
                    <!-- headers -->
                    <accordion-element data-group="1">
                        <div class="ploiu-accordion-title">
                            Headers
                        </div>
                        <div class="ploiu-accordion-body">
                            <div class="log-headers">
                                <ul>
                                    <li v-for="[headerName, headerValue] in Object.entries(log.headers)"
                                        :key="headerName">
                                        <span class="header-name">{{ headerName }}</span><span class="header-value">{{
                                            headerValue }}</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </accordion-element>
                    <accordion-element data-group="1" v-if="log.body && log.body.trim().length > 0">
                        <div class="ploiu-accordion-title">Request Body</div>
                        <div class="ploiu-accordion-body">
                            <div class="log-body">
                                {{ log.body }}
                            </div>
                        </div>
                    </accordion-element>
                </div>
            </accordion-element>
            <section class="log-error" v-if="isError(log)">
                <span class="error-message">{{ log.message }}</span>
                <span class="date">{{ formatDate(log.timestamp) }}</span>
            </section>
        </article>
        <Button severity="danger" id="clearLogs" rounded @click="clearLogs">
            <!-- from primeicons (MIT license; https://github.com/primefaces/primeicons/blob/master/raw-svg/trash.svg)
                    Reason we import the raw svg is so that we don't have to add extra code to the backend to service the fonts file -->
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <g id="trash">
                    <path d="M20,8.7H4A.75.75,0,1,1,4,7.2H20a.75.75,0,0,1,0,1.5Z" />
                    <path
                        d="M16.44,20.75H7.56A2.4,2.4,0,0,1,5,18.49V8a.75.75,0,0,1,1.5,0V18.49c0,.41.47.76,1,.76h8.88c.56,0,1-.35,1-.76V8A.75.75,0,1,1,19,8V18.49A2.4,2.4,0,0,1,16.44,20.75Zm.12-13A.74.74,0,0,1,15.81,7V5.51c0-.41-.48-.76-1-.76H9.22c-.55,0-1,.35-1,.76V7a.75.75,0,1,1-1.5,0V5.51A2.41,2.41,0,0,1,9.22,3.25h5.56a2.41,2.41,0,0,1,2.53,2.26V7A.75.75,0,0,1,16.56,7.76Z" />
                    <path d="M10.22,17a.76.76,0,0,1-.75-.75V11.72a.75.75,0,0,1,1.5,0v4.52A.75.75,0,0,1,10.22,17Z" />
                    <path d="M13.78,17a.75.75,0,0,1-.75-.75V11.72a.75.75,0,0,1,1.5,0v4.52A.76.76,0,0,1,13.78,17Z" />
                </g>
            </svg>
        </Button>
    </section>
</template>

<style scoped>
#logSection {
    margin-left: 2em;
    margin-top: 1em;
    max-height: 75vh;
    overflow-y: auto;
    margin-bottom: 2em;

    article>accordion-element {
        width: 100%;
    }

    #clearLogs {
        margin-bottom: 1em;
    }

    .request-method {
        border-radius: inherit;
        padding: 0.25em;
        margin-right: 0.5em;
    }

    .date {
        float: right;
        color: var(--text-color);
    }

    .log-headers {
        background-color: var(--surface-a);
        border-radius: var(--border-radius);
        padding: var(--content-padding);

        ul {
            list-style-type: none;
            margin: 0;

            li {
                margin: 0.5em;

                .header-name {
                    color: var(--primary-300);

                    &::after {
                        content: ": ";
                    }
                }
            }
        }
    }

    .log-body {
        background-color: var(--surface-a);
        border-radius: var(--border-radius);
        padding: var(--content-padding);
        font-family: var(--font-family);
    }
}

.log-error {
    background-color: var(--surface-a);
    border-radius: var(--border-radius);
    padding: var(--content-padding);
    color: var(--red-500);
}

.log-success,
.log-error {
    margin-top: 0.5em;
    margin-bottom: 0.5em;
}

#clearLogs {
    position: fixed;
    bottom: 3vh;
    right: 3vh;
    padding: 15px;

    >svg {
        width: 25px;
        height: 25px;
    }
}
</style>