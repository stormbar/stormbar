# name: Bolt Manager
# description: List, Install, Update and Remove bolts.
# keyword: bolt
# homepage: http://stormbar.net

bolt.run ->

  options

    install:
      title: "Install"
      description: "Install a Bolt from a remote URL..."
      action: ->
        url = command.tokens[2]
        result
          title: if url then "Install: '#{url}'" else "Please provide a Bolt name or URL"
          description: 'Bolt URLs should be publicly accessible'
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
      description: "Update Bolts by reloading the cache from the remote URLs."
      action: ->
        input = command.tokens[2]
        if input and input.length > 0
          for boltId, bolt of bolts.installed when utils.prefixMatch(input, bolt.name)
            result
              title: bolt.name
              description: "Update from: #{bolt.url}"
              action: actions.update(boltId)
        else
          result
            title: "Update All"
            description: "Update all installed Bolts."
            action: actions.updateAll()

          for boltId, bolt of bolts.installed
            result
              title: bolt.name
              description: "Update from: #{bolt.url}"
              action: actions.update(boltId)

    uninstall:
      title: 'Uninstall'
      description: 'Uninstall a Bolt.'
      action: ->
        input = command.tokens[2]
        noInput = input is undefined or input.length is 0
        for boltId, bolt of bolts.installed when noInput or utils.prefixMatch(input, bolt.name)
          result
            title: bolt.name
            description: "Uninstall"
            action: actions.uninstall(boltId)
