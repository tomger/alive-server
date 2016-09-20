const express = require('express');
const url = require('url');
const fs = require('fs');
const port = 3001;
const app = express();
const bodyParser = require('body-parser');

function getProjectPath(query) {
  return './projects/' + parseInt(query.id.replace(/\./g,''), 10);
}

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/app.coffee', function(req, res) {
  try {
    fs.createReadStream(getProjectPath(req.query)).on('open', function() {
      console.log('reading coffee', getProjectPath(req.query))
      this.pipe(res);
    }).on('error', function() {
      res.send('')
    });
  } catch (e) {
    res.send('')
  }
});

app.post('/app.coffee', bodyParser.text({ type: 'text/plain' }), function(req, res) {
  console.log('writing coffee', req.body.length);
  if(req.body.length === 0) {
    return;
  }

  let stream = fs.createWriteStream(getProjectPath(req.query));
  stream.write(req.body);
  stream.end();
  res.status(200).send('thanks!');

});

app.use('/', express.static('linear.framer'));

app.listen(port, function(){
  console.log('listening on ' + port);
});
