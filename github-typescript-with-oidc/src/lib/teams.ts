import { Team, TeamArgs } from '@pulumi/github';

export function createGithubTeam(
    resourceName: string,
    teamName: string,
    teamPropertyOverrides?: Partial<TeamArgs>,
): Team {
    const defaultArgs: TeamArgs = {
        privacy: 'closed',
        createDefaultMaintainer: false,
    };

    return new Team(
        resourceName,
        {
            ...defaultArgs,
            ...{
                name: teamName,
            },
            ...teamPropertyOverrides,
        },
        {
            protect: true,
        },
    );
}
