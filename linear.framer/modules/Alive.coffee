params = queryToObject(window.location.search);
window.layers = Framer.Importer.load("imported/#{params.id}@2x")

initViewController = () ->
  home = null
  if params.view?
    console.log "set home", params.view
    home = layers[params.view]
  for name, layer of layers
    if layer._info.kind is "artboard"
      home = layer if not home

      do (layer) =>
        layer.onLoad = (callback) =>
          layer.onLoadCallback = callback

        layer.init = () =>
          if not layer.isInititalized and layer.onLoadCallback?
            layer.onLoadCallback(layer, layers)
            layer.isInititalized = yes

  window.views = new ViewController
    initialView: home
  # hacky, but we need to wait until app.coffee has been run.
  Utils.delay 0.1, -> home.init()


contains = (rect, point) ->
  point.x >= rect.left and point.x <= rect.right and point.y >= rect.top and point.y <= rect.bottom;

AliveLayerSelector = () ->
  currentLayer = null
  highlighter = document.createElement 'div'
  highlighter.className = 'Alive-highlighter'

  document.body.appendChild highlighter

  document.body.addEventListener 'mousemove', (event) ->
    screen = document.querySelector '#FramerContextRoot-DeviceScreen'
    if not event.metaKey
      highlighter.style.display = 'none'
      screen.classList.remove 'Alive-editing'
      return

    screen.classList.add 'Alive-editing'
    currentLayer = event.target
    if currentLayer
      rect = currentLayer.getBoundingClientRect()
      for p of rect
        highlighter.style[p] = rect[p] + 'px'
      highlighter.style.display = 'block'
    else
      highlighter.style.display = 'none'

  clickHandler = (event) ->
    if not event.metaKey
      return
    layer = Framer.CurrentContext.getLayers().find (layer) ->
      layer._element is event.target
    sendMessage
      type: 'addLink'
      target: layer.name
    event.stopPropagation()
  document.body.addEventListener 'click', clickHandler, true

AliveLayerSelector()
initViewController()
console.log('Alive is initialized')
