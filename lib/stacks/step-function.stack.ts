import { Duration, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
    Choice,
    Condition,
    DefinitionBody,
    JsonPath,
    Parallel,
    StateMachine,
    Wait,
    WaitTime,
} from 'aws-cdk-lib/aws-stepfunctions';
import { Function } from 'aws-cdk-lib/aws-lambda';
import { EcsFargateLaunchTarget, EcsRunTask, LambdaInvoke } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Cluster } from 'aws-cdk-lib/aws-ecs';
import { IVpc, Vpc } from 'aws-cdk-lib/aws-ec2';
import { EcsModule } from '../module/ecs.module';
import { ECS_JOBS_CONFIG_FARGATE } from '../constants/ecs-task';

export class StepFunctionStack extends Stack {
    constructor(scope: Construct, stackId: string) {
        super(scope, stackId);

        const transcribeLambda = Function.fromFunctionArn(
            this,
            'transcribe-step',
            `arn:aws:lambda:${this.region}:${this.account}:function:transcribe`,
        );
        const transcribeCheckLambda = Function.fromFunctionArn(
            this,
            'transcribe-check-step',
            `arn:aws:lambda:${this.region}:${this.account}:function:transcribe-check`,
        );

        const transcribeSuccessLambda = Function.fromFunctionArn(
            this,
            'transcribe-success-step',
            `arn:aws:lambda:${this.region}:${this.account}:function:transcribe-success`,
        );

        const transcribeFailedLambda = Function.fromFunctionArn(
            this,
            'transcribe-failed-step',
            `arn:aws:lambda:${this.region}:${this.account}:function:transcribe-failed`,
        );

        const flashCardLambda = Function.fromFunctionArn(
            this,
            'flash-card-step',
            `arn:aws:lambda:${this.region}:${this.account}:function:flash-card`,
        );

        const quizLambda = Function.fromFunctionArn(
            this,
            'quiz-step',
            `arn:aws:lambda:${this.region}:${this.account}:function:quiz`,
        );

        const summaryLambda = Function.fromFunctionArn(
            this,
            'summary-step',
            `arn:aws:lambda:${this.region}:${this.account}:function:summary`,
        );

        const transcribeTask = new LambdaInvoke(this, 'transcribeTask', {
            lambdaFunction: transcribeLambda,
            outputPath: '$.Payload',
        });

        const transcribeCheckTask = new LambdaInvoke(this, 'transcribeCheckTask', {
            lambdaFunction: transcribeCheckLambda,
            outputPath: '$.Payload',
        });

        const transcribeSuccessTask = new LambdaInvoke(this, 'transcribeSuccessTask', {
            lambdaFunction: transcribeSuccessLambda,
            outputPath: '$.Payload',
        });

        const transcribeFailedTask = new LambdaInvoke(this, 'transcribeFailedTask', {
            lambdaFunction: transcribeFailedLambda,
            outputPath: '$.Payload',
        });

        const flashCardTask = new LambdaInvoke(this, 'flashCardTask', {
            lambdaFunction: flashCardLambda,
            outputPath: '$.Payload',
        });
        const summaryTask = new LambdaInvoke(this, 'summaryTask', {
            lambdaFunction: summaryLambda,
            outputPath: '$.Payload',
        });
        const quizTask = new LambdaInvoke(this, 'quizTask', {
            lambdaFunction: quizLambda,
            outputPath: '$.Payload',
        });

        const vpc: IVpc = Vpc.fromLookup(this, 'TO_CHANGE-vpc', {
            vpcName: `edonevpc`,
        });

        const cluster = Cluster.fromClusterAttributes(this, 'TO_CHANGE-cluster-import', {
            clusterName: 'TO_CHANGE-cluster',
            vpc,
        });
        const ecsModule = new EcsModule();

        const ecsTaskDefinition = ecsModule.createEcsTask(this, vpc, {
            taskConfiguration: ECS_JOBS_CONFIG_FARGATE,
            region: this.region,
            account: this.account,
            outputBucket: '$.outputBucket',
            lectureId: '$.lectureId',
        });

        const containerDefinition = ecsModule.createContainerDefinition(this, ecsTaskDefinition, {
            region: this.region,
            account: this.account,
            taskConfiguration: ECS_JOBS_CONFIG_FARGATE,
        });

        const embeddingTask = new EcsRunTask(this, 'embeddingTask', {
            cluster,
            taskDefinition: ecsTaskDefinition,
            containerOverrides: [
                {
                    containerDefinition,
                    environment: [
                        {
                            name: 'OUTPUT_BUCKET',
                            value: JsonPath.stringAt('$.outputBucket'),
                        },
                        {
                            name: 'INPUT_BUCKET',
                            value: JsonPath.stringAt('$.inputBucket'),
                        },
                        {
                            name: 'LECTURE_ID',
                            value: JsonPath.stringAt('$.lectureId'),
                        },
                    ],
                },
            ],
            launchTarget: new EcsFargateLaunchTarget(),
        });

        const wait5SecondsTask = new Wait(this, 'state-machine-wait-job', {
            time: WaitTime.duration(Duration.seconds(5)),
        });

        const parallelTasks = new Parallel(this, 'ParallelTasks')
            .branch(flashCardTask)
            .branch(summaryTask)
            .branch(quizTask)
            .branch(embeddingTask);

        const checkStatusChoice = new Choice(this, 'CheckStatus', {})
            .when(Condition.stringEquals('$.status', 'complete'), transcribeSuccessTask.next(parallelTasks))
            .when(Condition.stringEquals('$.status', 'failed'), transcribeFailedTask)
            .otherwise(transcribeCheckTask);

        const stateMachineDefinition = transcribeTask
            .next(transcribeCheckTask)
            .next(wait5SecondsTask)
            .next(checkStatusChoice);

        const stateMachine = new StateMachine(this, 'TranscribeStateMachine', {
            definitionBody: DefinitionBody.fromChainable(stateMachineDefinition),
            stateMachineName: 'TranscribeStateMachine',
        });
    }
}
