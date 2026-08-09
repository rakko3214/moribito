import * as cdk from "aws-cdk-lib";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as authorizers from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as s3 from "aws-cdk-lib/aws-s3";
import type { Construct } from "constructs";
import { fileURLToPath } from "node:url";
export class MoribitoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps & { environment: "dev" | "prod" }) {
    super(scope, id, props);
    const prefix = `moribito-${props.environment}`;
    const saves = new dynamodb.Table(this, "Saves", { tableName: `${prefix}-saves`, partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING }, billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true }, removalPolicy: props.environment === "prod" ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY });
    const web = new s3.Bucket(this, "Web", { bucketName: `${prefix}-web-${this.account}-${this.region}`, blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, removalPolicy: props.environment === "prod" ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY, autoDeleteObjects: props.environment !== "prod" });
    const users = new cognito.UserPool(this, "Users", { userPoolName: `${prefix}-users`, selfSignUpEnabled: false, signInAliases: { email: true } });
    const userClient = users.addClient("WebClient", { userPoolClientName: `${prefix}-web`, authFlows: { userSrp: true }, generateSecret: false });
    const handler = new nodejs.NodejsFunction(this, "SaveApi", { functionName: `${prefix}-save-api`, runtime: lambda.Runtime.NODEJS_22_X, entry: fileURLToPath(new URL("../../../backend/save-api/src/lambda.ts", import.meta.url)), handler: "handler", environment: { SAVE_TABLE_NAME: saves.tableName }, timeout: cdk.Duration.seconds(10), memorySize: 256, bundling: { minify: true, sourceMap: true } });
    saves.grantReadWriteData(handler);
    const api = new apigwv2.HttpApi(this, "HttpApi", { apiName: `${prefix}-save-api`, corsPreflight: { allowOrigins: props.environment === "prod" ? [] : ["http://localhost:5173"], allowHeaders: ["authorization", "content-type"], allowMethods: [apigwv2.CorsHttpMethod.GET, apigwv2.CorsHttpMethod.PUT, apigwv2.CorsHttpMethod.POST] } });
    const integration = new integrations.HttpLambdaIntegration("SaveIntegration", handler);
    const issuer = `https://cognito-idp.${this.region}.${cdk.Stack.of(this).urlSuffix}/${users.userPoolId}`;
    const authorizer = new authorizers.HttpJwtAuthorizer("CognitoAuthorizer", issuer, { jwtAudience: [userClient.userPoolClientId] });
    api.addRoutes({ path: "/save", methods: [apigwv2.HttpMethod.GET, apigwv2.HttpMethod.PUT], integration, authorizer });
    api.addRoutes({ path: "/save/reset", methods: [apigwv2.HttpMethod.POST], integration, authorizer });
    new cdk.CfnOutput(this, "UserPoolId", { value: users.userPoolId });
    new cdk.CfnOutput(this, "UserPoolClientId", { value: userClient.userPoolClientId });
    new cdk.CfnOutput(this, "ApiUrl", { value: api.apiEndpoint });
    new cdk.CfnOutput(this, "WebBucket", { value: web.bucketName });
  }
}
