/**
 * These are browser side tests to be copied and pasted into the browser console (yeah, I know)
 *
 * TODO figure out a better way, the tests need to be included only during test run
 */

// collection of helpful test methods
const Ploiu = {
  /** prints a green "ok" to the console */
  ok() {
    console.log('%cok', 'color: springgreen')
  },
  /** prints a red "FAIL" to the console, also throws an eception to be caught by the test runner*/
  fail(message = '', throwException = true) {
    console.log('%cFAIL', 'color: crimson')
    if (throwException) {
      throw new Error(message)
    }
  },
  ////// assertion methods
  assert(expression, message = '') {
    if (!expression) {
      if (message && message !== '') {
        console.error(message)
      }
      this.fail(message)
    }
  },
  assertFalse(expression, message = '') {
    if (expression) {
      if (message && message !== '') {
        console.error(message)
      }
      this.fail(message)
    }
  },
  assertEquals(expected, actual, message = '') {
    if (expected !== actual) {
      if (message && message !== '') {
        console.error(message)
      }
      this.fail(message)
    }
  },
  assertNull(value, message = '') {
    this.assert(value === null || value === undefined, message)
  },
  assertNotNull(value, message = '') {
    this.assertFalse(value === null || value === undefined, message)
  },
  ////// test methods

  /**Runs the passed test, marking it as passed or failed depending on the result*/
  test(title = '', test = () => {
  }) {
    // first log the title, then run the test. If no exceptions are thrown, we can pass the test
    console.log(title)
    try {
      test()
      this.ok()
    } catch (e) {
      if (typeof e === 'string') {
        this.fail(e, false)
      }
    }
  },
  // this should be called if the test is an async function
  async testAsync(title = '', test = async () => {
  }) {
    // first log the title, then run the test. If no exceptions are thrown, we can pass the test
    console.log(title)
    try {
      await test()
      this.ok()
    } catch (e) {
      if (typeof e === 'string') {
        this.fail(e, false)
      }
    }
  },
};

Ploiu.test('should show only 1 route on page load', () => {
  const routes = [...document.querySelectorAll('#route-panel-list li')]
  Ploiu.assertEquals(1, routes.length, 'only should be 1 route')
  Ploiu.assertEquals('Example Route', routes[0].innerText, 'Route should display route name')
})

await Ploiu.testAsync('should show edit route panel on route click', async () => {
  return new Promise(resolve => {
    const beforeClick = document.querySelector('#route-editor')
    Ploiu.assertNull(beforeClick, 'route editor should not be visible before a route is selected')
    document.querySelector('#route-panel-list li').click()
    // displaying the route editor is fast but not instantaneous, so wait a bit before testing this part
    window.setTimeout(() => {
      const afterClick = document.querySelector('#route-editor')
      Ploiu.assertNotNull(afterClick, 'route editor should be visible after a route is selected')
      // test each of the form components
      const routeName = document.querySelector('#route-name-input').value
      const routeResponseCode = document.querySelector('#route-status-code-input').value
      const requestMethod = document.querySelector('#route-request-method-input').value
      const requestUrl = document.querySelector('#route-request-url').value
      const headers = [...document.querySelectorAll('#response-headers tr')]

      Ploiu.assertEquals('Example Route', routeName, 'route name input does not match selected route name')
      Ploiu.assertEquals(200, routeResponseCode, 'route response code input does not match selected route response code')
      Ploiu.assertEquals('GET', requestMethod, 'route status code input does not match selected route status code')
      Ploiu.assertEquals('/HelloWorld/:name?:age', requestUrl, 'route url input does not match selected route url')
      resolve()
    }, 100)
  })
})

