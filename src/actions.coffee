Storm.actions =

  repeat: ->
    (bar) -> bar.update(true)

  open: (url) ->
    (bar) -> window.open(url)

  image: (url, title) ->
    (bar) -> new Storm.Modal('image', title: title, image: url).open()

  iframe: (url) ->
    (bar) -> new Storm.Modal('iframe', src: url).open()

  fill: (searchTerm) ->
    (bar) -> bar.forceSearchTerm(searchTerm)

  fillKeyword: (token) ->
    (bar) -> bar.forceSearchTerm(token + ' ')

  fillCommand: (keyword, command) ->
    (bar) -> bar.forceSearchTerm("#{keyword} #{command} ")

  reset: ->
    (bar) -> bar.reset()

  ignore: ->
    (bar) -> null

  install: (url) ->
    (bar) ->
      if this.isPrivileged
        Storm.install(url)
        bar.reset()

  uninstall: (boltId) ->
    (bar) ->
      if this.isPrivileged
        Storm.uninstall(boltId)
        bar.reset()

  update: (boltId) ->
    (bar) ->
      if this.isPrivileged
        Storm.update(boltId)
        bar.reset()

  updateAll: (boltId) ->
    (bar) ->
      if this.isPrivileged
        Storm.updateAll()
        bar.reset()