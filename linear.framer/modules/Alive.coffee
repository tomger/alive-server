Utils.isLocalAssetUrl = (url, baseUrl) ->
  # tell Layer.coffee to never cachebust
  return no

params = queryToObject(window.location.search);
window.Alive.layers = layers = Framer.Importer.load "imported/#{params.id}@2x"

initialView = layers[window.Alive.initialView] if window.Alive.initialView?
for name, layer of layers
  if layer._info.kind is "artboard"
    initialView = layer if not initialView
    do (layer) =>
      layer.onLoad = (callback) =>
        layer.onLoadCallback = callback
      layer.init = () =>
        if not layer.isInititalized and layer.onLoadCallback?
          layer.onLoadCallback(layer, layers)
          layer.isInititalized = yes

window.Alive.views = views = new ViewController
  initialView: initialView
# hacky, but we need to wait until app.coffee has been run.
Utils.delay 0.1, -> initialView.init()


# contains = (rect, point) ->
#   point.x >= rect.left and point.x <= rect.right and point.y >= rect.top and point.y <= rect.bottom;

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

if not window.Alive.isInitialized
  AliveLayerSelector()
  window.Alive.isInitialized = true;
  console.log 'Alive is initialized'
