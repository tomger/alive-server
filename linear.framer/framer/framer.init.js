(function() {

function isFileLoadingAllowed() {
	return (window.location.protocol.indexOf("file") == -1)
}

function isHomeScreened() {
	return ("standalone" in window.navigator) && window.navigator.standalone == true
}

function isCompatibleBrowser() {
	return Utils.isWebKit()
}

var alertNode;

function dismissAlert() {
	alertNode.parentElement.removeChild(alertNode)
	loadProject()
}

function showAlert(html) {

	alertNode = document.createElement("div")

	alertNode.classList.add("framerAlertBackground")
	alertNode.innerHTML = html

	document.addEventListener("DOMContentLoaded", function(event) {
		document.body.appendChild(alertNode)
	})

	window.dismissAlert = dismissAlert;
}

function showBrowserAlert() {
	var html = ""
	html += "<div class='framerAlert'>"
	html += "<strong>Error: Not A WebKit Browser</strong>"
	html += "Your browser is not supported. <br> Please use Safari or Chrome.<br>"
	html += "<a class='btn' href='javascript:void(0)' onclick='dismissAlert();'>Try anyway</a>"
	html += "</div>"

	showAlert(html)
}

function showFileLoadingAlert() {
	var html = ""
	html += "<div class='framerAlert'>"
	html += "<strong>Error: Local File Restrictions</strong>"
	html += "Preview this prototype with Framer Mirror or learn more about "
	html += "<a href='https://github.com/koenbok/Framer/wiki/LocalLoading'>file restrictions</a>.<br>"
	html += "<a class='btn' href='javascript:void(0)' onclick='dismissAlert();'>Try anyway</a>"
	html += "</div>"

	showAlert(html)
}

/////////// Start custom Alive code ///////////

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
	var id = location.search.split(/[=&]/)[1];
	console.log(id);
	var snippet = 'var layers = Framer.Importer.load("imported/'+id+'@2x");';
	var requests = [
		_loadFile('modules/linear.sjs'),
		_loadFile('app.coffee' + location.search)
	];
	Promise.all(requests)
		.then(function(files){
			var js = [snippet, files[0], CoffeeScript.compile(files[1])];
			require('builtin:apollo-sys').eval(js.join(''));
		});
}

/////////// End custom Alive code ///////////


function setDefaultPageTitle() {
	// If no title was set we set it to the project folder name so
	// you get a nice name on iOS if you bookmark to desktop.
	document.addEventListener("DOMContentLoaded", function() {
		if (document.title == "") {
			if (window.FramerStudioInfo && window.FramerStudioInfo.documentTitle) {
				document.title = window.FramerStudioInfo.documentTitle
			} else {
				document.title = window.location.pathname.replace(/\//g, "")
			}
		}
	})
}

function init() {
	if (Utils.isFramerStudio()) {
		// return
	}

	setDefaultPageTitle()

	if (!isCompatibleBrowser()) {
		return showBrowserAlert()
	}

	if (!isFileLoadingAllowed()) {
		return showFileLoadingAlert()
	}

	loadProject()

}

init()

})()
