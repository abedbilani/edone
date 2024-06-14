import { CfnOutput, Duration, Fn, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
    AuroraPostgresEngineVersion,
    ClusterInstance,
    Credentials,
    DatabaseCluster,
    DatabaseClusterEngine,
} from 'aws-cdk-lib/aws-rds';
import { InstanceClass, InstanceSize, InstanceType, Peer, Port, SecurityGroup, Subnet, Vpc } from 'aws-cdk-lib/aws-ec2';
import { SECURITY_GROUPS_INGRESS } from '../constants/sg';

export class RdsStack extends Stack {
    constructor(scope: Construct, stackId: string) {
        super(scope, stackId);

        const vpcId = Fn.importValue('vpcId');
        const vpc = Vpc.fromVpcAttributes(this, `vpcId-rds`, {
            availabilityZones: [
                'us-east-1a',
                'us-east-1b',
            ],
            vpcId,
        });

        const sgs: any = [];

        SECURITY_GROUPS_INGRESS.map((object: any) => {
            const {
                securityGroupName,
                securityGroupId,
                ingress,
            } = object;

            const {
                port,
                description,
            } = ingress;

            const securityGroup = new SecurityGroup(this, securityGroupId, {
                vpc,
                description,
                securityGroupName,
            });

            const ecsSecurityGroup = Fn.importValue(`ecs-security-groupsSecurityGroup`);


            securityGroup.addIngressRule(
                Peer.securityGroupId(ecsSecurityGroup),
                Port.tcp(port),
                description,
            );

            sgs.push(securityGroup);
        });
        const privateSubnetAZ1Id = Fn.importValue('privateSubnet1');
        const privateSubnetAZ2Id = Fn.importValue('privateSubnet2');


        const privateSubnetAZ1 = Subnet.fromSubnetAttributes(this, privateSubnetAZ1Id, {
            subnetId: privateSubnetAZ1Id,
        });

        const privateSubnetAZ2 = Subnet.fromSubnetAttributes(this, privateSubnetAZ2Id, {
            subnetId: privateSubnetAZ2Id,
        });


       const db:DatabaseCluster = new DatabaseCluster(this, `database`, {
            engine: DatabaseClusterEngine.auroraPostgres({
                version: AuroraPostgresEngineVersion.VER_16_1,
            }),
            credentials: Credentials.fromGeneratedSecret('clusteradmin', {
                secretName: 'rds-credentials',
            }),
            writer: ClusterInstance.provisioned(`writer`, {
                publiclyAccessible: false,
                instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MEDIUM),
            }),
            backup: {
                retention: Duration.days(7),
                preferredWindow: '01:00-02:00',
            },
            vpc,
            vpcSubnets: {
                subnets: [privateSubnetAZ1, privateSubnetAZ2],
            },
            clusterIdentifier: `cluster`,
            instanceIdentifierBase: `instance`,
            securityGroups: sgs,
        });

        new CfnOutput(this, 'DatabaseCluster', {
            exportName: 'clusterEndpoint',
            value: db.clusterEndpoint.hostname,
        });
    }
}
