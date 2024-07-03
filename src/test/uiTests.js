(async function () {
  // collection of helpful test methods
  const Ploiu = {
    /** list of failed test names */
    failedTests: [],
    /** prints a green "ok" to the console */
    ok() {
      console.log('%cok', 'color: springgreen');
    },
    /** prints a red "FAIL" to the console, also throws an eception to be caught by the test runner*/
    fail(message = '', throwException = true) {
      console.log('%cFAIL', 'color: crimson');
      if (throwException) {
        throw new Error(message);
      }
    },
    ////// assertion methods
    assert(expression, message = '') {
      if (!expression) {
        if (message && message !== '') {
          console.error(message);
        }
        this.fail(message);
      }
    },
    assertFalse(expression, message = '') {
      if (expression) {
        if (message && message !== '') {
          console.error(message);
        }
        this.fail(message);
      }
    },
    assertEquals(expected, actual, message = '') {
      if (expected !== actual) {
        if (message && message !== '') {
          console.error(message);
        }
        this.fail(message);
      }
    },
    assertNotEquals(notExpected, actual, message = '') {
      if (notExpected === actual) {
        if (message && message !== '') {
          console.error(message);
        }
        this.fail(message);
      }
    },
    assertNull(value, message = '') {
      this.assert(value === null || value === undefined, message);
    },
    assertNotNull(value, message = '') {
      this.assertFalse(value === null || value === undefined, message);
    },
    ////// test methods

    /**Runs the passed test, marking it as passed or failed depending on the result*/
    test(title = '', test = () => {
    }) {
      // first log the title, then run the test. If no exceptions are thrown, we can pass the test
      console.log(title);
      try {
        test();
        this.ok();
      } catch (e) {
        this.failedTests.push(title);
        if (typeof e === 'string') {
          this.fail(e, false);
        }
      }
    },
    // this should be called if the test is an async function
    async testAsync(title = '', test = async () => {
    }) {
      // first log the title, then run the test. If no exceptions are thrown, we can pass the test
      console.log(title);
      try {
        await test();
        this.ok();
      } catch (e) {
        this.failedTests.push(title);
        if (typeof e === 'string') {
          this.fail(e, false);
        }
      }
    },
    ////// util methods

    /**
     * Types the passed text into the passed element
     * @param {string} text the text to type
     * @param {HTMLElement} inputElement the input element to fill with the text
     * @param {Number} keyIntervalMS the interval in milliseconds between each keystroke
     * @return {Promise<void>}
     */
    async type(text, inputElement, keyIntervalMS = 10) {
      return new Promise((resolve) => {
        const splitText = text.split('');
        // list of promises to wait for
        const promises = [];
        for (let i = 0; i < splitText.length; i++) {
          promises.push(
            new Promise((resolve) => {
              window.setTimeout(() => {
                const event = new Event('input', {
                  bubbles: true,
                  cancelable: true,
                });
                inputElement.value += splitText[i];
                inputElement.dispatchEvent(event);
                resolve();
              }, keyIntervalMS * i);
            }),
          );
        }
        Promise.allSettled(promises).then(() => resolve());
      });
    },
    /**
     * selects an option in the passed `selectElement`
     * @param {number} index
     * @param {HTMLSelectElement} selectElement
     */
    select(index, selectElement) {
      selectElement.selectedIndex = index;
      selectElement.dispatchEvent(new Event('change', {}));
    },
    /**
     * clicks the passed element and waits the passed duration before resolving
     * @param element
     * @param waitDurationMS
     * @return {Promise<void>}
     */
    async clickAndWait(element, waitDurationMS = 250) {
      return new Promise((resolve) => {
        element.click();
        window.setTimeout(resolve, waitDurationMS);
      });
    },
    /** used to run a function that requires some sort of delay before it. Use this instead of `window.setTimeout`*/
    async delay(fn, delayTime = 250) {
      return new Promise((resolve, reject) => {
        window.setTimeout(() => {
          try {
            fn();
            resolve();
          } catch (e) {
            reject(e);
          }
        }, delayTime);
      });
    },

    ////// misc methods
    showResults() {
      const dialog = document.createElement('dialog');
      document.body.appendChild(dialog);
      dialog.style.color = 'darkgray';
      if (Ploiu.failedTests.length > 0) {
        dialog.innerHTML = `
    <h1 style="color: red">There are test failures:</h1>
    <ul>
    ${
          (() => {
            let failedTests = Ploiu.failedTests;
            let listHtml = '';
            for (const testName of failedTests) {
              listHtml += '<li>' + testName + '</li>';
            }
            return listHtml;
          })()
        }
    </ul>
  `;
      } else {
        dialog.innerHTML =
          '<h1 style="color: forestgreen">All Tests Passed</h1>';
      }
      dialog.showModal();
    },
  };

  console.log('starting tests...');
  await Ploiu.testAsync('should show only 1 route on page load', async () => {
    // wait a moment for vue to startup
    return Ploiu.delay(() => {
      const routes = [
        ...document.querySelectorAll('#routeList .route-list-entry'),
      ];
      Ploiu.assertEquals(1, routes.length, 'only should be 1 route');
      Ploiu.assertEquals(
        'Example Route',
        routes[0].querySelector('.route-title').innerText,
        'Route should display route name',
      );
    }, 2_000);
  });

  await Ploiu.testAsync(
    'should show route edit panel when clicking on route',
    async () => {
      const route = document.querySelector('#routeList .route-list-entry');
      await Ploiu.clickAndWait(route);
      const editPanel = document.querySelector('#routeEditor');
      Ploiu.assertNotNull(
        editPanel,
        'edit panel should exist when route is clicked',
      );
    },
  );

  await Ploiu.testAsync(
    'should have route values when selecting route',
    async () => {
      const routeTitleInput = document.querySelector(
        '#routeEditor #requestTitle',
      );
      const routeTypeOption = document.querySelector(
        '#routeEditor #routeTypes > span',
      );
      const statusCodeInput = document.querySelector(
        '#routeEditor #responseStatusCode',
      );
      const requestMethodOption = document.querySelector(
        '#routeEditor #requestMethod > span',
      );
      const urlInput = document.querySelector('#routeEditor #urlInput');
      const headersInput = document.querySelector('#routeEditor #headersInput');
      const responseBodyInput = document.querySelector(
        '#routeEditor #bodyInput',
      );
      Ploiu.assertNotNull(routeTitleInput, 'route title input should exist');
      Ploiu.assertNotNull(routeTypeOption, 'route type option should exist');
      Ploiu.assertNotNull(statusCodeInput, 'status code input should exist');
      Ploiu.assertNotNull(
        requestMethodOption,
        'request method option should exist',
      );
      Ploiu.assertNotNull(urlInput, 'url input should exist');
      Ploiu.assertNotNull(headersInput, 'headers input should exist');
      Ploiu.assertNotNull(
        responseBodyInput,
        'response body input should exist',
      );

      Ploiu.assertEquals('Example Route', routeTitleInput.value);
      Ploiu.assertEquals('default', routeTypeOption.innerText);
      Ploiu.assertEquals('200', statusCodeInput.value);
      Ploiu.assertEquals('GET', requestMethodOption.innerText);
      Ploiu.assertEquals('/HelloWorld/:name?:age', urlInput.value);
      Ploiu.assertEquals('', headersInput.value);
      Ploiu.assertEquals(
        'Hello, {{name}}! You are {{age}} years old',
        responseBodyInput.value,
      );
    },
  );

  await Ploiu.testAsync(
    'should hide header and body inputs when route type is set to pass-through',
    async () => {
      await Ploiu.clickAndWait(document.querySelector('#routeTypes'));
      const passthroughElement =
        [...document.querySelectorAll('#routeTypes_list > li')].filter((it) =>
          it.innerText === 'pass-through'
        )[0];
      await Ploiu.clickAndWait(passthroughElement);
      Ploiu.assertNull(
        document.querySelector('#routeEditor #responseStatusCode'),
      );
      Ploiu.assertNull(document.querySelector('#routeEditor #headersInput'));
      Ploiu.assertNull(document.querySelector('#routeEditor #bodyInput'));
      Ploiu.assertNotNull(document.querySelector('#routeEditor #redirectUrl'));
    },
  );

  Ploiu.showResults();
})();
