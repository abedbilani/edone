import { CfnOutput, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { IpAddresses, SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { SECURITY_GROUPS } from '../constants/sg';

export class VpcStack extends Stack {
    constructor(scope: Construct, stackId: string) {
        super(scope, stackId);

        const vpc = new Vpc(this, `vpc`, {
            vpcName: `edonevpc`,
            ipAddresses: IpAddresses.cidr('10.0.0.0/16'),
            natGateways: 1,
            maxAzs: 2,
            subnetConfiguration: [
                {
                    name: 'private-subnet-1',
                    subnetType: SubnetType.PRIVATE_WITH_EGRESS,
                    cidrMask: 24,
                },
                {
                    name: 'private-subnet-2',
                    subnetType: SubnetType.PRIVATE_WITH_EGRESS,
                    cidrMask: 24,
                },
                {
                    name: 'public-subnet-1',
                    subnetType: SubnetType.PUBLIC,
                    cidrMask: 24,
                },
                {
                    name: 'public-subnet-2',
                    subnetType: SubnetType.PUBLIC,
                    cidrMask: 24,
                },
            ],
        });

        new CfnOutput(this, 'VPCId', {
            exportName: 'vpcId',
            value: vpc.vpcId,
        });

        new CfnOutput(this, 'VPCPrivateSubnet1', {
            exportName: 'privateSubnet1',
            value: vpc.privateSubnets[0].subnetId,
        });
        new CfnOutput(this, 'VPCPrivateSubnet2', {
            exportName: 'privateSubnet2',
            value: vpc.privateSubnets[1].subnetId,
        });

        SECURITY_GROUPS.map((object: any) => {
            const {
                description,
                securityGroupName,
                securityGroupId,
            } = object;

            const securityGroup = new SecurityGroup(this, securityGroupId, {
                vpc,
                description,
                securityGroupName,
            });


            new CfnOutput(this, `${securityGroupName}SecurityGroup`, {
                value: securityGroup.securityGroupId,
                exportName: `${securityGroupName}SecurityGroup`,
            });
        });
    }
}
