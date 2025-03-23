import { defineFunction } from "@aws-amplify/backend";
import { Function, Runtime, Code } from "aws-cdk-lib/aws-lambda";
import { Duration } from "aws-cdk-lib";
import * as path from "path";

export const resizeImage = defineFunction((scope) =>
    new Function(scope, "resizeImage", {
        handler: "handler.handler", // refers to handler.py, function "handler"
        runtime: Runtime.PYTHON_3_9, // using the enum from aws-cdk-lib/aws-lambda
        code: Code.fromAsset(path.join(__dirname, "./")), // all files in this folder
        timeout: Duration.seconds(30),
    })
);
