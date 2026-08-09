import * as cdk from "aws-cdk-lib";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";
import type { Construct } from "constructs";
export class MoribitoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps & { environment: "dev" | "prod" }) {
    super(scope, id, props);
    const prefix = `moribito-${props.environment}`;
    const saves = new dynamodb.Table(this, "Saves", { tableName: `${prefix}-saves`, partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING }, billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true }, removalPolicy: props.environment === "prod" ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY });
    const web = new s3.Bucket(this, "Web", { bucketName: `${prefix}-web-${this.account}-${this.region}`, blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, removalPolicy: props.environment === "prod" ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY, autoDeleteObjects: props.environment !== "prod" });
    const users = new cognito.UserPool(this, "Users", { userPoolName: `${prefix}-users`, selfSignUpEnabled: false, signInAliases: { email: true } });
    const handler = new lambda.Function(this, "SaveApi", { functionName: `${prefix}-save-api`, runtime: lambda.Runtime.NODEJS_22_X, handler: "index.handler", code: lambda.Code.fromInline("exports.handler = async () => ({ statusCode: 501, body: JSON.stringify({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Phase 0 placeholder' } }) });"), environment: { SAVE_TABLE_NAME: saves.tableName } });
    saves.grantReadWriteData(handler);
    const api = new apigwv2.HttpApi(this, "HttpApi", { apiName: `${prefix}-save-api`, corsPreflight: { allowOrigins: props.environment === "prod" ? [] : ["http://localhost:5173"], allowHeaders: ["authorization", "content-type"], allowMethods: [apigwv2.CorsHttpMethod.GET, apigwv2.CorsHttpMethod.PUT, apigwv2.CorsHttpMethod.POST] } });
    new cdk.CfnOutput(this, "UserPoolId", { value: users.userPoolId });
    new cdk.CfnOutput(this, "ApiUrl", { value: api.apiEndpoint });
    new cdk.CfnOutput(this, "WebBucket", { value: web.bucketName });
  }
}
