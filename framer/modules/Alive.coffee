# hack to tell Layer.coffee to never cachebust
Utils.isLocalAssetUrl = (url, baseUrl) ->
  return no

AliveLoadLayers = () ->
  params = queryToObject window.location.search
  Framer.Extras.Preloader.disable()
  Framer.Extras.Preloader.setLogo("none")
  window.layers = Framer.Importer.load "imported/#{params.id}@2x"

AliveViewController = () ->
  console.log 'AliveViewController'
  initialView = layers[window.Alive.initialView] if window.Alive.initialView?
  for name, layer of layers
    if layer._info.kind is "artboard"
      initialView = layer if not initialView
      do (layer) =>
        layer.onLoad = (callback) =>
          layer.onLoadCallback = callback
  flow = window.flow = new FlowComponent
  flow.on Events.TransitionStart, (from, to) =>
    if to.init?
      to.init()
  flow.showNext(initialView)

AliveHotspotEditor = () ->
  hotspotContext = new Framer.Context(name:"Hotspots")
  window.Alive.HotspotContext = hotspotContext
  hotspot = null
  hotspotLabel = null
  hotspotContext.run =>
    hotspotLabel = new Layer
      backgroundColor: 'transparent'
      y: Align.bottom(-20)
      x: Align.center
      height: 20
      width: 800
      style:
        fontSize: '16px'
        textShadow: '0 1px 3px black'
        textAlign: 'center'
        zIndex: 2001


    hotspot = new Layer
      borderWidth: 1
      backgroundColor: 'rgba(0,173,255,.54)'
      borderColor: '#2A9FD8'
      visible: no
      style:
        pointerEvents: 'none'
        zIndex: 2000


  for name, layer of window.layers
    if layer._info.kind isnt "artboard"
      do (layer) =>
        layer.onMouseOver (event) ->
          # if @_hotspot
          #   return
          hotspot.visible = yes
          hotspotLabel.visible = yes
          hotspot.frame = layer.canvasFrame
          hotspotLabel.html = 'layers.' + layer.name
          event.stopPropagation()
        layer.onMouseOut ->
          hotspot.visible = no
          hotspotLabel.visible = no
          event.stopPropagation()
        layer.onClick ->
          event.stopPropagation()
          sendMessage
            type: 'addLink'
            target: layer.name
            view: window.flow.current.name
    for triggerName, action of layer.actions
      trigger = layers[triggerName]
      if trigger
        trigger._hotspot = new Layer
          parent: trigger.parent
          frame: trigger.frame
          borderWidth: 2
          backgroundColor: 'rgba(0, 255, 55, 0.3)'
          borderColor: 'rgb(18, 187, 63)'
          style:
            zIndex: 2000

AliveHotspotViewer = () ->
  for name, layer of layers
    if layer._info.kind is "artboard"
      do (layer) =>
        layer.init = () =>
          if not window.Alive.isBuildMode and not layer.isInititalized
            for trigger, action of layer.actions
              if layers[trigger]
                do (trigger, action) ->
                  layers[trigger].onClick ->
                    to = layers[action.view]
                    flow.showNext(to)
                    # transition: action.transition
            if layer.onLoadCallback?
              layer.onLoadCallback(layers)
            layer.isInititalized = yes
  if window.flow.current.init?
    window.flow.current.init()


AliveCodeReady = () ->
  console.log 'AliveCodeReady'
  if window.Alive.isBuildMode
    AliveHotspotEditor()
  else
    AliveHotspotViewer()

AliveInit = () ->
  AliveLoadLayers()
  AliveViewController()
  # if not window.Alive.isInitialized
  window.Alive.isInitialized = true;
  console.log 'Alive is initialized'

AliveInit()
