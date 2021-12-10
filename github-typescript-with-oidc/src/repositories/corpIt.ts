import { createGithubRepo } from '../lib/repositories';
import { corpItTeam, devopsAdmin, devopsTeam } from '../teams';

export const githubInfra = createGithubRepo({
    repoName: 'github-infra',
    resourceName: 'github-infra',
    teamAccess: [
        {
            team: devopsTeam,
            permission: 'write',
        },
        {
            team: corpItTeam,
            permission: 'admin',
        },
        {
            team: devopsAdmin,
            permission: 'admin',
        },
    ],
});
