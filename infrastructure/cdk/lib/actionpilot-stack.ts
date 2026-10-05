import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

export class ActionPilotStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. VPC Configuration
    const vpc = new ec2.Vpc(this, 'ActionPilotVpc', {
      maxAzs: 2,
      natGateways: 1
    });

    // 2. DynamoDB Tables (AWS Builder Mini Challenge)
    const tasksTable = new dynamodb.Table(this, 'ActionPilotTasksTable', {
      tableName: 'ActionPilot-Tasks',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    tasksTable.addGlobalSecondaryIndex({
      indexName: 'status-deadline-index',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'deadline', type: dynamodb.AttributeType.STRING }
    });

    const calendarTable = new dynamodb.Table(this, 'ActionPilotCalendarTable', {
      tableName: 'ActionPilot-Calendar',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const userContextTable = new dynamodb.Table(this, 'ActionPilotUserContextTable', {
      tableName: 'ActionPilot-UserContext',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // 3. ECS Fargate Cluster
    const cluster = new ecs.Cluster(this, 'ActionPilotCluster', {
      vpc,
      clusterName: 'actionpilot-ecs-cluster'
    });

    // Container Image: uses local asset when USE_DOCKER_ASSET is true, otherwise uses production container registry image
    const containerImage = process.env.USE_DOCKER_ASSET === 'true'
      ? ecs.ContainerImage.fromAsset('../../apps/mcp-server')
      : ecs.ContainerImage.fromRegistry(process.env.IMAGE_URI || 'public.ecr.aws/docker/library/node:20-alpine');

    // 4. Application Load Balanced Fargate Service (ALB + ECS Fargate)
    const fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(
      this,
      'ActionPilotFargateService',
      {
        cluster,
        cpu: 512,
        memoryLimitMiB: 1024,
        desiredCount: 1,
        publicLoadBalancer: true,
        taskImageOptions: {
          image: containerImage,
          containerPort: 3001,
          environment: {
            PORT: '3001',
            AWS_REGION: this.region,
            DYNAMODB_TABLE_PREFIX: 'ActionPilot',
            BEDROCK_MODEL_ID: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
            MCP_STREAMABLE_HTTP: 'true',
            MCP_SPEC_VERSION: '2025-11-25'
          }
        }
      }
    );

    // Health check on ALB target group
    fargateService.targetGroup.configureHealthCheck({
      path: '/health',
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 3,
      interval: cdk.Duration.seconds(30),
      timeout: cdk.Duration.seconds(5)
    });

    // 5. IAM Permissions
    // DynamoDB read/write access
    tasksTable.grantReadWriteData(fargateService.taskDefinition.taskRole);
    calendarTable.grantReadWriteData(fargateService.taskDefinition.taskRole);
    userContextTable.grantReadWriteData(fargateService.taskDefinition.taskRole);

    // Amazon Bedrock reasoning permissions
    fargateService.taskDefinition.taskRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
        resources: [
          `arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0`,
          `arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-3-haiku-20240307-v1:0`,
          `arn:aws:bedrock:${this.region}::foundation-model/amazon.titan-text-express-v1`
        ]
      })
    );

    // Amazon Bedrock AgentCore Memory permissions
    fargateService.taskDefinition.taskRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: [
          'bedrock:GetAgentMemory',
          'bedrock:CreateAgentMemory',
          'bedrock:DeleteAgentMemory',
          'bedrock:ListAgentMemories'
        ],
        resources: ['*']
      })
    );

    // 6. CloudWatch Dashboard & Observability
    const dashboard = new cloudwatch.Dashboard(this, 'ActionPilotDashboard', {
      dashboardName: 'ActionPilot-Observability'
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'ALB Request Count & Target Response Time',
        left: [fargateService.loadBalancer.metrics.requestCount()],
        right: [fargateService.targetGroup.metrics.targetResponseTime()],
        width: 12
      }),
      new cloudwatch.GraphWidget({
        title: 'ECS Fargate CPU & Memory Utilization',
        left: [
          fargateService.service.metricCpuUtilization(),
          fargateService.service.metricMemoryUtilization()
        ],
        width: 12
      })
    );

    // 7. Stack Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDns', {
      value: fargateService.loadBalancer.loadBalancerDnsName,
      description: 'Public Application Load Balancer DNS for ActionPilot'
    });

    new cdk.CfnOutput(this, 'McpStreamableHttpEndpoint', {
      value: `http://${fargateService.loadBalancer.loadBalancerDnsName}/mcp`,
      description: 'Remote Streamable HTTP MCP 2025-11-25 Endpoint for Alexa+'
    });

    new cdk.CfnOutput(this, 'HealthCheckEndpoint', {
      value: `http://${fargateService.loadBalancer.loadBalancerDnsName}/health`,
      description: 'ALB Health Check URL'
    });
  }
}
