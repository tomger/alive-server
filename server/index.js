const express = require('express');
const url = require('url');
const util = require('util');
const fs = require('fs');
const http = require('http');
const httpProxy = require('http-proxy');
const path = require('path');
const formidable = require('formidable');
const mkdirp = require('mkdirp');

const port = 3001;
const app = express();
const projectsDir = './projects/';
const foreverMaxAge = 31556926;

let server = http.createServer(app);
let proxy = httpProxy.createProxyServer();

app.server = server;
app.server.listen(port);

function pathExists(path) {
  try {
    fs.accessSync(path, fs.F_OK);
    return true;
  } catch (err) {
    return false;
  }
}

function traverseLayers(layersArray, fn) {
  layersArray.forEach(layer => {
    fn(layer);
    if (layer.children) {
      traverseLayers(layer.children, fn);
    }
  });
}

app.post('/upload', function(req, res) {
  var form = new formidable.IncomingForm();
  form.parse(req, function(err, fields, files) {
    res.writeHead(200, {'content-type': 'text/plain'});
    res.write('received upload:\n\n');
    res.end(util.inspect({fields: fields, files: files}));

    var documentId = String(fields.documentId);
    if (files.image) {
      var file = files.image;
      mkdirp(path.join(projectsDir, documentId, 'images'), function() {
        fs.rename(file.path, path.join(projectsDir, documentId, 'images', file.name));
      });
    }
    if (fields.json) {
      let layers = JSON.parse(fields.json);
      let now = Date.now();
      traverseLayers(layers, layer => {
        if (layer.image) {
          layer.image.path = `${layer.image.path}?time=${now}`;
        }
      });
      let layersJson = JSON.stringify(layers);
      mkdirp(path.join(projectsDir, documentId), function() {
        let stream = fs.createWriteStream(path.join(projectsDir, documentId, 'layers.json'));
        stream.write(layersJson);
        stream.end();
      });
    }
  });
});

app.get('/imported/:documentId@:size/images/:image', function(req, res) {
  let documentId = String(parseInt(req.params.documentId, 10));
  let filename = req.params.image.replace(/[^a-zA-Z0-9-_.]/g, '');
  let imagePath = path.join(__dirname, '..', projectsDir, documentId, 'images', filename);
  res.setHeader('Cache-Control', 'public, max-age=' + foreverMaxAge);
  res.sendFile(imagePath, {
  });
});

app.get('/layers.:format', function(req, res) {
  try {
    let documentId = String(parseInt(req.query.id, 10));
    let coffeePath = path.join(projectsDir, documentId, 'layers.json');
    if (req.params.format === 'js') {
      res.write('window.__imported__ = []; window.__imported__["' + documentId + '@2x/layers.json.js"] = ');
    }
    fs.createReadStream(coffeePath).on('open', function() {
      this.pipe(res);
    }).on('error', function(error) {
      console.error(error);
      res.end();
    });
  } catch (e) {
    res.send('')
  }
});

app.get('/app.coffee', function(req, res) {
  try {
    let coffeePath = path.join(projectsDir, String(parseInt(req.query.id, 10)), 'app.coffee');
    fs.createReadStream(coffeePath).on('open', function() {
      this.pipe(res);
    }).on('error', function() {
      res.send('')
    });
  } catch (e) {
    res.send('')
  }
});

app.post('/app.coffee', function(req, res) {
  var form = new formidable.IncomingForm();
  form.parse(req, function(err, fields, files) {
    if(fields.code.length === 0) {
      return;
    }

    let code = fields.code;
    let documentId = String(parseInt(req.query.id, 10));
    let coffeePath = path.join(projectsDir, documentId, 'app.coffee');

    console.log('writing coffee', code.length, documentId);
    mkdirp(path.join(projectsDir, documentId), function() {
      let stream = fs.createWriteStream(coffeePath);
      stream.write(code);
      stream.end();
      res.status(200).send('thanks!');
    });
  });
});


app.use('/farmer.js', express.static('framer/farmer.js', { maxAge: foreverMaxAge}));
app.use('/coffee-script.js', express.static('framer/coffee-script.js', { maxAge: foreverMaxAge}));
// XXX hack cause framer's hardcoded to get cursors here
app.use('/framer/', express.static('framer'));
// Proxy for the React dev environment. Websocket & JS Bundle:
if (pathExists('build')) {
  console.log('Production');
  app.use(/\/\d+/, express.static('build/index.html'));
  app.use('/', express.static('build', { maxAge: foreverMaxAge}));

  app.use('/', express.static('framer'));
} else {
  console.log('Development');
  app.use('/', express.static('framer'));
  // app.get('/static/js/bundle.js', function(req, res) {
  app.get('*', function(req, res) {
    console.log(req.path)
    proxy.web(req, res, {
      target: 'http://localhost:3000'
    });
  });

  // http://localhost:3001/sockjs-node/info?t=1475265053147
  app.server.on('upgrade', function (req, socket, head) {
    proxy.ws(req, socket, {
      target: 'http://localhost:3000'
    });
  });
}
