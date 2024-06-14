import { Construct } from 'constructs';
import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import { CorsRule } from 'aws-cdk-lib/aws-s3/lib/bucket';
import { BlockPublicAccess, Bucket, HttpMethods } from 'aws-cdk-lib/aws-s3';
import { AllowedMethods, Distribution, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Effect, PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

export default class S3Stack extends Stack {
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


        const bucket: Bucket = new Bucket(this, `${this.account}_SiteBucket`, {
            bucketName: `${this.account}-site`,
            cors,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
            removalPolicy: RemovalPolicy.RETAIN,
        });

        const siteCloudfront = new Distribution(
            this,
            `${this.account}SiteCloudfront`,
            {
                defaultBehavior: {
                    origin: new S3Origin(bucket),
                    viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    allowedMethods: AllowedMethods.ALLOW_ALL,
                },
                defaultRootObject: '/index.html',
                errorResponses: [
                    {
                        httpStatus: 403,
                        responseHttpStatus: 200,
                        responsePagePath: '/index.html',
                    },
                    {
                        httpStatus: 404,
                        responseHttpStatus: 200,
                        responsePagePath: '/index.html',
                    },
                ],
            },
        );
        bucket.addToResourcePolicy(
            new PolicyStatement({
                effect: Effect.ALLOW,
                resources: [bucket.arnForObjects('*')],
                actions: ['s3:GetObject'],
                principals: [new ServicePrincipal('cloudfront.amazonaws.com')],
                conditions: {
                    StringEquals: {
                        'AWS:SourceArn': `arn:aws:cloudfront::${process.env.ACCOUNT}:distribution/${siteCloudfront.distributionId}`,
                    },
                },
            }),
        );
    }
}

