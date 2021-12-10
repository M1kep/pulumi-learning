import * as pulumi from '@pulumi/pulumi';
import { OpenIdConnectProvider } from '@pulumi/aws/iam';
import { createRepoEcrRole } from './lib/repositories';

const pulumiCfg = new pulumi.Config();
const githubOwner = pulumiCfg.require('owner');
const awsRegion = pulumiCfg.require('awsRegion');
const githubThumbprint = pulumiCfg.require('githubThumbprint');

const githubActionsOIDCProvider = new OpenIdConnectProvider(
    'github-actions',
    {
        clientIdLists: ['sts.amazonaws.com'],
        thumbprintLists: [githubThumbprint],
        url: 'https://token.actions.githubusercontent.com',
    },
    {
        protect: true,
    },
);

createRepoEcrRole({
    repoName: 'slackbot-framework',
    oidcProvider: githubActionsOIDCProvider,
    awsRegion: awsRegion,
    githubOwner: githubOwner,
    accountId: '123',
});
