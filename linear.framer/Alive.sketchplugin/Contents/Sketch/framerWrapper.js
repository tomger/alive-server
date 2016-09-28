@import "framer.js"

var debugConfig = {
  url: 'http://127.0.0.1:3001/upload',
  projectUrl: 'http://127.0.0.1:3000/',
  debug: true
};

var config = {
  url: 'http://alive.iterator.us:3001/upload',
  projectUrl: 'http://alive.iterator.us:3000/',
  debug: true
};

// config = debugConfig;

function showMessage(message) {
  NSApplication.sharedApplication().orderedDocuments().firstObject().showMessage(message);
}

function createHash(string) {
  var hash = 0, i, chr, len;
  if (string.length === 0) return hash;
  for (i = 0, len = string.length; i < len; i++) {
    chr   = string.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash);
}

function getDocumentId(context) {
  return createHash(String(context.document.currentPage().objectID()));
}

function upload(context) {
  log("let's do this");
  showMessage('Alive: Slicing layers...');
  var documentId = getDocumentId(context);
  var rv = _main({
    scale: 2,
    destinationPath: '/project'
  });

  showMessage('Alive: Uploading layers...');
  recursiveUpload(rv.layers, rv.path, documentId);
  var request = createJSONRequest(rv.layers, documentId);
  post(request);
  openBrowser(config.projectUrl + documentId);
}

function getArtboardByName(document, name) {
  var page = document.currentPage();
  return page.artboards().find(function(artboard) {
    return artboard.name() == name;
  });
}

function recursiveUpload(layers, imagePath, documentId) {
  var layer;
  var request;
  var path;
  for (var i = 0; i < layers.length; i++) {
    layer = layers[i];
    if (layer.image) {
      path = [imagePath, layer.image.path].join('/');
      request = createFileRequest(path, layer.image.path, documentId);
      post(request);
    }
    if (layer.kind == "artboard") {
      var document = getActiveDocument(NSApplication.sharedApplication());
      var artboard = getArtboardByName(document, layer.name);
      var rect = [MSSliceTrimming trimmedRectForSlice: artboard];
      var slice = [MSExportRequest requestWithRect:rect scale:0.5];
      var path = [NSTemporaryDirectory(), artboard.objectID(), '.png'].join('');
      [document saveArtboardOrSlice:slice toFile: path];
      request = createFileRequest(path, layer.name, documentId);
      post(request);
    }
    recursiveUpload(layer.children, imagePath, documentId);
  }
}

function createJSONRequest(json, documentId) {
  return NSArray.arrayWithObjects(
    "-v", "POST",
    "--header", "Content-Type: multipart/form-data",
    "-F", "documentId=" + documentId,
    "-F", "json=" + JSON.stringify(json),
      config.url,
    nil);
}

function createFileRequest(path, name, documentId) {
  return NSArray.arrayWithObjects(
    "-v", "POST",
    "--header", "Content-Type: multipart/form-data",
    "-F", "documentId=" + documentId,
    "-F", "name=image; filename=" + name + "; Content-Type=image/png;",
    "-F", "image=@" + path,
      config.url,
    nil);
}

function post(args) {
  return run("/usr/bin/curl", args);
}

function openBrowser(url) {
  run("/usr/bin/open", NSArray.arrayWithObjects("-a", "Safari", "-g", url, nil));
}

function run(path, args) {
  var task = NSTask.alloc().init()
  task.setLaunchPath(path);
  if (args) {
    task.setArguments(args);
  }
  // var outputPipe = [NSPipe pipe];
  // [task setStandardOutput:outputPipe];
  task.launch();
  // var outputData = [[outputPipe fileHandleForReading] readDataToEndOfFile];
  // var outputString = [[[NSString alloc] initWithData:outputData encoding:NSUTF8StringEncoding]];
  // if (config.debug == true) {
  //   log(outputString)
  // }
  // return outputString;
}
