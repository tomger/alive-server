import React, { Component } from 'react';
import AceEditor from 'react-ace';
import ace from 'brace';
import 'brace/mode/coffee';
import 'brace/theme/monokai';
import 'brace/ext/language_tools';

import './App.css';
import words from './words';

function parseCode (code) {
  // Really really dumb parsing of the view tree code
  let rv = {};
  let currentBlock = 'global';
  let lines = code.split('\n');
  lines.forEach(line => {
    let matches = /^layers.(.*?).onLoad/.exec(line);
    if (matches) {
      currentBlock = matches[1];
      return; // skip onload line
    } else if (line.indexOf('    ') === 0) {
      line = line.substr(4); // cut off tab
    }
    rv[currentBlock] = rv[currentBlock] || [];
    rv[currentBlock].push(line);
  });
  for (let view in rv) {
    rv[view] = rv[view].join('\n');
  }
  return rv;
}

function stringifyCode(object) {
  let rv = [object['global'] || ''];
  for (let view in object) {
    if (view === 'global') {
      continue;
    }
    rv.push(`layers.${view}.onLoad ->`);
    rv.push(object[view].split('\n').map(line => `    ${line}`).join('\n'));
  }
  return rv.join('\n')
}

class App extends Component {
  constructor() {
    super();
    this.state = {
      iframeRefresh: 0,
      initialView: 'home'
    };
    this.editor = null;
    this.documentId = location.pathname.replace(/[\?\.\/]/g, '');
    this.initEditor();
  }

  componentDidMount() {
    this.fetchCode();
    this.fetchLayers();

    window.addEventListener('message', e => this.receiveMessage(e), false);
  }

  initEditor() {
    this.commands = [
      {
        name: "replace",
        bindKey: {
          win: "Ctrl-Shift-S",
          mac: "Command-Shift-S"
        },
        exec: editor => {
          this.saveAndReload();
        }
      }
    ];

    let langTools = ace.acequire('ace/ext/language_tools');
    let framerCompletions = words
      .split('\n')
      .filter(line => line.indexOf('#') !== 0)
      .map(line => line.split(' '))
      .reduce((prev, curr) => prev.concat(curr))
      .filter((word, index, words) => words.indexOf(word) === index)
      .map(word => { return {
        caption: word,
        value: word,
        meta: ''
      }});

    this.staticWordCompleter = {
      getCompletions: (editor, session, pos, prefix, callback) => {
        callback(null, [...this.viewCompletions, ...framerCompletions]);
      }
    }

    langTools.setCompleters([this.staticWordCompleter]);
  }

  receiveMessage(event) {
    let message = JSON.parse(event.data);
    if (message.type === 'addLink') {
      this.addLink(message.target)
    } else if (message.type === 'navigatingTo') {
      this.focusView(message.view);
    }
  }

  addLink(target) {
    let snippet = `\nlayers.${target}.onClick ->\n\tviews.pushIn(layers.home)`;

    let code = this.codeTree[this.state.selectedView] || '';
    code += snippet;
    this.codeTree[this.state.selectedView] = code;
    this.setState({ code });

    let lines = code.split('\n');
    let position = lines.length;
    let cursor = lines[lines.length - 1].length;
    this.editor.resize(true);
    this.editor.scrollToLine(position, true, true, function () {});
    this.editor.gotoLine(position, cursor, true);
    this.editor.focus();
  }

  focusView(view) {
    this.setState({
      selectedView: view,
      code: this.codeTree[view]
    });
  }

  loadPreview() {
    this.setState({
      iframeRefresh: Date.now(),
      initialView: this.state.selectedView
    });
  }

  fetchLayers() {
    return fetch(`//${location.hostname}:3001/layers.json?id=${this.documentId}`, {
    }).then(response => {
      return response.json();
    }).then(layers => {
      this.setState({layers})
      this.viewCompletions = layers.map(layer => {
        return {
          caption: `layers.${layer.name}`,
          value: `layers.${layer.name}`,
          meta: "View"
        };
      })
    });
  }

  saveAndReload() {
    this.saveCode().then(_ => {
      this.loadPreview();
    });
  }

  saveCode() {
    this.setState({code: this.codeTree[this.state.selectedView]});
    let code = stringifyCode(this.codeTree);
    // console.log(code)
    // return;
    return fetch(`//${location.hostname}:3001/app.coffee?id=${this.documentId}`, {
      method: 'POST',
      headers: {
        'Accept': 'text/plain',
      },
      body: code
    }).then(response => {
      return response.text();
    }).then(code => {

    });
  }

  fetchCode() {
    return fetch(`//${location.hostname}:3001/app.coffee?id=${this.documentId}`, {
      accept: 'text/plain'
    }).then(response => {
      return response.text();
    }).then(code => {
      console.log('loaded code');
      this.codeTree = parseCode(code);
      this.setState({
        code: this.codeTree[this.state.selectedView]
      });
      var undo_manager = this.refs.ace.editor.getSession().getUndoManager();
      undo_manager.reset();
      this.refs.ace.editor.getSession().setUndoManager(undo_manager);
    });
  }

  onChange(newValue) {
    this.codeTree[this.state.selectedView] = newValue;
  }

  getIframeSrc() {
    let path = `//${location.hostname}:3001/framer.html`;

    let id = this.documentId;
    let view = this.state.initialView;
    let cachebust = this.state.iframeRefresh;

    return `${path}?id=${id}&view=${view}&cachebust=${cachebust}`;
  }

  onSelectView(view) {
    let message = {
      type: 'show',
      view: view.name
    };

    let targetOrigin = '*';
    this.refs.preview.contentWindow.postMessage(JSON.stringify(message), targetOrigin);
  }

  render() {
    if (!this.documentId) {
      return (
        <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems:'center'}}>
          <a href={`//${location.hostname}:3001/Alive.sketchplugin.zip`} style={{ fontWeight: 600, padding: '12px 15px', background: '#0076FF', color: '#fff', textDecoration: 'none', borderRadius: 3}}>Download Sketch Plugin</a>
        </div>
      );
    }

    let pages;
    if (this.state.layers) {
      pages = this.state.layers.filter(layer =>
        layer.kind === 'artboard'
      ).map(artboard => {
          let style = {
            backgroundColor: artboard.backgroundColor,
            backgroundImage: `url(//${location.hostname}:3001/imported/${this.documentId}@2x/images/${artboard.objectId}.png)`
          };
          return (
            <div key={artboard.name}
              className={['Thumbnail', this.state.selectedView === artboard.name ? 'Thumbnail--selected' : undefined].join(' ')}
              onClick={e => this.onSelectView(artboard)}>
              <div className="Thumbnail__image" style={ style }></div>
              <div className="Thumbnail__title">
                {artboard.name}
              </div>
            </div>
          )
        }
      );
    }


    return (
      <div className="App">
        <div style={{display: 'flex', height: '100vh'}}>
          <div className="pagelist" style={{
            display: 'flex',
            flex: '0 0 132px',
            flexDirection: 'column',
            overflowX: 'hidden',
            overflowY: 'auto'}}>
            {pages}
          </div>
          <div style={{ display: 'flex', flex: '1 1', flexDirection: 'column'}}>
            <AceEditor
               className="editor"
               height="500px"
               width="auto"
               mode="coffee"
               ref="ace"
               theme="monokai"
               fontSize={14}
               value={this.state.code}
               onChange={e => this.onChange(e)}
               commands={this.commands}
               editorProps={{$blockScrolling: true}}
               onLoad={(editor) => {
                 this.editor = editor;
                 editor.focus();
                 editor.getSession().setUseWrapMode(true);
                 editor.setOptions({
                  //  enableBasicAutocompletion: true,
                   enableLiveAutocompletion: true
                 });
               }}
             />
           {/* <div className="statusbar">
              <a className="" href="https://framerjs.com/docs/" target="_blank">Framer Docs</a>
              <div className="statusbar-button" title="Cmd + Shift + S" onClick={ e => this.saveAndReload() }>Save &amp; Run</div>
           </div> */}
           </div>
           <iframe ref="preview" className="preview" src={this.getIframeSrc()}></iframe>
        </div>
      </div>
    );
  }
}

export default App;
