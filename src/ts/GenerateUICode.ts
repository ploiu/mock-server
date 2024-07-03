import { gray, green, red } from '@std/fmt/colors';
import { parseArgs } from '@std/cli';
/**
 * Reads the contents of our ui files and inserts them into the ui strings in {/src/ts/MockServer.ts#createUIFileIfNotExists}
 */
if (import.meta.main) {
  const { args } = Deno;
  const parsedArgs = parseArgs(args);
  let html = Deno.readTextFileSync('./src/ui/dist/index.html');
  const [rootJsScriptPath, rootCssPath] = determineGeneratedSourceNames(html);
  html = replaceGeneratedSourceNames(html);
  // using an array like this will make it easier to add new files in the future if we need to
  const jsFiles = [
    Deno.readTextFileSync(`./src/ui/dist${rootJsScriptPath}`),
    parsedArgs.test ? Deno.readTextFileSync('./src/test/uiTests.js') : '',
  ];
  const cssFiles = [
    Deno.readTextFileSync(`./src/ui/dist${rootCssPath}`),
  ];
  let css = '';
  let js = '';
  // populate the css and js files
  for (const cssFile of cssFiles) {
    css += '\n' + cssFile;
  }
  for (const jsFile of jsFiles) {
    js += ';\n' + jsFile;
  }
  // properly format the html and css so that it doesn't interfere with the js, since it's inserted into js code
  const formattedHtml = fixBackSlashesAndQuotes(html);
  const formattedCss = fixBackSlashesAndQuotes(css);
  const formattedJs = js.replaceAll(/\\/g, '\\\\').replaceAll(/\r?\n/g, '\\n')
    .replaceAll(/'/g, `\\'`);
  const generatedCodeBlock = `
////// GENERATED CODE
type UI = {
  uiHtml: string,
  uiCss: string,
  uiJs: string
}
export default {
  uiHtml: '${formattedHtml}',
  uiCss: '${formattedCss}',
  uiJs: '${formattedJs}',
} as UI
////// END GENERATED CODE
`;
  Deno.writeTextFileSync('./src/ts/generatedUi.ts', generatedCodeBlock);
}

function fixBackSlashesAndQuotes(text: string) {
  return text.replaceAll(/\r?\n/g, '\\n').replaceAll(/'/g, "\\'");
}

/**
 * scrapes the html for the names of the generated javascript and css files.
 * The first value returned is the javascript file path, the second is the scss file path
 * @param html
 */
function determineGeneratedSourceNames(html: string): [string, string] {
  const scriptGex = /(?<=src=").*(?=")/i;
  const cssGex = /(?<="stylesheet".*href=").*(?=")/i;
  try {
    console.info(gray('retrieving name of generated js file...'));
    const scriptName = html.match(scriptGex)?.[0];
    console.info(`${green(scriptName!)}!`);
    console.info(gray('retrieving name of generated css file...'));
    const styleSheetName = html.match(cssGex)?.[0];
    console.info(`${green(styleSheetName!)}!`);
    return [scriptName!, styleSheetName!];
  } catch (e) {
    console.error(
      `${
        red('Failed to retrieve js and css names from html file.')
      }. Exception is ${e}`,
    );
    Deno.exit(1);
  }
}

/**
 * replaces the vite-generated js and css file paths with the names we give our bundled js and css
 * @param html
 */
function replaceGeneratedSourceNames(html: string): string {
  const scriptGex = /(?<=src=").*(?=")/i;
  const cssGex = /(?<="stylesheet".*href=").*(?=")/i;
  return html.replace(scriptGex, './ui.js').replace(cssGex, './ui.css');
}
