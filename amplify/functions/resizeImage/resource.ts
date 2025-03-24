import { defineFunction } from "@aws-amplify/backend";
import { Function, Runtime, Code, LayerVersion } from "aws-cdk-lib/aws-lambda";
import { Duration } from "aws-cdk-lib";
import * as path from "path";
import { fileURLToPath } from 'url';

const functionDir = path.dirname(fileURLToPath(import.meta.url));

export const resizeImage = defineFunction((scope) =>
    new Function(scope, "resizeImage", {
        handler: "handler.handler", // refers to handler.py, function "handler"
        runtime: Runtime.PYTHON_3_10, // updated to Python 3.10
        code: Code.fromAsset(path.join(functionDir, "./")), // all files in this folder
        timeout: Duration.seconds(30),
        layers: [
            LayerVersion.fromLayerVersionArn(
                scope,
                "PillowLayer",
                "arn:aws:lambda:eu-central-1:770693421928:layer:Klayers-p310-Pillow:10"
            )
        ]
    })
);