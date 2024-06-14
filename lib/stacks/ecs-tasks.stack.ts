import { CfnOutput, Duration, Fn, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
    Cluster,
    ContainerImage,
    FargateService,
    FargateTaskDefinition,
    LogDriver,
    Protocol,
} from 'aws-cdk-lib/aws-ecs';
import { Port, SecurityGroup, Subnet, Vpc } from 'aws-cdk-lib/aws-ec2';
import { PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import { ECS_CONFIG_FARGATE } from '../constants/ecs';
import { DnsRecordType, PrivateDnsNamespace } from 'aws-cdk-lib/aws-servicediscovery';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';

export class EcsStack extends Stack {
    constructor(scope: Construct, stackId: string) {
        super(scope, stackId);

        const vpc = Vpc.fromLookup(this, `ecs-vpc`, {
            vpcName: `${this.account}`,
        });

        const privateSubnetAZ1Id = Fn.importValue('privateSubnet1');
        const privateSubnetAZ2Id = Fn.importValue('privateSubnet2');

        const privateSubnetAZ1 = Subnet.fromSubnetAttributes(this, privateSubnetAZ1Id, {
            subnetId: privateSubnetAZ1Id,
        });
        const privateSubnetAZ2 = Subnet.fromSubnetAttributes(this, privateSubnetAZ2Id, {
            subnetId: privateSubnetAZ2Id,
        });

        const cluster = new Cluster(this, `cluster`, {
            clusterName: `${this.account}-cluster`,
            vpc,
            containerInsights: true,
        });

        ECS_CONFIG_FARGATE.map((microService: any) => {
            const { serviceName, cpu, memoryLimitMiB, nameSpaceId, nameSpace, nameSpaceDescription, port } =
                microService;
            new Repository(this, `${serviceName}-repo`, {
                repositoryName: serviceName,
            });

            const role = new Role(this, `${serviceName}-execution-role`, {
                roleName: `${serviceName}-execution-role`,
                assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
                inlinePolicies: {
                    taskDefinition: new PolicyDocument({
                        statements: [
                            new PolicyStatement({
                                actions: [
                                    'ecr:*',
                                    'ses:*',
                                    's3:*',
                                    'sts:AssumeRole',
                                    'secretsmanager:GetSecretValue',
                                    'states:StartExecution',
                                    'ec2:DescribeSubnets',
                                    'ec2:DescribeSecurityGroups',
                                    'ecs:RunTask',
                                    'iam:PassRole',
                                    'bedrock:InvokeModel',
                                ],
                                resources: ['*'],
                            }),
                        ],
                    }),
                },
            });

            const taskDefinition = new FargateTaskDefinition(this, `${serviceName}-task`, {
                family: `${serviceName}-task`,
                cpu,
                memoryLimitMiB,
                taskRole: role,
                executionRole: role,
            });

            const dbSecret = Secret.fromSecretNameV2(this, 'db-secret', 'rds-credentials');

            const username = dbSecret.secretValueFromJson('username').unsafeUnwrap();
            const password = dbSecret.secretValueFromJson('password').unsafeUnwrap();
            const host = dbSecret.secretValueFromJson('host').unsafeUnwrap();
            const dbPort = dbSecret.secretValueFromJson('port').unsafeUnwrap();

            const container = taskDefinition.addContainer(`${serviceName}-container`, {
                image: ContainerImage.fromRegistry(
                    `${this.account}.dkr.ecr.${this.region}.amazonaws.com/${serviceName}`,
                ),
                cpu,
                environment: {
                    ENVIRONMENT: 'dev',
                    NODE_ENV: 'dev',
                    RDS_SECRET_NAME: 'rds-credentials',
                    INPUT_BUCKET: `destination-${this.account}-${this.region}`,
                    REGION: this.region,
                    ACCOUNT_ID: this.account,
                    DATABASE_URL: `postgresql://${username}:${password}@${host}:${dbPort}/edone?schema=edone`,
                },
                memoryReservationMiB: memoryLimitMiB,
                containerName: `${serviceName}`,
                portMappings: [
                    {
                        hostPort: port,
                        protocol: Protocol.TCP,
                        containerPort: port,
                    },
                ],
                logging: LogDriver.awsLogs({ streamPrefix: `${serviceName}-container` }),
            });

            const securityGroup = new SecurityGroup(this, `${serviceName}ServiceSecurityGroup`, {
                allowAllOutbound: true,
                securityGroupName: `${serviceName}ServiceSecurityGroup`,
                vpc: vpc,
            });

            securityGroup.addIngressRule(securityGroup, Port.tcp(945));
            securityGroup.addIngressRule(securityGroup, Port.tcp(443));
            securityGroup.addIngressRule(securityGroup, Port.tcp(1194));
            securityGroup.addIngressRule(securityGroup, Port.tcp(22));
            securityGroup.addIngressRule(securityGroup, Port.tcp(943));
            securityGroup.addEgressRule(securityGroup, Port.allTraffic());

            new CfnOutput(this, `Export${serviceName}ServiceSecurityGroup`, {
                value: securityGroup.securityGroupId,
                exportName: `${serviceName}ServiceSecurityGroup`,
            });

            const dnsNamespace = new PrivateDnsNamespace(this, nameSpaceId, {
                name: nameSpace,
                vpc: vpc,
                description: nameSpaceDescription,
            });

            // TODO CHANGE THE NUMBER OF DESIRED TASKS TO START
            const service = new FargateService(this, `${serviceName}-service`, {
                cluster,
                taskDefinition,
                maxHealthyPercent: 200,
                minHealthyPercent: 100,
                desiredCount: 0,
                serviceName: `${serviceName}-service`,
                vpcSubnets: { subnets: [privateSubnetAZ1, privateSubnetAZ2] },
                securityGroups: [securityGroup],
                cloudMapOptions: {
                    dnsTtl: Duration.seconds(60),
                    name: serviceName,
                    cloudMapNamespace: dnsNamespace,
                    container,
                    containerPort: port,
                    dnsRecordType: DnsRecordType.SRV,
                },
            });

            const cloudMapServiceId: any = service.cloudMapService?.serviceId;
            new CfnOutput(this, `${serviceName}CloudMapServiceId`, {
                exportName: `${serviceName}CloudMapServiceId`,
                value: cloudMapServiceId,
            });
        });
    }
}
