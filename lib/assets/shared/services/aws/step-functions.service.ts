import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';

export const startExecution = async (stateMachineArn: string, payload: string): Promise<any> => {
    try {
        const sfnClient: SFNClient = new SFNClient();
        return await sfnClient.send(
            new StartExecutionCommand({
                stateMachineArn,
                input: payload,
            }),
        );
    } catch (error: any) {
        throw new Error(`Error starting execution: ${error.message}`);
    }
};
