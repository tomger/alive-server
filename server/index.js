const express = require('express');
const url = require('url');
const util = require('util');
const fs = require('fs');
const path = require('path');
const formidable = require('formidable');
const bodyParser = require('body-parser');
const mkdirp = require('mkdirp');

const port = 3001;
const app = express();
const projectsDir = './projects/';

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.post('/upload', bodyParser.text({ type: 'text/plain' }), function(req, res) {
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
      console.log('got json');
      mkdirp(path.join(projectsDir, documentId), function() {
        let stream = fs.createWriteStream(path.join(projectsDir, documentId, 'layers.json'));
        stream.write(fields.json);
        stream.end();
      });
    }
  });
});

app.get('/imported/:documentId@:size/images/:image', function(req, res) {
  let documentId = String(parseInt(req.params.documentId, 10));
  let filename = req.params.image.replace(/[^a-zA-Z0-9-_.]/g, '');
  let imagePath = path.join(__dirname, '..', projectsDir, documentId, 'images', filename);
  res.sendFile(imagePath);
});

app.get('/layers.js', function(req, res) {
  try {
    let documentId = String(parseInt(req.query.id, 10));
    let coffeePath = path.join(projectsDir, documentId, 'layers.json');
    res.write('window.__imported__ = []; window.__imported__["' + documentId + '@2x/layers.json.js"] = ');
    fs.createReadStream(coffeePath).on('open', function() {
      this.pipe(res);
    }).on('error', function(error) {
      console.error(error);
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

app.post('/app.coffee', bodyParser.text({ type: 'text/plain' }), function(req, res) {
  console.log('writing coffee', req.body.length, req.query);
  if(req.body.length === 0) {
    return;
  }
  let documentId = String(parseInt(req.query.id, 10));
  let coffeePath = path.join(projectsDir, documentId, 'app.coffee');
  mkdirp(path.join(projectsDir, documentId), function() {
    let stream = fs.createWriteStream(coffeePath);
    stream.write(req.body);
    stream.end();
    res.status(200).send('thanks!');
  });
});

app.use('/', express.static('linear.framer'));

app.listen(port, function(){
  console.log('listening on ' + port);
});
