import { StackProps, Stage } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EcsStack } from '../stacks/ecs-tasks.stack';
import { LambdaDeployStack } from '../stacks/lambda-deploy.stack';

export class ThirdStage extends Stage {
    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);
        new EcsStack(this, 'EcsStack');
        new LambdaDeployStack(this, 'LambdaDeployStackNode');
    }
}
