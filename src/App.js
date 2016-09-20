import React, { Component } from 'react';
// import brace from 'brace';
import AceEditor from 'react-ace';
import 'brace/mode/coffee';
import 'brace/theme/monokai';

import './App.css';

class App extends Component {
  constructor() {
    super();
    this.state = {
      iframeRefresh: 0
    };
    this.uid = location.pathname.replace(/[\?\.\/]/g, '');
    if (!this.uid) {
      location.href = this.generateId();
    }

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
  }
  componentDidMount() {
    this.fetchCode();
  }

  generateId() {
    let time = String(Date.now());
    return '/' + Math.round(1000 * Math.random()) + time.substr(time.length - 6);
  }

  loadPreview() {
    this.setState({iframeRefresh:Date.now()})
  }

  saveAndReload() {
    this.saveCode().then(_ => {
      this.loadPreview();
    });
  }
  saveCode() {
    console.log('saving', this.editedCode.length)
    this.setState({code: this.editedCode})
    return fetch(`//${location.hostname}:3001/app.coffee?id=${this.uid}`, {
      method: 'POST',
      headers: {
        'Accept': 'text/plain',
      },
      body: this.editedCode
    }).then(response => {
      return response.text();
    }).then(code => {
      console.log(code);
    });
  }

  fetchCode() {
    return fetch(`//${location.hostname}:3001/app.coffee?id=${this.uid}`, {
      accept: 'text/plain'
    }).then(response => {
      return response.text();
    }).then(code => {
      console.log('loaded code');
      this.editedCode = code;
      this.setState({
        code: code
      });
      var undo_manager = this.refs.ace.editor.getSession().getUndoManager();
      undo_manager.reset();
      this.refs.ace.editor.getSession().setUndoManager(undo_manager);
    });
  }

  onChange(newValue) {
    this.editedCode = newValue;
  }

  render() {
    return (
      <div className="App">
        <div style={{display: 'flex', height: '100vh'}}>
          <div style={{ display: 'flex', flex: '1 1', flexDirection: 'column'}}>
            <AceEditor
               className="editor"
               height="500px"
               width="auto"
               mode="coffee"
               ref="ace"
               theme="monokai"
               fontSize={16}
               value={this.state.code}
               onChange={e => this.onChange(e)}
               commands={this.commands}
               editorProps={{$blockScrolling: true}}
               onLoad={(editor) => {
                 editor.focus();
                 editor.getSession().setUseWrapMode(true);
               }}
             />
           <div className="statusbar">
              <a className="" href="https://framerjs.com/docs/" target="_blank">Framer Docs</a>
              <a className="" href={this.generateId()} target="_blank">New Prototype</a>
              <div className="statusbar-button" title="Cmd + Shift + S" onClick={ e => this.saveAndReload() }>Save &amp; Run</div>
            </div>
           </div>
           <iframe
              className="preview"
              src={`//${location.hostname}:3001/framer.html?id=${this.uid}&${this.state.iframeRefresh}`}></iframe>
        </div>
      </div>
    );
  }
}

export default App;
