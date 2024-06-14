import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

export const getSecretValue = async (secretId: string) => {
    const secretsManagerClient = new SecretsManagerClient();
    const secretValue: any = await secretsManagerClient.send(new GetSecretValueCommand({ SecretId: secretId }));
    return JSON.parse(secretValue.SecretString);
};
