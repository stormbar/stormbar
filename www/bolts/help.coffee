# name: Help!
# description: Get help on using Storm Bar
# keyword: help
# homepage: http://stormbar.net

bolt.run ->
  result
    title: "Help!"
    description: 'press enter for assistance...'
    action: actions.iframe('/help/index.html')