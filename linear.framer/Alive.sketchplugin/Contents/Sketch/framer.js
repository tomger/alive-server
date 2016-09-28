function log() {
  var t = Array.prototype.slice.call(arguments);
  t = t.filter(function(t) {
    return t && "" != t
  }), print(t.join(" "))
}

function ipc(t) {
  return log(JSON.stringify(t, null))
}

function inspect(t) {
  return JSON.stringify(t)
}

function getCurrentPath() {
  return NSProcessInfo.processInfo().arguments()[0].stringByDeletingLastPathComponent()
}

function joinPath() {
  return Array.prototype.slice.call(arguments).map(stripSlashes).join("/")
}

function stripSlashes(t) {
  return t.replace(/\/$/, "")
}

function splitLines(t) {
  return t.match(/[^\r\n]+/g)
}

function getIsApplicationRunning(t) {
  for (var n = NSWorkspace.sharedWorkspace().runningApplications(), r = 0; r < n.count(); r++)
    if (n[r].bundleIdentifier() == t) return !0;
  return !1
}

function call(t) {
  return "function" == typeof t ? t() : t
}

function isNSType(t, n) {
  return null !== t && void 0 !== t && (t.className && t.className() == n)
}

function isNSString(t) {
  return isNSType(t, "__NSCFString")
}

function isNSArray(t) {
  return isNSType(t, "NSArray")
}

function isNSDictionary(t) {
  return isNSType(t, "NSDictionary")
}

function toBool(t) {
  return !!t
}

function toArray(t) {
  for (var n = t.count(), r = [], e = 0; e < n; e++) r.push(t.objectAtIndex(e));
  return r
}

function toObject(t) {
  var n = {};
  for (var r in t) n[r] = t[r];
  return n
}

function toString(t) {
  return t + ""
}

function map(t, n) {
  var r, e = [];
  r = t.count ? t.count() : t.length;
  for (var i = 0; i < r; i++) {
    var a;
    a = t.objectAtIndex ? t.objectAtIndex(i) : t[i], e.push(n(a, i))
  }
  return e
}

function filter(t, n) {
  var r, e = [];
  r = t.className && "__NSArrayM" == t.className() ? t.count() : t.length;
  for (var i = 0; i < r; i++) n(t[i], i) && e.push(n(t[i], i));
  return e
}

function getMergedObject() {
  for (var t, n = {}, r = 0, e = arguments.length; r < e; r++)
    for (t in arguments[r]) arguments[r].hasOwnProperty(t) && (n[t] = arguments[r][t]);
  return n
}

function getTemporaryFolderPath() {
  return NSTemporaryDirectory()
}

function createDirectory(t) {
  NSFileManager.defaultManager().createDirectoryAtPath_withIntermediateDirectories_attributes_error(t, !0, {}, null)
}

function getFileContents(t) {
  return NSString.stringWithContentsOfFile_encoding_error(t, NSUTF8StringEncoding, nil)
}

function writeFileContents(t, n) {
  NSString.stringWithString(n).writeToFile_atomically_encoding_error(t, !0, NSUTF8StringEncoding, nil)
}

function getJSON(t) {
  return JSON.stringify(t, null, "\t")
}

function getJSJSON(t, n, r) {
  var e = "";
  return e += "window." + t + " = window.__imported__ || {};\n", e += "window." + t + '["' + n + '"] = ' + r
}

function getTaskOutput(t, arguments) {
  pipe = NSPipe.pipe(), file = pipe.fileHandleForReading(), task = NSTask.alloc().init(), task.launchPath = t, task.arguments = arguments, task.standardOutput = pipe, task.launch(), task.waitUntilExit(), data = file.readDataToEndOfFile(), file.closeFile();
  var n = [];
  NSString.alloc().initWithData_encoding(data, NSUTF8StringEncoding).split("\n");
  return n.join("\n")
}

function getArguments() {
  return NSProcessInfo.processInfo().arguments()
}

function getIsApplicationRunning(t) {
  for (var n = NSWorkspace.sharedWorkspace().runningApplications(), r = 0; r < n.count(); r++)
    if (n[r].bundleIdentifier() == t) return !0;
  return !1
}

function exit() {
  log("Usage: coscript run.js <appName> <pluginPath> <destinationPath>")
}

function getParsedArgument(t, n) {
  var arguments = getArguments();
  if (t > arguments.length - 1) {
    if (n) return n;
    exit()
  }
  return toString(arguments[t])
}

function getIPC(t) {
  var n = {};
  return t.map(function(t) {
    if ("{" == t[0]) try {
      n = getMergedObject(n, JSON.parse(t))
    } catch (r) {}
  }), n
}

function replaceSuffix(t, n) {
  return endsWith(t.toLowerCase(), n) ? t.slice(0, -n.length) : t
}

function movePathToTrash(t) {
  var n = NSURL.fileURLWithPath(t);
  NSFileManager.defaultManager().trashItemAtURL_resultingItemURL_error(n, nil, nil)
}

function getCurrentPath() {
  return NSFileManager.defaultManager().currentDirectoryPath()
}

function getAbsolutePath(t) {
  if (!t) throw new Error("getAbsolutePath: missing path");
  return 0 == t.indexOf("/") ? t : joinPath(getCurrentPath(), t)
}

function getPathExists(t) {
  return NSFileManager.defaultManager().fileExistsAtPath(t)
}

function getParentPath(t) {
  return NSString.stringWithString(t).stringByDeletingLastPathComponent()
}

function copyPath(t, n) {
  t = getAbsolutePath(t), n = getAbsolutePath(n), getPathExists(n) && movePathToTrash(n), createDirectory(getParentPath(n));
  var r = NSFileManager.defaultManager().copyItemAtPath_toPath_error(t, n, nil);
  if (!r) throw new Error("Could not copy: \n\t" + t + "\n\t" + n)
}

function endsWith(t, n, r) {
  var e = t.toString();
  ("number" != typeof r || !isFinite(r) || Math.floor(r) !== r || r > e.length) && (r = e.length), r -= n.length;
  var i = e.indexOf(n, r);
  return i !== -1 && i === r
}

function repeat(t, n) {
  return Array(n).join(t)
}

function getActiveDocument(e) {
  var t = toArray(e.orderedDocuments()),
    r = t.filter(function(e) {
      return !e.window().isMiniaturized()
    });
  if (r.length > 0) return r[0];
  if (t.length > 0) return t[0];
  throw Error("Could not find open Sketch document")
}

function getApplication() {
  return NSApplication.sharedApplication()
}

function getDocumentName(e) {
  return e.displayName()
}

function getDocumentIsSaved(e) {
  return !0
}

function getDocumentDefaultPage(e) {
  return e.currentPage()
}

function getChildren(e) {
  var t = e.layers();
  return toArray(t.array ? t.array() : t)
}

function getParent(e) {
  return e.parentForInsertingLayers()
}

function getArtboards(e) {
  var t = toArray(e.artboards()),
    r = t.filter(getIsArtboard);
  return r
}

function getHasArtboards(e) {
  return getArtboards(e).length > 0
}

function getLayers(e) {
  return getChildren(e).filter(getIsLayer)
}

function getLayerGroups(e) {
  return getChildren(e).filter(getIsLayerGroup)
}

function getAbsoluteRect(e) {
  var t = getLayerGroupMaskRect(e),
    r = getLayerInfluenceRect(getIsolatedLayerGroupCopy(e));
  return t && r.size.width < t.size.width && r.size.height < t.size.height ? getLayerRulerRect(e, t) : getLayerRulerRect(e, r)
}

function getLayerRect(e) {
  return e.rect()
}

function getLayerExportRect(e) {
  return toArray(MSExportRequest.exportRequestsFromExportableLayer(e))[0].rect()
}

function getLayerInfluenceRect(e) {
  var t = e.absoluteRect().rect(),
    r = getLayerExportRect(e);
  return NSMakeRect(r.origin.x - t.origin.x, r.origin.y - t.origin.y, r.size.width, r.size.height)
}

function getLayerRulerRect(e, t) {
  return NSMakeRect(t.origin.x + e.absoluteRect().rulerX(), t.origin.y + e.absoluteRect().rulerY(), t.size.width, t.size.height)
}

function getLayerGroupMaskRect(e) {
  var t = getChildren(e).filter(getLayerHasMask).map(function(e) {
    return e.rect()
  });
  return t.length ? 1 == t.length ? t[0] : getMergedRect(t) : null
}

function getMergedRect(e) {
  var t = Math.min.apply(null, e.map(function(e) {
      return e.origin.x
    })),
    r = Math.min.apply(null, e.map(function(e) {
      return e.origin.y
    })),
    a = Math.max.apply(null, e.map(function(e) {
      return e.origin.x + e.size.width
    })),
    n = Math.max.apply(null, e.map(function(e) {
      return e.origin.y + e.size.height
    }));
  return NSMakeRect(t, r, a, n)
}

function getFrame(e) {
  return null == e ? null : ("MOStruct" != e.className() && (e = e.rect()), {
    x: parseFloat(e.origin.x),
    y: parseFloat(e.origin.y),
    width: parseFloat(e.size.width),
    height: parseFloat(e.size.height)
  })
}

function getIsArtboard(e) {
  return "MSArtboardGroup" == e.className()
}

function getIsLayerGroup(e) {
  return "MSLayerGroup" == e.className()
}

function getOnlyContainsTextLayer(e) {
  return 1 == e.containedLayersCount() && "MSTextLayer" == e.firstLayer().className()
}

function getIsLayer(e) {
  return !getIsLayerGroup(e)
}

function getLayerHasMask(e) {
  return e.hasClippingMask()
}

function getLayerIsBitmap(e) {
  return "MSBitmapLayer" == e.className()
}

function getLayerHasTransparentPixels(e) {
  if (!getLayerIsBitmap(e)) return !0;
  try {
    return e.NSImage().representations()[0].hasTransparentPixels()
  } catch (t) {
    return !0
  }
}

function getLayerBackgroundColor(e) {
  var t = e.backgroundColor().RGBADictionary();
  // XXX original line ALIVE
  // return "rgba(" + 255 * parseFloat(t.valueForKey("r")) + ", " + 255 * parseFloat(t.valueForKey("g")) + ", " + 255 * parseFloat(t.valueForKey("b")) + ", " + t.valueForKey("a") + ")"
  return "rgba(" +
    Math.round(255 * parseFloat(t.valueForKey("r"))) + ", " +
    Math.round(255 * parseFloat(t.valueForKey("g"))) + ", " +
    Math.round(255 * parseFloat(t.valueForKey("b"))) + ", " +
    t.valueForKey("a") + ")"
}

function getDocumentSymbols(e) {
  return toArray(e.allSymbols())
}

function getIsolatedLayerGroupCopy(e) {
  var t, r = MSDocumentData["new"]();
  if (e.copyWithOptions) {
    var a = getDocumentSymbols(e.parentPage().documentData());
    a.map(function(e) {
      var t = e.copyWithOptions(1);
      r.currentPage().addLayers([t])
    }), t = e.copyWithOptions(1)
  } else t = e.copyIncludingObjectIDS();
  return r.currentPage().addLayers([t]), t
}

function exportLayerGroup(e, t, r) {
  log("-", repeat("| ", r), t.name());
  var a = (Date.now(), getLayerGroupMetaData(e, t));
  if (getLayerShouldFlatten(t) || getLayers(t).length) {
    var n = getIsolatedLayerGroupCopy(t),
      o = getLayerExportRect(n),
      i = getLayerGroupMaskRect(n);
    i && i.size.width > o.size.width && i.size.height > o.size.height && (o = getLayerRulerRect(n, i)), getLayerShouldFlatten(t) || getLayerGroups(n).map(function(e) {
      n.removeLayer(e)
    }), n.setIsVisible(!0), writeImage(e, n, o)
  }
  return getLayerShouldFlatten(t) ? a.children = [] : a.children = getLayerGroups(t).filter(getLayerShouldProcess).map(function(t) {
    return exportLayerGroup(e, t, r + 1)
  }), a.children.reverse(), a
}

function getLayerGroupMetaData(e, t) {
  var r = getFrame(getAbsoluteRect(t)),
    a = {
      objectId: toString(t.objectID()),
      kind: "unknown",
      name: getSanitizedName(toString(t.name())),
      originalName: toString(t.name()),
      maskFrame: getFrame(getLayerGroupMaskRect(t)),
      layerFrame: r,
      visible: toBool(t.isVisible()),
      metadata: {}
    };
  if (getIsArtboard(t) && (a.kind = "artboard"), getIsLayerGroup(t) && (a.kind = "group", a.metadata.opacity = t.style().contextSettings().opacity()), getOnlyContainsTextLayer(t)) {
    a.kind = "text";
    var n = t.firstLayer(),
      o = toArray(n.CSSAttributes());
    a.metadata.string = toString(n.stringValue()), a.metadata.css = o.map(toString)
  }
  return getIsArtboard(t) && (a.backgroundColor = getLayerBackgroundColor(t)), (getLayerShouldFlatten(t) || getLayers(t).length) && (a.image = {
    path: getLayerGroupRelativeImagePath(e, t),
    frame: r
  }), a
}

function getLayerShouldFlatten(e) {
  return endsWith(toString(e.name()), "*")
}

function getLayerShouldProcess(e) {
  return !endsWith(toString(e.name()), "-")
}

function getSanitizedName(e) {
  var t = ["-", "*", ".jpg", ".pdf", ".png"];
  return t.map(function(t) {
    e = replaceSuffix(e, t)
  }), e = e.replace(/[^a-zA-Z0-9_\$]/g, "_"), e = e.replace(/(^[0-9])/, "$$$1"), e = e.replace(/_+/g, "_")
}

function getLayerGroupImageHash(e, t) {
  var r = t.objectID();
  return r = r.dataUsingEncoding(NSUTF8StringEncoding), r = r.base64EncodedStringWithOptions(0), r = toString(r).substring(0, 8).toLowerCase()
}

function getLayerGroupImageName(e, t) {
  return e.imagePrefix + getSanitizedName(t.name()) + "-" + getLayerGroupImageHash(e, t) + "." + getLayerGroupImageType(e, t)
}

function getLayerGroupRelativeImagePath(e, t) {
  return joinPath(e.imageFolder, getLayerGroupImageName(e, t))
}

function getLayerGroupImagePath(e, t) {
  return joinPath(e.path, getLayerGroupRelativeImagePath(e, t))
}

function getGroupHasOnlyBitmapsWithoutTransparency(e) {
  for (var t = getLayers(e), r = 0; r < t.length; r++)
    if (getLayerHasTransparentPixels(t[r])) return !1;
  return !0
}

function getLayerGroupImageType(e, t) {
  var r = toString(t.name()).toLowerCase(),
    a = ["-", "*"];
  return a.map(function(e) {
    r = replaceSuffix(r, e)
  }), endsWith(r, ".png") ? "png" : endsWith(r, ".jpg") ? "jpg" : endsWith(r, ".pdf") ? "pdf" : getGroupHasOnlyBitmapsWithoutTransparency(t) ? "jpg" : e.defaultImageFormat
}

function writeImage(e, t, r) {
  var a = t.parentPage(),
    n = getLayerGroupImagePath(e, t),
    o = getLayerGroupImageType(e, t),
    i = toArray(MSExportRequest.exportRequestsFromExportableLayer(t))[0];
  i.scale = e.scale, i.immutablePage = a.immutableModelObject(), i.rect = r, i.compression = e.compression, i.format = o;
  var u = MSExporter.exporterForRequest_colorSpace(i, e.colorSpace);
  u.data().writeToFile_atomically(n, !0)
}

function flattenMetadata(e) {
  function t(e) {
    r = r.concat(e), e.map(function(e) {
      e.children && t(e.children)
    })
  }
  var r = [];
  return t(e), r
}

function getUniqueName(e, t) {
  for (var r = e, a = 1; t.indexOf(r) != -1;) r = e + a, a += 1;
  return r
}

function _main(e) {
  e = e || {}, log("options:", inspect(e));
  var t = Date.now(),
    r = NSBundle.mainBundle().infoDictionary();
  log(e.appIdentifier, NSBundle.mainBundle().bundlePath(), r.CFBundleShortVersionString, r.CFBundleVersion);
  var a = joinPath(getTemporaryFolderPath(), Date.now().toString(), e.destinationPath.split("/").pop()),
    n = {
      app: getApplication(),
      path: a,
      imageFolder: "images",
      imagePrefix: "Layer-",
      colorSpace: NSColorSpace.sRGBColorSpace(),
      antiAlias: !0,
      jsonFileName: "layers.json",
      jsFileName: "layers.json.js",
      jsVariable: "__imported__",
      scale: e.scale,
      defaultImageFormat: "png",
      compression: .55
    };
  createDirectory(a), createDirectory(joinPath(a, n.imageFolder));
  var o = getActiveDocument(n.app);
  log("Document:", o.displayName());
  var i, u = getDocumentDefaultPage(o);
  i = getHasArtboards(u) ? getArtboards(u) : getLayerGroups(u);
  var g = i.filter(getLayerShouldProcess).map(function(e) {
      return exportLayerGroup(n, e, 0)
    }),
    s = flattenMetadata(g),
    c = [];
  s.map(function(e, t) {
    e.name = getUniqueName(e.name, c), c.push(e.name)
  });
  var l = n.path.split("/").pop();
  writeFileContents(joinPath(n.path, n.jsonFileName), getJSON(g));
  writeFileContents(joinPath(n.path, n.jsFileName), getJSJSON(n.jsVariable, joinPath(l, n.jsFileName), getJSON(g))), log("Exported:", o.displayName().stringByDeletingPathExtension()), log("Took:", Date.now() - t + "ms"), ipc({
    exportPath: a
  })
  return {
    path: a,
    layers: g
  };
}

function main(e) {
  try {
    log(">>> Run", new Date), _main(e)
  } catch (t) {
    log(t), ipc({
      err: t
    })
  }
}
