import React, { Component } from 'react';
import AceEditor from 'react-ace';
import Modal from 'react-modal';

import ace from 'brace';
import 'brace/mode/coffee';
import 'brace/theme/monokai';
import 'brace/ext/language_tools';

import { parseCode, stringifyCode, debounce, traverseLayers } from './Utils'
import './App.css';
import words from './words';

// editor/
// share/
// viewer/


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
    width: 500,
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

function getPathParts() {
  return window.location.pathname.split('/');
}

function getPathPartRight(index) {
  let parts = getPathParts();
  return parts[parts.length - 1 - (index || 0)];
}

class App extends Component {
  constructor() {
    super();

    this.state = {
      initialView: null,
      modalIsOpen: false,
      buildmode: false,
      shareId: undefined,
      saveButtonLabel: 'Save'
    };

    this.codeTree = {};
    this.editor = null;
    this.documentId = getPathPartRight(0);
    this.isReadonly = getPathPartRight(1) === 'share';
    this.debouncedUpdatePreview = debounce(this.updatePreview, 300);
    this.debouncedSaveCode = debounce(this.saveCode, 900);

    this.initEditor();
  }

  componentDidMount() {
    if (!this.documentId) {
      return;
    }
    this.fetchCode();
    this.fetchLayers();

    window.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.keyCode === 83) {
        this.debouncedSaveCode();
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

  removeLink(linkTarget) {
    try {
      delete this.codeTree[this.state.selectedView].actions[linkTarget];
    } catch (error) {
      console.error(error);
    }
    this.updatePreview();
    this.debouncedSaveCode();
  }

  addLink(linkTarget, linkView) {
    let view = this.state.selectedView;
    this.codeTree[view] = this.codeTree[view] || {};
    this.codeTree[view].actions = this.codeTree[view].actions || {};
    this.codeTree[view].actions[linkTarget] = {
      'view': linkView
    };
    this.updatePreview();
    this.debouncedSaveCode();
  }

  onSelectView(view) {
    this.setState({
      selectedView: view.name,
      code: this.codeTree[view.name] ? this.codeTree[view.name].code : ''
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
        code: this.codeTree[selectedView] ? this.codeTree[selectedView].code : ''
      })

      let flatLayers = [];
      traverseLayers(layers, layer => {
        flatLayers.push(layer);
      });
      this.viewCompletions = flatLayers.map(layer => {
        return {
          caption: `layers.${layer.name}`,
          value: `layers.${layer.name}`,
          meta: "Layer"
        };
      });
    });
  }

  share() {
    this.setState({ shareIsOpen: true });
    if (!this.state.shareId) {
      return fetch(`/project.json?id=${this.documentId}`, {
      }).then(response => {
        return response.json();
      }).then(project => {
        this.setState({
          shareId: project.shareId
        })
      });
    }
  }

  onSaveButtonClicked() {
    this.debouncedSaveCode();
    this.setState({ saveButtonLabel: 'Saving' });
    clearTimeout(this.saveButtonHandle);
    this.saveButtonHandle = setTimeout(e => {
      this.setState({ saveButtonLabel: 'Save' });
    }, 500);
  }

  saveCode() {
    if (this.isReadonly) {
      return;
    }

    this.setState({
      code: this.codeTree[this.state.selectedView].code
    });
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
      this.codeTree = parseCode(code);
      console.log('fetchCode', this.codeTree)
      this.setState({
        code: this.state.selectedView ? this.codeTree[this.state.selectedView].code : ''
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
    if (!this.codeTree[this.state.selectedView]) {
      this.codeTree[this.state.selectedView] = {};
    }
    this.codeTree[this.state.selectedView].code = newValue;
    this.debouncedUpdatePreview();
    this.debouncedSaveCode();
  }

  closeShareModal() {
    this.setState({shareIsOpen: false});
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
        code: this.codeTree[message.view] ? this.codeTree[message.view].code : '',
        selectedView: message.view,
        selectedLinkTarget: message.target,
        modalIsOpen: true
      });
    } else if (message.type === 'navigatingTo') {
      if (message.view !== this.state.selectedView) {
        this.setState({
          selectedView: message.view,
          code: this.codeTree[message.view] ? this.codeTree[message.view].code : ''
        });
      }
    }
  }

  toggleMode() {
    let buildmode = !this.state.buildmode;
    this.setState({buildmode});
    this.postMessage({
      type: 'buildmode',
      value: buildmode,
      view: this.state.selectedView
    });
  }


  render() {
    if (!this.documentId) {
      return (
        <div>Sorry, I don't know which document you want to edit.</div>
      );
    }

    let pages;
    let linkModal;
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

      let removeLinkButton;
      let currentAction;

      if (this.codeTree &&
          this.codeTree[this.state.selectedView] &&
          this.codeTree[this.state.selectedView].actions &&
          this.codeTree[this.state.selectedView].actions[this.state.selectedLinkTarget]) {
            currentAction = this.codeTree[this.state.selectedView].actions[this.state.selectedLinkTarget];
      }

      if (currentAction) {
        removeLinkButton = (
          <a style={{cursor: 'pointer', color: 'red', marginRight: 16}}
            onClick={e => { this.removeLink(this.state.selectedLinkTarget); this.closeModal() }}>Remove Link</a>
        );
      }

      linkTargets = pages.map(thumbnail => {
        return React.cloneElement(thumbnail, {
          selected: currentAction && (thumbnail.props.name === currentAction.view), // OH BOY XXX
          titleStyle: { color: '#333'},
          onSelect: () => {
            this.addLink(this.state.selectedLinkTarget, thumbnail.props.name);
            this.setState({modalIsOpen: false});
          }
        });
      });

      linkModal = (
        <Modal
          className="modal linkModal"
          isOpen={this.state.modalIsOpen}
          style={modalStyle}
          onRequestClose={e => this.closeModal()}>
          <div className="modal__toolbar" style={{display:'flex', flex: '1 1', height: 40, alignItems: 'center', justifyContent: 'space-between'}}>
            <div className="modal__title">Link to</div>
            <div>
              {removeLinkButton}
              <a style={{cursor: 'pointer', color: '#555'}} onClick={e => this.closeModal()}>Close</a>
            </div>
          </div>
          <div className="modal__content" style={{ display: 'flex', flex: '1 1', overflowX: 'auto'}}>
            {linkTargets}
          </div>
        </Modal>
      );
    }

    return (
      <div className="App">
        <div style={{display: 'flex', height: '100vh' }}>
          <div className="content" style={{display: 'flex', flex: '1 1', flexDirection: 'column'}}>

            <Modal
              className="modal shareModal"
              isOpen={this.state.shareIsOpen}
              style={modalStyle}
              onRequestClose={e => this.closeShareModal()}
              >
              <div className="modal__toolbar" style={{display:'flex', flex: '1 1', height: 40, alignItems: 'center', justifyContent: 'space-between'}}>
                <div className="modal__title">Share</div>
                <a style={{cursor: 'pointer', color: '#555'}} onClick={e => this.closeShareModal()}>Close</a>
              </div>
              <div className="modal__content" style={{}}>
                <div className="share__linkBlock">
                  <div className="share__linkTitle">Viewer</div>
                  <a target="_blank" className="share__link" href={`/viewer?id=${this.state.shareId}`}>{location.origin}/viewer?id={this.state.shareId}</a>
                </div>
                <div className="share__linkBlock">
                  <div className="share__linkTitle">Viewer with Code</div>
                  <a target="_blank" className="share__link" href={`/share/${this.state.shareId}`}>{location.origin}/share/{this.state.shareId}</a>
                </div>
                <div className="share__linkBlock share__warning">
                  Warning: sharing the current URL (/edit/{this.documentId}) will give the receiver full editing access!
                </div>
              </div>
            </Modal>

            {linkModal}

            <div className="toolbar" style={{display: this.isReadonly ? 'none' : 'flex', height: 48, justifyContent: 'space-between'}}>
            {/* Save Publish Device Edit/View */}
              <div className="toolbar__group">
                <a className="toolbar__button" style={{width: 56, display: 'inline-block'}} onClick={e => this.onSaveButtonClicked() } >{this.state.saveButtonLabel}</a>
                <a className="toolbar__button" onClick={e => this.saveCode().then(_ => this.share())}>Share</a>
              </div>
              <a className="toolbar__button" href="https://framerjs.com/docs/" target="_blank">Docs</a>
              <div className="toolbar__group">
                {/* <a className="toolbar__button"
                   style={{ marginLeft: 24}}
                   onClick={e => this.saveCode() } >Follow</a> */}
                <a className={['toolbar__button', this.state.buildmode ? 'isSelected' : undefined].join(' ')}
                   style={{ marginLeft: 24}}
                   onClick={e => this.toggleMode() } >Edit Hotspots</a>
                <a className={['toolbar__button', !this.state.buildmode ? 'isSelected' : undefined].join(' ')}
                   onClick={e => this.toggleMode() } >Preview</a>
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
        <div className="Thumbnail__title" style={ this.props.titleStyle }>
          {this.props.name}
        </div>
      </div>
    );
  }
}

export default App;
