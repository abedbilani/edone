import {
    GetObjectCommand,
    HeadBucketCommandOutput,
    HeadObjectCommand,
    PutObjectCommand,
    PutObjectCommandOutput,
    S3Client,
} from '@aws-sdk/client-s3';
import { ERROR_TYPES } from '../../../helpers/api-response.enum';

export const getObjectFromBucket = async (bucket: string, key: string): Promise<string> => {
    try {
        const s3Client = new S3Client();
        const { Body } = await s3Client.send(
            new GetObjectCommand({
                Bucket: bucket,
                Key: key,
            }),
        );
        return await Body.transformToString();
    } catch (e) {
        console.error('An error has occurred while getting all collections', e);
        throw new Error(ERROR_TYPES.GENERIC_ERROR);
    }
};

export const headObjectFromBucket = async (bucket: string, key: string): Promise<boolean> => {
    try {
        const s3Client: S3Client = new S3Client();
        const object: HeadBucketCommandOutput = await s3Client.send(
            new HeadObjectCommand({
                Bucket: bucket,
                Key: key,
            }),
        );
        console.log('lib->assets->shared->services->aws->s->3->service->ts, line: 36 => ', object);
        return true;
    } catch (e: any) {
        if (e?.$metadata.httpStatusCode === 404) {
            return false;
        }
        throw new Error(ERROR_TYPES.GENERIC_ERROR);
    }
};

export const putObjectInBucket = async (bucket: string, key: string, body: string): Promise<PutObjectCommandOutput> => {
    try {
        const s3Client = new S3Client();
        return await s3Client.send(
            new PutObjectCommand({
                Bucket: bucket,
                Key: key,
                Body: body,
            }),
        );
    } catch (e) {
        console.error('An error has occurred while getting all collections', e);
        throw new Error(ERROR_TYPES.GENERIC_ERROR);
    }
};
