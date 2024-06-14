import {
    InvokeEndpointAsyncCommand,
    InvokeEndpointAsyncOutput,
    SageMakerRuntimeClient,
} from '@aws-sdk/client-sagemaker-runtime';
import { putObjectInBucket } from './s3.service';

export const sagemakerInvokeAsyncEndpoint = async (bucket: string, key: string): Promise<InvokeEndpointAsyncOutput> => {
    const sageMakerRuntimeClient = new SageMakerRuntimeClient();
    const newKey = key.split('/').slice(0, -1).join('/') + '/asynch_input_file.json';
    const payload = {
        s3bucket: bucket,
        s3key: key,
    };
    await putObjectInBucket(bucket, newKey, JSON.stringify(payload));

    return await sageMakerRuntimeClient.send(
        new InvokeEndpointAsyncCommand({
            EndpointName: process.env.WHISPER_ENDPOINT,
            ContentType: 'application/json',
            InputLocation: `s3://${bucket}/${newKey}`,
        }),
    );
};
