
const nameSpaceConfig = {
    nameSpace: 'edone.namespace',
    nameSpaceId: 'edoneDnsNamespace',
    nameSpaceDescription: 'Private DnsNamespace for Microservices',
};

export const ECS_CONFIG_FARGATE: any = [
    {
        ...nameSpaceConfig,
        serviceName: 'edone-public-backend',
        cpu: 1024,
        memoryLimitMiB: 2048,
        isService: true,
        port: 3000,
    },
];
