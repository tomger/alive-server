export default `
# Window object
innerWidth innerHeight

# Framer _.keys(Framer)
Utils Framer Layer Events Animation Config Defaults print

# Screen
Screen screen

# Utils _.keys(Framer.Utils)
reset getValue setDefaultProperties valueOrDefault arrayToObject
arrayNext arrayPrev getTime delay interval debounce throttle
randomColor randomChoice randomNumber labelLayer uuid
arrayFromArguments cycle toggle isWebKit isTouch isMobile
isChrome isLocal isLocalUrl devicePixelRatio pathJoin round
mapRange modulate convertPoint

# Frame
frame minX midX maxX minY midY maxY

# Events _.keys(Events)
TouchStart TouchEnd TouchMove Click MouseOver MouseOut MouseMove Scroll on off DragEnd DragStart DragMove Move DragAnimationDidStart DragAnimationDidEnd DirectionLockDidStart ScrollStart Scroll ScrollEnd ScrollAnimationDidStart ScrollAnimationDidEnd

# Layer _.keys((new Layer)._DefinedPropertiesValuesKey)
width height visible opacity index clip scrollX scrollY ignoreEvents
x y z scaleX scaleY scaleZ scale originX originY
rotationX rotationY rotationZ blur brightness saturate hueRotate contrast
invert grayscale sepia backgroundColor shadowX shadowY shadowBlur shadowColor

convertPoint screenFrame contentFrame centerFrame center centerX centerY pixelAlign
style html copy image
superLayer subLayers siblingLayers addSubLayer removeSubLayer
animate animateStop
bringToFront sendToBack placeBefore placeBehind
scrollFrame

# Layer Draggable
draggable enabled speedX speedY calculateVelocity

# State machine
states add switch switchInstant next animationOptions StateWillSwitch StateDidSwitch current

# Animation
properties curve repeat reverse stop start AnimationStart AnimationStop AnimationEnd layer

Screen Canvas

# Device
Device deviceType fullScreen orientation orientationName rotateLeft rotateRight setDeviceScale setContentScale deviceScale contentScale keyboard setKeyboard showKeyboard hideKeyboard toggleKeyboard
DeviceTypeDidChange DeviceFullScreenDidChange DeviceKeyboardWillShow DeviceKeyboardDidShow


Layer
addListener toInspect mouseWheelSpeedMultiplier velocityThreshold animationOptions constructor width height visible opacity index clip scrollHorizontal scrollVertical scroll ignoreEvents x y z scaleX scaleY scaleZ scale skewX skewY skew originX originY perspective rotationX rotationY rotationZ rotation blur brightness saturate hueRotate contrast invert grayscale sepia shadowX shadowY shadowBlur shadowSpread shadowColor backgroundColor color borderColor borderWidth force2d name borderRadius cornerRadius point size frame minX midX maxX minY midY maxY convertPoint canvasFrame screenFrame contentFrame centerFrame center centerX centerY pixelAlign canvasScaleX canvasScaleY screenScaleX screenScaleY screenScaledFrame scaledFrame style computedStyle classList html querySelector querySelectorAll destroy copy copySingle image addSubLayer removeSubLayer subLayersByName superLayers animate animations animatingProperties animateStop bringToFront sendToBack placeBefore placeBehind draggable scrollFrame scrollX scrollY removeListener once removeAllListeners on off keys listeners emit screenFrame canvasFrame parent children siblings

BackgroundLayer
layout addListener toInspect mouseWheelSpeedMultiplier velocityThreshold animationOptions constructor width height visible opacity index clip scrollHorizontal scrollVertical scroll ignoreEvents x y z scaleX scaleY scaleZ scale skewX skewY skew originX originY perspective rotationX rotationY rotationZ rotation blur brightness saturate hueRotate contrast invert grayscale sepia shadowX shadowY shadowBlur shadowSpread shadowColor backgroundColor color borderColor borderWidth force2d name borderRadius cornerRadius point size frame minX midX maxX minY midY maxY convertPoint canvasFrame screenFrame contentFrame centerFrame center centerX centerY pixelAlign canvasScaleX canvasScaleY screenScaleX screenScaleY screenScaledFrame scaledFrame style computedStyle classList html querySelector querySelectorAll destroy copy copySingle image addSubLayer removeSubLayer subLayersByName superLayers subLayersAbove subLayersBelow subLayersLeft subLayersRight animate animations animatingProperties animateStop bringToFront sendToBack placeBefore placeBehind draggable scrollFrame scrollX scrollY removeListener once removeAllListeners on off keys listeners emit

VideoLayer
addListener toInspect mouseWheelSpeedMultiplier velocityThreshold animationOptions player constructor video width height visible opacity index clip scrollHorizontal scrollVertical scroll ignoreEvents x y z scaleX scaleY scaleZ scale skewX skewY skew originX originY perspective rotationX rotationY rotationZ rotation blur brightness saturate hueRotate contrast invert grayscale sepia shadowX shadowY shadowBlur shadowSpread shadowColor backgroundColor color borderColor borderWidth force2d name borderRadius cornerRadius point size frame minX midX maxX minY midY maxY convertPoint canvasFrame screenFrame contentFrame centerFrame center centerX centerY pixelAlign canvasScaleX canvasScaleY screenScaleX screenScaleY screenScaledFrame scaledFrame style computedStyle classList html querySelector querySelectorAll destroy copy copySingle image addSubLayer removeSubLayer subLayersByName superLayers subLayersAbove subLayersBelow subLayersLeft subLayersRight animate animations animatingProperties animateStop bringToFront sendToBack placeBefore placeBehind draggable scrollFrame scrollX scrollY removeListener once removeAllListeners on off keys listeners emit

Animation
start options constructor stop reverse copy revert inverse invert emit animatingProperties listeners on once removeListener removeAllListeners off addListener

ScrollComponent
updateContent addListener toInspect velocityThreshold animationOptions constructor velocity scrollHorizontal scrollVertical speedX speedY isDragging isMoving propagateEvents directionLock directionLockThreshold content mouseWheelSpeedMultiplier calculateContentFrame scroll scrollX scrollY scrollPoint scrollFrame contentInset direction angle scrollToPoint scrollToTop scrollToLayer scrollToClosestLayer closestContentLayer closestContentLayerForScrollPoint removeListener on off mouseWheelEnabled copy width height visible opacity index clip ignoreEvents x y z scaleX scaleY scaleZ scale skewX skewY skew originX originY perspective rotationX rotationY rotationZ rotation blur brightness saturate hueRotate contrast invert grayscale sepia shadowX shadowY shadowBlur shadowSpread shadowColor backgroundColor color borderColor borderWidth force2d name borderRadius cornerRadius point size frame minX midX maxX minY midY maxY convertPoint canvasFrame screenFrame contentFrame centerFrame center centerX centerY pixelAlign canvasScaleX canvasScaleY screenScaleX screenScaleY screenScaledFrame scaledFrame style computedStyle classList html querySelector querySelectorAll destroy copySingle image addSubLayer removeSubLayer subLayersByName superLayers subLayersAbove subLayersBelow subLayersLeft subLayersRight animate animations animatingProperties animateStop bringToFront sendToBack placeBefore placeBehind draggable once removeAllListeners keys listeners emit

PageComponent
updateContent addListener toInspect constructor originX originY velocityThreshold animationOptions closestPage currentPage previousPage snapToPage snapToNextPage snapToPreviousPage addPage horizontalPageIndex verticalPageIndex velocity scrollHorizontal scrollVertical speedX speedY isDragging isMoving propagateEvents directionLock directionLockThreshold content mouseWheelSpeedMultiplier calculateContentFrame scroll scrollX scrollY scrollPoint scrollFrame contentInset direction angle scrollToPoint scrollToTop scrollToLayer scrollToClosestLayer closestContentLayer closestContentLayerForScrollPoint removeListener on off mouseWheelEnabled copy width height visible opacity index clip ignoreEvents x y z scaleX scaleY scaleZ scale skewX skewY skew perspective rotationX rotationY rotationZ rotation blur brightness saturate hueRotate contrast invert grayscale sepia shadowX shadowY shadowBlur shadowSpread shadowColor backgroundColor color borderColor borderWidth force2d name borderRadius cornerRadius point size frame minX midX maxX minY midY maxY convertPoint canvasFrame screenFrame contentFrame centerFrame center centerX centerY pixelAlign canvasScaleX canvasScaleY screenScaleX screenScaleY screenScaledFrame scaledFrame style computedStyle classList html querySelector querySelectorAll destroy copySingle image addSubLayer removeSubLayer subLayersByName superLayers subLayersAbove subLayersBelow subLayersLeft subLayersRight animate animations animatingProperties animateStop bringToFront sendToBack placeBefore placeBehind draggable once removeAllListeners keys listeners emit

SliderComponent
addListener toInspect mouseWheelSpeedMultiplier velocityThreshold animationOptions knob fill constructor knobSize min max value pointForValue valueForPoint animateToValue width height visible opacity index clip scrollHorizontal scrollVertical scroll ignoreEvents x y z scaleX scaleY scaleZ scale skewX skewY skew originX originY perspective rotationX rotationY rotationZ rotation blur brightness saturate hueRotate contrast invert grayscale sepia shadowX shadowY shadowBlur shadowSpread shadowColor backgroundColor color borderColor borderWidth force2d name borderRadius cornerRadius point size frame minX midX maxX minY midY maxY convertPoint canvasFrame screenFrame contentFrame centerFrame center centerX centerY pixelAlign canvasScaleX canvasScaleY screenScaleX screenScaleY screenScaledFrame scaledFrame style computedStyle classList html querySelector querySelectorAll destroy copy copySingle image addSubLayer removeSubLayer subLayersByName superLayers subLayersAbove subLayersBelow subLayersLeft subLayersRight animate animations animatingProperties animateStop bringToFront sendToBack placeBefore placeBehind draggable scrollFrame scrollX scrollY removeListener once removeAllListeners on off keys listeners emit

DeviceComponent
background phone screen viewport content keyboardLayer animationOptions fullscreen padding deviceZoom contentZoom constructor context fullScreen deviceType deviceScale contentScale orientation isPortrait isLandscape orientationName rotateLeft rotateRight keyboard showKeyboard hideKeyboard toggleKeyboard keys toInspect listeners emit on once removeListener removeAllListeners off addListener

MIDIComponent
min max source channel control

once
on
onClick
onDoubleClick
onScroll
onTouchStart
onTouchEnd
onTouchMove
onMouseUp
onMouseDown
onMouseOver
onMouseOut
onMouseMove
onMouseWheel
onAnimationStart
onAnimationStop
onAnimationEnd
onAnimationDidStart
onAnimationDidStop
onAnimationDidEnd
onImageLoaded
onImageLoadError
onMove
onDragStart
onDragWillMove
onDragMove
onDragDidMove
onDrag
onDragEnd
onDragAnimationDidStart
onDragAnimationDidEnd
onDirectionLockDidStart
onTap
onTapStart
onTapEnd
onDoubleTap
onForceTap
onForceTapChange
onForceTapStart
onForceTapEnd
onLongPress
onLongPressStart
onLongPressEnd
onSwipe
onSwipeStart
onSwipeEnd
onSwipeUp
onSwipeUpStart
onSwipeUpEnd
onSwipeDown
onSwipeDownStart
onSwipeDownEnd
onSwipeLeft
onSwipeLeftStart
onSwipeLeftEnd
onSwipeRight
onSwipeRightStart
onSwipeRightEnd
onEdgeSwipe
onEdgeSwipeStart
onEdgeSwipeEnd
onEdgeSwipeTop
onEdgeSwipeTopStart
onEdgeSwipeTopEnd
onEdgeSwipeRight
onEdgeSwipeRightStart
onEdgeSwipeRightEnd
onEdgeSwipeBottom
onEdgeSwipeBottomStart
onEdgeSwipeBottomEnd
onEdgeSwipeLeft
onEdgeSwipeLeftStart
onEdgeSwipeLeftEnd
onPan
onPanStart
onPanEnd
onPanLeft
onPanRight
onPanUp
onPanDown
onPinch
onPinchStart
onPinchEnd
onScale
onScaleStart
onScaleEnd
onRotate
onRotateStart
onRotateEnd
onChange
onValueChange

Align
`;
