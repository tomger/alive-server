window.Alive = {};

function queryToObject(query) {
  var rv = {};
  var vars = query.substring(1).split('&');
  var pair;
  for (var i = 0; i < vars.length; i++) {
    pair = vars[i].split('=');
    rv[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1])
  }
  return rv;
}

function _loadString(string) {
  return new Promise(function(success) {
    success(string);
  });
}

var _loadFileCache = {};
function _loadFile(file) {
  return new Promise(function(success) {
    if (_loadFileCache[file]) {
      success(_loadFileCache[file]);
      return;
    }
    var request = new XMLHttpRequest();
    request.open("GET", file);
    request.onload = function() {
      _loadFileCache[file] = request.responseText;
      success(request.responseText);
    }
    request.send();
  });
}

function loadProject(preloadedCode) {
  var params = queryToObject(window.location.search);
  var requests = [
    // _loadFile('linear.sjs'),
    _loadFile('modules/Alive.coffee'),
    preloadedCode !== undefined ? _loadString(preloadedCode) : _loadFile('app.coffee?id=' + params.id),
    _loadString('AliveCodeReady()')
  ];
  Promise.all(requests)
    .then(function(files){
      return new Promise(function(success) {
        console.time('compile');
        var coffee = [
          files[0],
          files[1],
          files[2]
        ].join('\n');
        if (window.Alive.farmer) {
          window.Alive.farmer.terminate();
        }
        window.Alive.farmer = new Worker("farmer.js");
        window.Alive.farmer.onerror = function(err) {
          console.error('wassup', err);
        }
        window.Alive.farmer.onmessage = function(event) {
          success(event.data);
          window.Alive.farmer.terminate();
        }
        window.Alive.farmer.postMessage(coffee);
      });
    })
    .then(function(js){
      try {
        console.timeEnd('compile');
        Framer.Extras.ErrorDisplay.disable();
        Framer.Extras.ErrorDisplay.enable();
        if (window.Alive.isInitialized) {
          Framer.CurrentContext.reset();
        }
        if (window.Alive.HotspotContext) {
          window.Alive.HotspotContext.reset();
          window.Alive.HotspotContext = null;
        }
        // require('builtin:apollo-sys').eval(js.join(''));
        eval(js);
      } catch (error) {
        console.error('Alive runtime error: ', error);
      }
    });
}

function sendMessage(message) {
  window.parent.postMessage(JSON.stringify(message), '*');
}

function receiveMessage(event) {
  if (!event.data) {
    return;
  }
  var origin = event.origin || event.originalEvent.origin; // XXX check
  var message = JSON.parse(event.data);
  console.log('received', message.type);
  if (message.type === 'change:app.coffee') {
    window.Alive.initialView = message.view;
    window.Alive.currentCode = message.code;
    loadProject(message.code);
  } else if (message.type === 'buildmode') {
    window.Alive.initialView = message.view;
    window.Alive.isBuildMode = !!message.value;
    loadProject(window.Alive.currentCode);
    document.querySelector('.DeviceBackground').style.backgroundColor = window.Alive.isBuildMode ? '#bbe8ff' : 'white';
  } else if (message.type === 'show') {
    window.flow.showNext(window.layers[message.view], {animate: false});
    // views.history.shift()
  }
}

window.addEventListener('message', receiveMessage, false);
document.write("<script src=\"/layers.js?id="+ queryToObject(location.search).id+"\"></script>");


// Framer setup
var deviceScale = 'fit';
// var deviceScale = 0.5;
if (DeviceComponent) {
  DeviceComponent.Devices["iphone-6-silver"].deviceImageJP2 = false
}
if (window.Framer) {
  window.Framer.Defaults.DeviceView = {
    "deviceScale":deviceScale,"selectedHand":"","deviceType":"apple-iphone-6s-silver","contentScale":1,"orientation":0
  };
}
if (window.Framer) {
  window.Framer.Defaults.DeviceComponent = {
    "deviceScale":deviceScale,"selectedHand":"","deviceType":"apple-iphone-6s-silver","contentScale":1,"orientation":0
  };
}
window.FramerStudioInfo = {
  "deviceImagesUrl":"\/_server\/resources\/DeviceImages","documentTitle":"Prototype"
};

Framer.Device = new Framer.DeviceView();
Framer.Device.setupContext();
