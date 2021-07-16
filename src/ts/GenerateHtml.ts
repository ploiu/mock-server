/**
 * Reads the contents of /src/html/ui.html and puts it into the ui string in {/src/ts/MockServer.ts#createUIFileIfNotExists}
 */
if (import.meta.main) {
  const html = Deno.readTextFileSync("./src/ui/ui.html");
  const css = Deno.readTextFileSync("./src/ui/ui.css");
  // properly format the html and css so that it doesn't interfere with the js, since it's inserted into js code
  const formattedHtml = html.replaceAll(/\r?\n/g, "\\n").replaceAll(
    /'/g,
    "\\'",
  );
  const formattedCss = css.replaceAll(/\r?\n/g, "\\n").replaceAll(/'/g, "\\'");
  const tsFile = Deno.readTextFileSync("./src/ts/MockServer.ts");
  const replacedContents =
    // replace the html string
    tsFile.replace(
      /(?<=const uiHtml: string =[\r\n ]*).*?(?=;(\r\n)?$)/mgi,
      `'${formattedHtml}'`,
    )
      // replace the css string
      .replace(
        /(?<=const uiCss: string =[\r\n ]*).*?(?=;(\r\n)?$)/mgi,
        `'${formattedCss}'`,
      );
  Deno.writeTextFileSync("./src/ts/MockServer.ts", replacedContents);
}
