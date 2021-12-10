import { Repository, RepositoryArgs, Team, TeamRepository } from '@pulumi/github';
import { all, Input } from '@pulumi/pulumi';
import { OpenIdConnectProvider, Role } from '@pulumi/aws/iam';
import { generateEcrPushPullPolicy, generateGithubOIDCAssumeRolePolicy } from './aws';

export type teamAccessMapping = {
    team: Team;
    permission: 'read' | 'triage' | 'write' | 'maintain' | 'admin';
};

type createGithubRepoParams = {
    resourceName: string;
    repoName: string;
    repoPropertyOverrides?: Partial<RepositoryArgs>;
    teamAccess?: teamAccessMapping[];
};

export function createGithubRepo(params: createGithubRepoParams): Repository {
    const { resourceName, repoName, repoPropertyOverrides, teamAccess } = params;

    const defaultArgs: RepositoryArgs = {
        visibility: 'private',
        vulnerabilityAlerts: true,
        allowAutoMerge: false,
        allowMergeCommit: false,
        allowRebaseMerge: true,
        allowSquashMerge: true,
        archived: false,
        deleteBranchOnMerge: true,
        hasDownloads: true,
        hasIssues: true,
        hasProjects: true,
        hasWiki: true,
    };

    const repository = new Repository(resourceName, {
        ...defaultArgs,
        ...{
            name: repoName,
        },
        ...repoPropertyOverrides,
    });

    if (teamAccess) {
        for (const teamToGrant of teamAccess) {
            all([teamToGrant.team.id, teamToGrant.team.name, repository.name]).apply(
                ([teamId, teamName, repositoryName]) => {
                    teamName = teamName.toLowerCase().replace(' ', '-');
                    new TeamRepository(
                        `${teamName}-${repositoryName}-access`,
                        {
                            teamId: teamId,
                            repository: repositoryName,
                            permission: teamToGrant.permission,
                        },
                        {
                            protect: true,
                        },
                    );
                },
            );
        }
    }

    return repository;
}

type createRepoEcrRoleParams = {
    githubOwner: string;
    repoName: Input<string>;
    accountId: string;
    oidcProvider: OpenIdConnectProvider;
    awsRegion: string;
};

export function createRepoEcrRole(params: createRepoEcrRoleParams) {
    all([params.oidcProvider.arn, params.repoName]).apply(([oidcProviderArn, repositoryName]) => {
        const assumeRolePolicy = generateGithubOIDCAssumeRolePolicy({
            githubOwner: params.githubOwner,
            oidcProviderArn: oidcProviderArn,
            repositoryName: repositoryName,
        });

        const ecrPushPullPolicy = generateEcrPushPullPolicy({
            region: params.awsRegion,
            accountId: params.accountId,
            repositoryName: repositoryName,
        });

        return new Role(`${params.repoName}-ecr-role`, {
            name: `github-actions-${params.repoName}-ecr-role`,
            assumeRolePolicy: assumeRolePolicy.then((policy) => {
                return policy.json;
            }),
            inlinePolicies: [
                {
                    name: 'ecr-push-pull',
                    policy: ecrPushPullPolicy.then((policy) => {
                        return policy.json;
                    }),
                },
            ],
        });
    });
}
