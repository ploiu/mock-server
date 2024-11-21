<script lang="ts" setup>
import { store } from '../../store.ts';
import Button from 'primevue/button';
import { logs } from './LogView.ts'
const formatDate = (timestamp: number) => new Date(timestamp).toISOString()
const clearLogs = () => store.logs.splice(0, store.logs.length);
</script>

<template>
    <section id="logSection">
        <article v-for="[id, logGroup] in Object.entries(logs)" :key="id">
            <!-- parent accordion for both request and response -->
            <accordion-element class="log" data-group="root" v-if="'request' in logGroup">
                <div class="ploiu-accordion-title">
                    <span :class="`request-method request-method-${logGroup.request.method.toLowerCase()}`">{{
                        logGroup.request.method }}</span>
                    <span class="url">{{ logGroup.request.url }}</span>
                </div>
                <div class="ploiu-accordion-body">
                    <!-- request log -->
                    <accordion-element class="log-success request-response-log" v-if="'request' in logGroup" data-group="request/response">
                        <div class="ploiu-accordion-title">
                            <span>Request</span>
                            <span class="date">{{ formatDate(logGroup.request.timestamp) }}</span>
                        </div>
                        <div class="ploiu-accordion-body">
                            <!-- headers -->
                            <accordion-element class="headers-body-log" data-group="headers/body">
                                <div class="ploiu-accordion-title">
                                    Headers
                                </div>
                                <div class="ploiu-accordion-body">
                                    <div class="log-headers">
                                        <ul>
                                            <li v-for="[headerName, headerValue] in Object.entries(logGroup.request.headers)"
                                                :key="headerName">
                                                <span class="header-name">{{ headerName }}</span><span
                                                    class="header-value">{{
                                                        headerValue }}</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </accordion-element>
                            <accordion-element class="headers-body-log" data-group="headers/body"
                                v-if="logGroup.request.body && logGroup.request.body.trim().length > 0">
                                <div class="ploiu-accordion-title">Request Body</div>
                                <div class="ploiu-accordion-body">
                                    <div class="log-body">
                                        {{ logGroup.request.body }}
                                    </div>
                                </div>
                            </accordion-element>
                        </div>
                    </accordion-element>
                    <!-- response log -->
                    <accordion-element class="log-success request-response-log" v-if="'response' in logGroup" data-group="request/response">
                        <div class="ploiu-accordion-title">
                            <span>Response</span>
                            <span class="date">{{ formatDate(logGroup.response.timestamp) }}</span>
                        </div>
                        <div class="ploiu-accordion-body">
                            <!-- headers  TODO rename log-error class and use that to say no headers on response -->
                            <accordion-element class="headers-body-log" data-group="headers/body">
                                <div class="ploiu-accordion-title">
                                    Headers
                                </div>
                                <div class="ploiu-accordion-body">
                                    <div class="log-headers">
                                        <ul>
                                            <li v-for="[headerName, headerValue] in Object.entries(logGroup.response.headers)"
                                                :key="headerName">
                                                <span class="header-name">{{ headerName }}</span>
                                                <span class="header-value">{{ headerValue }}</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </accordion-element>
                            <accordion-element class="headers-body-log" data-group="headers/body"
                                v-if="logGroup.response.body && logGroup.response.body.trim().length > 0">
                                <div class="ploiu-accordion-title">Response Body</div>
                                <div class="ploiu-accordion-body">
                                    <div class="log-body">
                                        {{ logGroup.response.body }}
                                    </div>
                                </div>
                            </accordion-element>
                        </div>
                    </accordion-element>
                </div>
            </accordion-element>
            <section class="log-error" v-if="'error' in logGroup">
                <span class="error-message">{{ logGroup.error.message }}</span>
                <span class="date">{{ formatDate(logGroup.error.timestamp) }}</span>
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