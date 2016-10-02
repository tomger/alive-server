import React, { Component } from 'react';
import AceEditor from 'react-ace';
import { DragSource, DropTarget,    DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import ace from 'brace';
import 'brace/mode/coffee';
import 'brace/theme/monokai';
import 'brace/ext/language_tools';

import './App.css';
import words from './words';

const VIEW_DRAG_TYPE = 'view';

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
      initialView: 'home'
    };
    this.editor = null;
    this.documentId = location.pathname.replace(/[\?\.\/]/g, '');
    this.initEditor();
    this.debouncedUpdatePreview = debounce(this.updatePreview, 300);
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
          this.saveCode();
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

  insertViewCode(view) {
    let snippet = `\nviews.pushIn layers.${view}`;

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
      // var undo_manager = this.refs.ace.editor.getSession().getUndoManager();
      // undo_manager.reset();
      // this.refs.ace.editor.getSession().setUndoManager(undo_manager);
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
    if (message.type === 'addLink') {
      this.addLink(message.target);
      this.debouncedUpdatePreview();
    } else if (message.type === 'navigatingTo') {
      this.focusView(message.view);
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
    if (this.state.layers) {
      pages = this.state.layers.filter(layer =>
        layer.kind === 'artboard'
      ).map(artboard => {
          let style = {
            backgroundColor: artboard.backgroundColor,
            backgroundImage: `url(/imported/${this.documentId}@2x/images/${artboard.objectId}.png)`
          };
          return (
            <DraggableThumbnail
              key={artboard.name}
              name={artboard.name}
              selected={this.state.selectedView === artboard.name}
              style={style}
              onClick={e => this.onSelectView(artboard)}
              />
          )
        }
      );
    }

    let editor = this.props.connectDropTarget(
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
             enableLiveAutocompletion: true
           });
         }}/>
      </div>
    );

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
          {editor}
          <iframe ref="preview" className="preview" src={`/framer.html?id=${this.documentId}`}></iframe>
        </div>
      </div>
    );
  }
}

const thumbnailSource = {
  beginDrag(props) {
    return {
      name: props.name
    };
  }
};

function collectThumbnail(connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
  };
}

function collectEditor(connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget()
  };
}


var appDropTarget = {
  canDrop: function (props, monitor) {
    // console.log('canDrop', props.position)
    // You can disallow drop based on props or item
    // var item = monitor.getItem();
    // return canMakeChessMove(item.fromPosition, props.position);
    return true;
  },

  hover: function (props, monitor, component) {
    // console.log('hover')
    // This is fired very often and lets you perform side effects
    // in response to the hover. You can't handle enter and leave
    // here—if you need them, put monitor.isOver() into collect() so you
    // can just use componentWillReceiveProps() to handle enter/leave.

    // You can access the coordinates if you need them
    // var clientOffset = monitor.getClientOffset();
    // var componentRect = findDOMNode(component).getBoundingClientRect();

    // You can check whether we're over a nested drop target
    // var isJustOverThisOne = monitor.isOver({ shallow: true });

    // You will receive hover() even for items for which canDrop() is false
    // var canDrop = monitor.canDrop();
  },

  drop: function (props, monitor, component) {
    let item = monitor.getItem();
    let name = item.name;
    component.insertViewCode(name);
  }
};

class Thumbnail extends Component {
  render() {
    const { isDragging, connectDragSource } = this.props;
    let style = {};
    if (isDragging) {
      style.opacity = 0.5;
    }
    return connectDragSource(
      <div
        className={['Thumbnail', this.props.selected ? 'Thumbnail--selected' : undefined].join(' ')}
        onClick={this.props.onClick}
        style={style}>
        <div className="Thumbnail__image" style={ this.props.style }></div>
        <div className="Thumbnail__title">
          {this.props.name}
        </div>
      </div>
    );
  }
}

var DraggableThumbnail = DragSource(VIEW_DRAG_TYPE, thumbnailSource, collectThumbnail)(Thumbnail);

let droppableApp = DropTarget(VIEW_DRAG_TYPE, appDropTarget, collectEditor)(App);
export default DragDropContext(HTML5Backend)(droppableApp);
