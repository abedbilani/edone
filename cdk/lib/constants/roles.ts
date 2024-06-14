import { PolicyDocument, PolicyStatement } from 'aws-cdk-lib/aws-iam';

export const sageMakerBucketRolePolicies = (params: any) => {
    return {
        S3Access: new PolicyDocument({
            statements: [
                new PolicyStatement({
                    actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject', 's3:ListBucket'],
                    resources: [
                        `arn:aws:s3:::${params.bucketName}`,
                        `arn:aws:s3:::${params.bucketName}/*`,
                        `arn:aws:s3:::${params.bucketName}`,
                        `arn:aws:s3:::${params.bucketName}/*`,
                    ],
                }),
            ],
        }),
        CloudWatchAccess: new PolicyDocument({
            statements: [
                new PolicyStatement({
                    actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
                    resources: ['arn:aws:logs:*:*:*'],
                }),
            ],
        }),
        ECRAccess: new PolicyDocument({
            statements: [
                new PolicyStatement({
                    actions: [
                        'ecr:GetDownloadUrlForLayer',
                        'ecr:BatchGetImage',
                        'ecr:BatchCheckLayerAvailability',
                        'ecr:GetAuthorizationToken',
                    ],
                    resources: [
                        '*',
                    ],
                }),
            ],
        }),
        SageMakerAccess: new PolicyDocument({
            statements: [
                new PolicyStatement({
                    actions: [
                        'sagemaker:CreateModel',
                        'sagemaker:CreateEndpoint',
                        'sagemaker:CreateEndpointConfig',
                    ],
                    resources: ['*'],
                }),
            ],
        }),
    };
};
