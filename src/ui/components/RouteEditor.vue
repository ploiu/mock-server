<script setup lang="ts">
import { UIRoute } from '../models'
import { RouteTypes } from '../../ts/request/RouteTypes.ts';
import { RequestMethod } from '../../ts/request/RequestMethod.ts';
import InputText from 'primevue/inputtext';
import FloatLabel from 'primevue/floatlabel';
import Dropdown from 'primevue/dropdown';
import UrlEditor from '../components/UrlEditor.vue';
import TextArea from 'primevue/textarea';
import { ref } from 'vue';
import { validateHeaderInput } from '../models/UIHeader.ts';

type RouteEditorProps = {
  route: UIRoute
}
const props = defineProps<RouteEditorProps>();
const headersInvalid = ref(false)

const setHeaders = (input: string) => {
  props.route.responseHeaders = input
  headersInvalid.value = !validateHeaderInput(input);
}
</script>

<template>
  <section id="routeEditor">
      <!-- title, type, response code -->
  <div class="row">
    <!-- title  -->
    <div class="col-4">
      <FloatLabel id="requestTitleWrapper">
        <InputText id="requestTitle" v-model="props.route.title" />
        <label for="requestTitle">Title</label>
      </FloatLabel>
    </div>
    <!-- type  -->
    <div class="col-4">
      <Dropdown id="routeTypes" v-model="props.route.routeType" :options="Object.values(RouteTypes)"
        placeholder="type" />
    </div>
    <!-- status code  -->
    <div class="col-4" v-if="props.route.routeType === RouteTypes.DEFAULT">
      <FloatLabel id="responseStatusCodeWrapper">
        <InputText id="responseStatusCode" type="number" v-model="props.route.responseStatus"
          @change="e => props.route!.responseStatus = Number((e as any).target.value)" />
        <label for="responseStatusCode">Status Code</label>
      </FloatLabel>
    </div>
  </div>
  <!-- method, url -->
  <div class="row">
    <div class="col-2">
      <Dropdown id="requestMethod" v-model="props.route.method" :options="Object.keys(RequestMethod)"
        placeholder="Method" />
    </div>
    <div class="col-10">
      <!-- key is set here to force re-render when props.route changes -->
      <UrlEditor :initial-text="props.route.url ?? ''" :key="props.route.url" />
    </div>
  </div>
  <!-- http headers -->
  <div id="httpHeadersRow" class="row">
    <div class="col-12">
      <!-- TODO not now, but I want to add syntax highlighting to the headers -->
      <FloatLabel>
        <TextArea 
        id="headersInput" 
        rows="14" 
        spellcheck="false"
        
        :invalid="headersInvalid"
         @change="e => setHeaders(e.target.value)"
         v-model="props.route.responseHeaders" />
        <label for="headersInput">Response Headers</label>
      </FloatLabel>
    </div>
  </div>
  <!-- response body -->
  <div id="httpResponseRow" class="row" v-if="props.route.routeType === RouteTypes.DEFAULT">
    <div class="col-12">
      <FloatLabel>
        <TextArea
          id="bodyInput"
          rows="14"
          spellcheck="false"
          v-model="props.route.response"
        />
        <label for="bodyInput">Response Body</label>
      </FloatLabel>
    </div>
  </div>
  </section>
</template>

<style scoped>
#routeEditor {
  overflow-y: auto;
  height: 90vh;
}

#routeEditor > .row {
  margin-top: 1em;
}

#requestTitle,
#routeTypes,
#responseStatusCode,
#requestUrl,
#requestMethod {
  width: 100%;
}

#httpHeadersRow {
  margin-top: 1em;
}

:deep(textarea) {
  width: 100%;
  resize: vertical;
}
</style>