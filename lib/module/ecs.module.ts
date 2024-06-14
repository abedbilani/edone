import { Construct } from 'constructs';
import { ContainerDefinition, ContainerImage, FargateTaskDefinition, LogDriver, Protocol } from 'aws-cdk-lib/aws-ecs';
import { IVpc, Port, SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import { JobType } from './enums/job-type.enum';

export class EcsModule {
    createEcsTask(scope: Construct, vpc: IVpc, params: any): FargateTaskDefinition {
        const { taskConfiguration } = params;

        const { cpu, memoryLimitMiB, role, imageName } = taskConfiguration;

        new Repository(scope, `${imageName}-repo`, {
            repositoryName: imageName,
        });

        const executionRole: Role = new Role(scope, `${imageName}-task-execution-role`, {
            roleName: `${imageName}-task-execution-role`,
            assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
            inlinePolicies: {
                taskDefinition: new PolicyDocument({
                    statements: [
                        new PolicyStatement({
                            actions: role.actions,
                            resources: ['*'],
                        }),
                    ],
                }),
            },
        });

        const taskDefinition: FargateTaskDefinition = new FargateTaskDefinition(scope, `${imageName}-task-def`, {
            family: `${imageName}-task`,
            cpu,
            memoryLimitMiB,
            taskRole: executionRole,
            executionRole: executionRole,
        });

        const securityGroup = new SecurityGroup(scope, `${imageName}ServiceSecurityGroup`, {
            allowAllOutbound: true,
            securityGroupName: `${imageName}ServiceSecurityGroup`,
            vpc,
        });
        securityGroup.addIngressRule(securityGroup, Port.tcp(945));
        securityGroup.addIngressRule(securityGroup, Port.tcp(443));
        securityGroup.addIngressRule(securityGroup, Port.tcp(1194));
        securityGroup.addIngressRule(securityGroup, Port.tcp(22));
        securityGroup.addIngressRule(securityGroup, Port.tcp(943));

        return taskDefinition;
    }

    createContainerDefinition(
        scope: Construct,
        taskDefinition: FargateTaskDefinition,
        params: any,
    ): ContainerDefinition {
        const { region, account, environment, taskConfiguration } = params;

        const { cpu, memoryLimitMiB, imageName, port } = taskConfiguration;

        const dbSecret = Secret.fromSecretNameV2(scope, 'db-secret', 'rds-credentials');
        const username = dbSecret.secretValueFromJson('username').unsafeUnwrap();
        const password = dbSecret.secretValueFromJson('password').unsafeUnwrap();
        const host = dbSecret.secretValueFromJson('host').unsafeUnwrap();
        const dbPort = dbSecret.secretValueFromJson('port').unsafeUnwrap();

        return taskDefinition.addContainer(`${imageName}-container`, {
            image: ContainerImage.fromRegistry(`${account}.dkr.ecr.${region}.amazonaws.com/${imageName}`),
            cpu,
            environment: {
                ENVIRONMENT: environment,
                NODE_ENV: environment,
                RDS_SECRET_NAME: 'TO_CHANGE',
                INPUT_BUCKET: `TO_CHANGE`,
                REGION: region,
                ACCOUNT_ID: account,
                DATABASE_URL: `postgresql://${username}:${password}@${host}:${dbPort}/TO_CHANGE?schema=TO_CHANGE`,
                FUNCTION_TO_EXECUTE: JobType.EMBEDDING,
            },
            memoryReservationMiB: memoryLimitMiB,
            containerName: `${imageName}`,
            portMappings: [
                {
                    hostPort: port,
                    protocol: Protocol.TCP,
                    containerPort: port,
                },
            ],
            logging: LogDriver.awsLogs({ streamPrefix: `${imageName}-container` }),
        });
    }
}
