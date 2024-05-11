<script setup lang="ts">
    import InputText from 'primevue/inputtext';
    import { ref } from 'vue';

    type UrlEditorProps = {
        initialText: string
    }

    const props = defineProps<UrlEditorProps>();

    const inputText = ref(props.initialText)
    const renderedText = ref('')

    const processInputText = (): void => {
        renderedText.value = inputText.value;
    }
    
    const setInputText = (value: string): void => {
        inputText.value = value;
        processInputText();
    }

    // calling setInputText here instead of default value for inputText will process the text as well
    setInputText(props.initialText);

    // TODO I want syntax highlighting on routes for things like path and query variables

</script>

<template>
    <code id="renderedText">{{ renderedText }}</code>
    <InputText id="inputText" type="text" :model-value="inputText" @update:model-value="setInputText"/>
</template>

<style scoped>
#inputText {
    color: transparent;
    background-color: transparent;
    caret-color: white;
}

#inputText, #renderedText {
    position: absolute;
    top: 1vh;
    left: 18%;
    width: 85%;
    font-family: var(--font-family);
    font-feature-settings: var(--font-feature-settings);
    font-size: 1rem;
}

#renderedText {
    padding: calc(46px - 2em);
    background-color: var(--surface-b);
    height: 46px;
}

</style>