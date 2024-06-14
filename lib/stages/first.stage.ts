import { StackProps, Stage } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VpcStack } from '../stacks/vpc.stack';
import S3Stack from '../stacks/s3.stack';
import SageMakerStack from '../stacks/sagemaker.stack';

export class FirstStage extends Stage {
    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);
        new VpcStack(this, 'VpcStack');
        new S3Stack(this, 'S3Stack');
        new SageMakerStack(this, 'SageMakerStack');
    }
}
