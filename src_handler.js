const log = require('./src_log');
const { lint, defaultConfig } = require('./src_core_index');

const APP_NAME = 'PRLint';

const createFinalReport = ({
  failureMessages,
  failureURLs,
  defaultFailureURL,
}) => {
  let bodyPayload = {};
  if (!failureMessages.length) {
    bodyPayload = {
      state: 'success',
      description: 'Your validation rules passed',
    };
  } else {
    let description = failureMessages[0];
    let URL = failureURLs[0];
    if (failureMessages.length > 1) {
      description = `1/${failureMessages.length - 1}: ${description}`;
      URL = defaultFailureURL;
    }
    if (description) {
      bodyPayload = {
        state: 'failure',
        description: description.slice(0, 140), // 140 characters is a GitHub limit
        target_url: URL,
      };
    } else {
      bodyPayload = {
        state: 'failure',
        description:
          'Something went wrong with PRLint - You can help by opening an issue (click details)',
        target_url: 'https://github.com/ewolfe/prlint/issues/new',
      };
    }
  }

  return bodyPayload;
};

module.exports = async (context) => {
  run(context);
}

async function run(context) {
  console.log("Loading handler file");
  
  const { repos } = context.github;
  const { sha } = context.payload.pull_request.head;
  const repo = context.repo();
  
  const defaultFailureURL = "https://github.com/upengareri"
  
  // Hold this PR info
  const statusInfo = { ...repo, sha, context: APP_NAME };

  try {
    // Post pending status for prlint to github
    await repos.createStatus({
      ...statusInfo,
      state: 'pending',
      description: 'Waiting for the status to be reported',
    });

    // get prlint.json. get the default one in case of 404
    const prlintDotJson = await context.config('prlint.json', defaultConfig);
    // console.log("*******************")
    // console.log(prlintDotJson)
    // console.log("*******************")
    // run lint on PR
    const { failureMessages, failureURLs } = lint({
      pull_request: context.payload.pull_request,
      prlintDotJson,
      defaultFailureURL,
    });
    console.log(failureURLs)
    // Post final status to github
    // await context.github.repos.createStatus({
    //   "repo": "test_probot_ug",
    //   "owner": "upengareri",
    //   "sha": sha,
    //   "context": context,
    //   "state": "success",
    //   "target_url": "https://example.com/build/status",
    //   "description": "The build succeeded!",
    //   "context": "PRLint"
    // });
    await repos.createStatus({
      ...statusInfo,
      ...createFinalReport({ failureMessages, failureURLs, defaultFailureURL }),
    });
    
    // // Post a comment 
    // const params = context.issue({ body: 'Hello World!' })
    // context.github.issues.createComment(params)
    
  } catch (e) {
    log({
      context,
      message: e.toString(),
      level: 'error',
    });
  }
};