# name: Bolt Manager
# description: List, Install, Update and Remove bolts.
# keyword: bolt
# homepage: http://stormbar.net

options

  install:
    title: "Install"
    description: "Install a Bolt from a remote URL..."
    action: ->
      url = command.tokens[2]
      result
        title: if url then "Install: '#{url}'" else "Please provide a Bolt URL"
        description: 'Bolt URLs should be publicly accessible and plaintext'
        action: if url then actions.install(url) else actions.ignore()

  list:
    title: 'List'
    description: 'List all locally installed Bolts.'
    action: ->
      for boltId, bolt of bolts.installed
        result
          title: bolt.name
          description: bolt.homepage
          action: actions.open(bolt.homepage)


  update:
    title: "Update"
    description: "Update all bolts by reloading the cache."