class Storm.Bar
  constructor: (@el, @options={}) ->
    @el = $(@el)
    @searchField = @el.find('input.search')
    @resultsEl = @el.find('.downpour')
    @query = new Storm.Query(this, @searchTerm())
    @results = []
    @lastSearch = ""
    @bindEvents()
    @currentResultIndex = 0
    @updateTimer = null
    # TODO: this is a big hack till we have load events
    setTimeout (=> @onLoad()), 1000

  onLoad: ->
    @forceSearchTerm(@options.query) if @options.query
    @bindEvents()
    @focusSearchField()

  bindEvents: ->
    @searchField.on('keyup', => @considerUpdate())
    @searchField.on('change', => @considerUpdate())
    Mousetrap.bind 'up', (=> @moveUp(); false)
    Mousetrap.bind 'down', (=> @moveDown(); false)
    Mousetrap.bind 'esc', (=> @reset(); false)
    Mousetrap.bind ['enter', 'tab'], (=> @triggerAction(); false)

  focusSearchField: ->
    $(document).ready(=> @searchField.focus())

  forceSearchTerm: (term) ->
    @searchField.val(term)
    @update(true)

  reset: -> @forceSearchTerm('')

  searchTerm: -> @searchField.val()

  result: (result) ->
    @results.push(result)
    @resultsEl.append(result.render())
    @updateSelection()
    @updateHeight()
    @el.addClass('has-results')

  considerUpdate: ->
    clearTimeout(@updatetimer) if @updateTimer
    # delay the update if we need to goto a bolt for results
    if @searchTerm().split(' ') > 1
      setTimeout (=> @update()), 300
    else
      @update()

  update: (force=false) ->
    @updateTimer = null
    return true if @searchTerm() == @activeSearch and force is false
    @wipe()
    @activeSearch = @searchTerm()
    @query = new Storm.Query(this, @searchTerm())
    @query.run()
    true

  wipe: ->
    @results = []
    @currentResultIndex = 0
    @query.cancel()
    @resultsEl.html('')
    @el.removeClass('has-results')
    @updateHeight()

  moveUp: ->
    return if @currentResultIndex == 0
    @currentResultIndex--
    @updateSelection()

  moveDown: ->
    return unless @currentResultIndex < @results.length - 1
    @currentResultIndex++
    @updateSelection()

  updateSelection: ->
    allResults = @resultsEl.find('.result')
    allResults.removeClass('selected')
    $(allResults.get(@currentResultIndex)).addClass('selected')

  updateHeight: ->
    h = 0
    h += $(child).outerHeight() for child in @resultsEl.children()
    @resultsEl.height(h)

  triggerAction: ->
    result = @results[@currentResultIndex]
    return unless result
    result.triggerAction(this)
