
// blocking, only on server load
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
    throw Error(`safeProjectId: unsafe(${id}) `);
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

function ensureShareIdForDocumentId(documentId) {
  for (let id in shareTable) {
    if (shareTable[id] === documentId) {
      return;
    }
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
