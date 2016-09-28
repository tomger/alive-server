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

function _loadFile(file) {
	return new Promise(function(success) {
		var request = new XMLHttpRequest();
		request.open("GET", file);
		request.onload = function() {
			success(request.responseText);
		}
		request.send();
	})
}

function loadProject() {
	var params = queryToObject(window.location.search);
	var requests = [
		_loadFile('modules/linear.sjs'),
		_loadFile('modules/ViewController.coffee'),
		_loadFile('modules/Alive.coffee'),
		_loadFile('app.coffee?id=' + params.id)
	];
	Promise.all(requests)
		.then(function(files){
			var js = [
				// files[0],
				CoffeeScript.compile([
					files[1],
					files[2],
					files[3]
				].join('\n'))
			];
			window.theCompiledAlive = js.join('');
			// require('builtin:apollo-sys').eval(js.join(''));
			eval(js.join(''));
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
  if (message.type === 'show') {
		// for (var name in layers) {
		// 	var layer = layers[name];
		// 	if (layer._info.kind == 'artboard' && layers[message.view] !== layer ) {
		// 		layer.x = Screen.width
		// 	}
		// }
    views.switchInstant(layers[message.view]);
    // views.history.shift()
  }
}

window.addEventListener('message', receiveMessage, false);