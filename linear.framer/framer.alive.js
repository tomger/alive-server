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
		_loadFile('linear.sjs'),
		_loadFile('modules/ViewController.coffee'),
		_loadFile('modules/Alive.coffee'),
		preloadedCode ? _loadString(preloadedCode) : _loadFile('app.coffee?id=' + params.id)
	];
	Promise.all(requests)
		.then(function(files){
			return new Promise(function(success) {
				console.time('compile');
				var coffee = [
					files[1],
					files[2],
					files[3]
				].join('\n');
				if (window.Alive.farmer) {
					window.Alive.farmer.terminate();
				}
				window.Alive.farmer = new Worker("farmer.js");
				window.Alive.farmer.onmessage = function(e) {
					success(e.data);
					window.Alive.farmer.terminate();
				}
				window.Alive.farmer.postMessage(coffee);
			});
		})
		.then(function(js){
			try {
				console.timeEnd('compile');
				Framer.Extras.ErrorDisplay.disable();
				if (window.Alive.isInitialized) {
					Framer.CurrentContext.reset();
				}
				eval(js);
				// require('builtin:apollo-sys').eval(js.join(''));
			} catch (error) {
				console.error('Alive: Compile Error', error);
			}
      ready();
		});
}

function ready() {

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
		loadProject(message.code);
	} else if (message.type === 'show') {
    window.Alive.views.switchInstant(window.Alive.layers[message.view]);
    // views.history.shift()
  }
}

window.addEventListener('message', receiveMessage, false);
document.write("<script src=\"/layers.js?id="+ queryToObject(location.search).id+"\"></script>");
