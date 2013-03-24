window.Storm = Storm = {}

Storm.bolts = {}
Storm.keywords = {}

Storm.init = (selector) -> new Storm.Bar($(selector))

Storm.install = (url) ->
  $.get url, null, ((data) -> Storm.load(Storm.idFromURL(url), data)), 'text'

Storm.idFromURL = (url) -> CryptoJS.SHA1(url).toString()

Storm.load = (id, boltCode) ->
  bolt = new Storm.Bolt(id, boltCode)
  Storm.register(bolt)

Storm.register = (bolt) ->
  Storm.bolts[bolt.id] = bolt
  Storm.keywords[bolt.getKeyword()] = Storm.keywords[bolt.getKeyword()] || []
  Storm.keywords[bolt.getKeyword()].push(bolt.id)

Storm.terminateAll = ->
  for id, bolt of Storm.bolts
    bolt.terminate()

Storm.utils = {
  prefixMatch: (prefix, string) -> string.search(new RegExp("^#{prefix}",'i')) is 0
  fuzzyMatch: (prefix, string, threshold=0) -> string.score(prefix) > threshold
}