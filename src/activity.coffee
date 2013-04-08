class Storm.Activity

  @TIMEOUT = 10000

  constructor: (@_manager) ->
    @_running = false
    @_status = 'working'
    @_timeout = null

  start: (initialStatus) ->
    @_timeout = setTimeout (=> @end()), Storm.Activity.TIMEOUT
    @_running = true
    @_status = initialStatus
    @_manager.update()

  end: ->
    clearTimeout(@_timeout) if @_timeout
    @_running = false
    @_manager.update()

  status: (msg=null) ->
    if msg
      @_status = msg
      @_manager.update()
    @_status

  isRunning: -> @_running