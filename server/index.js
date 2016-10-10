const express = require('express');
const url = require('url');
const util = require('util');
const fs = require('fs');
const http = require('http');
const httpProxy = require('http-proxy');
const path = require('path');
const formidable = require('formidable');
const mkdirp = require('mkdirp');
const shortid = require('shortid');

const port = 3001;
const projectsDir = './projects/';
const shareTablePath = projectsDir + 'shares.json';
const foreverMaxAge = 31556926000; //ms
const allowedIdCharacters =
    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@';

////////////////////////////////////////////////////////////////////////////////
// Helpers
////////////////////////////////////////////////////////////////////////////////

function loadTable(path) {
  let json = {};
  try {
    let data = fs.readFileSync(path);
    json = JSON.parse(data);
  } catch (err){
    if (err.code !== 'ENOENT') {
      console.error(err);
    }
  }
  return json;
}

function saveTable(table, path) {
  mkdirp(projectsDir, err => {
    let json = JSON.stringify(table);
    fs.writeFile(path, json);
  });
}

function safeProjectId(id) {
  let regexp = RegExp(`^[${allowedIdCharacters}]+$`);
  if (!id || id.indexOf('\0') !== -1 || !regexp.test(id)) {
    throw Error(`Unsafe ID: ${id}`);
  }
  return String(id);
}

function pathExists(path, callback) {
  fs.access(path, fs.F_OK, function(err) {
    callback(!err);
  });
}

function pathExistsSync(path) {
  try {
    fs.accessSync(path, fs.F_OK);
    return true;
  } catch (err) {
    return false;
  }
}

function findShareIdForDocumentId(documentId) {
  for (let id in shareTable) {
    if (shareTable[id] === documentId) {
      return id;
    }
  }
}

function ensureShareIdForDocumentId(documentId) {
  if (findShareIdForDocumentId(documentId)) {
    return;
  }

  let shareId = shortid.generate();
  shareTable[shareId] = documentId;
  saveTable(shareTable, shareTablePath);
}

function traverseLayers(layersArray, fn) {
  layersArray.forEach(layer => {
    fn(layer);
    if (layer.children) {
      traverseLayers(layer.children, fn);
    }
  });
}

////////////////////////////////////////////////////////////////////////////////
// App setup
////////////////////////////////////////////////////////////////////////////////


const app = express();
const server = http.createServer(app);
const shareTable = loadTable(shareTablePath);
app.server = server;
app.server.listen(port);
shortid.characters(allowedIdCharacters);


////////////////////////////////////////////////////////////////////////////////
// Express Handlers
////////////////////////////////////////////////////////////////////////////////


// Receive images & layers.json upload from Sketch
app.post('/upload', function(req, res) {
  var form = new formidable.IncomingForm();
  form.parse(req, function(err, fields, files) {
    res.writeHead(200, {'content-type': 'text/plain'});
    res.write('received upload:\n\n');
    res.end(util.inspect({fields: fields, files: files}));

    var documentId = String(fields.documentId);
    if (files.image) {
      let file = files.image;
      let imagePath = path.join(projectsDir, documentId, 'images', file.name);
      mkdirp(path.join(projectsDir, documentId, 'images'), function() {
        fs.rename(file.path, imagePath);
      });
    }
    if (fields.json) {
      ensureShareIdForDocumentId(documentId);
      let layers = JSON.parse(fields.json);
      let now = Date.now();
      traverseLayers(layers, layer => {
        if (layer.image) {
          layer.image.path = `${layer.image.path}?time=${now}`;
        }
      });
      let layersJson = JSON.stringify(layers);
      mkdirp(path.join(projectsDir, documentId), function() {
        let jsonPath = path.join(projectsDir, documentId, 'layers.json');
        let stream = fs.createWriteStream(jsonPath);
        stream.write(layersJson);
        stream.end();
      });
    }
  });
});

// Send images to Framer viewer
app.get('/imported/:documentId@:size/images/:image', function(req, res) {
  let documentId = safeProjectId(req.params.documentId);
  if (shareTable[documentId]) {
    documentId = shareTable[documentId];
  }

  let filename = req.params.image.replace(/[^a-zA-Z0-9-_.]/g, '');
  let imagePath = path.join(__dirname, '..',
      projectsDir, documentId, 'images', filename);
  res.setHeader('Cache-Control', 'public, max-age=' + (foreverMaxAge / 1000));
  res.sendFile(imagePath);
});

// Send layers.json to editor and Framer viewer
app.get('/layers.:format', function(req, res) {
  let documentId = safeProjectId(req.query.id);
  let realDocumentId = shareTable[documentId] ? shareTable[documentId] : documentId;
  let coffeePath = path.join(projectsDir, realDocumentId, 'layers.json');

  pathExists(coffeePath, exists => {
    if (!exists) {
      res.status(404).send();
      return;
    }
    if (req.params.format === 'js') {
      res.write('window.__imported__ = []; window.__imported__["' +
          documentId + '@2x/layers.json.js"] = ');
    }
    fs.createReadStream(coffeePath).on('open', function() {
      this.pipe(res);
    }).on('error', function(error) {
      console.error(error);
      res.end();
    });
  })
});

// Send app.coffee to editor and Framer viewer
app.get('/project.json', function(req, res) {
  let documentId = safeProjectId(req.query.id);
  let project = {
    shareId: findShareIdForDocumentId(documentId)
  };
  let json = JSON.stringify(project);
  res.send(json);
});

// Send app.coffee to editor and Framer viewer
app.get('/app.coffee', function(req, res) {
  try {
    let documentId = safeProjectId(req.query.id);
    if (shareTable[documentId]) {
      documentId = shareTable[documentId];
    }
    let coffeePath = path.join(projectsDir, documentId, 'app.coffee');
    fs.createReadStream(coffeePath).on('open', function() {
      this.pipe(res);
    }).on('error', function() {
      res.send('')
    });
  } catch (e) {
    res.send('')
  }
});

// Receive app.coffee from editor
app.post('/app.coffee', function(req, res) {
  let documentId = safeProjectId(req.query.id);
  var form = new formidable.IncomingForm();
  form.parse(req, function(err, fields, files) {
    pathExists(path.join(projectsDir, documentId), exists => {
      if (!exists) {
        console.error('Writing coffee before project exists!', documentId);
        return;
      }
      let code = fields.code;
      let coffeePath = path.join(projectsDir, documentId, 'app.coffee');
      console.log('writing coffee', code.length, coffeePath);
      let stream = fs.createWriteStream(coffeePath);
      stream.write(code);
      stream.end();
      res.status(200).send('thanks!');
    });
  });
});


////////////////////////////////////////////////////////////////////////////////
// Development and Production routing
////////////////////////////////////////////////////////////////////////////////

function initSharedRouting(app) {
  app.use('/css/bootstrap.css',     express.static('node_modules/bootstrap/dist/css/bootstrap.min.css'));
  app.use(express.static('public'));
  app.use('/coffee-script.js', express.static('framer/coffee-script.js', { maxAge: foreverMaxAge}));
  app.use('/farmer.js',        express.static('framer/farmer.js', { maxAge: foreverMaxAge}));
  app.use('/framer.js',        express.static('framer/framer.js', { maxAge: foreverMaxAge}));
  app.use('/viewer?*',         express.static('framer/framer.html'));
  app.use('/framer/images/',   express.static('framer/images', { maxAge: foreverMaxAge}));
}

function initProductionRouting(app) {
  console.info('Production');
  app.use(express.static('build', { maxAge: foreverMaxAge}));
  app.use(express.static('framer'));
  app.use('*', express.static('build/index.html'));
}

// Proxy for the React dev environment. Websocket & JS Bundle:
function initDevelopmentRouting(app) {
  console.info('Development');
  const proxy = httpProxy.createProxyServer();
  app.use('/', express.static('framer'));
  // '/static/js/bundle.js'
  app.get('*', function(req, res) {
    console.log(req.path);
    proxy.web(req, res, {
      target: 'http://localhost:3000'
    });
  });
  app.server.on('upgrade', function (req, socket, head) {
    proxy.ws(req, socket, {
      target: 'http://localhost:3000'
    });
  });
}

initSharedRouting(app);
if (pathExistsSync('build')) {
  initProductionRouting(app);
} else {
  initDevelopmentRouting(app);
}
