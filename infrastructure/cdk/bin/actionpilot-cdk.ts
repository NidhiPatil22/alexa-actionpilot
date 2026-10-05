#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ActionPilotStack } from '../lib/actionpilot-stack';

const app = new cdk.App();

new ActionPilotStack(app, 'ActionPilotStack', {
  env: process.env.CDK_DEFAULT_ACCOUNT
    ? {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1'
      }
    : undefined,
  description: 'ActionPilot: The Next-Best-Action Engine for Alexa+ (Amazon Developer Hackathon 2026)'
});

app.synth();
