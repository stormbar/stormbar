Storm.ActivityManager =

  activities: []
  indicatorShowing: false
  hasRunningActivities: false

  create: () ->
    activity = new Storm.Activity(this)
    this.activities.push(activity)
    activity

  update: ->
    this.activities = (activity for activity in this.activities when activity.isRunning())
    this.hasRunningActivities = this.activities.length > 0
    this.updateIndicator()

  updateIndicator: ->
    indicator = $('#activity-indicator')
    if this.hasRunningActivities
      indicator.find('.status').text(this.activities[0].status())
      indicator.addClass('on')
      this.indicatorShowing = true
    else
      indicator.removeClass('on')
      this.indicatorShowing = true
