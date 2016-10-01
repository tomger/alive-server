function click(target) {
  var layer = target();
  waitfor(ev) {
    var handler = function() {
      layer.off(Events.Click, handler)
      resume()
    };
    layer.on(Events.Click, handler)
  }
}

function either(a, b) {
  waitfor {
    a();
  } or {
    b();
  }
}

function wait(target) {
  waitfor(ev) {
    if (typeof(target) === 'function') {
      target();
      resume();
    } else {
      Utils.delay(target, function() {
        resume()
      });
    }
  }
}

function animate(layer, options) {
  waitfor(ev) {
    var event = Events.AnimationEnd;
    options = Object.assign({
      layer: layer
    }, {}, options); // XXX

    var animation = new Animation(options);
    animation.start();
    try {
      if (options.wait === false) {
        resume();
      } else {
        var handler = function() {
        animation.off(event, handler);
          resume()
        };
        animation.on(event, handler);
      }
    } retract {
      animation.stop();
      animation.off(event, handler);
    }
  }
}

function play(fn) {
  setTimeout(fn, 0);
}
