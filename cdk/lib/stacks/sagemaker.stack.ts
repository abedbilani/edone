import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import { ArnPrincipal, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { BlockPublicAccess, Bucket, HttpMethods } from 'aws-cdk-lib/aws-s3';
import { CfnEndpoint, CfnEndpointConfig, CfnModel } from 'aws-cdk-lib/aws-sagemaker';
import { Construct } from 'constructs';
import { sageMakerBucketRolePolicies } from '../constants/roles';
import { CorsRule } from 'aws-cdk-lib/aws-s3/lib/bucket';

export default class SageMakerStack extends Stack {
    constructor(scope: Construct, stackId: string) {
        super(scope, stackId);

        const cors: CorsRule[] = [{
            allowedOrigins: ['*'],
            allowedMethods: [
                HttpMethods.GET,
                HttpMethods.HEAD,
                HttpMethods.DELETE,
                HttpMethods.POST,
                HttpMethods.PUT,
            ],
            allowedHeaders: ['*'],
        }];

        const bucket: Bucket = new Bucket(this, 'DESTINATION_BUCKET', {
            bucketName: `destination-${this.account}-${this.region}`,
            cors,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
            removalPolicy: RemovalPolicy.RETAIN,
        });

        const modelBucket = Bucket.fromBucketArn(this, `FetchBucket`, `arn:aws:s3:::whisper-x-dev`);

        const roleParams = {
            bucketName: bucket.bucketName,
        };

        const sgRole = new Role(this, 'sgRole', {
            assumedBy: new ServicePrincipal('sagemaker.amazonaws.com'),
            description: 'Model deployment role',
            inlinePolicies: sageMakerBucketRolePolicies(roleParams),
            roleName: 'sage-maker-role',
        });

        const bucketPolicy = new PolicyStatement({
            actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:ListBucket',
            ],
            principals: [new ArnPrincipal(sgRole.roleArn)],
            resources: [modelBucket.bucketArn, `${modelBucket.bucketArn}/*`],
        });
        modelBucket.addToResourcePolicy(bucketPolicy);

        const containerDefinitionProperty: CfnModel.ContainerDefinitionProperty = {
            image: `763104351884.dkr.ecr.us-east-1.amazonaws.com/huggingface-pytorch-inference:2.0.0-transformers4.28.1-gpu-py310-cu118-ubuntu20.04`,
            mode: 'SingleModel',
            modelDataUrl: `s3://whisper-x-dev/modelv1.tar.gz`,
        };

        const sagemakerModel = new CfnModel(this, 'MyCfnModel', {
            executionRoleArn: sgRole.roleArn,
            modelName: 'whisper-models',
            primaryContainer: containerDefinitionProperty,
        });
        sagemakerModel.node.addDependency(sgRole);

        const asyncInferenceConfigProperty: CfnEndpointConfig.AsyncInferenceConfigProperty = {
            outputConfig: {
                s3OutputPath: `s3://${bucket.bucketName}/output`,
                s3FailurePath: `s3://${bucket.bucketName}/failure`,
            },
            clientConfig: {
                maxConcurrentInvocationsPerInstance: 5,
            },
        };

        const endpointConfig: CfnEndpointConfig = new CfnEndpointConfig(this, 'SageMakerEndpointConfig', {
            endpointConfigName: 'whisper-config-endpoint',
            productionVariants: [{
                initialVariantWeight: 1.0,
                modelName: sagemakerModel.attrModelName,
                variantName: 'default',
                initialInstanceCount: 1,
                instanceType: 'ml.g4dn.xlarge',
            }],
            asyncInferenceConfig: asyncInferenceConfigProperty,
        });
        endpointConfig.node.addDependency(sagemakerModel);

        // TODO DO REMOVE WHEN NEED TO TURN OFF
        const cfnEndpoint: CfnEndpoint = new CfnEndpoint(this, 'SageMakerEndpoint', {
            endpointName: 'whisper-endpoint',
            endpointConfigName: endpointConfig.attrEndpointConfigName,
        });
        cfnEndpoint.node.addDependency(endpointConfig);
    }
}
