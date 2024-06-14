const SECURITY_GROUPS = [
        {
            securityGroupId: 'ecs-security-groups',
            allowAllOutbound: true,
            securityGroupName: 'ecs-security-groups',
            description: 'ecs security group egress to all outbound',
        },

    ]
;
const SECURITY_GROUPS_INGRESS = [
        {
            securityGroupId: 'rds-ingress-security-group',
            allowAllOutbound: true,
            securityGroupName: 'rds-ingress-security-group',
            description: 'rule to accept traffic from ecs-security-group',
            ingress: {
                securityGroupId: 'ecs-security-group',
                port: 5432,
                description: 'rule to accept traffic from ecs-security-group',
            },
        },
    ]
;

export {
    SECURITY_GROUPS,
    SECURITY_GROUPS_INGRESS,
};
