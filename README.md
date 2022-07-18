<!--
title: 'Serverless Framework Node Express API service backed by DynamoDB on AWS'
description: 'This is a demo using DynamoDB on AWS on a Serverless Network handling an ATM database.'
framework: v3
platform: AWS
language: nodeJS
authorLink: ''
authorName: 'Tal Shachar.'
-->

## Usage

### Deployment

You will need to have a dynamoDB Table called atm-table-dev in your AWS account 
Will provide AWS credentials if needed.

Install dependencies with:

```
npm install
```

and then deploy with:

```
serverless deploy
```


### Local development

It is also possible to emulate API Gateway and Lambda locally using the `serverless-offline` plugins. In order to do that, run:

```bash
serverless offline start
```


### Example usage

```bash
curl --request GET 'localhost:8000/atm'
```
