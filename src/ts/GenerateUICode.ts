import { parse } from "https://deno.land/std@0.127.0/flags/mod.ts";
/**
 * Reads the contents of our ui files and inserts them into the ui strings in {/src/ts/MockServer.ts#createUIFileIfNotExists}
 */
if (import.meta.main) {
  const { args } = Deno;
  const parsedArgs = parse(args);
  const html = Deno.readTextFileSync("./src/ui/ui.html");
  // using an array like this will make it easier to add new files in the future if we need to
  const jsFiles = [
    Deno.readTextFileSync("./src/ui/controller.js"),
    parsedArgs.test ? Deno.readTextFileSync("./src/test/uiTests.js") : "",
    Deno.readTextFileSync("./src/ui/AccordionElement.min.js"),
  ];
  const cssFiles = [
    // accordion needs to go first because we override some of its variables
    Deno.readTextFileSync("./src/ui/accordion.min.css"),
    Deno.readTextFileSync("./src/ui/ui.css"),
  ];
  let css = "";
  let js = "";
  // populate the css and js files
  for (const cssFile of cssFiles) {
    css += "\n" + cssFile;
  }
  for (const jsFile of jsFiles) {
    js += ";\n" + jsFile;
  }
  // properly format the html and css so that it doesn't interfere with the js, since it's inserted into js code
  const formattedHtml = fixBackSlashesAndQuotes(html);
  const formattedCss = fixBackSlashesAndQuotes(css);
  const formattedJs = fixBackSlashesAndQuotes(js.replaceAll(/\\/g, "\\\\"));
  const tsFile = Deno.readTextFileSync("./src/ts/MockServer.ts");
  const replacedContents = tsFile
    // replace the html string
    .replace(getRegexForUIString("uiHtml"), `'${formattedHtml}'`)
    // replace the css string
    .replace(getRegexForUIString("uiCss"), `'${formattedCss}'`)
    // replace the js string
    .replace(getRegexForUIString("uiJs"), `'${formattedJs}'`);
  Deno.writeTextFileSync("./src/ts/MockServer.ts", replacedContents);
}

function getRegexForUIString(uiStringName: string): RegExp {
  return new RegExp(
    `(?<=const ${uiStringName}: string =[\r\n ]*).*?(?=;(\r\n)?$)`,
    "mgi",
  );
}

function fixBackSlashesAndQuotes(text: string) {
  return text.replaceAll(/\r?\n/g, "\\n").replaceAll(/'/g, "\\'");
}
