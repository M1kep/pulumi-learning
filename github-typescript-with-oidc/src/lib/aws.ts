import { getPolicyDocument, GetPolicyDocumentResult } from '@pulumi/aws/iam';

export function generateEcrPushPullPolicy(params: {
    region: string;
    accountId: string;
    repositoryName: string;
}): Promise<GetPolicyDocumentResult> {
    return getPolicyDocument({
        statements: [
            {
                actions: [
                    'ecr:BatchGetImage',
                    'ecr:BatchCheckLayerAvailability',
                    'ecr:CompleteLayerUpload',
                    'ecr:GetDownloadUrlForLayer',
                    'ecr:InitiateLayerUpload',
                    'ecr:PutImage',
                    'ecr:UploadLayerPart',
                ],
                resources: [
                    `arn:aws:ecr:${params.region}:${params.accountId}:repository/${params.repositoryName}`,
                ],
            },
            {
                actions: ['ecr:GetAuthorizationToken'],
                resources: ['*'],
            },
        ],
    });
}

export function generateGithubOIDCAssumeRolePolicy(params: {
    githubOwner: string;
    repositoryName: string;
    oidcProviderArn: string;
}): Promise<GetPolicyDocumentResult> {
    return getPolicyDocument({
        statements: [
            {
                actions: ['sts:AssumeRoleWithWebIdentity'],
                conditions: [
                    {
                        test: 'StringLike',
                        values: [`repo:${params.githubOwner}/${params.repositoryName}`],
                        variable: 'token.actions.githubusercontent.com:sub',
                    },
                ],
                principals: [
                    {
                        identifiers: [params.oidcProviderArn],
                        type: 'Federated',
                    },
                ],
            },
        ],
    });
}
