const lintPullRequest = require('./src_handler.js');

module.exports = (app) => {
  // https://developer.github.com/v3/activity/events/types/#pullrequestevent
  // subscribe to every event but "closed"
  console.log("---------->>>>> index file")
  app.on(
    [
      'pull_request.opened',
      'pull_request.edited',
      'pull_request.reopened',
      'pull_request.assigned',
      'pull_request.unassigned',
      'pull_request.labeled',
      'pull_request.unlabeled',
      'pull_request.synchronize',
    ],
    lintPullRequest
  );
};