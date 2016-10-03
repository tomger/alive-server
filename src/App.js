import React, { Component } from 'react';
import AceEditor from 'react-ace';
import Modal from 'react-modal';

import ace from 'brace';
import 'brace/mode/coffee';
import 'brace/theme/monokai';
import 'brace/ext/language_tools';

import './App.css';
import words from './words';

const modalStyle = {
  overlay : {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1
  },
  content : {
    width: 600,
    transform: 'translate(-50%, -50%)',
    background: 'white',
    position: 'absolute',
    top: '50%',
    left: '50%',
    padding: '20px',
    outline: 0,
    borderRadius: 4,
    boxShadow: '0 10px 16px rgba(0,0,0,.3)'
  }
}

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
    if ({}.hasOwnProperty.call(rv, view)) {
      rv[view] = rv[view].join('\n');
    }
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

function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.call(this, ...args);
    }, delay);
  };
}

class App extends Component {
  constructor() {
    super();
    this.state = {
      initialView: 'home',
      modalIsOpen: false
    };
    this.editor = null;
    this.documentId = location.pathname.replace(/[\?\.\/]/g, '');
    this.initEditor();
    this.debouncedUpdatePreview = debounce(this.updatePreview, 300);
  }

  componentDidMount() {
    this.fetchCode();
    this.fetchLayers();

    window.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.keyCode === 83) {
        this.saveCode();
        e.preventDefault();
        return false;
      }
    });
    window.addEventListener('message', e => this.receiveMessage(e), false);
  }

  initEditor() {
    this.commands = [];

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

  addLink(linkTarget, linkView) {
    let snippet = `layers.${linkTarget}.onClick ->\n\tNavigation.push layers.${linkView}`;

    let code = this.codeTree[this.state.selectedView] || '';
    if (code) {
      code += '\n';
    }
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
    this.debouncedUpdatePreview();
  }

  onSelectView(view) {
    this.setState({
      selectedView: view.name,
      code: this.codeTree[view.name]
    });
    this.postMessage({
      type: 'show',
      view: view.name
    });
  }


  fetchLayers() {
    return fetch(`/layers.json?id=${this.documentId}`, {
    }).then(response => {
      return response.json();
    }).then(layers => {
      let selectedView = this.state.selectedView || (layers[0] ? layers[0].name : undefined);
      this.setState({
        layers: layers,
        selectedView: selectedView,
        code: this.codeTree[selectedView]
      })
      this.viewCompletions = layers.map(layer => {
        return {
          caption: `layers.${layer.name}`,
          value: `layers.${layer.name}`,
          meta: "View"
        };
      });
    });
  }

  share() {
    window.open(`/framer.html?id=${this.documentId}`, 'alivePreview'+this.documentId);
  }

  saveCode() {
    this.setState({code: this.codeTree[this.state.selectedView]});
    let code = stringifyCode(this.codeTree);
    let formData  = new FormData();
    formData.append('code', code);
    return fetch(`/app.coffee?id=${this.documentId}`, {
      method: 'POST',
      body: formData
    }).then(response => {
      return response.text();
    }).then(code => {

    });
  }

  fetchCode() {
    return fetch(`/app.coffee?id=${this.documentId}`, {
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

  updatePreview() {
    let code = stringifyCode(this.codeTree);
    this.postMessage({
      type: 'change:app.coffee',
      code: code,
      view: this.state.selectedView
    });
  }

  onChange(newValue) {
    this.codeTree[this.state.selectedView] = newValue;
    this.debouncedUpdatePreview();
  }

  closeModal() {
    this.setState({modalIsOpen: false});
  }

  // Talk to preview
  postMessage(message) {
    let targetOrigin = '*';
    if (!this.refs.preview) {
      console.error('No preview iFrame');
      return;
    }
    this.refs.preview.contentWindow.postMessage(JSON.stringify(message), targetOrigin);
  }

  // Listen to preview
  receiveMessage(event) {
    let message = JSON.parse(event.data);
    console.log('App::receiveMessage', message.type);
    if (message.type === 'addLink') {
      this.setState({
        code: this.codeTree[message.view],
        selectedView: message.view,
        selectedLinkTarget: message.target,
        modalIsOpen: true
      });
    } else if (message.type === 'navigatingTo') {
      // if (message.view !== this.state.selectedView) {
      //   this.setState({
      //     selectedView: message.view,
      //     code: this.codeTree[message.view]
      //   });
      // }
    }
  }




  render() {
    if (!this.documentId) {
      return (
        <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems:'center'}}>
          <a href={`/Alive.sketchplugin.zip`} style={{ fontWeight: 600, padding: '12px 15px', background: '#0076FF', color: '#fff', textDecoration: 'none', borderRadius: 3}}>Download Sketch Plugin</a>
        </div>
      );
    }

    let pages;
    let linkTargets = [];
    if (this.state.layers) {
      pages = this.state.layers.filter(layer =>
        layer.kind === 'artboard'
      ).map(artboard => {
          let style = {
            backgroundColor: artboard.backgroundColor,
            backgroundImage: `url(/imported/${this.documentId}@2x/images/${artboard.objectId}.png)`
          };
          return (
            <Thumbnail
               key={artboard.name}
               name={artboard.name}
               selected={this.state.selectedView === artboard.name}
               style={style}
               onSelect={e => this.onSelectView(artboard)}
               />
          )
        }
      );

      linkTargets = pages.map(thumbnail => {
        return React.cloneElement(thumbnail, {
          selected: false,
          onSelect: () => {
            this.addLink(this.state.selectedLinkTarget, thumbnail.props.name);
            this.setState({modalIsOpen: false});
          }
        });
      });

    }

    return (
      <div className="App">
        <div style={{display: 'flex', height: '100vh' }}>
          <div className="content" style={{display: 'flex', flex: '1 1', flexDirection: 'column'}}>

            <Modal
              className="linkModal"
              isOpen={this.state.modalIsOpen}
              style={modalStyle}
              // onAfterOpen={this.afterOpenModal}
              // onRequestClose={this.closeModal}
              >

              <div style={{display:'flex', flex: '1 1', height: 40, alignItems: 'center', justifyContent: 'space-between'}}>
                <div>Hostspot destination</div>
                <a style={{cursor: 'pointer', color: 'blue'}} onClick={e => this.closeModal()}>Close</a>
              </div>
              <div style={{ display: 'flex', flex: '1 1', justifyContent: 'space-between'}}>
                {linkTargets}
              </div>
            </Modal>

            <div className="toolbar" style={{display: 'flex', height: 48, justifyContent: 'space-between'}}>
            {/* Save Publish Device Edit/View */}
              <div className="toolbar__group">
                <div className="toolbar__home">Alive 0.0.1</div>
              </div>
              <div className="toolbar__group">
                <a className="toolbar__button" onClick={e => this.saveCode() } >Save</a>
                <a
                  className="toolbar__button"
                  onClick={e => this.saveCode().then(_ => this.share())}>Share</a>
              </div>
            </div>
            <div style={{display: 'flex', flex: '1 1'}}>
              <div className="pagelist" style={{
                display: 'flex',
                flexDirection: 'column',
                overflowX: 'hidden',
                overflowY: 'auto'}}>
                {pages}
              </div>
              <div style={{ display: 'flex', flex: '1 1', flexDirection: 'column' }}>
                <AceEditor
                   className="editor"
                   height="500px"
                   width="auto"
                   mode="coffee"
                   ref="ace"
                   theme="monokai"
                   value={this.state.code}
                   fontSize={14}
                   onChange={e => this.onChange(e)}
                   commands={this.commands}
                   editorProps={{$blockScrolling: Infinity}}
                   onLoad={(editor) => {
                     this.editor = editor;
                     editor.focus();
                     editor.getSession().setUseWrapMode(true);
                     editor.renderer.setPadding(16);
                     editor.renderer.setScrollMargin(10, 10);
                     editor.setOptions({
                      //  enableBasicAutocompletion: true,
                       enableLiveAutocompletion: true,
                       showLineNumbers: false,
                       showGutter: false,
                       displayIndentGuides: true,
                       showPrintMargin: true
                     });
                   }}
                 />
              </div>
            </div>
          </div>
          <iframe ref="preview" className="preview" src={`/framer.html?id=${this.documentId}`}></iframe>
        </div>
      </div>
    );
  }
}


class Thumbnail extends Component {
  render() {
    return (
      <div
        className={['Thumbnail', this.props.selected ? 'Thumbnail--selected' : undefined].join(' ')}
        onClick={this.props.onSelect}>
        <div className="Thumbnail__image" style={ this.props.style }></div>
        <div className="Thumbnail__title">
          {this.props.name}
        </div>
      </div>
    );
  }
}

export default App;
