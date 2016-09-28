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

findLayersForPoint = (layers, point) ->
  rv = []
  for name, layer of layers
    if layer._info.kind is "artboard"
      continue
    rect = layer._element.getBoundingClientRect()
    if contains rect, point
      rv.push layer
  return rv

# getZIndex = (layer) ->
#   i = 0
#   while layer = layer.parent
#     i = i + 1
#   return i

AliveLayerSelector = () ->
  currentLayer = null
  highlighter = new Layer
    backgroundColor: 'rgba(200, 0, 0, 0.1)'
    opacity: .9
    style:
      border: '2px solid rgba(200, 0, 0, 0.9)'
      pointerEvents: 'none'

  document.body.addEventListener 'mousemove', (event) ->
    if not event.metaKey
      highlighter.visible = no
      return

    matches = findLayersForPoint window.layers,
      x: event.pageX
      y: event.pageY

    # matches.forEach (match) ->
    #   match.realIndex = getZIndex match
    # matches.sort (match) -> match.realIndex

    currentLayer = matches.pop()
    if currentLayer
      highlighter.visible = yes
      highlighter.bringToFront()
      highlighter.frame = currentLayer.frame
    else
      highlighter.visible = no
    # console.log((matches.map (m) -> m.name).join())


document.body.addEventListener 'click', (event) ->
  if not event.metaKey
    return
  matches = findLayersForPoint window.layers,
    x: event.pageX
    y: event.pageY
  console.log matches
  event.stopPropagation()

AliveLayerSelector()
initViewController()
console.log('Alive is initialized')
