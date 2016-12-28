# Alive Server

**Alive** is an open source browser-based [Framer](https://github.com/koenbok/Framer/) editor for rapid prototyping with a hint of Invision. A [Sketch plugin](https://github.com/tomger/alive) makes it easy to upload typical Framer layers to the server.

## Get Started

- [Download] (https://github.com/tomger/alive-server/archive/master.zip) (Node.js & React project)
- Run `npm install` to install dependencies
- Run `npm start` to start the web server and the "Create react app" live environment.
- Install the Sketch plugin to upload an artboard to your local server. The plugin will open a specific project on **http://localhost:3001/edit/[sketch page id]** automatically.

If that sounds scary, check out [this screencast](https://vimeo.com/185270726) of an older version of the web editor.

## Contribute


##### Current features
- The server accepts Framer JSON and PNG assets through HTTP POST
- The web client can edit and compile CoffeeScript for **each artboard**.
- Navigate through code by clicking on artboard previews.
- Autocomplete for Framer framework and layer names.
- **Invision style** point and click hotspots with artboard previews.
- Sharing using a read-only ID.

##### Wanted features

- **Figma** asset syncing (as background cloud service)
- Authentication / safer sharing
- More point & click FlowComponent transitions
- Improved autocomplete
- Point & click drawing of click targets

<br/>
<img src="https://github.com/tomger/alive-server/blob/images/screenshot.png?raw=true">
