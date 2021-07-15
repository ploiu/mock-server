/**
 * Reads the contents of /src/html/ui.html and puts it into the ui string in {/src/ts/MockServer.ts#createUIFileIfNotExists}
 */
if (import.meta.main) {
    const html = Deno.readTextFileSync('./src/html/ui.html')
    const formattedHtml = html.replaceAll(/\r?\n/g, '\\n').replaceAll(/'/g, "\\'")
    const tsFile = Deno.readTextFileSync('./src/ts/MockServer.ts')
    const replacedContents = tsFile.replace(/(?<=const uiHtml: string = ).*?(?=;)/, `'${formattedHtml}'`)
    Deno.writeTextFileSync('./src/ts/MockServer.ts', replacedContents)
}
