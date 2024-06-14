export const ECS_JOBS_CONFIG_FARGATE: any = {
    serviceName: 'backend-service',
    imageName: 'jobs',
    role: {
        actions: [
            'ecr:*',
            's3:*',
            'sts:AssumeRole',
            'bedrock:InvokeModel',
            'textract:StartDocumentTextDetection',
            'textract:GetDocumentTextDetection',
        ],
    },
    cpu: 1024,
    memoryLimitMiB: 2048,
    environmentVariables: {
        name: 'FUNCTION_TO_EXECUTE',
    },
    port: 3000,
};
