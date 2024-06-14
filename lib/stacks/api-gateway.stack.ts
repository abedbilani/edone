import { Duration, Fn, Stack } from 'aws-cdk-lib';

import { Construct } from 'constructs';
import { CfnIntegration, CfnRoute, CfnVpcLink, CorsHttpMethod, HttpApi } from 'aws-cdk-lib/aws-apigatewayv2';
import { IntegrationType } from 'aws-cdk-lib/aws-apigateway';
import { SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import {
    CacheHeaderBehavior,
    CachePolicy,
    CacheQueryStringBehavior,
    CloudFrontAllowedMethods,
    CloudFrontWebDistribution,
    HttpVersion,
    OriginProtocolPolicy,
    OriginSslPolicy,
    PriceClass,
    ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import { ROUTES } from '../constants/routes';

export default class ApiGatewayStack extends Stack {
    constructor(scope: Construct, stackId: string) {
        super(scope, stackId);

        const privateSubnetAZ1Id = Fn.importValue('privateSubnet1');
        const privateSubnetAZ2Id = Fn.importValue('privateSubnet2');
        const vpc = Vpc.fromLookup(this, 'TO_CHANGE-vpc', {
            vpcName: `${this.account}`,
        });

        const securityGroup = new SecurityGroup(this, 'VpcLinkSecurityGroup', {
            allowAllOutbound: true,
            securityGroupName: 'VpcLinkSecurityGroup',
            vpc,
        });
        const vpcLink = new CfnVpcLink(this, `VPCLink`, {
            name: `VPCLink`,
            subnetIds: [privateSubnetAZ1Id, privateSubnetAZ2Id],
            securityGroupIds: [securityGroup.securityGroupId],
        });

        const { apiName, routes, serviceName, prefix } = ROUTES;

        const api = new HttpApi(this, `${apiName}-api`, {
            apiName: `${apiName}-api`,
            corsPreflight: {
                allowHeaders: ['*'],
                allowMethods: [
                    CorsHttpMethod.GET,
                    CorsHttpMethod.HEAD,
                    CorsHttpMethod.OPTIONS,
                    CorsHttpMethod.POST,
                    CorsHttpMethod.PUT,
                    CorsHttpMethod.DELETE,
                ],
                allowOrigins: ['*'],
                exposeHeaders: [],
                maxAge: Duration.seconds(30),
            },
        });

        api.addStage(`${apiName}-stage`, {
            stageName: 'v1',
            autoDeploy: true,
        });

        const serviceId = Fn.importValue(`${serviceName}CloudMapServiceId`);

        const integration = new CfnIntegration(this, `${serviceName}Integration`, {
            apiId: api.apiId,
            integrationType: IntegrationType.HTTP_PROXY,
            connectionId: vpcLink.attrVpcLinkId,
            connectionType: 'VPC_LINK',
            description: 'API Integration',
            integrationMethod: 'ANY',
            integrationUri: `arn:aws:servicediscovery:${this.region}:${this.account}:service/${serviceId}`,
            payloadFormatVersion: '1.0',
            requestParameters: {
                'append:header.requestId': '$context.requestId',
            },
        });

        routes.map((route: any) => {
            const { method, path, routeId } = route;

            new CfnRoute(this, routeId, {
                apiId: api.apiId,
                routeKey: `${method} ${prefix}${path}`,
                target: `integrations/${integration.ref}`,
            });
        });


        const cachePolicy = new CachePolicy(this, 'DeltaCachePolicy', {
            minTtl: Duration.seconds(1),
            maxTtl: Duration.seconds(1),
            defaultTtl: Duration.seconds(1),
            enableAcceptEncodingGzip: true,
            enableAcceptEncodingBrotli: true,
            queryStringBehavior: CacheQueryStringBehavior.all(),
            headerBehavior: CacheHeaderBehavior.allowList(
                'Authorization',
                'Origin',
                'Access-Control-Request-Method',
                'Access-Control-Request-Headers',
                'Version',
            ),
        });

        const cloudfront = new CloudFrontWebDistribution(
            this,
            `${this.account}TeacherDistribution`,
            {
                originConfigs: [
                    {
                        customOriginSource: {
                            domainName: `${api.apiId}.execute-api.${process.env.REGION}.amazonaws.com`,
                            httpsPort: 443,
                            originProtocolPolicy: OriginProtocolPolicy.HTTPS_ONLY,
                            allowedOriginSSLVersions: [OriginSslPolicy.TLS_V1_2],
                            originHeaders: {},
                        },
                        behaviors: [
                            {
                                isDefaultBehavior: true,
                                allowedMethods: CloudFrontAllowedMethods.ALL,
                                viewerProtocolPolicy: ViewerProtocolPolicy.HTTPS_ONLY,
                            },
                        ],
                    },
                ],
                httpVersion: HttpVersion.HTTP2,
                viewerProtocolPolicy: ViewerProtocolPolicy.ALLOW_ALL,
                priceClass: PriceClass.PRICE_CLASS_ALL,
                defaultRootObject: '',
            },
        );
    }
}
