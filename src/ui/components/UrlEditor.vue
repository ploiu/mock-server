<script setup lang="ts">
import InputText from "primevue/inputtext";
import { ref } from "vue";
import { tokenize } from "../../ts/request/RouteTokenizer.ts";

type UrlEditorProps = {
    initialText: string;
};

const emit = defineEmits<{
    (e: "change", value: string);
}>();

const props = defineProps<UrlEditorProps>();

const inputText = ref(props.initialText);

const processInputText = (): string => {
    if (inputText.value.length === 0) {
        inputText.value = "/";
    }
    const tokens = tokenize(inputText.value);
    if (tokens.length === 0) {
        return inputText.value;
    }
    let builtText = "";
    // keep track of this is the first query param we've found; used to know if we need to prepend `?` or `&`
    let firstQueryParam = true;
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        let prepend: string;
        if (token.tokenType.includes("PATH")) {
            prepend = "/";
        } else if (firstQueryParam) {
            firstQueryParam = false;
            prepend = "?";
        } else {
            prepend = "&";
        }
        builtText += `<span class="${token.tokenType}">${prepend}${token.text}</span>`;
    }
    return builtText;
};

const cleanValue = () => {
    return inputText.value.replace(/^\/\//, "/");
};

const change = () => {
    emit("change", cleanValue());
};
</script>

<template>
    <div id="renderedText" v-html="processInputText()"></div>
    <InputText
        id="urlInput"
        type="text"
        :model-value="inputText"
        @update:model-value="
            (value) => (inputText = ('/' + value).replace(/^\/\//, '/'))
        "
        @change="change"
    />
</template>

<style scoped>
#urlInput {
    color: transparent;
    background-color: transparent;
    caret-color: white;
}

#urlInput,
#renderedText {
    position: absolute;
    left: 18%;
    width: 80%;
    font-family: var(--font-family);
    font-feature-settings: var(--font-feature-settings);
    font-variant-ligatures: none;
    font-size: 1rem;
}

#renderedText {
    padding: calc(46px - 2em);
    background-color: var(--p-inputtext-background);
    height: 46px;
}
</style>
// can't use scoped styles for generated html
<style>
.INVALID_PATH_PART,
.INVALID_QUERY_PART {
    color: var(--p-red-500);
}

.QUERY_GLOB_PART {
    color: var(--p-blue-500);
}

.PATH_GLOB_PART {
    color: var(--p-primary-500);
}

.REQUIRED_PATH_PARAM_PART {
    color: var(--p-yellow-500);
}

.OPTIONAL_PATH_PARAM_PART {
    color: var(--p-green-500);
}

.REQUIRED_QUERY_PARAM_PART {
    color: var(--p-pink-500);
}

.OPTIONAL_QUERY_PARAM_PART {
    color: var(--p-cyan-500);
}
</style>
