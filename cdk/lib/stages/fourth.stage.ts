import { StackProps, Stage } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import ApiGatewayStack from '../stacks/api-gateway.stack';
import { StepFunctionStack } from '../stacks/step-function.stack';

export class FourthStage extends Stage {
    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);
        new ApiGatewayStack(this, 'ApiGatewayStack');
        new StepFunctionStack(this, 'StepFunctionStack');
    }
}
