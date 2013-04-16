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
    $(document).ready => @onLoad()

  onLoad: ->
    @forceSearchTerm(@options.query) if @options.query
    @bindEvents()
    @focusSearchField()

  bindEvents: ->
    @searchField.on('keyup', => @considerUpdate())
    @searchField.on('change', => @considerUpdate())
    Mousetrap.bind 'up', @closeModalAnd(=> @moveUp())
    Mousetrap.bind 'down', @closeModalAnd(=> @moveDown())
    Mousetrap.bind 'esc', @closeModalOr(=> @reset())
    Mousetrap.bind ['enter', 'tab'], @closeModalOr(=> @triggerAction())

  closeModalOr: (fn) ->
    ->
      if Storm.Modal.hasOpenModal()
        Storm.Modal.close()
      else
        fn()
      false

  closeModalAnd: (fn) ->
    ->
      Storm.Modal.close() if Storm.Modal.hasOpenModal()
      fn()
      false

  focusSearchField: ->
    $(document).ready(=> @searchField.focus())

  forceSearchTerm: (term) ->
    @searchField.val(term)
    @update(true)

  reset: -> @forceSearchTerm('')

  searchTerm: -> @searchField.val()

  result: (result) ->
    @results.push(result)
    resultHTML = $.parseHTML(result.render())
    @resultsEl.append(resultHTML)
    $(resultHTML).click => @triggerAction(result)
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

  triggerAction: (result=@results[@currentResultIndex]) ->
    return unless result
    result.triggerAction(this)
