# [Slider.js](http://demo.greweb.fr/slider) by @greweb 

###!
Copyright 2011 Gaetan Renaudeau
http://greweb.fr/slider

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
###

# Util function : modulo for negative values
mod = (X,Y) -> X-Y*Math.floor(X/Y)

# RequestAnimationFrame polyfill : https://gist.github.com/997619
requestAnimationFrame = `function(a,b){while(a--&&!(b=window["oR0msR0mozR0webkitR0r".split(0)[a]+"equestAnimationFrame"]));return b||function(a){setTimeout(a,15)}}(5)`

# return the current millisecond timestamp
currentTime = `function(){return new Date().getTime()}`


# Slider template
# ---------------
tmplSlider = (o) ->
  slider = $("""
  <div class="slider">
    <div class="loader"><span class="spinner"></span> <span class="percent">0</span>%</div>
    <div class="slide-images"></div>
    <div class="options">
      <a class="prevSlide" href="javascript:;">prev</a>
      <span class="slide-pager"></span>
      <a class="nextSlide" href="javascript:;">next</a>
    </div>
  </div>
  """)
  slider.find('.slide-images').append(
    $.map(o.slides, (slide) -> $('<div class="slide-image">'+
      (if slide.link then '<a href="'+slide.link+'" target="_blank">' else '')+
      '<img src="'+slide.src+'">'+
      (if slide.name then '<span class="caption">'+slide.name+'</span>' else '')+
      (if slide.link then '</a>' else '')+
      '</div>')[0]
    )
  )
  slider.find('.slide-pager').append $.map(o.slides, (slide, i) ->
    $('<a href="javascript:;">' + (i + 1) + '</a>')[0]
  )
  slider

tmplSliderWithCanvas = (o) ->
  node = tmplSlider o
  node.find('div.slide-images').append('<canvas class="slide-images" />')
  node


# SliderUtils
# -----------
SliderUtils = 
  extractImageData: (self, from, to) ->
    {width, height} = self.canvas[0]
    self.clean()
    self.drawImage self.images[from]
    fromData = self.ctx.getImageData 0, 0, width, height
    self.clean()
    self.drawImage self.images[to]
    toData = self.ctx.getImageData 0, 0, width, height
    output = self.ctx.createImageData width, height
    return fromData: fromData, toData: toData, output: output
    
  clippedTransition: ( clipFunction ) -> 
    (self, from, to, progress) ->
      {width, height} = self.canvas[0]
      ctx = self.ctx
      self.drawImage self.images[from]
      ctx.save()
      ctx.beginPath()
      clipFunction ctx, width, height, progress
      ctx.clip()
      self.drawImage self.images[to]
      ctx.restore()

# SliderTransitionFunctions
# ------------------------
SliderTransitionFunctions =
  # A clock load effect
  clock: 
    render: SliderUtils.clippedTransition (ctx, w, h, p) ->
      ctx.moveTo w/2, h/2
      ctx.arc w/2, h/2, Math.max(w, h), 0, Math.PI*2*p, false

  # A circle open effect
  circle: 
    render: SliderUtils.clippedTransition (ctx, w, h, p) ->
      ctx.arc w/2, h/2, 0.6*p*Math.max(w, h), 0, Math.PI*2, false

  # A horizontal open effect
  diamond: 
    render: SliderUtils.clippedTransition (ctx, w, h, p) ->
      w2=w/2
      h2=h/2
      dh=p*h
      dw=p*w
      ctx.moveTo w2,    h2-dh
      ctx.lineTo w2+dw, h2
      ctx.lineTo w2,    h2+dh
      ctx.lineTo w2-dw, h2

  # A vertical open effect
  verticalOpen: 
    render: SliderUtils.clippedTransition (ctx, w, h, p) ->
      nbSpike=8
      spikeh=h/(2*nbSpike) # the height of a demi-spike (triangle)
      spikew=spikeh
      pw=p*w/2
      xl=w/2-pw
      xr=w/2+pw
      spikel=xl-spikew
      spiker=xr+spikew
      ctx.moveTo xl, 0
      for hi in [0..nbSpike]
        h1=(2*hi)*spikeh
        h2=h1+spikeh
        ctx.lineTo spikel, h1
        ctx.lineTo xl, h2
      ctx.lineTo spiker, h
      for hi in [nbSpike..0]
        h1=(2*hi)*spikeh
        h2=h1-spikeh
        ctx.lineTo xr, h1
        ctx.lineTo spiker, h2

  # A horizontal open effect
  horizontalOpen: 
    render: SliderUtils.clippedTransition (ctx, w, h, p) ->
      ctx.rect 0, (1-p)*h/2, w, h*p

  # A sundblind open effect
  horizontalSunblind: 
    render: SliderUtils.clippedTransition (ctx, w, h, p) ->
      p = 1-(1-p)*(1-p) #non linear progress
      blinds = 6
      blindHeight = h/blinds
      for blind in [0..blinds]
        ctx.rect 0, blindHeight*blind, w, blindHeight*p

  # A vertical sundblind open effect
  verticalSunblind: 
    render: SliderUtils.clippedTransition (ctx, w, h, p) ->
      p = 1-(1-p)*(1-p)
      blinds = 10
      blindWidth = w/blinds
      for blind in [0..blinds]
        prog = Math.max(0, Math.min( 2*p-(blind+1)/blinds, 1))
        ctx.rect blindWidth*blind, 0, blindWidth*prog, h

  # circles open effect
  circles: 
    render: SliderUtils.clippedTransition (ctx, w, h, p) ->
      circlesY = 6
      circlesX = Math.floor circlesY*w/h
      circleW = w/circlesX
      circleH = h/circlesY
      maxWH = Math.max(w, h)
      maxRad = 0.7*Math.max(circleW, circleH)
      for x in [0..circlesX]
        for y in [0..circlesY]
          cx = (x+0.5)*circleW
          cy = (y+0.5)*circleH
          r = Math.max(0, Math.min(2*p-cx/w, 1)) * maxRad
          ctx.moveTo cx, cy
          ctx.arc cx, cy, r, 0, Math.PI*2, false

  # A square sundblind open effect
  squares: 
    render: SliderUtils.clippedTransition (ctx, w, h, p) ->
      p = 1-(1-p)*(1-p) #non linear progress
      blindsY = 5
      blindsX = Math.floor blindsY*w/h
      blindWidth = w/blindsX
      blindHeight = h/blindsY
      for x in [0..blindsX]
        for y in [0..blindsY]
          sx = blindWidth*x
          sy = blindHeight*y
          prog = Math.max(0, Math.min(3*p-sx/w-sy/h, 1))
          rw = blindWidth*prog
          rh = blindHeight*prog
          ctx.rect sx-rw/2, sy-rh/2, rw, rh

  # A blured fade left effect
  fadeLeft: 
    init: (self, from, to) -> 
      data = SliderUtils.extractImageData(self, from, to)
      data.randomTrait = []
      h = self.canvas[0].height
      for y in [0..h]
        data.randomTrait[y] = Math.random()
      data

    render: (self, from, to, progress, data) ->
      blur = 150
      {width, height} = self.canvas[0]
      ctx = self.ctx
      fd = data.fromData.data
      td = data.toData.data
      out = data.output.data
      randomTrait = data.randomTrait
      
      `(function(){
        var wpdb = width*progress/blur;
        for (var x = 0; x < width; ++x) {
          var xdb = x/blur;
          for (var y = 0; y < height; ++y) {
            var b = (y*width + x)*4
            var p1 = Math.min(Math.max((xdb-wpdb*(1+randomTrait[y]/10)), 0), 1)
            var p2 = 1-p1
            for (var c = 0; c < 3; ++c) {
              var i = b + c;
              out[i] = p1 * (fd[i] ) + p2 * (td[i] )
            }
            out[b + 3] = 255;
          }
        }
      }())`
      self.ctx.putImageData data.output, 0, 0





# Slider - a lightweight slider
# -----------------------------
# Constructor : init container node and current slide number
class Slider
  constructor: (container) -> @container = $(container)
  current: 0
  lastHumanNav: 0
  duration: 4000
  startDelay: 0
  w: '640px'
  h: '430px'
  theme: 'theme-dark'

  tmpl: tmplSlider
  
  # Util function : return the circular value of num
  circular: (num) -> mod num, @slides.size()

  # Go to slide number `num` : update both DOM and this.current
  slide: (num) ->
    # num must be between 0 and nbslides-1
    if @slides && @pages
      num = Math.max(0, Math.min(num, @slides.size()-1))
      # Move current class in **slides**
      @slides.eq(@current).removeClass "current"
      @slides.eq(num).addClass "current"
      # Move current class in **pages**
      @pages.eq(@current).removeClass "current"
      @pages.eq(num).addClass "current"
    @current = num
    this

  # Go to circular next slide (will call `slide`)
  next: -> @slide @circular(@current+1)

  # Go to circular previous slide (will call `slide`)
  prev: -> @slide @circular(@current-1)

  # Change the duration between each slide
  setDuration: (@duration) ->
    this

  # Change the start delay for changing between each slide
  setStartDelay: (@startDelay) ->
    this

  # Change the slider transition CSS class
  setTransition: (transition) ->
    if @node
      @node.removeClass(@transition) if @transition
      @node.addClass(transition) if transition
    @transition = transition
    this

  # Change the slider theme CSS class
  setTheme: (theme = "theme-dark") ->
    if @node
      @node.removeClass(@theme) if @theme
      @node.addClass(theme) if theme
    @theme = theme
    this

  # set slider size
  setSize: (@w, @h) ->
    if @node
      @node.width w
      @node.find(".slide-image").width w
      @node.find(".slide-images").height h
    this

  # Fetch photos with a JSON providing its `url`.
  # If `options` is defined, passing it in request params.
  # If `transformer` is defined, using it to transform the json
  # to a compatible json to pass to `Slider.setPhotos`.
  fetchJson: (url, options, transformer) ->
    params = $.extend({}, options)
    transformer ?= (json) -> json
    $.getJSON url, params, (json) => @setPhotos transformer(json)
    this

  # Sync slider data to DOM
  _sync: ->
    @setTransition @transition
    @setTheme @theme
    @setSize @w, @h
    @slide @current
  
  # `slides` : format: array of { src, name, link (optional) } 
  setPhotos: (@photos) ->
    # Templating and appending to DOM
    @node = @tmpl(slides: photos).addClass("loading")
    @container.empty().append @node
    @_sync()
    # Loading all images before showing the slider
    nbLoad = 0
    imgs = @node.find(".slide-image img").bind("load", =>
      total = imgs.size()
      if ++nbLoad == total
        @node.removeClass "loading"
        @start()
      # Update loader progression (in percent)
      @node.find(".loader .percent").text Math.floor(100 * nbLoad / total)
    )
    @node.find(".loader").text "No photo"  if imgs.size() == 0
    this
  
  # Start the slider
  start: ->
    @slides = @node.find(".slide-image")
    @pages = @node.find(".slide-pager a")
    @_sync()
    @_bind()
    this

  stop: ->
    @_unbind()
    this
  
  # Bind slider DOM events for navigation
  _bind: ->
    @_unbind()
    @node.find(".prevSlide").click => @prev()
    @node.find(".nextSlide").click => @next()
    self = this
    if @node
      @node.find(".slide-pager a").each (i) ->
        $(this).click -> self.slide i
      now = -> currentTime()
      @node.find(".options a").click => @lastHumanNav = now()
    
    if not @timeout
      loop_ = =>
        @next() if now() - @lastHumanNav > 2000
        @timeout = setTimeout(loop_, @duration)
      @timeout = setTimeout(loop_, if @startDelay then @startDelay else @duration)
    this

  _unbind: ->
    if @node
      @node.find(".prevSlide, .nextSlide, .slide-pager a, .options a").unbind 'click' 
    if @timeout
      clearTimeout @timeout
      @timeout = null


# SliderWithCanvas
# ---------------
# Let's support canvas transitions
class SliderWithCanvas extends Slider
  transitionFunction: SliderTransitionFunctions.clock
  transitionDuration: 1500
  tmpl: tmplSliderWithCanvas

  # also synchronize the renderMode
  _sync: () ->
    renderMode = @renderMode
    super
    @setRenderMode(renderMode)

  # Init some variables related to canvas
  start: () ->
    @notCanvas = @node.find '.slide-images:not(canvas) img'
    @canvas = @node.find 'canvas.slide-images'
    @ctx = @canvas[0].getContext '2d' if @canvas[0] and @canvas[0].getContext
    @images = $.map(@photos, ((photo) => 
      img = new Image()
      img.src = photo.src
      img
    )) if @photos
    super

  # The `setSize` method should update the canvas size
  setSize: (w, h) ->
    super w, h
    @canvas.attr("height", h).attr("width", w) if @canvas
    this

  # set the render mode of the slider ( canvas | css )
  setRenderMode: (@renderMode) ->
    if @ctx
      if @renderMode is 'canvas'
        @drawImage @images[@current]
        @notCanvas.hide()
        @canvas.show()
      else
        @canvas.hide()
        @notCanvas.show()
    this

  setTransition: (transition) -> 
    @setRenderMode 'css'
    super transition
    this

  # Change the slider transition function (for the canvas animation)
  setTransitionFunction: (@transitionFunction) -> 
    @setRenderMode 'canvas'
    this

  # Change the slider transition duration (means the time of the transition)
  setTransitionDuration: (@transitionDuration) ->
    @setRenderMode 'canvas'
    this

  # Overriding `slide` to support the canvas rendering
  slide: (num) ->
    @fromSlide = @current
    @toSlide = num
    @transitionStart = currentTime()
    if @ctx and @renderMode is 'canvas'
      @startRender()
    super num

  # clean the canvas
  clean: -> @ctx.clearRect 0, 0, @canvas[0].width, @canvas[0].height

  # draw an image on the all canvas with the correct ratio
  drawImage: (img) -> 
    {width, height} = @canvas[0]
    @ctx.drawImage img, 0, 0, width, width*img.height/img.width

  # `_renderId` help to make sure once transition is running
  _renderId: 0

  # init render loop
  startRender: ->
    if @transitionFunction.init
      @tfdata = @transitionFunction.init this, @fromSlide, @toSlide
    @render(++@_renderId, @transitionFunction)

  # render loop
  render: (id, transitionFunction) ->
    now = currentTime()
    if id==@_renderId and now >= @transitionStart
      progress = Math.min(1, (now - @transitionStart) / @transitionDuration)
      if progress == 1
        @clean()
        @drawImage @images[@toSlide]
      else
        transitionFunction.render this, @fromSlide, @toSlide, progress, @tfdata
        requestAnimationFrame (=>@render(id, transitionFunction)), @canvas[0]


# Exporting global variables
# --------------------------
window.Slider = SliderWithCanvas
window.SliderTransitionFunctions = SliderTransitionFunctions
window.SliderUtils = SliderUtils
