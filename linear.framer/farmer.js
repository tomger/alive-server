importScripts('/coffee-script.js');

onmessage = function(e) {
  postMessage(CoffeeScript.compile(e.data));
}
