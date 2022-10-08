import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: process.env.GH_TOKEN,
});

var repos = [];

octokit.rest.repos
  .listForUser({
    username: "tinarskii",
    sort: "full_name",
    per_page: 100,
  })
  .then(({ data }) => {
    data.forEach(async (repo, idx) => {
      repos.push({
        repo: repo.name,
        star: repo.stargazers_count,
        forks: repo.forks,
        issues: repo.open_issues,
        isFork: repo.fork,
        pulls: await (
          await octokit.rest.pulls.list({ owner: "tinarskii", repo: repo.name })
        ).data.length,
      });
      if (repos.length === data.length) {
        const readmeContent = await octokit.rest.repos.getReadme({
          owner: "tinarskii",
          repo: "tinarskii",
        });
        const content = Buffer.from(
          readmeContent.data.content,
          "base64"
        ).toString();
        const data = content.split("\n");

        const start_line = data.indexOf("<!-- [PROFILE UPDATER]: START -->");
        const end_line = data.indexOf("<!-- [PROFILE UPDATER]: END -->");

        if (start_line === -1 && end_line === -1) {
          console.log("Error: Could not find start/end line syntax");
        }

        data.splice(
          start_line + 1,
          end_line - start_line - 1,
          `## My Projects\n` +
            `${repos
              .filter((repo) => !repo.isFork)
              .map(
                (repo) =>
                  `- [${repo.repo}](https://github.com/tinarskii/${repo.repo})` +
                  (!repo.star && !repo.fork && !repo.pulls && !repo.issues
                    ? ""
                    : " (" +
                      (repo.star > 0
                        ? ` [${repo.star} stars](https://github.com/tinarskii/${repo.repo}/stargazers)`
                        : "") +
                      (" " + repo.pulls > 0
                        ? ` [${repo.pulls} pulls](https://github.com/tinarskii/${repo.repo}/pulls)`
                        : "") +
                      (" " + repo.fork > 0
                        ? ` [${repo.fork} forks](https://github.com/tinarskii/${repo.repo}/network/members)`
                        : "") +
                      (" " + repo.issues > 0
                        ? ` [${repo.issues} issues](https://github.com/tinarskii/${repo.repo}/issues)`
                        : "") +
                      " )")
              )
              .sort()
              .toString()
              .split(",")
              .join("\n")}` +
            `\n\n` +
            `## My contribution\n` +
            `${repos
              .filter((repo) => repo.isFork)
              .map(
                (repo) =>
                  `- [${repo.repo}](https://github.com/tinarskii/${repo.repo})`
              )
              .sort()
              .toString()
              .split(",")
              .join("\n")}`
        );
        const modify = data.join("\n");
        octokit.rest.repos.createOrUpdateFileContents({
          owner: "tinarskii",
          repo: "tinarskii",
          path: "README.md",
          branch: "main",
          message: "Update README.md",
          sha: readmeContent.data.sha,
          content: Buffer.from(modify).toString("base64"),
          committer: {
            name: "Tin's bot",
            email: "Toddsbin@users.noreply.github.com",
          },
        });
      }
    });
  });
