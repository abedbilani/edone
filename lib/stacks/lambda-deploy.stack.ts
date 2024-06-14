import { Duration, Fn, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Effect, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export class LambdaDeployStack extends Stack {
    constructor(scope: Construct, stackId: string) {
        super(scope, stackId);

        const vpc = Vpc.fromLookup(this, 'lambda-vpc', {
            vpcName: `edonevpc`,
        });

        const securityGroupId = Fn.importValue(`TO_CHANGEServiceSecurityGroup`);

        const lambdaRole = new Role(this, 'provisionRoleId', {
            roleName: 'provisionRole',
            assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
        });

        lambdaRole.addToPolicy(
            new PolicyStatement({
                effect: Effect.ALLOW,
                resources: ['*'],
                actions: [
                    's3:*',
                    'logs:*',
                    'iam:*',
                    'sagemaker:*',
                    'bedrock:InvokeModel',
                    'ec2:*',
                    'secretsmanager:GetSecretValue',
                ],
            }),
        );
        const securityGroups = [SecurityGroup.fromSecurityGroupId(this, `Import-${securityGroupId}`, securityGroupId)];

        const transcribe = new NodejsFunction(this, 'TranscribeLambda', {
            runtime: Runtime.NODEJS_20_X,
            functionName: 'transcribe',
            role: lambdaRole,
            environment: {
                REGION: this.region,
                ACCOUNT_ID: this.account,
                SECRET_NAME: 'TO_CHANGE',
                WHISPER_ENDPOINT: 'whisper-endpoint',
                SECRET_ID: 'TO_CHANGE',
            },
            handler: 'index.handler',
            entry: __dirname + '/../assets/lambda/transcribe/lambda.ts',
            vpc,
            vpcSubnets: {
                subnetType: SubnetType.PRIVATE_WITH_EGRESS,
            },
            securityGroups,
            timeout: Duration.minutes(15),
            bundling: {
                externalModules: ['@aws-sdk/client-sagemaker-runtime'],
                nodeModules: ['@aws-sdk/client-sagemaker-runtime'],
            },
        });
        const transcribeCheck = new NodejsFunction(this, 'TranscribeCheckLambda', {
            runtime: Runtime.NODEJS_20_X,
            functionName: 'transcribe-check',
            role: lambdaRole,
            environment: {
                REGION: this.region,
                ACCOUNT_ID: this.account,
                SECRET_NAME: 'TO_CHANGE',
                WHISPER_ENDPOINT: 'whisper-endpoint',
                SECRET_ID: 'TO_CHANGE',
            },
            handler: 'index.handler',
            entry: __dirname + '/../assets/lambda/transcribe-check/lambda.ts',
            vpc,
            vpcSubnets: {
                subnetType: SubnetType.PRIVATE_WITH_EGRESS,
            },
            securityGroups,
            timeout: Duration.minutes(15),
            bundling: {
                externalModules: [
                    '@aws-sdk/client-s3',
                    '@aws-sdk/client-secrets-manager',
                    'typeorm',
                    'typeorm-aurora-data-api-driver',
                    'typeorm-naming-strategies',
                ],
                nodeModules: [
                    '@aws-sdk/client-s3',
                    '@aws-sdk/client-secrets-manager',
                    'typeorm',
                    'typeorm-aurora-data-api-driver',
                    'typeorm-naming-strategies',
                ],
            },
        });
        const transcribeSuccess = new NodejsFunction(this, 'TranscribeSuccess', {
            runtime: Runtime.NODEJS_20_X,
            functionName: 'transcribe-success',
            role: lambdaRole,
            environment: {
                REGION: this.region,
                ACCOUNT_ID: this.account,
                SECRET_NAME: 'TO_CHANGE',
                WHISPER_ENDPOINT: 'whisper-endpoint',
                SECRET_ID: 'TO_CHANGE',
            },
            handler: 'index.handler',
            entry: __dirname + '/../assets/lambda/transcribe-success/lambda.ts',
            vpc,
            vpcSubnets: {
                subnetType: SubnetType.PRIVATE_WITH_EGRESS,
            },
            securityGroups,
            timeout: Duration.minutes(15),
            bundling: {
                externalModules: [
                    '@aws-sdk/client-s3',
                    '@aws-sdk/client-secrets-manager',
                    'typeorm',
                    'typeorm-aurora-data-api-driver',
                    'typeorm-naming-strategies',
                ],
                nodeModules: [
                    '@aws-sdk/client-s3',
                    '@aws-sdk/client-secrets-manager',
                    'typeorm',
                    'typeorm-aurora-data-api-driver',
                    'typeorm-naming-strategies',
                ],
            },
        });
        const transcribeFailed = new NodejsFunction(this, 'TranscribeFailed', {
            runtime: Runtime.NODEJS_20_X,
            functionName: 'transcribe-failed',
            role: lambdaRole,
            environment: {
                REGION: this.region,
                ACCOUNT_ID: this.account,
                SECRET_NAME: 'TO_CHANGE',
                WHISPER_ENDPOINT: 'whisper-endpoint',
                SECRET_ID: 'TO_CHANGE',
            },
            handler: 'index.handler',
            entry: __dirname + '/../assets/lambda/transcribe-failed/lambda.ts',
            vpc,
            vpcSubnets: {
                subnetType: SubnetType.PRIVATE_WITH_EGRESS,
            },
            securityGroups,
            timeout: Duration.minutes(15),
            bundling: {
                externalModules: [
                    '@aws-sdk/client-secrets-manager',
                    'typeorm',
                    'typeorm-aurora-data-api-driver',
                    'typeorm-naming-strategies',
                ],
                nodeModules: [
                    '@aws-sdk/client-secrets-manager',
                    'typeorm',
                    'typeorm-aurora-data-api-driver',
                    'typeorm-naming-strategies',
                ],
            },
        });
        const flashCard = new NodejsFunction(this, 'FlashCardLambda', {
            runtime: Runtime.NODEJS_20_X,
            functionName: 'flash-card',
            role: lambdaRole,
            environment: {
                REGION: this.region,
                ACCOUNT_ID: this.account,
                SECRET_NAME: 'TO_CHANGE',
                WHISPER_ENDPOINT: 'whisper-endpoint',
                SECRET_ID: 'TO_CHANGE',
            },
            handler: 'index.handler',
            entry: __dirname + '/../assets/lambda/flash-card/lambda.ts',
            vpc,
            vpcSubnets: {
                subnetType: SubnetType.PRIVATE_WITH_EGRESS,
            },
            securityGroups,
            timeout: Duration.minutes(15),
            bundling: {
                externalModules: [
                    '@aws-sdk/client-bedrock-runtime',
                    '@aws-sdk/client-s3',
                    '@aws-sdk/client-secrets-manager',
                    '@aws-sdk/client-sfn',
                    'typeorm',
                    'typeorm-aurora-data-api-driver',
                    'typeorm-naming-strategies',
                ],
                nodeModules: [
                    '@aws-sdk/client-bedrock-runtime',
                    '@aws-sdk/client-s3',
                    '@aws-sdk/client-secrets-manager',
                    '@aws-sdk/client-sfn',
                    'typeorm',
                    'typeorm-aurora-data-api-driver',
                    'typeorm-naming-strategies',
                ],
            },
        });
        const quiz = new NodejsFunction(this, 'QuizLambda', {
            runtime: Runtime.NODEJS_20_X,
            functionName: 'quiz',
            role: lambdaRole,
            environment: {
                REGION: this.region,
                ACCOUNT_ID: this.account,
                SECRET_NAME: 'TO_CHANGE',
                WHISPER_ENDPOINT: 'whisper-endpoint',
                SECRET_ID: 'TO_CHANGE',
            },
            handler: 'index.handler',
            entry: __dirname + '/../assets/lambda/quiz/lambda.ts',
            vpc,
            vpcSubnets: {
                subnetType: SubnetType.PRIVATE_WITH_EGRESS,
            },
            securityGroups,
            timeout: Duration.minutes(15),
            bundling: {
                externalModules: [
                    '@aws-sdk/client-bedrock-runtime',
                    '@aws-sdk/client-s3',
                    '@aws-sdk/client-secrets-manager',
                    '@aws-sdk/client-sfn',
                    'typeorm',
                    'typeorm-aurora-data-api-driver',
                    'typeorm-naming-strategies',
                ],
                nodeModules: [
                    '@aws-sdk/client-bedrock-runtime',
                    '@aws-sdk/client-s3',
                    '@aws-sdk/client-secrets-manager',
                    '@aws-sdk/client-sfn',
                    'typeorm',
                    'typeorm-aurora-data-api-driver',
                    'typeorm-naming-strategies',
                ],
            },
        });
        const summary = new NodejsFunction(this, 'SummaryLambda', {
            runtime: Runtime.NODEJS_20_X,
            functionName: 'summary',
            role: lambdaRole,
            environment: {
                REGION: this.region,
                ACCOUNT_ID: this.account,
                SECRET_NAME: 'TO_CHANGE',
                WHISPER_ENDPOINT: 'whisper-endpoint',
                SECRET_ID: 'TO_CHANGE',
            },

            handler: 'index.handler',
            entry: __dirname + '/../assets/lambda/summary/lambda.ts',
            vpc,
            vpcSubnets: {
                subnetType: SubnetType.PRIVATE_WITH_EGRESS,
            },
            securityGroups,
            timeout: Duration.minutes(15),
            bundling: {
                externalModules: [
                    '@aws-sdk/client-bedrock-runtime',
                    '@aws-sdk/client-s3',
                    '@aws-sdk/client-secrets-manager',
                    '@aws-sdk/client-sfn',
                    'typeorm',
                    'typeorm-aurora-data-api-driver',
                    'typeorm-naming-strategies',
                ],
                nodeModules: [
                    '@aws-sdk/client-bedrock-runtime',
                    '@aws-sdk/client-s3',
                    '@aws-sdk/client-secrets-manager',
                    '@aws-sdk/client-sfn',
                    'typeorm',
                    'typeorm-aurora-data-api-driver',
                    'typeorm-naming-strategies',
                ],
            },
        });
    }
}
