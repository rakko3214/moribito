#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { MoribitoStack } from "../lib/MoribitoStack.js";
const app = new cdk.App();
const environment = app.node.tryGetContext("environment") === "prod" ? "prod" : "dev";
new MoribitoStack(app, `moribito-${environment}`, { environment });
