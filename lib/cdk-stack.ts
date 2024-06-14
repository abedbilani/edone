import { Construct } from 'constructs';
import { CDK_PIPELINE_CONFIG } from './constants/cdk';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { SecretValue, Stack, StackProps } from 'aws-cdk-lib';
import { FirstStage } from './stages/first.stage';
import { SecondStage } from './stages/second.stage';
import { ThirdStage } from './stages/third.stage';
import { FourthStage } from './stages/fourth.stage';

export class CdkStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const {
            oauthTokenName,
            repositoryName,
            branchName,
        } = CDK_PIPELINE_CONFIG;

        const cdkPipeline = new CodePipeline(this, 'TO_CHANGEPipeline', {
            pipelineName: 'TO_CHANGE-cdk-pipeline',
            synth: new ShellStep('Synth', {
                input: CodePipelineSource.gitHub(repositoryName, branchName,{
                    authentication: SecretValue.secretsManager(oauthTokenName),
                }),
                commands: [
                    'npm ci',
                    'npm run build',
                    'npx cdk synth',
                    'ls -lh',
                    'pwd', // Print working directory
                ],

            }),
            dockerEnabledForSynth: true,
        });

        // deploy Vpc
        // deploy S3
        // deploy SageMaker
        cdkPipeline.addStage(new FirstStage(this, 'FirstStage', { env: props?.env }));

        // deploy RDS
        // cdkPipeline.addStage(new SecondStage(this, 'SecondStage', { env: props?.env }));
        //
        // // deploy ECS service
        // // deploy lambda functions
        // cdkPipeline.addStage(new ThirdStage(this, 'ThirdStage', { env: props?.env }));
        //
        // // deploy step function
        // // create api gateway
        // cdkPipeline.addStage(new FourthStage(this, 'FourthStage', { env: props?.env }));
    }
}
