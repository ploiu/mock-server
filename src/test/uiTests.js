import puppeteer from "https://deno.land/x/puppeteer@9.0.1/mod.ts";
import {assertEquals,} from "https://deno.land/std@0.100.0/testing/asserts.ts";

const browser = await puppeteer.launch({headless: false});
const page = await browser.newPage();
await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
})
await page.goto("http://localhost:8000/mock-server-ui");
await page.screenshot({path: "example.png"});

Deno.test('should show default route in route panel and nothing else', async () => {
    const data = await page.evaluate(() => {
        const elements = [...document.querySelectorAll('#route-panel-list li')]
        return {
            count: elements.length,
            firstText: elements[0].innerText
        }
    })
    assertEquals(data.count, 1)
    assertEquals(data.firstText, 'Example Route')
})

// exists only to close everything after the rest of the tests are done
Deno.test('cleanup', () => {
    browser.close().then(() => {
        // remove the test config file
        try {
            Deno.removeSync('./config-test.json')
        } catch (e) {
        }
    });
})
