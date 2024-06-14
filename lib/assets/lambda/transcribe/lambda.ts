import { sagemakerInvokeAsyncEndpoint } from '../../shared/services/aws/sagemaker.service';

exports.handler = async (event: any): Promise<any> => {
    try {
        console.log('lib->assets->lambda->transcribe->lambda->ts, line: 5 => ', event);
        const { lectureId, federatedIdentity, inputBucket, outputBucket, key } = event;
        const invokeEndpoint = await sagemakerInvokeAsyncEndpoint(inputBucket, key);

        const sagemakerOutputLocation = invokeEndpoint.OutputLocation.includes('s3://')
            ? invokeEndpoint.OutputLocation.replace(`s3://${outputBucket}/`, '')
            : invokeEndpoint.OutputLocation;
        const sagemakerFailureLocation = invokeEndpoint.FailureLocation.includes('s3://')
            ? invokeEndpoint.FailureLocation.replace(`s3://${outputBucket}/`, '')
            : invokeEndpoint.FailureLocation;

        return {
            sagemakerOutputLocation,
            sagemakerFailureLocation,
            federatedIdentity,
            lectureId,
            outputBucket,
            inputBucket,
        };
    } catch (e) {
        console.log('lib->assets->lambda->transcribe->lambda->ts, line: 17 => ', e);
    }
};
