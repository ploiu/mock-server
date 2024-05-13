<script setup lang="ts">
import { UIRoute } from '../models'
import { RouteTypes } from '../../ts/request/RouteTypes.ts';
import { RequestMethod } from '../../ts/request/RequestMethod.ts';
import InputText from 'primevue/inputtext';
import FloatLabel from 'primevue/floatlabel';
import Dropdown from 'primevue/dropdown';
import UrlEditor from '../components/UrlEditor.vue';
import TextArea from 'primevue/textarea';
import Button from 'primevue/button';
import { ref, reactive } from 'vue';
import { validateHeaderInput } from '../models/UIHeader.ts';

type RouteEditorProps = {
  route: UIRoute
}
const props = defineProps<RouteEditorProps>();

const item = reactive({ ...props.route } as UIRoute);
item.isEnabled = item.isEnabled ?? true;
const headersInvalid = ref(false)
const hasChanges = ref(false);
const emit = defineEmits<{
  (e: 'save', value: UIRoute)
}>()

const setHeaders = (input: string) => {
  item.responseHeaders = input
  headersInvalid.value = !validateHeaderInput(input);
}

const valueChange = () => hasChanges.value = true

const saveRoute = () => {
  emit('save', item);
  hasChanges.value = false;
}

</script>

<template>
  <section id="routeEditor">
    <!-- title, type, response code -->
    <div class="row">
      <!-- title  -->
      <div class="col-4">
        <FloatLabel id="requestTitleWrapper">
          <InputText id="requestTitle" v-model="item.title" @update:model-value="valueChange" />
          <label for="requestTitle">Title</label>
        </FloatLabel>
      </div>
      <!-- type  -->
      <div class="col-4">
        <Dropdown id="routeTypes" v-model="item.routeType" :options="Object.values(RouteTypes)" placeholder="type"
          @update:model-value="valueChange" />
      </div>
      <!-- status code  -->
      <div class="col-4" v-if="item.routeType === RouteTypes.DEFAULT">
        <FloatLabel id="responseStatusCodeWrapper">
          <InputText id="responseStatusCode" type="number" v-model="item.responseStatus"
            @update:model-value="e => { props.route!.responseStatus = Number(e); valueChange() }" />
          <label for="responseStatusCode">Status Code</label>
        </FloatLabel>
      </div>
    </div>
    <!-- method, url -->
    <div class="row">
      <div class="col-2">
        <Dropdown id="requestMethod" v-model="item.method" :options="Object.keys(RequestMethod)"
          placeholder="Method" @update:model-value="valueChange" />
      </div>
      <div class="col-10">
        <!-- key is set here to force re-render when props.route changes -->
        <UrlEditor :initial-text="item.url ?? ''" :key="item.url" @change="v => { valueChange(); item.url = v }" />
      </div>
    </div>
    <!-- http headers -->
    <div id="httpHeadersRow" class="row" v-if="item.routeType === RouteTypes.DEFAULT">
      <div class="col-12">
        <!-- TODO not now, but I want to add syntax highlighting to the headers -->
        <FloatLabel>
          <TextArea id="headersInput" rows="14" spellcheck="false" :invalid="headersInvalid"
            @change="e => { setHeaders(e.target.value); valueChange() }" v-model="item.responseHeaders" />
          <label for="headersInput">Response Headers</label>
        </FloatLabel>
      </div>
    </div>
    <!-- response body -->
    <div id="httpResponseRow" class="row" v-if="item.routeType === RouteTypes.DEFAULT">
      <div class="col-12">
        <FloatLabel>
          <TextArea id="bodyInput" rows="14" spellcheck="false" v-model="item.response" @change="valueChange" />
          <label for="bodyInput">Response Body</label>
        </FloatLabel>
      </div>
    </div>
    <!-- redirect url -->
    <div id="redirectUrl" class="row" v-if="item.routeType == RouteTypes.PASSTHROUGH">
      <div class="col-12">
        <FloatLabel id="redirectUrlWrapper">
          <InputText v-model="item.redirectUrl" id="redirectUrl" @update:model-value="valueChange" />
          <label for="redirectUrl">Redirect Url</label>
        </FloatLabel>
      </div>
    </div>
    <Button id="saveButton" icon="pi pi-save" rounded v-if="hasChanges" @click="saveRoute" />
  </section>
</template>

<style scoped>
#routeEditor {
  overflow-y: auto;
  height: 90vh;
}

#routeEditor>.row {
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

#redirectUrl {
  width: 100%;
}

#saveButton {
  position: fixed;
  bottom: 3vh;
  right: 3vh;
}
</style>