import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

import { parseCode, stringifyCode, debounce } from './Utils'

// it('renders without crashing', () => {
//   const div = document.createElement('div');
//   ReactDOM.render(<App />, div);
// });

it('simple parse', () => {
  let tree = parseCode('layers.home.actions = { "a": { "view": "b"} }');
  expect(JSON.stringify(tree)).toEqual('{"home":{"code":"","actions":{"a":{"view":"b"}}}}');
  expect(stringifyCode(tree)).toEqual('layers.home.actions = {"a":{"view":"b"}}');
});

it('parses too', () => {
  let code =
`layers.loginView.onLoad ->
    layers.loginbutton.onClick ->
    	Navigation.push layers.homeView
layers.loginView.actions = {"loginbutton":{"view":"homeView"}}
layers.homeView.onLoad ->
    layers.brand1.onClick ->
    	Navigation.push layers.loginView,
    	    transition: 'pushOutRight'`;
  let tree = parseCode(code);
  expect(tree.loginView.actions.loginbutton.view).toEqual('homeView');
  // console.log('tree', JSON.stringify(tree));
  // console.log(JSON.stringify(stringifyCode(tree)));
  expect(stringifyCode(tree)).toEqual(code);
});
