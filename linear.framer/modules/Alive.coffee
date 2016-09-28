aliveImportId = location.search.split(/[=&]/)[1];
window.layers = Framer.Importer.load("imported/#{aliveImportId}@2x")


setupViewController = () ->
  home = null
  for name, layer of layers
    if layer._info.kind is "artboard"
      home = layer if not home
      layer.onLoad = (callback) =>
        # play -> callback(layer)
        Utils.delay 0, -> callback(layer)
  window.views = new ViewController
    initialView: home


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
setupViewController()
console.log('Alive is initialized')
