Storm.actions =

  repeat: ->
    (bar) -> bar.update(true)

  open: (url) ->
    (bar) -> window.open(url)

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