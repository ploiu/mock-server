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
        ...document.querySelectorAll('#route-panel-list li'),
      ];
      Ploiu.assertEquals(1, routes.length, 'only should be 1 route');
      Ploiu.assertEquals(
        'Example Route',
        routes[0].innerText,
        'Route should display route name',
      );
    }, 2_000);
  });

  await Ploiu.testAsync(
    'should show edit route panel on route click',
    async () => {
      const beforeClick = document.querySelector('#route-editor');
      Ploiu.assertNull(
        beforeClick,
        'route editor should not be visible before a route is selected',
      );
      document.querySelector('#route-panel-list li').click();
      // displaying the route editor is fast but not instantaneous, so wait a bit before testing this part
      return Ploiu.delay(() => {
        const afterClick = document.querySelector('#route-editor');
        Ploiu.assertNotNull(
          afterClick,
          'route editor should be visible after a route is selected',
        );
        // test each of the form components
        const routeName = document.querySelector('#route-name-input').value;
        const routeResponseCode = +document.querySelector(
          '#route-status-code-input',
        ).value;
        const requestMethod =
          document.querySelector('#route-request-method-input').value;
        const requestUrl = document.querySelector('#route-request-url').value;
        const headers = [
          ...document.querySelectorAll('#response-headers tbody tr'),
        ];
        const responseBody =
          document.querySelector('#response-body-input').value;

        Ploiu.assertEquals(
          'Example Route',
          routeName,
          'route name input does not match selected route name',
        );
        Ploiu.assertEquals(
          200,
          routeResponseCode,
          'route response code input does not match selected route response code',
        );
        Ploiu.assertEquals(
          'GET',
          requestMethod,
          'route status code input does not match selected route status code',
        );
        Ploiu.assertEquals(
          '/HelloWorld/:name?:age',
          requestUrl,
          'route url input does not match selected route url',
        );
        Ploiu.assertEquals(
          0,
          headers.length,
          'route has 0 headers, so UI should only display 0',
        );
        Ploiu.assertEquals(
          'Hello, {{name}}! You are {{age}} years old',
          responseBody,
          'response body should be route\'s response body',
        );
      });
    },
  );

  await Ploiu.testAsync(
    'should show empty edit route panel when creating a new route',
    async () => {
      document.querySelector('#add-new-button').click();
      return Ploiu.delay(() => {
        // test each of the form components
        const routeName = document.querySelector('#route-name-input').value;
        const routeResponseCode =
          document.querySelector('#route-status-code-input').value;
        const requestMethod =
          document.querySelector('#route-request-method-input').value;
        const requestUrl = document.querySelector('#route-request-url').value;
        const headers = [
          ...document.querySelectorAll('#response-headers tbody tr'),
        ];
        const responseBody =
          document.querySelector('#response-body-input').value;

        Ploiu.assertEquals(
          '',
          routeName,
          'route name input should be empty',
        );
        Ploiu.assertEquals(
          '',
          routeResponseCode,
          'route response code input should be empty',
        );
        Ploiu.assertEquals(
          '',
          requestMethod,
          'route status code input should be empty',
        );
        Ploiu.assertEquals(
          '',
          requestUrl,
          'route url input should be empty',
        );
        Ploiu.assertEquals(
          0,
          headers.length,
          'so UI should only display 0 headers',
        );
        Ploiu.assertEquals(
          '',
          responseBody,
          'response body should be empty',
        );
      });
    },
  );

  await Ploiu.testAsync('should allow fields to be input into', async () => {
    const routeNameInput = document.querySelector('#route-name-input');
    const routeResponseCodeInput = document.querySelector(
      '#route-status-code-input',
    );
    const requestMethodInput = document.querySelector(
      '#route-request-method-input',
    );
    const requestUrlInput = document.querySelector('#route-request-url');
    const headersButton = document.querySelector('#add-header-button');
    const responseBodyInput = document.querySelector(
      '#response-body-input',
    );

    await Promise.all([
      Ploiu.type('route title', routeNameInput),
      Ploiu.type('200', routeResponseCodeInput),
      Ploiu.type('/test', requestUrlInput),
      Ploiu.type('response body', responseBodyInput),
    ]);
    Ploiu.select(0, requestMethodInput);
    headersButton.click();
    // wait a bit for the UI to update
    return Ploiu.delay(() => {
      // verify that the headers inputs exist, and only one of each exist since we clicked the button once
      const headerTitleInputs = [
        ...document.querySelectorAll('input.header-title'),
      ];
      const headerValueInputs = [
        ...document.querySelectorAll('input.header-value'),
      ];
      Ploiu.assertEquals(
        1,
        headerTitleInputs.length,
        'There should only be 1 header input',
      );
      Ploiu.assertEquals(
        1,
        headerValueInputs.length,
        'There should only be 1 header value input',
      );
      // make sure the delete button exists
      const deleteHeaderButton = document.querySelector(
        '.header-remove-button',
      );
      Ploiu.assertNotNull(deleteHeaderButton);
    });
  });

  await Ploiu.testAsync(
    'should remove header inputs when delete header button is clicked',
    async () => {
      await Ploiu.clickAndWait(
        document.querySelector('.header-remove-button'),
      );
      Ploiu.assertNull(document.querySelector('input.header-title'));
      Ploiu.assertNull(document.querySelector('input.header-value'));
    },
  );

  await Ploiu.testAsync(
    'should remove route when corresponding delete button is clicked',
    async () => {
      const routeDeleteButton = document.querySelectorAll(
        '#route-panel li.clickable + button',
      )[1];
      // click the button and then verify that only the example route is left
      await Ploiu.clickAndWait(routeDeleteButton);
      const routes = [...document.querySelectorAll('#route-panel li')];
      Ploiu.assertEquals(
        1,
        routes.length,
        'There should only be 1 route left',
      );
      Ploiu.assertEquals(
        'Example Route',
        routes[0].innerText,
        'The only remaining route should be the example route',
      );
    },
  );

  await Ploiu.testAsync(
    'should successfully save route changes',
    async () => {
      const saveButton = document.querySelector('#save-button');
      await Ploiu.clickAndWait(saveButton);
      const successBar = document.querySelector('#messageBar.success');
      Ploiu.assertNotNull(successBar);
    },
  );

  await Ploiu.testAsync('should show switch view buttons', async () => {
    const editRouteButton = document.querySelector(
      '#edit-route-view-button',
    );
    const viewLogsButton = document.querySelector('#view-logs-view-button');
    Ploiu.assertNotNull(editRouteButton, 'Edit Route Button Should Exist');
    // make sure that the edit route button is selected
    Ploiu.assertFalse(
      editRouteButton.classList.contains('outline'),
      'Edit Route button should be selected',
    );
    Ploiu.assertNotNull(viewLogsButton, 'View Logs Button Should Exist');
  });

  await Ploiu.testAsync(
    'should switch to log view when clicking view logs button',
    async () => {
      const viewLogsButton = document.querySelector(
        '#view-logs-view-button',
      );
      await Ploiu.clickAndWait(viewLogsButton);
      // make sure the view logs button is selected
      Ploiu.assertFalse(
        viewLogsButton.classList.contains('outline'),
        'View Logs button should be selected',
      );
      const logListPanel = document.querySelector('#logArea');
      Ploiu.assertNotNull(logListPanel, 'Log List should be visible');
    },
  );

  await Ploiu.testAsync('should show log for a valid request', async () => {
    // make a fetch request to the backend server for our only route
    await fetch('/HelloWorld/ploiu?age=23');
    // the backend waits about half a second before sending events, but to be safe let's wait a bit longer
    return Ploiu.delay(() => {
      const logEntries = [...document.querySelectorAll('.log')];
      Ploiu.assertEquals(
        1,
        logEntries.length,
        'There should be exactly 1 log entry since 1 request was made',
      );
      const entry = logEntries[0];
      const methodText = entry.querySelector('.method').innerText;
      const url = entry.querySelector('.url').innerText;
      Ploiu.assertEquals(
        'GET',
        methodText,
        'log method should match request method',
      );
      Ploiu.assertEquals(
        '/helloworld/ploiu?age=23',
        url.toLowerCase(),
        'Url should match request url',
      );
    }, 1_500);
  });

  await Ploiu.testAsync(
    'should show error log for an invalid request',
    async () => {
      await fetch('/test');
      return Ploiu.delay(() => {
        const lastLogEntry = document.querySelector('.log:last-child');
        Ploiu.assertNotNull(
          lastLogEntry,
          'there should be a new log entry',
        );
        const methodElement = lastLogEntry.querySelector('.method');
        const urlElement = lastLogEntry.querySelector('.url');
        const messageElement = lastLogEntry.querySelector('.message');
        Ploiu.assertNull(
          methodElement,
          'error logs should not have method parts',
        );
        Ploiu.assertNull(
          urlElement,
          'error logs should not have a url part',
        );
        Ploiu.assertNotNull(
          messageElement,
          'error logs should have a message part',
        );
        Ploiu.assertEquals(
          'requested route /test, method GET not found',
          messageElement.innerText,
          'error log should match the requested route and method',
        );
      }, 1_000);
    },
  );

  await Ploiu.testAsync(
    'should clear logs when clear log button is clicked',
    async () => {
      const clearLogButton = document.querySelector('#clear-logs-button');
      Ploiu.assertNotNull(
        clearLogButton,
        'The clear logs button should be displayed',
      );
      await Ploiu.clickAndWait(clearLogButton);
      const logEntries = [...document.querySelectorAll('.log')];
      Ploiu.assertEquals(
        0,
        logEntries.length,
        'Clicking the clear logs button should clear all logs',
      );
    },
  );

  await Ploiu.testAsync(
    'should show request body when log accordion is expanded',
    async () => {
      // first thing we need to do is create a new endpoint that accepts post requests
      await Ploiu.clickAndWait(
        document.querySelector('#edit-route-view-button'),
        500,
      );
      await Ploiu.clickAndWait(
        document.querySelector('#add-new-button'),
        500,
      );
      await Ploiu.type(
        'title',
        document.querySelector('#route-name-input'),
      );
      await Ploiu.type(
        '200',
        document.querySelector('#route-status-code-input'),
      );
      await Ploiu.select(
        2,
        document.querySelector('#route-request-method-input'),
      );
      await Ploiu.type(
        '/test',
        document.querySelector('#route-request-url'),
      );
      await Ploiu.clickAndWait(document.querySelector('#save-button'));
      await Ploiu.clickAndWait(
        document.querySelector('#view-logs-view-button'),
      );
      await Ploiu.clickAndWait(
        document.querySelector('#clear-logs-button'),
      );
      await fetch('/test', {
        method: 'POST',
        body: 'test',
        headers: {
          'X-test': '5',
        },
      });
      await Ploiu.delay(() => {}, 1_000);
      const routeLog = document.querySelector('accordion-element.log');
      await Ploiu.clickAndWait(
        routeLog.querySelector('.ploiu-accordion-title'),
      );
      const accordionBody = routeLog.querySelector(
        '.ploiu-accordion-body',
      );
      await Ploiu.clickAndWait(
        accordionBody.querySelector('.ploiu-accordion-title'),
      );
      await Ploiu.clickAndWait(
        accordionBody.querySelector(
          '[data-request-body] .ploiu-accordion-title',
        ),
      );
      Ploiu.assertEquals(
        'test',
        accordionBody.querySelector(
          '[data-request-body] .ploiu-accordion-body',
        )
          .innerText,
        'accordion body text is not what the request body was',
      );
    },
  );

  await Ploiu.testAsync(
    'should allow toggling between enabled and disabled state',
    async () => {
      await Ploiu.clickAndWait(
        document.querySelector('#clear-logs-button'),
      );
      const editRoutesButton = document.querySelector(
        '#edit-route-view-button',
      );
      await Ploiu.clickAndWait(editRoutesButton);
      const addNewButton = document.querySelector('#add-new-button');
      await Ploiu.clickAndWait(addNewButton);
      await Ploiu.type(
        'test disable',
        document.querySelector('#route-name-input'),
      );
      await Ploiu.type(
        '200',
        document.querySelector('#route-status-code-input'),
      );
      await Ploiu.select(
        0,
        document.querySelector('select#route-request-method-input'),
      );
      await Ploiu.type(
        '/testDisabled',
        document.querySelector('#route-request-url'),
      );
      // now time to disable the route
      const disableButton = document.querySelector(
        '#route-enable-toggle-button',
      );
      Ploiu.assertNotNull(
        disableButton,
        'the disable button should display',
      );
      Ploiu.assertEquals(
        'Enabled',
        disableButton.innerText,
        'The disable button should default to enabled',
      );
      await Ploiu.clickAndWait(disableButton);
      Ploiu.assertEquals(
        'Disabled',
        disableButton.innerText,
        'After being clicked, the disable button should allow for re-enabling the route',
      );
      await Ploiu.clickAndWait(
        document.querySelector('#view-logs-view-button'),
      );
      const result = await fetch('/testDisabled');
      Ploiu.assertEquals(
        404,
        result.status,
        'The route should return a 404 since it\'s disabled',
      );
      await Ploiu.delay(() => {}, 1_250);
      const logs = [
        ...document.querySelectorAll(
          '#logArea > accordion-element > div.ploiu-accordion-title',
        ),
      ];
      // we only want 1 log, saying that the route was not found
      Ploiu.assertEquals(
        1,
        logs.length,
        'there should only be 1 log for this test, instead there are ' +
          logs.length,
      );
      Ploiu.assert(
        logs[0].innerText.includes(
          'requested route /testDisabled, method GET not found',
        ),
        'log should show that the route was not found',
      );
    },
  );

  await Ploiu.testAsync(
    'should hide body and header sections when route type is pass-through',
    async () => {
      await Ploiu.clickAndWait(
        document.querySelector('#edit-route-view-button'),
      );
      await Ploiu.clickAndWait(document.querySelector('#add-new-button'));
      await Ploiu.type(
        'pass-through title',
        document.querySelector('#route-name-input'),
      );
      await Ploiu.type(
        '200',
        document.querySelector('#route-status-code-input'),
      );
      await Ploiu.select(1, document.querySelector('#route-type-select'));
      await Ploiu.select(
        0,
        document.querySelector('#route-request-method-input'),
      );
      await Ploiu.type('/', document.querySelector('#route-request-url'));
      await Ploiu.type(
        'https://www.example.com',
        document.querySelector('#redirect-url-input'),
      );
      await Ploiu.clickAndWait(document.querySelector('#save-button'));
      // now time to test the route
      const response = await fetch('http://localhost:8000/');
      Ploiu.assertEquals(200, response.status, 'response status mismatch');
      const text = await response.text();
      // not going to verify the entire website contents
      Ploiu.assert(text.toLowerCase().startsWith('<!doctype html>'));
    },
  );
  Ploiu.showResults();
})();
