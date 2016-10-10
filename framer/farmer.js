importScripts('/coffee-script.js');

onmessage = function(e) {
  try {
    postMessage(CoffeeScript.compile(e.data));
  } catch(err) {
    throw err;
    // throw Error(CoffeeScript.helpers.prettyErrorMessage(err, null, null, true));
  }
}
