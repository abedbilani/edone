import { InstanceClass, InstanceSize } from 'aws-cdk-lib/aws-ec2';

export const RDS_CONFIG: any = [
    {
        clusterName: 'TO_CHANGE-database',
        securityGroupId: 'rds-ingress-security-group',
        instances: 1,
        instanceClass: InstanceClass.T3,
        instanceSize: InstanceSize.MEDIUM,
        enablePerformanceInsights: false,
    },
];
