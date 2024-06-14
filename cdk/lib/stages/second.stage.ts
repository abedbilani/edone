import { StackProps, Stage } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RdsStack } from '../stacks/rds.stack';
import { LambdaDeployStack } from '../stacks/lambda-deploy.stack';

export class SecondStage extends Stage {
    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);
        new RdsStack(this, 'RDSStack');
    }
}
