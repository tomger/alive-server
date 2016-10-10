export function parseCode(code) {
  // Really really dumb parsing of the view tree code
  let rv = {};
  let currentBlock = 'global';
  let lines = code.split('\n');
  lines.forEach(line => {
    let codeBlockMatch = /^layers.(.*?).onLoad/.exec(line);
    let actionBlockMatch = line.match(/^layers.(.*?).actions = (.*)/);
    if (codeBlockMatch) {
      currentBlock = codeBlockMatch[1];
      return; // skip onload line
    } else if (actionBlockMatch) {
      // but also manage it
      let view = `${actionBlockMatch[1]}`;
      rv[view] = rv[view] || { code: [] };
      rv[view].actions = JSON.parse(actionBlockMatch[2]);
      return; // skip adding it to the code
    } else if (currentBlock !== 'global' && line.indexOf('    ') === 0) {
      line = line.substr(4); // cut off tab
    }
    rv[currentBlock] = rv[currentBlock] || { code: [] };
    rv[currentBlock].code.push(line);
  });
  for (let view in rv) {
    if ({}.hasOwnProperty.call(rv, view)) {
      rv[view].code = rv[view].code.join('\n');
    }
  }
  return rv;
}

export function stringifyCode(object) {
  let rv = [];
  for (let view in object) {
    if (view === 'global') {
      continue;
    }
    if (object[view].code) {
      rv.push(`layers.${view}.onLoad ->`);
      rv.push(object[view].code.split('\n').map(line => `    ${line}`).join('\n'));
    }
    if (object[view].actions) {
      let json = JSON.stringify(object[view].actions);
      rv.push(`layers.${view}.actions = ${json}`);
    }
  }
  return rv.join('\n');
}

export function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.call(this, ...args);
    }, delay);
  };
}

export function traverseLayers(layersArray, fn) {
  layersArray.forEach(layer => {
    fn(layer);
    if (layer.children) {
      traverseLayers(layer.children, fn);
    }
  });
}
