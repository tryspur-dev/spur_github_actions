const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    const token = core.getInput('github-token');
    const octokit = github.getOctokit(token);
    const context = github.context;

    // Fetch status checks
    const { data: statusChecks } = await octokit.rest.repos.getCombinedStatusForRef({
      ...context.repo,
      ref: context.sha,
    });

    // Generate report
    const totalCount = statusChecks.statuses.length;
    const successCount = statusChecks.statuses.filter(check => check.state === 'success').length;

    let report = `Spur \n\nTest Report: ${successCount}/${totalCount} successful.\n\n`;
    report += '| description | status |\n';
    report += '|-------------|--------|\n';

    for (const check of statusChecks.statuses) {
      const statusIcon = check.state === 'success' ? 'Passed ✅' : 'Failed ❌';
      report += `| ${check.context} | ${statusIcon} |\n`;
    }

    report += `\ncommit sha: ${context.sha}`;

    // Post comment
    await octokit.rest.issues.createComment({
      ...context.repo,
      issue_number: context.issue.number,
      body: report,
    });

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
