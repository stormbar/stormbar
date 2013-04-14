class Storm.Modal

  @activeModal = null

  @hasOpenModal = -> Storm.Modal.activeModal and Storm.Modal.activeModal.isOpen
  @close = -> Storm.Modal.activeModal.close()

  constructor: (@template, @options) ->
    @content = Storm.Template.render('modal-' + @template, @options)
    @el = null
    @isOpen = false
    Storm.Modal.activeModal = this


  open: ->
    @el = $.parseHTML(@content)
    $('body').append(@el)
    @isOpen = true
    window.addEventListener('message', @onMessage, false)

  close: ->
    return unless @isOpen
    $(@el).remove()
    @isOpen = false
    window.removeEventListener('message', @onMessage, false)

  onMessage: (e) =>
    return unless e.data = 'closeModal'
    @close()
